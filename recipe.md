# RecipeOnly — Build Specification

> Paste a recipe link, get just the ingredients and method. Free, no signup, no paywall.

This document is a complete build brief. Read it fully before writing code.

---

## 1. What we are building

A single-page web tool. The user pastes a recipe URL, presses a button, and the ingredients and method appear in place on the same page — no navigation, no account, no paywall.

**Positioning:** The market leader (JustTheRecipe) puts its tool behind a paywall almost immediately. Our entire wedge is being genuinely free and instant. Every design decision must protect that: no signup walls, no interstitials, no "create an account to continue".

**Non-goal:** We are not building a recipe manager, a meal planner, or a social network. Resist scope creep.

---

## 2. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 15 (App Router) + TypeScript | Server routes for extraction, great SEO, free hosting |
| Styling | Tailwind CSS | Fast, no CSS files to maintain |
| Hosting | Vercel (free tier) | Zero config, edge caching |
| Database | Supabase (Postgres + Auth) | Free tier, magic-link auth built in |
| HTML parsing | `cheerio` | Fast server-side DOM parsing |
| AI fallback | Claude Haiku or GPT-4o-mini via API | Only used when structured data is missing |
| Caching | Vercel KV or Supabase table | Never extract the same URL twice |

Keep dependencies minimal. No component libraries, no state management library, no ORM beyond the Supabase client.

---

## 3. The extraction engine (the core of the product)

This is where the quality lives. Build it as a server route: `POST /api/extract` with `{ url: string }`.

### 3.1 Extraction ladder

Try each method in order. Stop at the first success.

**Step 1 — JSON-LD (handles ~80% of sites)**

Nearly every recipe site embeds `schema.org/Recipe` structured data so Google can show recipe cards. Parse every `<script type="application/ld+json">` block and look for an object where `@type` is `Recipe` (it may be nested inside `@graph` or an array — handle both).

Fields to pull:
- `name` → title
- `recipeIngredient[]` → ingredients
- `recipeInstructions` → steps (may be a string, an array of strings, an array of `HowToStep` objects, or contain `HowToSection` groups — normalise all four)
- `totalTime` / `prepTime` / `cookTime` → ISO 8601 durations, convert to minutes
- `recipeYield` → servings (may be `"4 servings"` or `4` or `["4"]`)
- `author.name` → attribution
- `image` → **do not display**, see §7

**Step 2 — Microdata / RDFa**

Older sites use `itemprop="recipeIngredient"` attributes instead. Same fields, different selectors.

**Step 3 — WordPress recipe plugins**

A large share of food blogs use WP Recipe Maker or Tasty Recipes. Both output predictable class names (`.wprm-recipe-ingredient`, `.tasty-recipes-ingredients`). Add selectors for the top few plugins.

**Step 4 — AI fallback**

Only if all of the above fail. Strip the page to text, send it to a cheap model with a strict JSON schema, and return the parsed result. Cap the input at ~15k characters to control cost. Log every time this fires so we can see which sites need a dedicated parser.

**Step 5 — Fail gracefully**

Show: *"We couldn't find a recipe on that page."* plus a link to open the original. Never show a stack trace or a blank screen.

### 3.2 Fetching rules

- Send a normal browser User-Agent
- 8 second timeout
- Follow redirects, max 3
- Reject non-HTML content types
- Validate the URL is `http`/`https` and not a private IP range (SSRF protection — this matters, do not skip it)
- Rate limit by IP: 20 extractions per minute

### 3.3 Caching

Cache every successful extraction by normalised URL for 30 days. This makes repeat requests instant and cuts cost to near zero. Strip tracking parameters (`utm_*`, `fbclid`) before using the URL as a cache key.

### 3.4 Ingredient parsing (needed for the serving adjuster)

Parse each ingredient string into `{ quantity, unit, item }`. Handle:
- Decimals and fractions, including unicode fractions (½, ¼, ⅓)
- Ranges (`2-3 cloves`)
- Missing quantity (`Salt and pepper` → quantity null, never scale it)

