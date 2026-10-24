# PNG Studio

A privacy-first image toolkit that runs in your browser. No account or app server is required.

## Tools

- **Convert** - export PNG, JPG, or WebP where supported by the browser.
- **Resize** - set dimensions and optionally keep the original aspect ratio.
- **Compress** - adjust JPG/WebP quality or reduce dimensions. PNG is lossless, so the quality slider does not apply to it.
- **Remove background** - use an AI model to export a transparent PNG.
- **Crop** - set an aspect ratio, drag the crop area, or enter pixel coordinates.
- **Watermark** - add styled text to the image.
- **Enhance** - use an AI upscaler and adjust clarity, contrast, and saturation.

## Run locally

Open `index.html` in a modern browser. No build step or package installation is required.

## Deploy

This is a static website and can be hosted on GitHub Pages or Cloudflare Pages. For Cloudflare Pages, use the repository root as the project directory, no build command, and `/` as the output directory.

## Privacy and limitations

The selected image is processed in the browser; the app does not intentionally upload it to an app server. The AI tools download their JavaScript libraries and models from a CDN, so an internet connection is needed for those tools, especially on first use.

- Input files are limited to 20 MB.
- General canvas output is limited to 40 megapixels and 12,000 pixels per dimension.
- AI Enhance output is capped at 4,096 pixels per dimension and 16 megapixels. Large inputs may produce less than a full 2× output to preserve the aspect ratio and stay within this limit.
- Animated GIFs are processed as a still image.
- JPG conversion fills transparent areas with white.
- Available export formats depend on browser support.

## Roadmap

- Batch processing
- Social-media size presets
- Automated and cross-browser testing

Made with care by Mujib, S.Coc.
