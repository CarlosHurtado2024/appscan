---
name: AppScan
description: Phone-only document scanning, dressed as security paper.
colors:
  primary: "oklch(36% 0.13 270)"
  on-primary: "oklch(98% 0.005 295)"
  primary-press: "oklch(30% 0.12 270)"
  serial: "oklch(46% 0.18 20)"
  danger: "oklch(46% 0.18 20)"
  on-danger: "oklch(98% 0.005 20)"
  focus: "oklch(50% 0.17 270)"
  paper: "oklch(95.5% 0.02 295)"
  paper-raised: "oklch(98% 0.012 295)"
  paper-sunk: "oklch(91% 0.03 295)"
  ink: "oklch(26% 0.085 275)"
  ink-soft: "oklch(42% 0.06 275)"
  rule: "oklch(80% 0.035 290)"
  guilloche: "oklch(62% 0.1 285)"
  scrim: "oklch(20% 0.05 275 / 0.5)"
  primary-night: "oklch(80% 0.09 280)"
  on-primary-night: "oklch(20% 0.05 280)"
  primary-press-night: "oklch(72% 0.09 280)"
  serial-night: "oklch(76% 0.13 20)"
  danger-night: "oklch(76% 0.13 20)"
  on-danger-night: "oklch(20% 0.05 20)"
  focus-night: "oklch(82% 0.11 280)"
  paper-night: "oklch(25% 0.08 278)"
  paper-raised-night: "oklch(30% 0.085 278)"
  paper-sunk-night: "oklch(20% 0.07 278)"
  ink-night: "oklch(93% 0.018 295)"
  ink-soft-night: "oklch(78% 0.03 290)"
  rule-night: "oklch(44% 0.08 280)"
  guilloche-night: "oklch(58% 0.09 285)"
  scrim-night: "oklch(8% 0.02 280 / 0.65)"
  camera-ground: "oklch(12% 0.02 280)"
  camera-ink: "oklch(96% 0.01 295)"
  camera-action: "oklch(84% 0.09 280)"
  camera-action-ink: "oklch(18% 0.05 280)"
  signature-sheet: "oklch(98.5% 0.006 295)"
  signature-ink: "#1b1b6b"
  browser-chrome: "#23246b"
typography:
  display:
    fontFamily: "Libre Bodoni, Georgia, serif"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1.1
  headline:
    fontFamily: "Libre Bodoni, Georgia, serif"
    fontSize: "1.625rem"
    fontWeight: 700
    lineHeight: 1.15
  headline-dialog:
    fontFamily: "Libre Bodoni, Georgia, serif"
    fontSize: "1.375rem"
    fontWeight: 700
  title:
    fontFamily: "Libre Bodoni, Georgia, serif"
    fontSize: "1.25rem"
    fontWeight: 700
  action-lead:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
  body:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.45
  body-strong:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.45
  body-small:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
  meta:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
  label-tool:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
  label-square:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
  serial:
    fontFamily: "Courier Prime, Courier New, monospace"
    fontSize: "0.875rem"
    fontWeight: 700
    letterSpacing: "0.06em"
rounded:
  plate: "2px"
  checkbox: "4px"
  radius: "6px"
  instrument: "50%"
