---
name: Surplus to Shelter
colors:
  surface: '#fbf8ff'
  surface-dim: '#d6d8f2'
  surface-bright: '#fbf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f2ff'
  surface-container: '#ececff'
  surface-container-high: '#e4e7ff'
  surface-container-highest: '#dee1fa'
  on-surface: '#161b2d'
  on-surface-variant: '#574236'
  inverse-surface: '#2b2f43'
  inverse-on-surface: '#efefff'
  outline: '#8b7264'
  outline-variant: '#dec1b0'
  surface-tint: '#984800'
  primary: '#984800'
  on-primary: '#ffffff'
  primary-container: '#fc8019'
  on-primary-container: '#5e2a00'
  inverse-primary: '#ffb689'
  secondary: '#b7122a'
  on-secondary: '#ffffff'
  secondary-container: '#db313f'
  on-secondary-container: '#fffbff'
  tertiary: '#006e16'
  on-tertiary: '#ffffff'
  tertiary-container: '#58b654'
  on-tertiary-container: '#004309'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbc8'
  primary-fixed-dim: '#ffb689'
  on-primary-fixed: '#311300'
  on-primary-fixed-variant: '#733500'
  secondary-fixed: '#ffdad8'
  secondary-fixed-dim: '#ffb3b1'
  on-secondary-fixed: '#410007'
  on-secondary-fixed-variant: '#92001c'
  tertiary-fixed: '#98f98e'
  tertiary-fixed-dim: '#7cdc75'
  on-tertiary-fixed: '#002203'
  on-tertiary-fixed-variant: '#00530e'
  background: '#fbf8ff'
  on-background: '#161b2d'
  surface-variant: '#dee1fa'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
    letterSpacing: '0'
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: '0'
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-sm: 0.75rem
  margin: 1rem
  margin-md: 1.5rem
  margin-lg: 2rem
  space-2xs: 0.25rem
  space-xs: 0.5rem
  space-sm: 0.75rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
---

## Brand & Style

This design system pairs the rapid, frictionless usability of consumer food-delivery platforms with a mission-driven, community-first ethos: "Today's surplus, tonight's meal." The experience balances the visual warmth, appetite-appeal, and velocity of modern food tech with the institutional dependability required by shelters, food banks, and logistics volunteers.

### Brand Personality
- **Warm & Welcoming:** Generous spacing, friendly rounded curves, and inviting saffron tones strip away bureaucracy and make surplus redistribution feel celebratory rather than clinical.
- **Urgent yet Composed:** Perishable food operations hinge on fast turnarounds. High-contrast alerts and clear countdown treatments drive decisive action without inciting panic.
- **Reliable & Utilitarian:** Solid typography, clear touch targets, and unmistakable status signposts ensure volunteers and donors can navigate the interface in fast-paced kitchen environments.

### Design Movement: Modern Tactile Food-Tech
The visual design merges crisp, contemporary mobile card interfaces with warm, human-scale tactile touches:
- **Luminous Warmth:** Sunlit gradients and high-contrast charcoal typography keep the interface energetic and readable in varied lighting (from dim soup kitchens to bright outdoor pickup docks).
- **Physical Surfaces:** Card modules simulate structured physical trays with ultra-soft ambient drop shadows, grounding time-critical listings into tactile, tangible units of action.

## Colors

The palette is tuned for high-velocity food rescue operations, balancing appetizing warmth with immediate operational clarity.

### Primary & Action Surfaces
- **Primary Saffron (`#FC8019`):** Direct driver for primary actions, critical confirmation flows, brand badges, and active navigation indicators.
- **Primary Gradient:** `linear-gradient(135deg, #FC8019 0%, #FF9A3D 100%)` applied to hero action buttons, claimed-status banners, and high-impact donation banners.

### Functional & Semantic Tiers
- **Urgent / Expiry Red (`#E23744`):** Used strictly for critical countdowns, perishable shelf-life warnings (e.g., `< 45 mins remaining`), cancellation flows, and stock shortages. Paired with soft tint `#FDECEE` for alert containers.
- **Success / Rescued Green (`#3D9B3D`):** Designates verified safe handoffs, completed pickups, and dietary certifications. Paired with light surface `#E8F5E9` for badges and completion banners.
- **Attention Amber (`#F5A623`):** Designates pending partner confirmation, transit delays, and warm holding requirements. Paired with container tint `#FEF6E9`.

