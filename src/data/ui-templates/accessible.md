# Accessible UI/UX Guidelines (WCAG 2.1 AAA)

## Design Principles
- Perceivable: Information must be presentable to all users
- Operable: Interface must be usable by all input methods
- Understandable: Information and operation must be clear
- Robust: Content must work with assistive technologies

## Color & Contrast
**WCAG AAA Contrast Ratios:**
- Normal Text (< 18px): 7:1 minimum
- Large Text (≥ 18px or ≥ 14px bold): 4.5:1 minimum
- UI Components: 3:1 minimum
- Graphical Objects: 3:1 minimum

**Recommended Color Palette:**
- Background: #FFFFFF (White)
- Text: #000000 (Black) - 21:1 contrast
- Primary: #0056B3 (Dark Blue) - 8.59:1 contrast on white
- Secondary: #6C757D (Grey) - 4.54:1 contrast on white
- Success: #155724 (Dark Green) - 9.78:1 contrast on white
- Warning: #856404 (Dark Yellow) - 7.03:1 contrast on white
- Error: #721C24 (Dark Red) - 10.7:1 contrast on white
- Info: #004085 (Dark Cyan) - 11.9:1 contrast on white

**Never rely on color alone:**
- Use icons + color
- Use text labels + color
- Use patterns + color

## Typography
**Font Family:** 
- Primary: "Atkinson Hyperlegible", "Open Sans", Arial, sans-serif
- Dyslexia-friendly: "OpenDyslexic", "Comic Sans MS"

**Font Sizes (Minimum):**
- Body Text: 16px (1rem)
- Small Text: 14px (0.875rem)
- Large Text: 18px (1.125rem)
- Headings: Scale from 20px to 40px

**Font Weights:**
- Regular: 400 (minimum for body text)
- Semibold: 600 (for emphasis)
- Bold: 700 (for headings)

**Line Height:**
- Body Text: 1.5 (minimum)
- Headings: 1.3
- Long-form Content: 1.8

**Letter Spacing:**
- Normal: 0.02em (slight increase for readability)
- Headings: 0em

**Paragraph Spacing:**
- Margin Bottom: 1.5em (clear separation)

**Text Alignment:**
- Left-aligned (never justified - causes uneven spacing)
- Max line length: 80 characters (optimal readability)

## Spacing & Layout
**Touch Targets:**
- Minimum Size: 44x44px (WCAG AAA)
- Recommended: 48x48px
- Spacing Between: 8px minimum