spacing:
  space-1: "4px"
  space-2: "8px"
  space-3: "12px"
  space-4: "16px"
  space-5: "24px"
  space-6: "32px"
  tap: "44px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.radius}"
    padding: "8px 16px"
    height: "48px"
  button-primary-press:
    backgroundColor: "{colors.primary-press}"
    textColor: "{colors.on-primary}"
  button-secondary:
    backgroundColor: "{colors.paper-raised}"
    textColor: "{colors.ink}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.radius}"
    padding: "8px 16px"
    height: "48px"
  button-secondary-press:
    backgroundColor: "{colors.paper-sunk}"
    textColor: "{colors.ink}"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.on-danger}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.radius}"
    padding: "8px 16px"
    height: "48px"
  button-lead:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.action-lead}"
    rounded: "{rounded.radius}"
    height: "64px"
  button-square:
    backgroundColor: "{colors.paper-raised}"
    textColor: "{colors.ink}"
    typography: "{typography.label-square}"
    rounded: "{rounded.radius}"
    padding: "4px"
    size: "64px"
  button-small:
    rounded: "{rounded.radius}"
    padding: "8px 12px"
    height: "{spacing.tap}"
  icon-button:
    textColor: "{colors.ink}"
    rounded: "{rounded.radius}"
    size: "{spacing.tap}"
  tool:
    textColor: "{colors.ink}"
    typography: "{typography.label-tool}"
    rounded: "{rounded.radius}"
    padding: "4px"
    height: "56px"
  tool-pressed:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
  input-field:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.radius}"
    padding: "0 12px"
    height: "{spacing.tap}"
  input-search:
    backgroundColor: "{colors.paper-raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.radius}"
    padding: "0 12px"
    height: "{spacing.tap}"
  segment:
    backgroundColor: "{colors.paper-raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.radius}"
    padding: "4px 12px"
    height: "{spacing.tap}"
  segment-selected:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
  stub:
    backgroundColor: "{colors.paper-raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.radius}"
    height: "104px"
  stub-counterfoil:
    backgroundColor: "{colors.paper-sunk}"
    padding: "8px"
    width: "84px"
  serial-number:
    textColor: "{colors.serial}"
    typography: "{typography.serial}"
  page-tile:
    backgroundColor: "{colors.paper-raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.radius}"
  notice:
    backgroundColor: "{colors.paper-sunk}"
    textColor: "{colors.ink}"
    rounded: "{rounded.radius}"
    padding: "12px 16px"
  dialog:
    backgroundColor: "{colors.paper-raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.radius}"
    padding: "24px"
  toast:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.radius}"
    padding: "12px 16px"
  camera-shutter:
    backgroundColor: "{colors.camera-ink}"
    rounded: "{rounded.instrument}"
    size: "72px"
---

# Design System: AppScan

## Overview

**Creative North Star: "The Document of Record"**

A scanned page is a document of record, so the app dresses like security paper instead of a utility. The ground is pale lilac safety paper, the band at the top of every screen carries fine procedural guilloche line work, text and primary actions print in indigo ink, and each document is a numbered cheque stub with a perforated line between its image and its record.

The density is Operate mode: a one-handed tool used at a table in mixed indoor light. Controls are large and plain, surfaces are flat, and the identity lives in a few printed details rather than in decoration. Those details recede around the work: document images are the only saturated imagery, and the crop and camera screens hand almost everything over to the photo. Night mode is the same sheet printed in pale ink on deep indigo, following the system setting.

The system rejects the white list with a floating button and a saturated brand bar. It must also never resemble CamScanner in icon or visual design.

**Key Characteristics:**
- Pale lilac paper, indigo ink, carmine reserved for serials and danger.
- A guilloche band heads every paper screen; a rosette watermark appears only on the empty library.
- Cheque stubs with a dashed perforation and a typewritten serial.
- Flat surfaces separated by 1px rules, with a shadow only on sheets and floating layers.
- A fixed bottom action bar at thumb height.
- Motion is brief state feedback, plus one guilloche sweep before the camera opens.

## Colors

A restrained palette of tinted lilac paper and indigo ink, with one carmine held back for serials and danger; every role has a night printing in the `-night` tokens.

### Primary
- **Banknote Indigo** (`primary`): Primary and lead buttons, selected segments, pressed tools, checked boxes, toasts, text selection and the native accent. Darkens to `primary-press` on hover and press. Night printing inverts it to a pale periwinkle carrying dark text.
- **Focus Indigo** (`focus`): The 2px focus outline, offset 2px, and the dashed selection around an annotation.

### Secondary
- **Serial Carmine** (`serial`): Printed serial numbers only.
- **Danger Carmine** (`danger`): Destructive buttons, error text and the invalid crop outline. Deliberately the same ink as the serial, in a separate token because its job is different.

### Neutral
- **Safety Lilac** (`paper`): The page ground and the fixed action bar.
- **Raised Sheet** (`paper-raised`): Stubs, tiles, secondary buttons, the search field, panels and dialogs.
- **Pressed Lilac** (`paper-sunk`): Mastheads and toolbars, image wells behind documents, notices, and hover or press on paper controls.
- **Indigo Ink** (`ink`): Primary text and icons.
- **Thinned Ink** (`ink-soft`): Metadata, secondary copy, placeholders and search icons. Holds at least 6.5:1 on every paper tone in both themes.
- **Paper Rule** (`rule`): 1px borders and the 2px perforations.
- **Line Work** (`guilloche`): Guilloche and rosette strokes only, never text.
- **Scrim** (`scrim`): The backdrop behind modal dialogs.

