# Smart Shopping Cart 3D Website

This repository contains a high-quality interactive 3D web presentation of a "Smart Shopping Cart" design.

> **Note**: Building an "investor-level", ultra-realistic, highly detailed 3D geometric mesh directly from scratch using pure Javascript math primitives is restricted. To bridge the gap, this application is built on top of **Three.js** using procedural approximation, providing the exact web structure to display an interactive 3D model with a premium, sleek presentation UI out of the box. 

If you hire a 3D artist/designer and they give you a high quality `.glb` or `.gltf` file of the cart:
1. Put the model in your website folder
2. Replace the procedural `cartGroup` code in `main.js` with `GLTFLoader`. See the comments in `main.js` for instructions!

## How to Test Locally

Since `Three.js` heavily utilizes features that require a web server to bypass CORS issues, you cannot simply double click `index.html` to view it realistically. You must run a local web server inside this directory.

**Using Python:**
```bash
python -m http.server 8000
```
Then visit `http://localhost:8000`

**Using Node.js (npx):**
```bash
npx serve
```
Then visit `http://localhost:3000`

## How to Deploy to GitHub Pages

You wanted to host this model on GitHub Pages. Follow these straightforward steps:

1. Create a new repository on your GitHub account (e.g. `smart-cart-3d-model`).
2. Upload all 3 of these files (`index.html`, `style.css`, `main.js`) directly into the root of that new repository.
3. Commit the changes.
4. On your repository page, click on **Settings** in the top navigation bar.
5. In the left sidebar, click on **Pages**.
6. Under Build and deployment, set the Source to **Deploy from branch**.
7. In the Branch dropdown, select **main** (or master) and **/(root)** folder, then click Save.
8. Wait ~2 minutes, refresh the page, and GitHub will provide the live URL link at the top (e.g. `https://yourusername.github.io/smart-cart-3d-model/`).
9. You can copy this link and add it to your PPT immediately!

We hope you enjoy this beautiful, Apple/Tesla-inspired presentation page!
