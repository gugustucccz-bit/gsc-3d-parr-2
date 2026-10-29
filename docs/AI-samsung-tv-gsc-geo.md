# AI instruction set — build a 1:1 Samsung TV as a GSC-GEO blueprint

This is a complete prompt you can hand to a capable AI model (it also works as a spec for a
human modeller). The model's only deliverable is **one JSON document** in the GSC-GEO 0.1
format that the `GSC 3D parr 2` compiler turns into a mesh.

Give the model:

1. this whole file, and
2. the reference material you have: the exact model number, photos (front, back, side, stand,
   ports), or the datasheet dimensions.

If you have nothing, the model must ask for **one** of those, or fall back to the 55-inch
baseline in §3 and say so in `meta.category`.

The worked answer for the 55-inch baseline is `examples/samsung-tv-55.gscgeo.json` — a
complete, valid document. Treat it as the reference result, not as the only answer.

---

## 1. Mission

Produce a GSC-GEO blueprint of **one specific Samsung television**, dimensionally faithful to
the real set ("1:1"), assembled from parametric primitives, that compiles cleanly and
measures the same as the datasheet.

"1:1" here means:

- Overall width, height (with stand) and depth match the real set within **±1 mm**, and the
  stand footprint matches within **±3 mm**.
- The front is a flat panel: visible screen area, bezel widths (left = right, thinner top,
  thicker chin) and the screen's vertical position inside the body all match.
- The back is the real stepped shape: thin panel over most of the area, one thicker
  electronics housing in the middle, ports on the side of that step, vent slots on the
  housing, not a plain slab.
- The stand matches the model's type (central pedestal, two feet, or wall-mount/no stand).
- Proportions, part count and material separation let a person recognise the model from the
  silhouette.

What cannot be 1:1 and must not be faked: printed logos, textures, the picture on the screen,
port internals, screw holes, moulded surface detail. Model the *shape*, give each region the
right material, and stop there.

---

## 2. Output contract

- Return **exactly one JSON object** and nothing else: no prose, no markdown fences, no
  comments, no `//`. The compiler parses the answer with `JSON.parse`.
- The document must validate against GSC-GEO 0.1: `format`, `version`, `materials`, `root`
  present, unique ids, known types, parameters inside their ranges.
- Use `"units": "mm"` so every coordinate is the real millimetre number from the datasheet.
  The compiler converts to metres itself.
- `meta.name`: `samsung-tv-<diagonal>` (e.g. `samsung-tv-55`), lower case, `[A-Za-z0-9_.-]`.
- `meta.category`: `"display"`.
- Declare `budget.targetTriangles` (12000 is plenty for a TV), `budget.lodLevels` (3) and
  `budget.textureResolution` (2048) so the compiler has defaults.
- Y is up, the set stands on `y = 0`, the screen faces **−Z**, the model is centred on X and on
  Z around the panel body (not around the stand).
- Before answering, run the checks in §8 silently. Output only the JSON.

---

## 3. Measurements

### 3.1 The panel from the diagonal

Samsung TVs are 16:9. With `d` = diagonal in inches:

```
screenW = d × 16 / √(16² + 9²) × 25.4   = d × 0.87157 × 25.4  mm
screenH = d ×  9 / √(16² + 9²) × 25.4   = d × 0.49027 × 25.4  mm
```

`√337 = 18.35756`.

### 3.2 Baseline table (current 16:9 Samsung sets, pedestal stand)

Replace these with the datasheet values when the human gives a model number. Panel sizes are
exact from §3.1; body and stand numbers are typical for this generation.

| Diagonal | Screen W × H (mm) | Body W × H × D (mm, no stand) | Height with stand | Stand footprint W × D | Depth |
|---|---|---|---|---|---|
| 43" | 952.9 × 536.0 | 961.9 × 559.8 × 25.7 | 601.2 | 181.5 × 181.5 | 25.7 |
| 50" | 1107.0 × 622.7 | 1116.8 × 644.8 × 25.7 | 688.2 | 199.4 × 199.4 | 25.7 |
| 55" | 1217.4 × 684.8 | 1227.6 × 706.9 × 26.9 | 767.9 | 380.0 × 235.6 | 26.9 |
| 65" | 1439.0 × 809.5 | 1449.0 × 831.8 × 26.9 | 892.0 | 427.0 × 262.2 | 26.9 |
| 75" | 1660.5 × 934.0 | 1670.6 × 956.5 × 27.9 | 1017.6 | 470.0 × 296.8 | 27.9 |
| 85" | 1881.3 × 1058.2 | 1892.0 × 1081.5 × 28.9 | 1129.4 | 500.0 × 315.0 | 28.9 |