### Typography & Neutrals
- **Charcoal Ink (`#282C3F`):** Deep, legible neutral for primary headings, order numbers, and core body text.
- **Secondary Ink (`#686B78`):** Supporting labels, timestamps, portion metadata, and secondary navigation.
- **Muted Ink (`#93959F`):** Inactive icons, helper descriptions, and input placeholders.
- **Canvas Base (`#F1F1F6`):** Soft, neutral off-white surface that reduces screen glare and allows white content cards to float cleanly.
- **Surface Cards (`#FFFFFF`):** High-contrast content planes.
- **Hairline Borders (`#E9E9EB`):** Subtle structural separators for lists, input fields, and tabular splits.

## Typography

Typography is set entirely in **Plus Jakarta Sans**, harnessing its geometric clarity, generous x-height, and contemporary rounded forms to keep dense logistical listings friendly and legible under field conditions.

### Typographic Hierarchy & Roles
- **Display & Section Headers (`700 Bold`):** Deliver punchy impact on landing surfaces, onboarding steps, and hero impact metrics (e.g., "1,420 Meals Rescued"). Tight negative tracking keeps larger sizes cohesive.
- **Card Titles & Item Names (`600 SemiBold`):** Distinguish individual food batches, partner bakeries, and distribution points instantly inside card lists.
- **Body & Metadata (`400 Regular` / `500 Medium`):** Standardizes allergen notices, preparation details, pickup instructions, and volunteer directions. Regular weights are paired with neutral `#686B78` for supporting timestamps and mileage distances.
- **Badges & Action Microcopy (`600 / 700 SemiBold`):** Labels, countdown counters, and pill chips use elevated weights with deliberate letter spacing for rapid scanning on handheld screens.

## Layout & Spacing

The layout system is mobile-first, designed around rapid single-thumb interaction and clear vertical feed progression.

### Spatial Rhythms
- **Canvas Base Grid:** Built on an 8px spatial rhythm with 4px sub-increments (`space-2xs`: 4px, `space-xs`: 8px, `space-sm`: 12px, `space-md`: 16px, `space-lg`: 24px, `space-xl`: 32px, `space-2xl`: 48px).
- **Mobile Foundation (< 768px):** Single-column layout bounded by a default `16px` (`1rem`) outer screen margin. Visual lists utilize an 8px vertical gap for tight batch cards or 12px when housing expanded item previews.
- **Tablet / Split View (768px - 1024px):** A 6-column fluid structure with `24px` margins and `16px` gutters. Map and inventory lists split into a balanced 4:2 view.
- **Desktop Dispatch Console (> 1024px):** 12-column layout maxing out at `1200px` content width, centered on canvas, with `32px` margins and `24px` gutters.

### Touch Target Safety
- All interactive controls (claim buttons, quantity selectors, map pins, filter chips) adhere to a minimum interactive footprint of `48px x 48px` to guarantee zero miss-taps during hurried transit handoffs.

## Elevation & Depth

Surfaces communicate priority through soft, warm ambient drop shadows calibrated against the `#F1F1F6` canvas background. Rather than stark grays, shadow tints borrow ink tone (`#282C3F`) at minimal opacities, avoiding muddy visual noise.

### Elevation Hierarchy
- **Level 0 (Flat Canvas):** `#F1F1F6`. Background base for feed navigation and static settings screens.
- **Level 1 (Content Cards & Input Fields):** `#FFFFFF` surface with soft elevation: `box-shadow: 0 4px 20px rgba(40, 44, 63, 0.08)`. Outlined with a hairline border (`1px solid #E9E9EB`) to preserve structural clarity against light backgrounds.
- **Level 2 (Active/Hovered Cards & Dropdown Menus):** `box-shadow: 0 8px 24px rgba(40, 44, 63, 0.12)`. Applied when a user selects a food parcel or opens an allergen filter sheet.
- **Level 3 (Sticky Bottom Bars & Claim Sheets):** `box-shadow: 0 -4px 24px rgba(40, 44, 63, 0.10)`. Used on anchored mobile bottom navigation and floating bottom CTAs (e.g., "Confirm Claim - 12 Servings").
- **Level 4 (Modals & Emergency Confirmations):** `box-shadow: 0 16px 40px rgba(40, 44, 63, 0.18)` over a 50% opacity charcoal backdrop (`rgba(40, 44, 63, 0.5)`).