### Fixed Surfaces
- **Viewfinder Black** (`camera-ground`), **Viewfinder Ink** (`camera-ink`) and **Viewfinder Action** (`camera-action`, with `camera-action-ink`): The camera's own palette, identical in both themes.
- **Signature Sheet** (`signature-sheet`) and **Signature Ink** (`signature-ink`): The pad and stored signature stay light with dark ink in both themes, because that ink is burned onto a white document.
- **Browser Chrome** (`browser-chrome`): The browser theme color and installed app splash only, outside the page itself.

### Named Rules
**The Carmine Rule.** Carmine prints only serial numbers and destructive or invalid states. Nothing else on the sheet may use it, so a red mark always means either "this is the number" or "this is dangerous".

**The Saturated Document Rule.** Document images are the only saturated imagery on a screen. Interface color stays in the lilac and indigo family, apart from carmine.

**The Night Printing Rule.** Night mode changes the printing, not the design. Every role keeps its job and only its value changes, driven by the system color scheme with no in-app switch.

## Typography

**Display Font:** Libre Bodoni, bold only (with Georgia, serif)
**Body Font:** System UI stack (system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, sans-serif)
**Label/Mono Font:** Courier Prime, bold only (with Courier New, monospace), for serials

**Character:** Banknote engraving over plain working text. High-contrast Bodoni names the sheet, the phone's own face does the operating, and a typewriter stamps the number.

### Hierarchy
- **Display** (700, 2rem, 1.1): The AppScan wordmark in the masthead.
- **Headline** (700, 1.625rem, 1.15, balanced wrap): The empty state heading. Dialog headings use the 1.375rem step.
- **Title** (700, 1.25rem): Toolbar titles and the editable document title.
- **Body** (400, 1rem, 1.45): All running text. Empty state copy holds to a 34rem measure. Buttons, legends and page numbers use the 600 weight; stub titles use 650 and clamp to two lines.
- **Body Small** (400, 0.9375rem): Notice copy. Segment labels use this size at 600.
- **Meta** (400, 0.875rem): Page count and date on stubs. The masthead promise uses this size at 500.
- **Label** (600, 0.8125rem and 0.75rem): Tool bar labels, and the square Importar button, always under an icon.
- **Serial** (700, 0.875rem, 0.06em tracking): `N.º` followed by six uppercase characters.

### Named Rules
**The Three Faces Rule.** Bodoni names, the system face operates, Courier Prime numbers. Courier Prime appears on serials and nowhere else; Bodoni never sets running text or a control label.

**The Clear Ground Rule.** Text never prints directly over line work. The guilloche fades in from the right, leaving the left of every band clear for names and titles; it is shown at full width only during the sweep.

**The Counted Numeral Rule.** A page number set inside a Bodoni title uses the system face at 1.0625rem with tabular numerals, because a Bodoni 1 reads as a roman I. Page numbers elsewhere use tabular numerals in the body face.

## Layout

A single column, mobile first, that holds at 720px and centers on larger screens. Body padding is 16px, with a 16px gap between blocks and 8px between stubs, on a scale of 4, 8, 12, 16, 24 and 32px. Bottom padding of 104px keeps content clear of the fixed bar, and every edge respects the device safe areas.

Page tiles sit in an auto-filling grid with a 156px minimum and a 12px gap. Segment groups use two equal columns. The layout has no width breakpoints; it responds through wrapping, auto-fill and `dvh` limits on images. One height condition exists: the rosette requires a viewport at least 820px tall. Hover styles apply only on devices that really hover.

The crop screen is the exception to the column: its stage sizes itself from the photo's aspect ratio and the viewport height, with 24px padding. The camera fills the whole viewport.

**The Thumb Reach Rule.** A screen's main action lives in the fixed bottom bar at thumb height. Where that bar holds tools instead, as in annotation, the commit action moves to the toolbar.

**The Tap Floor Rule.** Every touch target is at least 44px, including invisible hit areas on crop handles and annotation resize handles. Ordinary buttons are 48px, tools 56px, and the lead action 64px.

## Elevation & Depth