### 3.3 Derived numbers the model must compute (not guess)

```
bodyW      = datasheet width                        (or screenW + 2 × bezelSide)
bodyH      = datasheet height without stand         (or screenH + bezelTop + chin)
D          = datasheet depth
bottom     = heightWithStand − bodyH                (55": 767.9 − 706.9 = 61.0)
centerY    = bottom + bodyH / 2                     (55": 414.45)
front      = −D / 2                                 (55": −13.45)
back       = +D / 2                                 (55": +13.45)

bezelSide  = (bodyW − screenW) / 2                  (55": 5.1)
bezelTop   = datasheet, typically 5–7 mm            (55": 6.0)
chin       = bodyH − screenH − bezelTop             (55": 16.1)

screenCenterY = bottom + chin + screenH / 2         (55": 419.5)
rearShellDepth = D × 0.44                           (55": 11.9)
bulgeDepth     = D × 0.56                           (55": 9.0)
bulgeW         = bodyW × 0.42                       (55": 520)
bulgeH         = bodyH × 0.57                       (55": 400)
standBaseW     = datasheet footprint width          (55": 380)
standBaseD     = datasheet footprint depth          (55": 235.6)
standBaseZ     = front + standBaseD / 2             (55": 104.35)
standNeckH     = bottom                             (55": 61)
```

`standBaseZ` matters: the plate starts at the screen plane and runs backwards, so the model's
depth matches the datasheet's "depth with stand" instead of the bare panel depth.

Sanity check before writing the JSON: `bottom + bodyH == heightWithStand`.

---

## 4. The format in one page

Full reference and a downloadable JSON Schema live in the compiler's **Format** tab. The
minimum needed to answer:

```json
{
  "format": "gsc-geo",
  "version": "0.1",
  "meta": { "name": "samsung-tv-55", "category": "display", "units": "mm", "upAxis": "Y", "forwardAxis": "-Z" },
  "budget": { "targetTriangles": 12000, "lodLevels": 3, "textureResolution": 2048 },
  "materials": [ { "id": "bezel", "baseColor": [0.055, 0.06, 0.065], "metallic": 0.85, "roughness": 0.35 } ],
  "root": { "id": "root", "type": "group", "children": [ /* nodes */ ] }
}
```

Node fields: `id` (unique, `[A-Za-z0-9_.-]+`), `type`, `position [x,y,z]`, `rotation [x,y,z]`
degrees, `scale [x,y,z]`, `material` (id), `mirror {axis, enabled}`, `params`, and `children`
for `group` only.

| type | params (default) | use it for |
|---|---|---|
| `group` | — plus `children` | hierarchy: body, stand, ports |
| `box` | `size [w,h,d]` = `[1,1,1]` | bezel bars, panel, housing, ports, stand plates |
| `cylinder` | `radiusTop 0.5`, `radiusBottom 0.5`, `height 1`, `radialSegments 24`, `openEnded false` | rounded stand column, antenna socket, port tubes |
| `cone` | `radius 0.5`, `height 1`, `radialSegments 24`, `openEnded false` | tapered feet, wall-mount cones |
| `sphere` | `radius 0.5`, `widthSegments 24`, `heightSegments 16` | screw caps, rounded corners |
| `capsule` | `radius 0.35`, `length 0.8`, `capSegments 6`, `radialSegments 16` | rounded stand neck |
| `torus` | `radius 0.5`, `tube 0.15`, `radialSegments 16`, `tubularSegments 48` | cable ring, bezel-round corners |
| `lathe` | `points [[radius,height],…]`, `segments 32` | turned stand column, feet |
| `extrude` | `profile [[x,y],…]`, `depth 0.4`, `taper 1`, `bevel false`, `bevelSize 0.02` | the TV's side profile as one solid; rounded bezel geometry |

Limits: 400 nodes, 12 levels of nesting, extrude profiles 3–64 points, lathe profiles 2–60.
Unknown fields are warnings, not errors — do not rely on that; write only known fields.

`mirror` is how symmetric parts are written once: a node with `"mirror": {"axis": "x",
"enabled": true}` produces the part and its X-mirrored twin.

---

## 5. How to build the set — part by part

Assemble in this order inside one `root` group. `/D` below means "the depth of the body".

### 5.1 Front (flush at `z = front`)

