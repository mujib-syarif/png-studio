const MAX_BYTES = 20 * 1024 * 1024;
const FORMATS = new Set(["image/png", "image/jpeg", "image/webp", "image/avif"]);

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff"
  }
});

function number(value, fallback, min, max) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
}

function outputFormat(value, fallback = "image/png") {
  return FORMATS.has(value) ? value : fallback;
}

function positionOptions(position) {
  switch (position) {
    case "top-left": return { top: 16, left: 16 };
    case "top-right": return { top: 16, right: 16 };
    case "bottom-left": return { bottom: 16, left: 16 };
    case "center": return {};
    default: return { bottom: 16, right: 16 };
  }
}

export async function onRequestPost({ request, env }) {
  if (!env.IMAGES) {
    return json({ error: "Cloudflare Images binding belum dikonfigurasi. Tambahkan binding IMAGES di Pages." }, 503);
  }

  const origin = request.headers.get("Origin");
  if (origin && origin !== new URL(request.url).origin) {
    return json({ error: "Origin tidak diizinkan." }, 403);
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return json({ error: "Upload tidak valid. Pilih gambar lalu coba lagi." }, 400);
  }

  const file = form.get("file");
  const mode = String(form.get("mode") || "");
  if (!(file instanceof File)) return json({ error: "File gambar tidak ditemukan." }, 400);
  if (!file.type.startsWith("image/")) return json({ error: "File harus berupa gambar." }, 415);
  if (file.size <= 0 || file.size > MAX_BYTES) {
    return json({ error: "Ukuran file maksimal 20 MB." }, 413);
  }

  const allowedModes = new Set(["convert", "resize", "compress", "background", "watermark", "crop", "enhance"]);
  if (!allowedModes.has(mode)) return json({ error: "Tools tidak dikenal." }, 400);

  try {
    // Images binding accepts raw bytes and does not persist the uploaded image.
    const bytes = await file.arrayBuffer();
    const source = env.IMAGES.input(bytes);
    const info = await env.IMAGES.info(bytes);
    const sourceWidth = number(info?.width, 0, 1, 100000);
    const sourceHeight = number(info?.height, 0, 1, 100000);
    if (!sourceWidth || !sourceHeight) return json({ error: "Dimensi gambar tidak dapat dibaca." }, 422);

    let pipeline = source;
    let format = "image/png";
    let quality = 90;

    if (mode === "background") {
      pipeline = pipeline.transform({ segment: "foreground" });
      format = "image/png";
    } else if (mode === "convert") {
      format = outputFormat(form.get("format"));
      quality = number(form.get("quality"), 90, 40, 100);
    } else if (mode === "resize") {
      const width = number(form.get("width"), sourceWidth, 1, 12000);
      const height = number(form.get("height"), sourceHeight, 1, 12000);
      const fit = form.get("fit") === "squeeze" ? "squeeze" : "contain";
      pipeline = pipeline.transform({ width, height, fit });
      quality = number(form.get("quality"), 92, 40, 100);
      format = outputFormat(form.get("format"));
    } else if (mode === "compress") {
      const maxWidth = number(form.get("maxWidth"), 0, 0, 12000);
      if (maxWidth > 0 && maxWidth < sourceWidth) {
        pipeline = pipeline.transform({ width: maxWidth, fit: "scale-down" });
      }
      format = outputFormat(form.get("format"), "image/webp");
      quality = number(form.get("quality"), 75, 10, 100);
    } else if (mode === "crop") {
      const x = number(form.get("x"), 0, 0, sourceWidth - 1);
      const y = number(form.get("y"), 0, 0, sourceHeight - 1);
      const width = number(form.get("width"), sourceWidth, 1, sourceWidth);
      const height = number(form.get("height"), sourceHeight, 1, sourceHeight);
      const safeWidth = Math.max(1, Math.min(width, sourceWidth - x));
      const safeHeight = Math.max(1, Math.min(height, sourceHeight - y));
      pipeline = pipeline.transform({ trim: { top: y, left: x, width: safeWidth, height: safeHeight } });
      format = outputFormat(form.get("format"));
    } else if (mode === "watermark") {
      const text = String(form.get("text") || "").trim().slice(0, 160);
      if (!text) return json({ error: "Masukkan teks watermark terlebih dahulu." }, 400);
      const sizePercent = number(form.get("size"), 5, 1, 20);
      const opacity = number(form.get("opacity"), 75, 5, 100) / 100;
      const color = /^#[0-9a-fA-F]{6}$/.test(String(form.get("color") || "")) ? String(form.get("color")) : "#ffffff";
      const size = Math.round(Math.min(sourceWidth, sourceHeight) * sizePercent / 100);
      pipeline = pipeline.draw(env.IMAGES.text(text, { size: Math.max(12, Math.min(512, size)), color }), {
        ...positionOptions(String(form.get("position") || "bottom-right")),
        opacity
      });
      format = outputFormat(form.get("format"));
    } else if (mode === "enhance") {
      const contrast = number(form.get("contrast"), 100, 50, 150) / 100;
      const saturation = number(form.get("saturation"), 100, 0, 200) / 100;
      const sharpen = number(form.get("sharpness"), 30, 0, 100) / 10;
      const width = Math.min(4096, sourceWidth * 2);
      const height = Math.min(4096, sourceHeight * 2);
      if (width * height > 16000000) return json({ error: "Hasil 2× terlalu besar. Gunakan gambar yang lebih kecil." }, 413);
      pipeline = pipeline.transform({
        width,
        height,
        fit: "scale-up",
        upscale: "generate",
        contrast,
        saturation,
        sharpen
      });
      format = "image/png";
    }

    pipeline = pipeline.transform({ metadata: "none" });
    const result = await pipeline.output({ format, quality }).response({
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "Pragma": "no-cache",
        "X-Content-Type-Options": "nosniff",
        "Content-Disposition": 'attachment; filename="png-studio-output.' + format.split("/")[1].replace("jpeg", "jpg") + '"'
      }
    });

    if (!result.ok) return json({ error: "Cloud image processing gagal. Coba gambar lain atau kurangi ukuran file." }, 502);
    return result;
  } catch (error) {
    console.error("PNG Studio image processing error:", error?.message || error);
    return json({ error: "Pemrosesan cloud gagal. Pastikan binding Images aktif dan coba lagi." }, 502);
  }
}

export async function onRequestOptions({ request }) {
  return new Response(null, {
    status: 204,
    headers: {
      "Allow": "POST, OPTIONS",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": new URL(request.url).origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}
