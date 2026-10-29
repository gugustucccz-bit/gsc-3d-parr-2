# GSC 3D parr 2

A **GSC-GEO compiler** that runs entirely in the browser: you give it a JSON blueprint, it
gives you a mesh.

Paste or load a `.json`, press **Compile**, and the page parses it, validates it against the
GSC-GEO 0.1 schema, fills in every default, builds the geometry, generates the LOD chain,
shows it in a viewer and lets you export a GLB plus a compile report.

There is no backend, no build step and no server-side model.

## Run

Open `index.html` in any modern browser (WebGL required). If your browser blocks ES modules
over `file://`, serve the folder instead, e.g. `python3 -m http.server` and open
`http://localhost:8000/`.

On a phone the workspace splits into two screens — **Editor** and **Model** — switched from the
bar at the bottom of the screen, which also carries **Compile** (in the editor) and **Export
GLB** (in the model view). Compiling on a phone jumps straight to the model, the viewer refits
to the portrait aspect, and the format reference reflows its tables into stacked rows.

## Install it on the iPhone

GitHub Pages serves the branch straight from its files (`.nojekyll` is already here), so there
is nothing to build and nothing to deploy by hand: **every push to `main` republishes the site**
a minute or two later. Turn Pages on once: **Settings → Pages → Build and deployment → Source:
Deploy from a branch → `main` / `/ (root)` → Save**. The site then lives at
`https://gugustucccz-bit.github.io/gsc-3d-parr-2/`.

The page is a PWA. Open that URL in Safari, tap **Share → Add to Home Screen**, and it launches
full screen like an app. The service worker (`sw.js`) caches the compiler and the vendored 3D
engine on that first visit, so from then on it starts and compiles with no network at all. Every
launch asks for the newest HTML with the HTTP cache bypassed, the other assets are revalidated in
the background, and a new worker reloads the page once — so a deploy shows up on its own. The
compile card prints the **build** it is running (`v0.7 · 7 examples`) next to a **Refresh app**
button that unregisters the worker, empties the caches and reloads with a fresh URL — the way out
of a stuck Home Screen copy. If that line is missing altogether you are looking at a cached page,
so reload or reopen the app. `version.txt` at the site root always shows the deployed build, which
is the quickest way to tell hosting apart from caching. iOS builds the Home Screen icon from a
page screenshot because the repository has no raster icon; drop a 180×180 PNG at the root and
link it as `apple-touch-icon` if you want a custom one.

For a fully local run with no hosting, the app's **Run** button serves these same files inside
this app's web view.

## The compile pipeline

1. **Parse** — `JSON.parse` with the error position translated to line and column.
2. **Validate** — schema-level checks (format marker, version, units, material ids and
   colour ranges, node ids, node types, parameter ranges, profile point counts, hierarchy
   depth and node count). A rejected document never reaches the geometry kernel.
3. **Normalize** — the *Normalized* tab shows exactly what gets built, with every default
   filled in.
4. **Geometry** — each node becomes a three.js primitive; the result is re-centred on the
   ground plane. When a triangle cap is set, a deterministic tessellation ladder
   (`1.0 → 0.82 → 0.68 → 0.55 → 0.44 → 0.34 → 0.26 → 0.2` segment scale) is walked until the
   mesh fits.
5. **LODs** — the same blueprint re-tessellated at lower segment scales.
6. **Report and export** — triangle/vertex/mesh counts, budget ladder, dimensions, materials,
   timing; GLB (every LOD as a sibling node), normalized blueprint, report as JSON or
   Markdown.

Compile options: quality (preview / game / high), triangle cap and LOD count. Leaving the cap
or LOD count at `0` uses the document's own `budget`.

## The format — GSC-GEO 0.1

The **Format** tab inside the page is the full reference and is generated from the same
`NODE_SPEC` the validator uses, so it cannot drift from the compiler. It documents every
field, every node type and every parameter with its type, range, default and meaning, plus
copyable examples. **Download JSON Schema** exports a draft 2020-12 schema you can point your
editor at.

The shape in short:

```json
{
  "format": "gsc-geo",
  "version": "0.1",
  "meta": { "name": "my-asset", "category": "prop", "units": "m", "upAxis": "Y", "forwardAxis": "-Z" },
  "budget": { "targetTriangles": 15000, "lodLevels": 3, "textureResolution": 2048 },
  "materials": [
    { "id": "body", "baseColor": [0.6, 0.2, 0.2], "metallic": 0.2, "roughness": 0.5 }
  ],
  "root": {
    "id": "root",
    "type": "group",
    "children": [
      { "id": "part-1", "type": "box", "material": "body", "position": [0, 0.5, 0], "params": { "size": [1, 1, 1] } }
    ]
  }
}
```