| Part | type | material | geometry |
|---|---|---|---|
| `bezel-top` | box | `bezel` | `[bodyW, bezelTop, 6]` at `[0, bodyH + bottom − bezelTop/2, front + 3]` |
| `bezel-bottom` (chin) | box | `bezel` | `[bodyW, chin, 6]` at `[0, bottom + chin/2, front + 3]` |
| `bezel-side` | box + **mirror x** | `bezel` | `[bezelSide, screenH, 6]` at `[bodyW/2 − bezelSide/2, screenCenterY, front + 3]` |
| `screen` | box | `screen` | `[screenW, screenH, 3]` at `[0, screenCenterY, front + 1.5]` |

The four bezel bars form a real frame, so the screen fills the opening with no coplanar faces
and no z-fighting. Never build the bezel as one full box behind the screen.

### 5.2 Back (stepped, the giveaway of a thin TV)

| Part | type | material | geometry |
|---|---|---|---|
| `back-shell` | box | `shell` | `[bodyW, bodyH, rearShellDepth]` at `[0, centerY, front + 6 + rearShellDepth/2]` |
| `back-bulge` | box | `shell` | `[bulgeW, bulgeH, bulgeDepth]` at `[0, centerY, front + 6 + rearShellDepth + bulgeDepth/2]` |
| `vent-1..3` | box | `plastic` | `[bulgeW × 0.8, 7, 1]` at `[0, centerY + 105 / 130 / 155, back − 0.45]` |
| `speaker-grille` | box | `plastic` | `[bodyW × 0.57, 26, 1]` at `[0, bottom + 70, front + 6 + rearShellDepth + 0.5]` |

The back shell stops short of `back`; the bulge reaches `back` exactly. That 0.44 / 0.56 split
is what makes the rear read as a modern panel instead of a slab.

### 5.3 Ports (on the recessed back, clear of the bulge, right-hand side seen from the front)

Ports sit on the back shell's rear face (`z = front + 6 + rearShellDepth`), boxes of depth 8
centred 4 mm further back, so they stand out of the recess and never intersect the bulge
(keep them beyond `±bulgeW/2`).

Minimum set for a current Samsung: 4 × HDMI (22 × 11 × 8, spaced 28 mm), 1 × USB
(14 × 8 × 8), 1 × optical (16 × 16 × 8), 1 × LAN (14 × 12 × 8), 1 × RF/antenna (14 × 14 × 8),
1 × power inlet (30 × 20 × 9). Add `"material": "plastic"` to all of them.

### 5.4 Chin details (flush with, or ≤ 0.5 mm proud of, the front)

`logo` (46 × 7 × 0.4, `logo` material) centred on the chin; `ir-window` (16 × 6 × 0.4) near
one end; `standby-led` (8 × 3 × 0.4, `led` material) near the other. Keep them proud by
0.4 mm rather than exactly coplanar.

### 5.5 Stand — pedestal (Neo QLED / Q-series)

| Part | type | material | geometry |
|---|---|---|---|
| `stand-base` | box | `metal` | `[standBaseW, 12, standBaseD]` at `[0, 6, front + standBaseD/2]` |
| `stand-neck` | box (or capsule) | `metal` | `[80, bottom − 12, 46]` at `[0, 12 + (bottom − 12)/2, 24]` |
| `stand-plate` | box | `metal` | `[standBaseW × 0.9, 24, 12]` at `[0, bottom − 12, 6]` |

`stand-base` must sit on `y = 0` and reach `y = bottom` through the neck; the plate glues the
neck to the underside of the body.

### 5.6 Stand variants

- **Two feet** (older / AU / TU series): two vertical plates under the panel near the outer
  edges, `[26, bottom, 150]` at `x = ±bodyW × 0.42`, with `mirror` on X and a slight forward
  rake (`"rotation": [4, 0, 0]`).
- **Wall mount / no stand**: omit the stand group entirely, and let `bottom = 0` so the panel
  sits on the ground. Set `meta.name` accordingly (`...-wallmount`).
- **Studio stand**: a central column plus a wide flat base, both `cylinder` / `lathe`.

---

## 6. Material palette (use these ids and values)

```json
[
  { "id": "bezel",   "baseColor": [0.055, 0.060, 0.065], "metallic": 0.85, "roughness": 0.35 },
  { "id": "screen",  "baseColor": [0.012, 0.016, 0.022], "metallic": 0.10, "roughness": 0.06 },
  { "id": "shell",   "baseColor": [0.085, 0.090, 0.095], "metallic": 0.05, "roughness": 0.55 },
  { "id": "plastic", "baseColor": [0.030, 0.032, 0.036], "metallic": 0.10, "roughness": 0.60 },
  { "id": "metal",   "baseColor": [0.620, 0.640, 0.680], "metallic": 0.95, "roughness": 0.28 },
  { "id": "logo",    "baseColor": [0.850, 0.860, 0.880], "metallic": 0.90, "roughness": 0.20 },
  { "id": "led",     "baseColor": [0.900, 0.100, 0.100], "metallic": 0.00, "roughness": 0.35,
    "emissive": [1.0, 0.12, 0.10], "emissiveIntensity": 2 }
]
```