## Shapes

The design system uses a Level 2 (Rounded) curvature baseline, tailored to match top-tier consumer food delivery applications.

### Geometry Specifications
- **Food Parcel & Shelter Cards:** `16px` (`rounded-lg`) corner radius, creating a comfortable visual container that softens high-density inventory data.
- **Primary & Secondary Buttons:** `12px` radius. Sufficiently curved to signal clickability while maintaining crisp alignment with field inputs.
- **Chips, Diet Badges & Timers:** Full-pill geometry (`border-radius: 9999px`) for metadata markers such as "Veg", "Halal", "Expires in 20m", and category filters.
- **Form Inputs & Dialogs:** `12px` for standard inputs and text areas; `24px` (`rounded-xl`) for top edges of mobile bottom-sheets.
- **Image Thumbnails:** `12px` radius within card frames, inset with an inner hairline border to delineate bright food photography from white card walls.

## Components

### Buttons
- **Primary Button:** Gradient surface `linear-gradient(135deg, #FC8019 0%, #FF9A3D 100%)`, solid white text (`#FFFFFF`), `12px` border radius, `14px` vertical padding (`min-height: 48px`), font weight `600`. Active state applies a subtle `scale(0.98)` transform and a deeper shadow.
- **Urgent Claim Button:** Solid Rose Red (`#E23744`) with white text for food items expiring within 30 minutes.
- **Secondary Button:** Surface `#FFFFFF`, border `1.5px solid #FC8019`, text `#FC8019`, `12px` border radius.
- **Ghost Button:** Transparent surface, charcoal text (`#282C3F`), hover tint `rgba(40, 44, 63, 0.04)`.

### Chips & Filter Pills
- **Filter Chips:** Height `36px`, padding `0 16px`, full-pill radius. Default state: `#FFFFFF` background, border `1px solid #E9E9EB`, text `#686B78`. Selected state: `#FFF4EC` background, border `1.5px solid #FC8019`, text `#FC8019`, font weight `600`.
- **Status Pills (Dietary & Urgency):**
  - *Vegetarian / Safe:* `#E8F5E9` background, `#3D9B3D` text, leading green dot.
  - *Expiring Soon:* `#FDECEE` background, `#E23744` text, clock icon.
  - *Surplus Reserved:* `#FEF6E9` background, `#F5A623` text.

### Food Rescue Cards
- High-level modular containers with white background, `16px` radius, hairline border `#E9E9EB`, and Level 1 shadow (`0 4px 20px rgba(40,44,63,0.08)`).
- Composed of:
  1. Header with donor business logo, distance indicator, and urgent expiry countdown badge.
  2. Thumbnail preview of packaged surplus (e.g., 20 fresh baguettes, 15 hot meal trays).
  3. Meal count tag (e.g., "Feeds ~35 people").
  4. Full-width or inline "Claim Batch" action button.

### Lists & Activity Rows
- Clean horizontal rows on `#FFFFFF` cards separated by `#E9E9EB` hairlines.
- Padding: `16px`. Title in `#282C3F` (`font-weight: 600`), subtitle in `#686B78` (`14px`), trailing time or status stamp in `#93959F`.

### Checkboxes & Radio Controls
- **Radio Buttons:** `20px` circle, `2px` solid border (`#E9E9EB` unselected, `#FC8019` selected). Inner dot `#FC8019` at `10px` when active.
- **Checkboxes:** `20px` square, `6px` radius. Active state fills with `#FC8019` displaying a crisp white SVG checkmark.

### Form Inputs
- Height `48px`, `12px` radius, background `#FFFFFF`, border `1px solid #E9E9EB`, font size `15px`, text `#282C3F`.
- Focus state: border `1.5px solid #FC8019`, glow ring `0 0 0 3px rgba(252, 128, 25, 0.15)`. Placeholder text in `#93959F`.

### Domain-Specific Components
- **Perishable Countdown Timer:** High-visibility banner featuring a pulsating Rose Red indicator dot, countdown clock (`"38m left to pickup"`), and immediate routing link.
- **Rescue Progress Indicator:** Multi-stage breadcrumb tracking step status: `Listed` -> `Claimed` -> `In Transit` -> `Delivered to Shelter`. Completed milestones use `#3D9B3D`, active step glows in `#FC8019`.