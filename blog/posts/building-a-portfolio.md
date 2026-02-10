# Building a Portfolio with Vanilla HTML, CSS & JS

Sometimes the simplest approach is the best one. In this post, I'll walk through the decisions behind building this portfolio using only vanilla web technologies.

## Why No Frameworks?

It's tempting to reach for React, Vue, or Next.js for every project. But for a personal portfolio hosted on GitHub Pages, the overhead isn't worth it:

- **Zero build step** — just push and deploy
- **No dependencies to update** — no `node_modules`, no security patches
- **Fast load times** — minimal JavaScript, no framework runtime
- **Easy to maintain** — any developer can read and modify plain HTML/CSS/JS

## The Stack

Here's what powers this site:

- **HTML5** for structure
- **CSS3** with custom properties for theming
- **Vanilla JavaScript** for interactivity
- **CSS Grid & Flexbox** for layout
- **marked.js** (CDN) for rendering Markdown blog posts

## CSS Custom Properties for Theming

The dark/light theme toggle is powered entirely by CSS custom properties:

```css
:root {
  --bg-primary: #0f0f0f;
  --text-primary: #e8e8e8;
  --accent: #6c9eff;
}

[data-theme="light"] {
  --bg-primary: #f5f5f5;
  --text-primary: #1a1a1a;
  --accent: #3b6fd4;
}
```

Toggling the theme just changes a `data-theme` attribute on the `<html>` element. Every component that uses these variables updates instantly.

## The Blog System

The blog uses a simple `posts.json` manifest file. Adding a new post is two steps:

1. Write a `.md` file in `blog/posts/`
2. Add an entry to `posts.json`

The listing page reads the manifest, sorts by date, and paginates automatically. Individual posts are fetched as raw Markdown and rendered client-side with marked.js.

## Conclusion

You don't always need a complex toolchain. For static content like a portfolio, vanilla web technologies are performant, maintainable, and surprisingly pleasant to work with.