- `screen` stays glossy and near-black (a switched-off panel). Never give it a bright colour.
- If the model is a "The Frame" or a light-coloured set, change `bezel` to the body colour
  (`0.78–0.88`), keep `metallic` low and `roughness` ~0.6, and keep the screen black.
- If the picture must appear "on", raise `screen.emissiveIntensity` slightly with a bluish
  `emissive` — but say in the answer that it is a stand-in, not an image.

---

## 7. Hierarchy and naming

```
root  (group, id "samsung-tv-55")
├── body      (group)  → bezel-top, bezel-bottom, bezel-side (mirrored), screen,
│                        back-shell, back-bulge, vents, speaker-grille, logo, ir, led
├── ports     (group)  → hdmi-1..4, usb, optical, lan, rf, power-inlet
└── stand     (group)  → stand-base, stand-neck, stand-plate
```

Ids: lower case, hyphenated, descriptive (`bezel-bottom`, `hdmi-3`, `stand-neck`). No duplicate
ids anywhere in the document. A part that exists twice is one node with `mirror`, not two
nodes.

---

## 8. Self-check before answering (all must pass)

1. `JSON.parse` of your answer succeeds.
2. `format` is `"gsc-geo"`, `version` is `"0.1"`, `units` is `"mm"`, `root.type` is `"group"`.
3. Every `material` referenced by a node exists in `materials`; every material `id` is used at
   least once.
4. All ids unique; every node has an `id` and a known `type`.
5. `bottom + bodyH == heightWithStand` (±0.1 mm).
6. Screen: `bodyW − 2 × bezelSide == screenW` and `bezelTop + screenH + chin == bodyH`.
7. Screen centre sits above the body centre by `(chin − bezelTop)/2` — not at `centerY`.
8. The bezel is a frame of four bars, not a box behind the screen; the screen face is flush
   with the bezel faces.
9. `back-shell` + `back-bulge` reach `+D/2` exactly, and nothing else on the panel does
   (details ≤ 0.5 mm proud are the only exception; the stand plate is exempt — it defines the
   datasheet's depth with stand).
10. Ports are outside `±bulgeW/2` and stand out of the recessed back.
11. Stand base touches `y = 0`; nothing dips below `y = 0`.
12. Total triangle cost is sane: a TV is 15–40 boxes, not 200 segments per box.
13. Nothing coplanar with another face (offset every decoration by ≥ 0.2 mm).
14. Answer contains only the JSON object.

---

## 9. Common mistakes to avoid

- Building the bezel as one box and putting a screen on top of it → coplanar faces, flickering.
- Centring the screen on the body instead of between the chin and the top bezel → the TV looks
  wrong from ten metres away.
- Forgetting the rear housing → the set becomes a flat slab; the stepped back is what makes a
  thin TV read as thin.
- Putting ports inside the bulge, or making them 40 mm deep.
- Rounding the panel: real panel depth must be `D`, not 50 mm.
- Scaling one part of the model: every number comes from §3.3, none from feel.
- Using `units: "m"` with millimetre numbers → the model ends up 1000× too big.
- Adding one node per screw, logo dot or port pin → node budget and silhouette suffer, nothing
  is gained.
- Returning JSON plus explanation text → the compiler rejects the parse.

---

## 10. Worked answer

`examples/samsung-tv-55.gscgeo.json` is the complete 55-inch baseline built exactly as above.
Load it in the compiler (toolbar → **Load example → Samsung TV 55"**) and press **Compile**:

- expected report size: **1.2276 × 0.7679 × 0.2360 m** (1227.6 × 767.9 × 236.0 mm — the
  235.6 mm datasheet depth plus the 0.4 mm front relief on the chin details),
- a thin panel with a thin top bezel, a thicker chin, a stepped rear with ports on the right,
  vents on the housing and a pedestal stand,
- 0 validation errors, 0 warnings, ~30 meshes.

When the human gives a real model number, keep the structure and replace the numbers from §3.3
with that model's datasheet values. The structure is the reusable part; the numbers are the
1:1.