Paper screens are flat at rest. Depth comes first from tone, with `paper-sunk` below the page and `paper-raised` above it, and from 1px rules. One soft, indigo-tinted shadow exists, and it describes a physical sheet or a truly floating layer. Pressed controls settle 1px downward; nothing lifts on hover.

### Shadow Vocabulary
- **Sheet** (`box-shadow: 0 1px 2px oklch(26% 0.085 275 / 0.08), 0 8px 24px oklch(26% 0.085 275 / 0.08)`; at night `0 1px 2px oklch(5% 0.02 280 / 0.4), 0 8px 24px oklch(5% 0.02 280 / 0.35)`): Document images, the annotation stage, dialogs, toasts, crop handles and the crop lens.

### Named Rules
**The Sheet Shadow Rule.** Shadows belong to paper lying on the desk and to layers floating above the screen. Stubs, tiles, buttons, panels, notices and bars get a rule, not a shadow.

## Shapes

Gently rounded rectangles (6px) for every sheet, control and panel, so that the system reads as cut paper rather than as pills. Smaller radii are purposeful: the 2px masthead plate and the 4px checkbox. Document images are never rounded or cropped, and the blank sheet in the empty state has square corners for the same reason. The camera's ID card guide uses 10px and the card's real proportions (85.6 by 54).

**The Perforation Rule.** A dashed line means paper that tears, an outline waiting to be filled, or a guide. It marks the 2px perforation on stubs and tiles, the border of the blank stub, the camera's card guide, and the 1px selection around an annotation. It is not general decoration for ordinary panels.

**The Instrument Rule.** Full circles are reserved for things that act like physical instruments: the camera shutter, crop and resize handles, and the magnifying lens. Interface buttons stay rectangular.

## Components

### Buttons
Plain, large, and printed rather than glossy.
- **Shape:** Gently rounded (6px), 48px tall, weight 600.
- **Primary:** `primary` fill with `on-primary` text. Hover and press use `primary-press`; press also settles 1px.
- **Secondary:** `paper-raised` with a 1px `rule` border and `ink` text. Hover and press use `paper-sunk`.
- **Danger:** `danger` fill with `on-danger` text. It appears only in the confirmation dialog, because destructive actions earn a protected moment.
- **Lead:** The wide bottom action in the library, 64px tall at 1.125rem with an icon.
- **Square:** 64px, icon above a 0.75rem label, beside the lead action. The library has two: Cédula and Importar.
- **Small:** 44px tall with 12px side padding, for toolbars and notices.
- **Icon:** 44px, transparent, `paper-sunk` on hover and `rule` on press, with 1.75-stroke inline line icons.
- **Disabled:** 45% opacity on every button and tool.
- **Text link:** Underlined with a 3px offset, weight 600, 44px tall, with an icon for secondary paths.

### Stub
The signature row, a cheque's counterfoil. `paper-raised` with a 1px rule, at least 104px tall. An 84px `paper-sunk` counterfoil holds the contained, unrounded thumbnail with a Sheet shadow. A 2px dashed perforation separates it from the record: title, then page count and date, then serial. Hover darkens the border to `ink-soft`; press settles 1px. The **blank stub** of the empty state is transparent with a dashed border, ruled blank lines and the serial `N.º ······`, teaching what will fill the screen.

In merging, the stub gains a leading checkbox. Selected rows thicken to a 2px `primary` border through a 1px inset line.

### Serial
Courier Prime in `serial`, prefixed `N.º`, derived from the document's identity. It appears on stubs, merge rows and the document header. The serial is a record of the document and is never used as a label for anything else.

### Page Tile
A raised sheet with a 200px `paper-sunk` well holding the contained page, and a dashed perforation above its bar of reorder and delete icon buttons around a tabular page number.

### Masthead and Toolbar
The library masthead holds the 44px app mark, the wordmark and the promise that documents stay on the phone, on `paper-sunk` with a 1px bottom rule, with the guilloche fading in behind on the right. Other paper screens use a sticky toolbar with the same band and material, holding a back icon, a title and an optional action. On the document screen the title is itself an input, transparent until focus, when it takes `paper-raised` and a focus outline.

### Guilloche
An interlaced cord of 14 procedural strands, 0.5px non-scaling stroke in `guilloche` at 50% opacity, stretching to any width and masked to fade in from 45% of the band. Pressing Escanear prints it across the band in 240ms at 90% opacity, then the camera opens. Under reduced motion there is no sweep and the camera opens at once.