Every node takes `id`, `type`, `position`, `rotation` (degrees), `scale`, `material`,
`mirror: { axis, enabled }`, `params` and — for `group` only — `children`.

Node types: `group`, `box`, `cylinder`, `cone`, `sphere`, `capsule`, `torus`, `lathe`,
`extrude`. Two of them deserve a note:

- `lathe` revolves a `[[radius, height], …]` profile around Y — bottles, vases, lamp feet.
- `extrude` pushes a closed `[[x, y], …]` polygon along Z with an optional `taper` —
  car body panels, gables, silhouette slabs.

Materials are sRGB: `baseColor` as `[r, g, b]` in 0–1 or `"#rrggbb"`, plus `metallic`,
`roughness`, `opacity`, and optionally `emissive` / `emissiveIntensity` and a `texture` (see
below).

Rules: one `root`, unique ids, metres by default (Y up, −Z forward), at most 400 nodes and
12 levels of nesting. Unknown fields and params are warnings, not errors — typos stay visible
without breaking a build.

## Textures, theme and haptics

A material can carry a `texture` that needs no external file: either a `data:image/…` URL (it
travels inside the JSON) or a procedural descriptor the compiler paints into a canvas —
`{"kind": "gradient", …}`, `{"kind": "keys", …}`, `{"kind": "stripes", …}`,
`{"kind": "grid", …}` or `{"kind": "text", lines: […]}` for etched lettering with an alpha
cut-out. `textureRepeat` and `textureOffset` place it; `extrude` geometry uses
blueprint units as UVs, so a 302 × 196 mm screen plate needs `[0.003311, 0.005102]` with offset
`[0.5, 0.5]`. The iPhone's wallpaper and the MacBook's keyboard and display are made this way,
and the GLB export embeds the maps.

The header switches between the dark and a light theme (remembered in `localStorage`), and
Compile plays a haptic pattern on success (`compile-ok`) or on a rejected blueprint
(`compile-fail`) through `src/haptics.js`.

## Examples in the page

Eight complete blueprints ship with the compiler and load from the example chips under the
editor toolbar (or the Format tab): a minimal cube, a wooden crate, a sports car (extruded body
panels, mirrored wheels and lights), a table lamp (lathe base, cone shade, emissive bulb), a 1:1
**Samsung TV 55"** built in millimetres, a 1:1 **iPhone Pro** — tessellated rounded body, inset
glasses, a lit screen with a wallpaper texture, home-screen grid, dock and Dynamic Island, camera
plateau with three lens rings, flash, lidar, side buttons, USB-C and speaker holes, in the
149.6 × 71.5 × 8.25 mm current-Pro footprint — a 1:1 **MacBook Pro 14"** open on its hinge, with
an aluminium body, textured keyboard, trackpad, display with wallpaper and its ports — and a 1:1
**AirPods Pro case**: one bevel-rounded shell with a seam band, aluminium hinge, pairing button
and ring, status LED, USB-C port with a metal rim and a dark slot, speaker holes, lanyard slot
and etched text on the bottom and the back.

## Building a 1:1 object with an AI

`docs/AI-samsung-tv-gsc-geo.md` is a complete instruction set you can hand to a capable model:
the format contract, the 16:9 panel math, a datasheet table for 43"–85" Samsung sets, a
part-by-part build plan (bezel frame, flush glossy panel, stepped back with ports and vents,
pedestal stand and its variants), the material palette, a self-check list and the common
mistakes. Its worked answer is `examples/samsung-tv-55.gscgeo.json`, which compiles to
1227.6 × 767.9 × 236.0 mm — load it from the **Samsung TV 55"** chip under the editor toolbar.

## Notes and limits

- Tessellation is parametric; the budget ladder lowers segment counts rather than decimating.
- Parts keep clean per-primitive topology but are not stitched into one watertight mesh.
- Materials are parametric — no UV unwrap and no texture baking in this build.
- GLB carries each LOD as a sibling node; engine-side LOD setup stays platform specific.
- FBX and Blender project export are out of scope for a pure HTML build.

## Vendored dependencies

`vendor/three.module.js` (three.js r160), `vendor/controls/OrbitControls.js`,
`vendor/exporters/GLTFExporter.js` and `vendor/utils/TextureUtils.js` (a dependency of the
exporter), wired through an import map. Nothing is fetched at runtime.
