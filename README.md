# TELEDOG — interactive room

A mobile-friendly 3D showroom with an animated greeting from the Teledog sitting on the sofa.

- Overview: drag to orbit and pinch / scroll to zoom.
- Walk: look by dragging, move with the joystick or WASD / arrow keys. Simple bounds and furniture collision prevent walking through the main furniture.
- Wave button restarts the greeting. The hologram in the computer rotates.
- Click the physical Telegram and DeDust logos on the wall to open their links. Header links provide an accessible alternative.
- Reduced motion preference disables automatic animation; greeting can be played manually.

## GitHub Pages

Keep `index.html`, `app.js`, `navigation.js`, `style.css`, `assets/` and `vendor/` together in the repository root. In Settings → Pages, select **GitHub Actions**. The supplied workflow deploys the static files on pushes to main. Alternatively select Deploy from a branch → main → /(root).

## Local development

`npm start` (or `python3 -m http.server 8080`), then open http://localhost:8080. Opening the HTML via file:// cannot load JavaScript modules or the GLB correctly.

`npm test` checks logo destinations, camera-relative movement, and collision boundaries. `node --check app.js` checks JavaScript syntax.

The model is 15 MB with embedded materials, images and two animation clips. It is stored in two byte-identical parts (room.glb.part1 and room.glb.part2), assembled in memory by app.js to fit upload limits. Three.js 0.180.0 is bundled locally under its MIT license (`vendor/LICENSE`). No runtime CDN is required.

Links:
- https://t.me/teledogton
- https://dedust.io/swap/GRAM/EQAm-H72S6NMaO3KEP7jFXPnupsgO0s-mggOKW89l098lL57

Validation: navigation/link unit tests and GLB structure/animation checks pass. The character pose was inspected in a Blender render. Browser QA and real mobile performance were not verified in this environment.
