# AGENTS.md — Coding Agent Guide for Portfolio Website

## Project Overview

Static SPA portfolio website hosted on GitHub Pages. Zero build step, zero npm
packages, zero frameworks. Vanilla HTML + CSS + JS only. Hash-based client-side
routing (`#/path`). Blog system renders Markdown client-side via marked.js (CDN).

## Build / Run / Test

There is **no build step, no linter, no test suite, and no package.json**. The
site is deployed by pushing static files to a GitHub Pages branch.

```bash
# Local development — serve with any static file server:
npx serve .                     # or python -m http.server 8000
# Then open http://localhost:3000 (or :8000)

# Note: opening index.html directly via file:// protocol will NOT work
# because fetch() for page partials requires HTTP. Use a local server.

# There are no build, lint, or test commands to run.
```

## Project Structure

```
index.html              # Single app shell (sidebar inline, all <script> tags)
css/style.css           # Monolithic stylesheet (~980 lines)
js/main.js              # SPA router, theme toggle, mobile menu
js/blog.js              # Blog listing module (window.BlogPage)
js/post.js              # Post viewer module (window.PostPage)
pages/
  home.html             # Page partial — hero section
  about.html            # Page partial — bio, skills, contact
  blog.html             # Page partial — blog listing skeleton
  post.html             # Page partial — post viewer skeleton
blog/posts/
  posts.json            # Blog manifest (title, date, file, summary, tags)
  *.md                  # Blog post Markdown files
images/
  background.svg        # Replaceable background image
```

## Architecture

### SPA Router (js/main.js)
- Routes: `#/` (home), `#/about`, `#/blog`, `#/blog?page=N`, `#/blog/file.md`
- `parseHash()` returns `{ page, param, query }`
- `navigate()` lifecycle: fade out → fetch partial → inject into `#app` → call
  page init → fade in → scroll to top
- Link interception: global click handler on `document` catches `<a href="#...">`

### Module Communication
- Each page module is an IIFE that registers on `window`:
  `window.BlogPage = { init: init }` and `window.PostPage = { init: init }`
- The router checks `typeof window.BlogPage !== 'undefined'` before calling
- Home and About are static partials — no JS init needed

### Blog System
- `blog/posts/posts.json` is the manifest — add an entry per new post
- Posts are fetched, sorted by date descending, cached after first load
- Pagination: 5 posts per page, client-side slicing
- Single post: raw `.md` fetched and parsed with `marked.parse()`

### Theme System
- Dark theme default via `<html data-theme="dark">`
- Light theme via `[data-theme="light"]` CSS override (28 custom properties)
- Persisted in `localStorage` key `'theme'`
- Applied before DOMContentLoaded to prevent flash

## Code Style

### JavaScript

| Rule | Convention |
|------|-----------|
| Wrapping | Every file is an IIFE: `(function () { 'use strict'; ... })();` |
| Variables | **`var` only** — no `let`, no `const` anywhere |
| Functions | **`function` keyword only** — no arrow functions |
| Strings | **Single quotes** in JS, **concatenation with `+`** — no template literals |
| Semicolons | Always present |
| Indentation | 2 spaces |
| Naming | camelCase for functions/variables: `fetchPosts`, `renderPagination` |
| Constants | UPPER_SNAKE_CASE: `POSTS_PER_PAGE`, `TRANSITION_MS`, `POSTS_DIR` |
| Async | `async/await` with `try/catch` — no raw `.then()` chains |
| Braces | K&R style (opening brace on same line) |
| Comments | `/** JSDoc */` for major functions, `//` for inline notes |
| Sections | Group with `// ---- Section Name ----` comment markers |

### CSS

| Rule | Convention |
|------|-----------|
| Indentation | 2 spaces |
| Class naming | Flat kebab-case: `blog-card-date`, `sidebar-nav`, `post-header` |
| State classes | Simple: `.active`, `.open`, `.page-exit`, `.page-enter` |
| Custom properties | `--{category}-{descriptor}`: `--bg-primary`, `--text-muted`, `--accent-hover` |
| Section markers | `/* --- Section Name --- */` |
| Theming | `:root` for dark defaults, `[data-theme="light"]` for light overrides |
| Transitions | Use custom property durations: `var(--transition-fast)` (0.15s), `var(--transition-base)` (0.25s) |
| Hover effects | `transform` only (translateX, translateY, scale) for GPU acceleration |
| Active/press | Slight scale-down: `scale(0.95)` to `scale(0.98)` |
| Responsive | Two breakpoints: `768px` (mobile), `480px` (small mobile) |

### HTML

| Rule | Convention |
|------|-----------|
| Quotes | Double quotes for attributes |
| IDs | kebab-case: `blog-grid`, `post-content`, `theme-toggle` |
| Data attributes | `data-page="home"`, `data-theme="dark"` |
| Partials | Raw HTML fragments in `pages/` — no `<html>`, `<head>`, or `<body>` |
| Icons | Inline SVG (no icon library) |
| Internal links | Always use `#/path` hash format for SPA routing |
| External links | `target="_blank" rel="noopener noreferrer"` |

### File & Directory Naming
- kebab-case for multi-word files: `building-a-portfolio.md`
- Lowercase single-word otherwise: `main.js`, `style.css`, `blog.html`
- Directories lowercase: `js/`, `css/`, `pages/`, `blog/`, `images/`

## Error Handling

- **All `fetch()` calls** wrapped in `try/catch` with `console.error(message, err)`
- **Graceful fallback UI**: navigation errors show "Page not found" with a home
  link; post errors show "Post not found" with a blog link; empty blog shows
  "No posts yet"
- **Guard clauses** at function entry: `if (!app) return;`, `if (!toggle) return;`
- **Null-safe DOM access**: always `if (el) el.property = ...` before manipulation
- **Input validation**: `post.js` rejects filenames with `/`, `\`, or missing
  `.md` suffix (path traversal prevention). Filenames are `decodeURIComponent()`
  decoded before use.
- **Type checks for globals**: `if (typeof window.BlogPage !== 'undefined')`
  and `if (typeof marked === 'undefined')`

## External Dependencies

| Dependency | Version | Loaded via | Notes |
|------------|---------|------------|-------|
| marked.js | 14.0.0 (pinned) | CDN script tag | Markdown rendering |
| Inter font | 400,500,600,700 | Google Fonts CSS | Primary typeface |

No npm packages. No build tools. No polyfills. Browser target is modern
evergreen browsers (ES2017+ features used: `async/await`, `fetch`,
`Promise.all`, `URLSearchParams`, `CSS custom properties`, `inset`).

## Key Conventions to Follow

1. **Never introduce a build step** — site must remain deployable as-is
2. **Never use `let`, `const`, arrow functions, or template literals** — the
   codebase uses `var` and `function` exclusively by design
3. **Never add npm packages** — only CDN-loaded libraries pinned to a version
4. **All internal navigation uses `#/path` hash links** — never `href="page.html"`
5. **New page partials** go in `pages/` as raw HTML fragments, registered in
   the `getPartialPath()` and `getPageTitle()` maps in `main.js`
6. **New JS modules** follow the IIFE pattern and expose via `window.ModuleName`
7. **New blog posts**: add `.md` file to `blog/posts/`, add entry to `posts.json`
8. **CSS changes** go in `css/style.css` under the appropriate `/* --- */` section
9. **Background image**: replace `images/background.svg` (or `.jpg`/`.png`/`.webp`)
   and update the `url()` path in the `body::before` rule in `style.css`
10. **Theme support**: any new colors must be defined as custom properties in both
    `:root` (dark) and `[data-theme="light"]` (light) blocks