### Rosette
A closed line-work watermark, 220px, fixed bottom right at 40% opacity and 0.35px stroke. It appears only on the empty library, and only on viewports at least 820px tall.

### Action Bar
Fixed to the bottom on `paper`, with a 1px top rule, 12px padding and an 8px gap, aligned to the 720px column. The **tool** variant is an even row of 56px icon-over-label tools; the active tool fills with `primary`.

### Inputs / Fields
- **Style:** 44px, 1px `rule` border, 6px radius, `ink-soft` placeholder. The field sits on `paper`, the search box on `paper-raised` with a leading icon.
- **Focus:** A 2px `focus` outline.
- **Checkbox:** Drawn from the palette at 24px with a 4px radius and a 2px `ink-soft` border, filling `primary` when checked.
- **Segmented:** Separate 44px rectangles with a gap, not a joined track. The selected option fills `primary`.

### Notice
`paper-sunk` with a 1px rule and 6px radius, a strong line, `ink-soft` copy and a small dismiss button. It states plainly where documents live and what is not backed up.

### Install Sheet
A non-modal sheet on first visit, floating above the action bar so the main action stays reachable: `paper-raised`, rule, Sheet shadow, 56px app mark, Bodoni heading. Where the browser can install, it holds an Instalar app button. On iPhone and on Android without a prompt, it shows the steps on a `paper-sunk` panel. Once dismissed it does not return by itself; a text link at the end of the library reopens it. It never appears in the installed app.

### App Icon
A white sheet with a folded corner, tilted 5 degrees, framed by four scan brackets on an indigo gradient, with interlaced rosette line work behind and one carmine line standing for the serial. Generated by `scripts/make-icons.mjs`. Rounded for browsers; full bleed with the motif inside the central 80% for maskable and iOS icons.

### Dialog and Toast
The **dialog** is a native modal, up to 26rem, `paper-raised` with a rule and Sheet shadow over the scrim, with a Bodoni heading and right-aligned actions. The **toast** is a `primary` sheet above the action bar with a Sheet shadow.

### Camera
Always dark in any theme, because the scene is the viewfinder. Translucent `camera-ground` bars hold the close button and page count at the top and a 72px circular shutter at the bottom, with a ringed outline and a press to 92% scale. The detected page shows as a pale indigo polygon with a 2px stroke, gliding over 200ms. Camera buttons are translucent dark rectangles with `camera-ink` text.

### Crop and Annotation
The photo is the work surface. The crop outline is indigo, turning carmine when the corners are invalid, and it is driven by 44px hit areas around small white circular handles, with a 112px magnifying lens while dragging. Annotations sit in a dashed selection with a 44px resize handle. The signature pad is a 160px `signature-sheet` panel with a 2px rule.

## Do's and Don'ts

### Do:
- **Do** head every paper screen with the guilloche band on `paper-sunk`, keeping line work at 50% opacity at rest and clear of text.
- **Do** show documents as contained, unrounded images in a `paper-sunk` well with the Sheet shadow.
- **Do** put a 2px dashed perforation between a document's image and its record.
- **Do** use only the existing spacing scale (4, 8, 12, 16, 24, 32px) and the 6px radius for new surfaces.
- **Do** define any new color for both the day and night printing, holding text at 4.5:1 or better.
- **Do** keep state motion within 150 to 250ms using `cubic-bezier(0.16, 1, 0.3, 1)`, and honor reduced motion.
- **Do** say plainly where documents live and what is not backed up, using the notice or the masthead promise.

### Don't:
- **Don't** build the white list with a floating button and a saturated brand bar. Primary actions live in the bottom bar.
- **Don't** resemble CamScanner in icon or visual design.
- **Don't** use carmine for anything but serials and destructive or invalid states.
- **Don't** place line work or the rosette behind a document preview.
- **Don't** show the rosette anywhere but the empty library, or on viewports under 820px tall.
- **Don't** use Courier Prime for anything but serial numbers.
- **Don't** put small labels or uppercase tracked text above headings; the only tracked text in the system is the serial.
- **Don't** add a shadow to stubs, tiles, buttons, panels or bars.
- **Don't** apply the paper theme or the night printing to the camera; it stays dark in both.
- **Don't** add a second signature animation; the guilloche sweep before the camera is the only one.
