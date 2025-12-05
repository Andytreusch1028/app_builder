# Minimalist UI/UX Guidelines

## Design Principles
- Less is more: Remove everything unnecessary
- White space is content: Use generous spacing
- Focus on content: Let content breathe
- Subtle interactions: Minimal but meaningful feedback
- Monochromatic: Limited color palette

## Color Palette
**Primary Colors:**
- Black: #000000
- White: #FFFFFF
- Grey: #808080

**Accent (Use Sparingly):**
- Accent: #0066FF (Bright Blue)

**Neutral Grays:**
- Grey 100: #F5F5F5
- Grey 200: #EEEEEE
- Grey 300: #E0E0E0
- Grey 400: #BDBDBD
- Grey 500: #9E9E9E
- Grey 600: #757575
- Grey 700: #616161
- Grey 800: #424242
- Grey 900: #212121

**Text Colors:**
- Primary: #000000
- Secondary: #757575
- Disabled: #BDBDBD
- Inverse: #FFFFFF

## Typography
**Font Family:** 
- Primary: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
- Alternative: "Helvetica Neue", Arial, sans-serif

**Font Sizes:**
- H1: 48px
- H2: 36px
- H3: 28px
- H4: 24px
- H5: 20px
- H6: 18px
- Body: 16px
- Small: 14px
- Tiny: 12px

**Font Weights:**
- Light: 300
- Regular: 400
- Medium: 500
- Semibold: 600

**Line Heights:**
- Tight: 1.2 (headings)
- Normal: 1.5 (body)
- Relaxed: 1.8 (long-form content)

**Letter Spacing:**
- Tight: -0.02em (large headings)
- Normal: 0em (body)
- Wide: 0.05em (small caps, labels)

## Spacing System
**Base Unit:** 8px

**Spacing Scale (Generous):**
- 2xs: 4px
- xs: 8px
- sm: 16px
- md: 24px
- lg: 32px
- xl: 48px
- 2xl: 64px
- 3xl: 96px
- 4xl: 128px

**Principle:** Use larger spacing than you think you need

## Layout
**Max Width:** 1200px (centered)
**Content Width:** 800px (reading content)
**Grid:** 12 columns with 24px gutters
**Margins:** 48px (desktop), 24px (mobile)

## Borders & Lines
**Border Width:** 1px (thin lines only)
**Border Color:** #E0E0E0 (subtle)
**Border Radius:** 0px (sharp corners) OR 2px (very subtle)

**Dividers:**
- Thickness: 1px
- Color: #E0E0E0
- Use sparingly

## Shadows
**Principle:** Avoid shadows when possible. Use subtle borders instead.

**If shadows are needed:**
- Subtle: 0 1px 2px rgba(0, 0, 0, 0.05)
- Medium: 0 2px 4px rgba(0, 0, 0, 0.08)
- Never use heavy shadows

## Components

### Buttons
**Primary Button:**
- Background: #000000
- Text: #FFFFFF
- Padding: 12px 32px
- Border: none
- Border Radius: 0px
- Font Weight: 500
- Hover: #333333

**Secondary Button:**
- Background: transparent
- Text: #000000
- Padding: 12px 32px
- Border: 1px solid #000000
- Border Radius: 0px
- Font Weight: 500
- Hover: Background #F5F5F5

**Text Button:**
- Background: transparent
- Text: #000000
- Padding: 12px 16px
- Border: none
- Font Weight: 500
- Hover: Underline

### Input Fields
- Height: 48px
- Padding: 12px 16px
- Border: 1px solid #E0E0E0
- Border Radius: 0px
- Background: #FFFFFF
- Focus: Border color #000000, no shadow
- Label: Above input, 14px, #757575

### Cards
- Background: #FFFFFF
- Border: 1px solid #E0E0E0
- Border Radius: 0px
- Padding: 32px
- Shadow: None (use border instead)

### Navigation
- Background: #FFFFFF
- Border Bottom: 1px solid #E0E0E0
- Height: 64px
- Logo: Left aligned
- Links: Right aligned, 16px, #000000
- Active: Underline or bold

### Lists
- Item Height: 56px
- Padding: 16px
- Border Bottom: 1px solid #E0E0E0
- Hover: Background #F5F5F5

## Icons
**Style:** Line icons (not filled)
**Stroke Width:** 1.5px
**Size:** 24px (standard), 20px (small), 32px (large)
**Color:** Match text color

## Images
- Full bleed or contained
- No rounded corners
- High quality, minimal processing
- Black & white preferred, color sparingly

## Animations
**Principle:** Minimal, fast, purposeful

**Duration:**
- Instant: 100ms
- Quick: 200ms
- Never longer than 300ms

**Easing:**
- Linear: linear (most cases)
- Ease Out: cubic-bezier(0, 0, 0.2, 1)

**What to animate:**
- Opacity: 0 to 1
- Transform: Subtle movements
- Avoid: Color changes, complex animations

## Accessibility
- High contrast: Black on white
- Focus indicators: 2px solid black outline
- Touch targets: Minimum 44x44px
- Keyboard navigation: Full support
- Screen reader: Proper ARIA labels

## Responsive Breakpoints
- Mobile: 0-767px
- Tablet: 768-1023px
- Desktop: 1024px+

**Mobile Adjustments:**
- Reduce spacing by 50%
- Stack elements vertically
- Full-width buttons
- Larger touch targets (48px minimum)

