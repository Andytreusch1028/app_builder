# Glassmorphism UI/UX Guidelines

## Design Principles
- Frosted glass effect: Blur and transparency
- Layered depth: Multiple glass layers
- Vibrant backgrounds: Colorful gradients behind glass
- Subtle borders: Light borders for definition
- Soft shadows: Gentle depth perception

## Color Palette
**Background Gradients:**
- Gradient 1: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
- Gradient 2: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)
- Gradient 3: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)
- Gradient 4: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)
- Gradient 5: linear-gradient(135deg, #fa709a 0%, #fee140 100%)

**Glass Colors (with transparency):**
- White Glass: rgba(255, 255, 255, 0.1) to rgba(255, 255, 255, 0.3)
- Dark Glass: rgba(0, 0, 0, 0.1) to rgba(0, 0, 0, 0.3)
- Colored Glass: rgba(color, 0.15)

**Border Colors:**
- Light Border: rgba(255, 255, 255, 0.18)
- Dark Border: rgba(0, 0, 0, 0.1)

**Text Colors:**
- On Light Glass: #000000 or rgba(0, 0, 0, 0.8)
- On Dark Glass: #FFFFFF or rgba(255, 255, 255, 0.9)
- Secondary: rgba(text-color, 0.7)

## Glass Effect Properties
**Standard Glass:**
```css
background: rgba(255, 255, 255, 0.1);
backdrop-filter: blur(10px);
-webkit-backdrop-filter: blur(10px);
border: 1px solid rgba(255, 255, 255, 0.18);
box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
```

**Intense Glass:**
```css
background: rgba(255, 255, 255, 0.25);
backdrop-filter: blur(20px) saturate(180%);
-webkit-backdrop-filter: blur(20px) saturate(180%);
border: 1px solid rgba(255, 255, 255, 0.3);
box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
```

**Subtle Glass:**
```css
background: rgba(255, 255, 255, 0.05);
backdrop-filter: blur(5px);
-webkit-backdrop-filter: blur(5px);
border: 1px solid rgba(255, 255, 255, 0.1);
box-shadow: 0 4px 16px 0 rgba(31, 38, 135, 0.2);
```

## Typography
**Font Family:** "Poppins", "Inter", -apple-system, sans-serif

**Font Sizes:**
- H1: 56px (Bold)
- H2: 42px (Semibold)
- H3: 32px (Semibold)
- H4: 24px (Medium)
- H5: 20px (Medium)
- H6: 18px (Medium)
- Body: 16px (Regular)
- Small: 14px (Regular)

**Font Weights:**
- Regular: 400
- Medium: 500
- Semibold: 600
- Bold: 700

**Text Shadow (for readability on vibrant backgrounds):**
- Subtle: 0 2px 4px rgba(0, 0, 0, 0.1)
- Medium: 0 2px 8px rgba(0, 0, 0, 0.2)

## Spacing System
**Base Unit:** 8px

**Spacing Scale:**
- xs: 8px
- sm: 16px
- md: 24px
- lg: 32px
- xl: 48px
- 2xl: 64px

## Border Radius
**Rounded Corners (Essential for glass effect):**
- Small: 12px
- Medium: 16px
- Large: 24px
- Extra Large: 32px
- Round: 50%

## Shadows
**Glass Shadows:**
- Light: 0 8px 32px 0 rgba(31, 38, 135, 0.37)
- Medium: 0 12px 48px 0 rgba(31, 38, 135, 0.45)
- Heavy: 0 16px 64px 0 rgba(31, 38, 135, 0.55)

**Inner Shadows (for depth):**
- Subtle: inset 0 1px 2px rgba(255, 255, 255, 0.1)

## Components

### Glass Cards
```css
background: rgba(255, 255, 255, 0.1);
backdrop-filter: blur(10px);
border-radius: 16px;
border: 1px solid rgba(255, 255, 255, 0.18);
padding: 32px;
box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
```

### Glass Buttons
**Primary:**
```css
background: rgba(255, 255, 255, 0.2);
backdrop-filter: blur(10px);
border: 1px solid rgba(255, 255, 255, 0.3);
border-radius: 12px;
padding: 12px 32px;
color: #FFFFFF;
font-weight: 600;
box-shadow: 0 4px 16px rgba(31, 38, 135, 0.3);
transition: all 0.3s ease;
```

**Hover:**
```css
background: rgba(255, 255, 255, 0.3);
transform: translateY(-2px);
box-shadow: 0 6px 24px rgba(31, 38, 135, 0.4);
```

### Glass Input Fields
```css
background: rgba(255, 255, 255, 0.1);
backdrop-filter: blur(8px);
border: 1px solid rgba(255, 255, 255, 0.18);
border-radius: 12px;
padding: 14px 20px;
color: #FFFFFF;
font-size: 16px;
```

**Placeholder:**
```css
color: rgba(255, 255, 255, 0.6);
```

**Focus:**
```css
border: 1px solid rgba(255, 255, 255, 0.4);
box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.1);
```

### Glass Navigation
```css
background: rgba(255, 255, 255, 0.1);
backdrop-filter: blur(20px);
border-bottom: 1px solid rgba(255, 255, 255, 0.18);
height: 70px;
position: fixed;
top: 0;
width: 100%;
z-index: 1000;
```

### Glass Modals/Dialogs
```css
background: rgba(255, 255, 255, 0.15);
backdrop-filter: blur(15px);
border-radius: 24px;
border: 1px solid rgba(255, 255, 255, 0.2);
padding: 40px;
max-width: 500px;
box-shadow: 0 16px 64px rgba(31, 38, 135, 0.5);
```

## Animations
**Duration:**
- Fast: 200ms
- Standard: 300ms
- Slow: 500ms

**Easing:**
- Smooth: cubic-bezier(0.4, 0, 0.2, 1)
- Bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55)

**Common Animations:**
- Hover: Transform translateY(-2px) + shadow increase
- Click: Transform scale(0.98)
- Fade In: Opacity 0 to 1 + translateY(10px to 0)

## Background Patterns
**Recommended Backgrounds:**
1. Vibrant gradients (see Color Palette)
2. Animated gradient (gradient position animation)
3. Particle effects behind glass
4. Blurred images
5. Geometric patterns with blur

**Background Animation Example:**
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
background-size: 200% 200%;
animation: gradientShift 15s ease infinite;

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
```

## Accessibility
- Ensure text contrast: Minimum 4.5:1 ratio
- Add text shadows for readability on vibrant backgrounds
- Provide fallback for browsers without backdrop-filter support
- Focus indicators: Bright border or glow effect
- Keyboard navigation: Full support

## Browser Support
**Backdrop Filter Support:**
- Chrome/Edge: 76+
- Safari: 9+ (with -webkit- prefix)
- Firefox: 103+

**Fallback for unsupported browsers:**
```css
background: rgba(255, 255, 255, 0.9); /* Solid fallback */
```

## Responsive Breakpoints
- Mobile: 0-767px
- Tablet: 768-1023px
- Desktop: 1024px+

**Mobile Adjustments:**
- Reduce blur intensity (blur(5px) instead of blur(10px))
- Increase background opacity for better readability
- Larger touch targets (48px minimum)

