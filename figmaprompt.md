# VINTAGE SYNTH 2.0 — Settings Screen Design

## Context

Extend the existing Analog Studio / VINTAGE SYNTH 2.0 synthesizer project by designing a dedicated Settings screen.

Use the existing synthesizer screen and its provided assets as the single source of truth for visual identity. Preserve the established skeuomorphic design language, including walnut wood, brushed gunmetal, machined metal controls, engraved labels, recessed panels, amber LCD displays, and restrained green LED indicators.

Do not redesign the main synthesizer screen. Add a complementary Settings experience that feels like another panel on the same physical instrument.

## Design objective

Create a high-fidelity desktop Settings screen at 1440 × 1000 px.

The screen should resemble the configuration panel of a premium vintage synthesizer: tactile, technical, carefully organized, and visually consistent with the main instrument.

This is a functional product settings interface, not a marketing page and not a generic SaaS dashboard.

## 1. Overall layout

Create a desktop application shell with three clear regions:

### A. Hardware header
- Existing VINTAGE SYNTH 2.0 branding.
- Compact preset or instrument status display.
- Audio status indicator.
- A clearly visible navigation control to return to the main synthesizer.
- A small SETTINGS label styled like an engraved hardware designation.

### B. Settings navigation panel

Create a narrow vertical navigation panel with five sections:

1. INSTRUMENT — appearance and visual customization.
2. CONTROLS — knob, fader, and interaction preferences.
3. AUDIO — audio behavior and playback configuration.
4. PERFORMANCE — keyboard mapping and sequencer defaults.
5. STORAGE — presets, patterns, and local data.

Use compact industrial labels, subtle engraved separators, small physical-looking selector buttons, and a clear active-section indicator.

The navigation should feel integrated into the instrument chassis rather than like a modern sidebar full of rounded cards.

### C. Main configuration panel

Display the selected settings section in a spacious, structured panel.

Use recessed groups, fine metal borders, realistic toggles, rotary controls, sliders, segmented selectors, and small amber displays.

Avoid oversized cards. Every group should appear to be physically integrated into the same instrument.

For the primary frame, show the INSTRUMENT section selected and visible in full.

## 2. Instrument appearance settings

Create a section titled INSTRUMENT FINISH.

Include:

**Hardware finish selector**
- Walnut.
- Black Ash.
- Silver Edition.

Represent the choices with realistic material swatches or small previews. The selected finish must be obvious.

**Accent lighting**
- Amber.
- Signal Green.
- Warm White.

Use a physical-looking segmented selector or small illuminated buttons.

**Display brightness**
- A horizontal tactile slider.
- A numerical percentage readout.

**Panel contrast**
- A compact slider or three-position selector.

**Control lighting**
- An option to enable or disable subtle active-control illumination.

Include a live preview area showing a small sample of the instrument panel with the selected appearance settings.

The preview must feel like a physical instrument preview, not a flat theme card.

## 3. Control preferences

Create a section titled CONTROL RESPONSE.

Include:

- Knob drag sensitivity: Low, Normal, High.
- Knob interaction mode: Vertical drag or Circular drag.
- Double-click to reset: On or Off.
- Show numerical parameter values: On or Off.
- Show control tooltips: On or Off.
- Fader sensitivity: a compact adjustment slider.

Represent toggles as physical switches and selectors as engraved segmented controls.

Clearly distinguish current selections and enabled states.

## 4. Audio configuration

Create a section titled AUDIO CONFIGURATION.

Include:

- Master volume behavior.
- Computer-keyboard note velocity.
- A clear indicator explaining that browser audio may require user activation.
- Audio engine status: Ready, Inactive, or Error.
- A button to initialize or retry audio when applicable.
- A small audio signal indicator.
- A compact troubleshooting area.

Do not invent unsupported audio devices, sample rates, or latency measurements. Only display technical values when the application can actually provide them.

Keep audio configuration separate from the main instrument's actual master volume control.

## 5. Keyboard and performance

Create a section titled PERFORMANCE SETUP.

Include:

**Computer keyboard mapping**
- A small visual keyboard layout showing the mapped note keys.
- A control to enable or disable computer-keyboard note input.
- A default octave selector.

**Piano keyboard**
- Show note labels: Always, While playing, or Never.
- An option to show octave markers.

**Sequencer defaults**
- Default tempo in BPM.
- Default pattern length, with 16 steps selected initially.
- An option to show the current playback step.

Do not imply that MIDI devices are connected. MIDI configuration may be shown as a clearly marked future capability only if necessary.

## 6. Presets and local data

Create a section titled PRESET & DATA MANAGEMENT.

Include separate groups for:

**Preset library**
- Export preset.
- Import preset.
- Restore the factory preset.

**Sequencer patterns**
- Export pattern.
- Import pattern.

**Local storage**
- Display the number of locally saved presets and patterns only if this information is available.
- Explain that saved data belongs to the current browser and device.
- Provide a destructive action to clear local data, with a strong confirmation step.

Use physical-looking action buttons with clear labels. Destructive actions must be visually distinguishable from normal actions without relying on color alone.

Do not include cloud synchronization, accounts, or subscription features.

## 7. Design system and materials

Preserve the existing project palette:

- Dark walnut: #3A2118
- Walnut brown: #573523
- Gunmetal: #34312F
- Recessed charcoal: #211F1D
- Engraved text: #C8B9A5
- Amber: #E6A34A
- Signal green: #B6D63C
- Alert red: #D94B35

Use the existing project's actual colors and typography if the supplied design defines different values.

Materials:
- Restrained wood grain.
- Brushed metal texture.
- Machined metallic control surfaces.
- Recessed panels and engraved dividers.
- Realistic contact shadows.
- Small illuminated indicators.

Avoid glassmorphism, floating white cards, oversized rounded corners, excessive neon, generic dashboard charts, and decorative elements without purpose.

## 8. Interaction states and components

Create reusable components or variants for:

- Hardware navigation selectors.
- Physical toggle switches.
- Segmented selectors.
- Rotary controls.
- Horizontal sliders.
- Material finish swatches.
- Amber readouts.
- Primary and secondary hardware buttons.
- Destructive confirmation dialog.

Include default, selected, active, disabled, hovered, and keyboard-focused states where appropriate.

Use Auto Layout, reusable components, consistent spacing, and meaningful layer names.

## 9. Additional frames

Create these deliverables:

1. Settings — Instrument section, fully designed.
2. Settings — Controls section.
3. Settings — Audio section.
4. Settings — Performance section.
5. Settings — Storage section.
6. A confirmation dialog for clearing locally saved data.
7. A reusable settings component library.
8. A tablet adaptation showing how the navigation and controls reorganize.

The Instrument section should be the visual showcase. The remaining sections should follow the same established layout system rather than introducing unrelated visual styles.

## Quality criteria

The Settings screen should feel like a genuine configuration system for the same physical synthesizer represented in the existing project.

Prioritize visual consistency, legibility, believable materials, clear grouping, and intuitive controls.

Keep the design technically plausible: every setting should correspond to a meaningful application capability, and any unavailable capability must be clearly identified rather than presented as functional.

Deliver a polished, implementation-ready Figma design that can be extracted into reusable components and translated into a real React application.