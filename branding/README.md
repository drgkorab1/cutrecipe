# Skip The Story — Branding Assets

## What's inside

```
branding/
├── BRAND.md              ← Brand guidelines (read first)
├── colors.json           ← Color palette in JSON
├── logo.svg              ← Main logo (use this on web)
├── favicon.svg           ← Browser tab icon
├── icons/
│   ├── check.svg
│   ├── star.svg
│   ├── print.svg
│   ├── share.svg
│   ├── menu.svg
│   └── close.svg
└── README.md             ← This file
```

## What to tell Claude in the terminal

Copy this prompt and send it to Claude Code:

---

**PROMPT:**

I've added a branding folder with logo, colors, and icons. Here's what I need:

1. Import the logo (`branding/logo.svg`) into the nav bar at the top left
2. Use the colors from `branding/colors.json` for all Tailwind classes
3. Use the icons from `branding/icons/` for buttons (checkmark in ingredients, star for save, print icon for print button, etc.)
4. Read `branding/BRAND.md` for typography and component specs
5. Keep the warm, calm aesthetic — this isn't a corporate app

The logo should be about 140px wide in the nav. Make sure it works on the light cream background.

---

## Notes

- The SVG logo scales perfectly to any size
- Colors are provided in both hex and CSS variables
- Icons use `currentColor` so they inherit the text color by default
- All fonts are system fonts (no webfont downloads needed)

## If you need changes later

Update `colors.json` or `icons/` directly and tell Claude to rebuild. Don't change the logo without a reason — consistency matters.