**Focus Indicators:**
- Visible on all interactive elements
- Minimum 2px solid outline
- High contrast color (e.g., #0056B3)
- Never remove outline without replacement

**Spacing Scale:**
- xs: 8px
- sm: 16px
- md: 24px
- lg: 32px
- xl: 48px

## Components

### Buttons
**Structure:**
```html
<button type="button" aria-label="Descriptive action">
  <span aria-hidden="true">Icon</span>
  Button Text
</button>
```

**Styling:**
- Min Height: 44px
- Min Width: 44px
- Padding: 12px 24px
- Border: 2px solid (for outline buttons)
- Border Radius: 4px
- Font Size: 16px
- Font Weight: 600
- Text Transform: None (avoid all caps)

**States:**
- Default: Clear visual appearance
- Hover: Background darkens 10%, cursor pointer
- Focus: 2px solid outline, 2px offset
- Active: Background darkens 20%
- Disabled: Opacity 0.5, cursor not-allowed, aria-disabled="true"

### Links
**Styling:**
- Color: #0056B3 (distinct from text)
- Underline: Always visible (not just on hover)
- Font Weight: 600 (slightly bolder than body)
- Visited: #551A8B (distinct from unvisited)

**Focus:**
- 2px solid outline
- 2px offset
- High contrast color

### Forms

**Labels:**
- Always visible (never placeholder-only)
- Associated with input (for/id or aria-labelledby)
- Font Size: 16px
- Font Weight: 600
- Margin Bottom: 8px

**Inputs:**
- Min Height: 44px
- Padding: 12px
- Border: 2px solid #6C757D
- Border Radius: 4px
- Font Size: 16px
- Background: #FFFFFF

**Focus:**
- Border: 2px solid #0056B3
- Outline: 2px solid #0056B3, 2px offset
- No box-shadow (can be confusing)

**Error States:**
- Border: 2px solid #721C24
- Error message: role="alert", aria-live="polite"
- Icon + text (not color alone)
- Error message ID linked via aria-describedby

**Required Fields:**
- Visual indicator: * or "Required" text
- aria-required="true"
- Never rely on color alone

### Navigation

**Skip Links:**
```html
<a href="#main-content" class="skip-link">Skip to main content</a>
```
- First focusable element
- Visible on focus
- Jumps to main content

**Menu Structure:**
```html
<nav aria-label="Main navigation">
  <ul role="list">
    <li><a href="/" aria-current="page">Home</a></li>
    <li><a href="/about">About</a></li>
  </ul>
</nav>
```

**Keyboard Navigation:**
- Tab: Move forward
- Shift+Tab: Move backward
- Enter/Space: Activate
- Arrow keys: Navigate within component
- Escape: Close modals/dropdowns

### Headings
**Hierarchy:**
- One H1 per page (page title)
- Don't skip levels (H1 → H2 → H3, never H1 → H3)
- Use semantic HTML (<h1>, <h2>, not <div class="h1">)

**Styling:**
- H1: 32px, Bold, Margin Bottom 24px
- H2: 28px, Bold, Margin Bottom 20px
- H3: 24px, Semibold, Margin Bottom 16px
- H4: 20px, Semibold, Margin Bottom 12px

### Images
**Alt Text:**
- Descriptive for informative images
- Empty alt="" for decorative images
- Never omit alt attribute

**Complex Images:**
- Provide long description via aria-describedby
- Or link to full description

### Tables
**Structure:**
```html
<table>
  <caption>Table description</caption>
  <thead>
    <tr>
      <th scope="col">Header 1</th>
      <th scope="col">Header 2</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">Row header</th>
      <td>Data</td>
    </tr>
  </tbody>
</table>
```

**Styling:**
- Border: 1px solid #6C757D
- Cell Padding: 12px
- Zebra striping: Alternate row backgrounds (#F8F9FA)
- Responsive: Horizontal scroll or card layout on mobile

### Modals/Dialogs
**Structure:**
```html
<div role="dialog" aria-labelledby="dialog-title" aria-modal="true">
  <h2 id="dialog-title">Dialog Title</h2>
  <!-- Content -->
  <button aria-label="Close dialog">×</button>
</div>
```

**Behavior:**
- Focus trap: Keep focus inside modal
- Focus first interactive element on open
- Return focus to trigger on close
- Close on Escape key
- Disable background scrolling

## Animations & Motion
**Respect prefers-reduced-motion:**
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Safe Animations:**
- Fade in/out: Opacity changes
- Slide: Small movements (< 20px)
- Avoid: Flashing, spinning, parallax

**Timing:**
- Duration: 200-300ms (quick)
- No auto-playing animations > 5 seconds

## Screen Reader Support
**ARIA Landmarks:**
- <header> or role="banner"
- <nav> or role="navigation"
- <main> or role="main"
- <aside> or role="complementary"
- <footer> or role="contentinfo"

**ARIA Labels:**
- aria-label: For elements without visible text
- aria-labelledby: Reference to visible label
- aria-describedby: Additional description

**Live Regions:**
- aria-live="polite": Announcements
- aria-live="assertive": Urgent alerts
- role="alert": Error messages
- role="status": Status updates

## Responsive Design
**Breakpoints:**
- Mobile: 320px - 767px
- Tablet: 768px - 1023px
- Desktop: 1024px+

**Mobile Considerations:**
- Larger touch targets (48x48px)
- Simplified navigation
- Readable text without zoom
- No horizontal scrolling

## Testing Checklist
- [ ] Keyboard navigation works completely
- [ ] Screen reader announces all content correctly
- [ ] Color contrast meets WCAG AAA (7:1)
- [ ] Focus indicators are visible
- [ ] Forms have proper labels and error messages
- [ ] Images have alt text
- [ ] Headings are in logical order
- [ ] Links are descriptive
- [ ] No flashing content
- [ ] Respects prefers-reduced-motion
- [ ] Works at 200% zoom
- [ ] Touch targets are 44x44px minimum