When the user changes servings, multiply quantities and re-render as readable fractions. Anything unparsed stays exactly as written.

---

## 4. Page structure

Single route `/`. Sections in this order:

### 4.1 Top navigation
Logo left. Links right: *Recipe extractor*, *From a photo*, *Blog*, and a bordered pill button *Sign in*. Sticky with a slight background blur.

### 4.2 Hero (default state)
- Small pill badge: `● Free forever — no signup, no paywall`
- H1: **Paste the link. Get *just* the recipe.** ("just" in italic serif, accent colour)
- Subheading: *No life story, no pop-ups, no scrolling past twelve photos of a kitchen. Ingredients and steps, in two seconds.*
- Input bar: rounded white card, URL input + accent button labelled **Get the recipe only**
- Below: *No account needed. **Always free.** We link back to the original author.*
- Social proof row: `WORKS WITH 40,000+ RECIPE SITES` and a muted list of site names

### 4.3 Result (replaces nothing — appears directly below the input)
Do not navigate away. Insert the recipe card in place and smooth-scroll it into view. Update the browser URL to `/?r=<slug>` with `history.pushState` so it can be shared and bookmarked.

Loading state: skeleton card, not a spinner. Should feel instant.

**Recipe card contents, in order:**

1. **Attribution strip** (top, tinted background): `Recipe by <Author> — we only show the ingredients and steps.` with a **Read the original ↗** link on the right. This is mandatory and must never be collapsible.
2. Recipe title (large serif)
3. Meta row: total time, servings, ingredient count, step count
4. Tool row:
   - Serving stepper (− / *4 servings* / +) that rescales quantities live
   - **Keep screen awake** toggle (Wake Lock API — falls back silently on unsupported browsers)
   - **Save recipe** (star) — prompts sign-in only when clicked
   - **Print** — clean print stylesheet, card only
   - **Share** — copies the link
5. Two columns: **Ingredients** (left, ~40%) and **Method** (right, ~60%)
   - Ingredients are tappable checkboxes with a dashed separator between rows. Ticked items go muted with a strikethrough. State persists while the page is open.
   - Steps are numbered with a circular accent badge.
6. On mobile: single column, ingredients first, minimum 16px text.

### 4.4 How it works
Three cards: *Paste any link* / *We strip the noise* / *Cook from a clean page*.

### 4.5 Other tools
Two cards side by side:
- **Recipe extractor** — badge `Live`, link *Try it →*
- **Cook from what you have** — badge `Coming soon`, photograph your ingredients and get recipes. Button: *Join the waitlist →* which opens an email capture modal.

Never use the words "under construction".

### 4.6 Blog
Grid of 6 most recent posts. Each card: gradient placeholder thumbnail, category label in accent colour, title, read time.

### 4.7 Newsletter
Dark rounded panel. Heading *One good recipe, every Friday*. Email input + Subscribe button. Small line beneath with subscriber count.

### 4.8 Footer
Four columns: brand + one-line blurb, Tools, Site, About. The About column includes a **For food bloggers** page (see §7). Bottom bar with copyright.

---

## 5. Design system

```
--bg:          #FBF7F1   /* warm cream page background */
--card:        #FFFFFF
--ink:         #1E1B18   /* near-black text */
--muted:       #6E655C   /* secondary text */
--line:        #E7DFD4   /* borders */
--accent:      #C0532A   /* terracotta - buttons, links, numbers */
--accent-soft: #F6E7DE   /* accent backgrounds */
--green:       #3F6B4A   /* "always free", active toggles */
```

