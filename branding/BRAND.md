# Skip The Story — Brand Guidelines

## Logo

The logo is in `logo.svg` and `logo.png`. Use the SVG version on the web — it's scalable.

**Lockup:** R symbol (square) + "Skip The Story" wordmark

**Usage:**
- Minimum width: 120px
- Don't crop, rotate, or distort
- Always keep the symbol and text together
- On dark backgrounds, use `logo-white.svg`

---

## Color System

All colors defined in `colors.json`. When Claude builds the app, tell him to use these tokens:

```
--bg:          #FBF7F1   /* warm cream — page background */
--card:        #FFFFFF   /* card backgrounds */
--ink:         #1E1B18   /* main text, near-black */
--muted:       #6E655C   /* secondary text */
--line:        #E7DFD4   /* borders, dividers */
--accent:      #C0532A   /* action — buttons, links, numbers */
--accent-soft: #F6E7DE   /* soft tint for accent backgrounds */
--green:       #3F6B4A   /* success, active state */
```

**Don't change these.** Consistency is the brand. If you want different colors later, update the spec first, not mid-build.

---

## Typography

### Headings
- Font: Georgia (serif)
- Weights: 600 (bold)
- Letter-spacing: -0.01em (tight)
- Used for: H1, H2, H3, section titles

### Body
- Font: System sans (use the stack below)
- -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Helvetica, Arial, sans-serif
- Weight: 400 (normal)
- Line-height: 1.55
- Font-size: 16px base

### Small / labels
- Same sans stack
- Weight: 600 (medium)
- Font-size: 13px
- Letter-spacing: 0.1em

---

## Components

### Buttons

**Primary (accent background)**
- Background: --accent (#C0532A)
- Text: white
- Padding: 14px 24px
- Radius: 11px
- Hover: darken to #A9451F

**Ghost (bordered)**
- Border: 1px --line
- Background: transparent or --card
- Text: --ink
- Padding: 8px 16px
- Radius: 99px (pill shape)

### Cards
- Background: --card
- Border: 1px --line
- Radius: 16px
- Shadow: soft, warm-tinted only (no hard grey)

### Pills / badges
- Background: --accent-soft
- Text: --accent
- Padding: 7px 15px
- Radius: 99px
- Font-size: 13px
- Font-weight: 600

---

## Spacing Scale

Use multiples of 4px for consistency:
- 4, 8, 12, 16, 20, 24, 28, 32, 36, 44, 52, 68, 76, 84

**Common:**
- Page padding: 28px
- Section padding: 76px top/bottom
- Gap between cards: 24px
- Button padding: 14px vertical, 24px horizontal

---

## Tone of Voice

- **Clear:** no jargon, no filler
- **Friendly:** helpful, not corporate
- **Direct:** one sentence is better than three
- **Practical:** feature names describe what they do

Example (good): "Paste the link. Get just the recipe."
Example (bad): "Enjoy a streamlined recipe experience with advanced extraction capabilities."

---

## File Structure

```
branding/
  logo.svg               (main logo)
  logo-white.svg        (for dark backgrounds)
  logo.png               (100x100, backup)
  favicon.ico            (use logo-square.svg converted)
  colors.json            (hex values)
  icons/
    check.svg
    star.svg
    print.svg
    share.svg
    menu.svg
    close.svg
  BRAND.md               (this file)
```

---

## Questions for Claude

When handing off: *"Use the colors from colors.json, the typography from BRAND.md, and the icons from the icons/ folder. Keep the warm, calm aesthetic — no corporate blues or cold greys."*
