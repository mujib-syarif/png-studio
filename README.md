# PNG Studio

A privacy-first browser image toolkit. No account required and no image uploads to a server.

## MVP features

- Convert images to PNG, JPG, and WebP
- Resize with optional aspect-ratio locking
- Compress with quality and optional max-width controls
- Preview and download processed images
- Drag-and-drop upload and responsive mobile layout
- Client-side processing using the Canvas API

## Run locally

Open `index.html` in a modern browser. No build step or package installation is required.

## Deploy

This is a static website and can be hosted on GitHub Pages or Cloudflare Pages. For Cloudflare Pages, use the repository root as the project directory, no build command, and `/` as the output directory.

## Privacy and limitations

Image processing happens locally in the browser. Animated GIFs are processed as a still image, and JPG conversion fills transparent areas with white. Browser support determines which output formats are available. Background removal and batch processing are future roadmap items.

## Roadmap

- Background removal
- Batch processing
- Social-media size presets
- Accessibility and cross-browser testing

Made with care by Mujib, S.Coc.