- **Headings:** serif (Georgia stack, or Instrument Serif / Fraunces if adding a webfont). Weight 600, tight letter-spacing.
- **Body:** system sans stack. Line height 1.55.
- **Radii:** 11px buttons, 16px cards, 20px recipe card, 99px pills.
- **Shadows:** very soft and warm-tinted only. No hard grey drop shadows.
- **Max width:** 1080px page, 820px recipe card.
- Generous whitespace. This should feel calm — it is the opposite of the sites we are fixing.

---

## 6. Accounts (optional, never required)

Supabase magic-link auth. No password.

Sign-in is **only** ever triggered by clicking *Save recipe* or *Sign in*. It is never shown as a wall, a modal on load, or a condition for extraction.

**Profile page** (`/profile`), two tabs:
- **History** — recipes this user has extracted, newest first
- **Starred** — saved recipes

Schema:

```sql
recipes        (id, url_hash, url, title, author_name, author_url,
                ingredients jsonb, steps jsonb, total_minutes,
                servings, extracted_at, method)   -- shared cache
user_recipes   (user_id, recipe_id, viewed_at, starred boolean)
waitlist       (email, source, created_at)
subscribers    (email, confirmed, created_at)
```

---

## 7. Legal and attribution rules — do not skip this section

In 2021 a near-identical site called Recipeasly launched and was taken offline within about 48 hours after food bloggers publicly attacked it for republishing their work with the ads and credit stripped. Our rules exist to avoid that outcome:

1. **Never display the source site's photos.** Do not hotlink them, do not copy them.
2. **Never display the source site's prose** — no headnotes, no story, no descriptive paragraphs. Ingredients and steps only. These are functional facts; the surrounding writing is theirs.
3. **Author name and a link to the original are always visible at the top** of the recipe card, never collapsed or in a footer.
4. **Honour `robots.txt`** and maintain a blocklist. Any publisher who asks to be excluded is excluded within 24 hours, no argument.
5. **Publish a `/for-food-bloggers` page** explaining what we show, what we don't, that we send traffic back, and how to opt out in one click.
6. **Never cache or serve a recipe from a paywalled page.**

This costs us nothing and removes the entire reason anyone would come after us.

---

## 8. SEO

- Every extracted recipe gets a shareable URL. Decide deliberately whether these are indexable — if in doubt, `noindex` them at launch and revisit once the blogger relationship is established. Traffic is not worth the fight.
- The blog is the safe SEO engine. Target long-tail cooking questions.
- Proper metadata, Open Graph tags, sitemap, and fast Core Web Vitals throughout.
- Target: hero interactive under 1 second, extraction result under 2 seconds.

---

## 9. Build order

**Phase 1 — ship this first, nothing else**
1. Next.js project, Tailwind, design tokens from §5
2. `/api/extract` with the JSON-LD path only
3. Hero + input + result card rendering in place
4. Attribution strip
5. Mobile layout
6. Deploy to Vercel

At this point it is genuinely usable. Give it to ten people who cook and watch what breaks.

**Phase 2 — quality**
7. Microdata, WP plugin parsers, AI fallback
8. Caching layer
9. Ingredient parsing + serving adjuster
10. Checkboxes, wake lock, print, share

**Phase 3 — retention**
11. Supabase auth, history, starred
12. Blog with the first 6 posts
13. `/for-food-bloggers` page
14. Newsletter + waitlist capture

**Phase 4 — later**
15. Browser extension
16. Photo-to-recipe tool

---

## 10. Things not to build

- Any paywall, trial, or usage limit on extraction
- A signup wall of any kind
- Comments, ratings, or user-generated recipes
- A mobile app
- Anything labelled "under construction"

---

## 11. Definition of done for Phase 1

- [ ] Pasting a URL from 10 different major recipe sites returns correct ingredients and steps
- [ ] A page with no recipe shows a friendly failure with a link to the original
- [ ] Author name and original link are visible on every result
- [ ] Works on a phone in one hand, text readable at arm's length
- [ ] No account required at any point
- [ ] Lighthouse performance score above 95
- [ ] Private IP addresses and non-HTML URLs are rejected by the API
