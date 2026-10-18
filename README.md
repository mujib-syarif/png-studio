# PNG Studio

Cloud-first image tools for mobile and desktop browsers. The browser is used for file selection, preview, and downloading; image processing is handled by a Cloudflare Pages Function and the Cloudflare Images binding.

## Tools

- Convert PNG, JPEG, and WebP
- Resize
- Compress and optionally limit width
- AI background removal with Cloudflare Images foreground segmentation
- Text watermark
- Crop
- AI upscaling and enhancement

## Cloud architecture

- Static frontend: Cloudflare Pages, repository root
- API: `/api/process` via `functions/api/process.js`
- Processing: Cloudflare Images binding named `IMAGES`
- No Replicate token, Cloudinary secret, or browser-exposed API key is required
- Uploaded bytes are passed to the Images binding in the request; this app does not write user images to R2, Images storage, or a history database
- API responses use `Cache-Control: no-store`

## Deploy and configure

1. Keep the Cloudflare Pages project connected to this repository and deploy from the repository root.
2. Confirm the Pages project uses the repository root as its build output directory and has no build command.
3. In Cloudflare, enable the Images transformation feature for the account if prompted.
4. Ensure the Pages Function has an Images binding named `IMAGES`. The included `wrangler.toml` declares this binding; if the Pages dashboard configuration takes precedence, add the same binding under **Settings → Functions → Bindings → Images**.
5. Deploy the `cloud-processing` branch for testing, or merge it into `main` after verification.
6. Test every tool with a small image first, then test a larger image up to the 20 MB upload limit.

## Free-tier notes

Cloudflare Images Free includes up to 5,000 unique transformations per month. Repeated identical transformations may be cached/count differently according to Cloudflare's current billing rules. This is a quota, not unlimited free AI. Review current limits before public launch.

## Privacy and limits

- This app does not intentionally save uploaded files or create permanent processing history.
- The file is sent over HTTPS to Cloudflare for processing and returned to the browser.
- Cloudflare's service-side handling and retention are governed by Cloudflare's current terms and platform behavior; this app cannot promise that every transient copy disappears instantly.
- The API rejects uploads larger than 20 MB and validates image MIME types.
- A public endpoint can be abused; consider Cloudflare rate limiting or Turnstile before promoting the site widely.
- Animated GIFs may be returned as a still image depending on the operation.
- Background removal and AI upscaling depend on Cloudflare Images transformation support and quota.

## Local development

This project is deployed as a static frontend with a Pages Function. For realistic local API testing, use Wrangler with the Images binding configured. Do not replace the cloud endpoint with browser Canvas or local AI inference.

Made with care by Mujib, S.Coc.
