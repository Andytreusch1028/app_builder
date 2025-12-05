# Material Design UI/UX Guidelines

## Design Principles
- Material is the metaphor: Inspired by physical materials
- Bold, graphic, intentional: Use color, imagery, and typography deliberately
- Motion provides meaning: Responsive and natural animations

## Color Palette
**Primary Colors:**
- Primary: #1976D2 (Blue 700)
- Primary Light: #42A5F5 (Blue 400)
- Primary Dark: #1565C0 (Blue 800)

**Secondary Colors:**
- Secondary: #DC004E (Pink A400)
- Secondary Light: #F50057 (Pink A200)
- Secondary Dark: #C51162 (Pink A700)

**Neutral Colors:**
- Background: #FAFAFA (Grey 50)
- Surface: #FFFFFF (White)
- Error: #F44336 (Red 500)
- Success: #4CAF50 (Green 500)
- Warning: #FF9800 (Orange 500)

**Text Colors:**
- Primary Text: rgba(0, 0, 0, 0.87)
- Secondary Text: rgba(0, 0, 0, 0.60)
- Disabled Text: rgba(0, 0, 0, 0.38)

## Typography
**Font Family:** Roboto, "Helvetica Neue", Arial, sans-serif

**Font Sizes:**
- H1: 96px (Light, -1.5px letter-spacing)
- H2: 60px (Light, -0.5px letter-spacing)
- H3: 48px (Regular, 0px letter-spacing)
- H4: 34px (Regular, 0.25px letter-spacing)
- H5: 24px (Regular, 0px letter-spacing)
- H6: 20px (Medium, 0.15px letter-spacing)
- Body 1: 16px (Regular, 0.5px letter-spacing)
- Body 2: 14px (Regular, 0.25px letter-spacing)
- Button: 14px (Medium, 1.25px letter-spacing, uppercase)
- Caption: 12px (Regular, 0.4px letter-spacing)

**Font Weights:**
- Light: 300
- Regular: 400
- Medium: 500
- Bold: 700

**Line Heights:**
- Headings: 1.2
- Body: 1.5
- Buttons: 1.75

## Spacing System
**Base Unit:** 8px

**Spacing Scale:**
- xs: 4px (0.5 units)
- sm: 8px (1 unit)
- md: 16px (2 units)
- lg: 24px (3 units)
- xl: 32px (4 units)
- 2xl: 48px (6 units)
- 3xl: 64px (8 units)

## Elevation (Box Shadows)
**Elevation Levels:**
- Level 0: none
- Level 1: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)
- Level 2: 0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)
- Level 3: 0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)
- Level 4: 0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22)
- Level 5: 0 19px 38px rgba(0,0,0,0.30), 0 15px 12px rgba(0,0,0,0.22)

## Border Radius
- Small: 4px (buttons, chips)
- Medium: 8px (cards, inputs)
- Large: 16px (dialogs, sheets)
- Round: 50% (FABs, avatars)

## Components

### Buttons
- Height: 36px (dense), 40px (normal), 48px (large)
- Padding: 16px horizontal
- Border Radius: 4px
- Text Transform: Uppercase
- Font Weight: 500
- Ripple Effect: On click

**Button Types:**
- Contained: Elevated, filled with primary color
- Outlined: Border, transparent background
- Text: No border, transparent background

### Cards
- Background: #FFFFFF
- Border Radius: 8px
- Elevation: Level 1 (default), Level 2 (hover)
- Padding: 16px

### Input Fields
- Height: 56px
- Border: 1px solid rgba(0,0,0,0.23)
- Border Radius: 4px
- Padding: 16px
- Label: Floating, 12px when focused
- Focus: 2px border, primary color

### Navigation
- App Bar Height: 56px (mobile), 64px (desktop)
- Drawer Width: 256px
- Bottom Nav Height: 56px

## Animations
**Duration:**
- Simple: 100ms
- Standard: 300ms
- Complex: 500ms

**Easing:**
- Standard: cubic-bezier(0.4, 0.0, 0.2, 1)
- Deceleration: cubic-bezier(0.0, 0.0, 0.2, 1)
- Acceleration: cubic-bezier(0.4, 0.0, 1, 1)

## Accessibility
- Minimum touch target: 48x48px
- Color contrast ratio: 4.5:1 (normal text), 3:1 (large text)
- Focus indicators: Visible outline
- ARIA labels: Required for icon buttons
- Keyboard navigation: Full support

## Responsive Breakpoints
- xs: 0-599px (Mobile)
- sm: 600-959px (Tablet)
- md: 960-1279px (Desktop)
- lg: 1280-1919px (Large Desktop)
- xl: 1920px+ (Extra Large)

