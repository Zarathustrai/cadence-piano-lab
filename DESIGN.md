# Design System

## Theme

A warm, light practice-room surface for an evening learner seated at a keyboard with the screen on a nearby music stand. Paper-like neutrals reduce glare without becoming sepia; deep blue provides calm, precise emphasis.

## Color

- Canvas: `oklch(0.965 0.012 82)`
- Surface: `oklch(0.985 0.008 82)`
- Raised surface: `oklch(0.995 0.006 82)`
- Ink: `oklch(0.245 0.025 250)`
- Muted ink: `oklch(0.52 0.025 250)`
- Line: `oklch(0.89 0.018 82)`
- Primary: `oklch(0.46 0.13 252)`
- Primary soft: `oklch(0.92 0.045 252)`
- Success: `oklch(0.58 0.11 155)`
- Warning: `oklch(0.62 0.12 68)`
- Error: `oklch(0.55 0.16 28)`

## Typography

Use Geist Sans for the interface and Geist Mono for timing, notes, and small numeric readouts. The scale is compact and fixed, with strong weight contrast rather than decorative display typography.

## Shape and Elevation

Controls use 10 to 14 pixel radii. Sections are defined mainly through spacing and quiet rules; cards are reserved for interactive lesson units and feedback. Use one restrained shadow only for the piano instrument and floating status controls.

## Layout

Desktop uses a 240 pixel curriculum rail and a flexible practice workspace. The primary viewport prioritizes the lesson prompt, live note readout, score line, and full keyboard. Below, the microscope and generated drill form a two-column learning explanation. At tablet widths the rail becomes horizontal; mobile stacks all regions and keeps controls at least 44 pixels high.

## Components

- Primary buttons are deep blue with clear hover, active, focus, and disabled states.
- Secondary buttons are paper surfaces with full borders.
- Note chips combine pitch text, ordinal position, and state labels.
- Progress uses labeled bars and text percentages.
- Feedback pairs a semantic icon with a sentence, never color alone.
- Piano keys remain recognizably physical and use text labels on landmark notes.

## Motion

Use 160 to 220 millisecond ease-out transitions for control state and note activation. Metronome motion communicates beat state only. Disable non-essential transitions when reduced motion is requested.
