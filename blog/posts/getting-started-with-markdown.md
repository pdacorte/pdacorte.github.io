# Getting Started with Markdown Blogging

Markdown is a lightweight markup language that makes writing formatted content simple and enjoyable. If you're new to Markdown, this post covers the basics.

## Why Markdown?

- **Readable** — Markdown source files are easy to read even without rendering
- **Portable** — plain text files work everywhere
- **Fast** — no clicking through formatting toolbars
- **Version-friendly** — diffs are clean and meaningful in Git

## Basic Syntax

### Headings

Use `#` for headings. More `#` symbols mean smaller headings:

```markdown
# Heading 1
## Heading 2
### Heading 3
```

### Text Formatting

- **Bold** text with `**double asterisks**`
- *Italic* text with `*single asterisks*`
- `Inline code` with backticks

### Lists

Unordered lists use `-` or `*`:

- Item one
- Item two
- Item three

Ordered lists use numbers:

1. First item
2. Second item
3. Third item

### Links and Images

```markdown
[Link text](https://example.com)
![Alt text](image-url.jpg)
```

### Code Blocks

Use triple backticks with an optional language name:

```javascript
function greet(name) {
  return `Hello, ${name}!`;
}
```

### Blockquotes

> Blockquotes are great for highlighting important information
> or quoting external sources.

## Writing Tips

1. **Keep paragraphs short** — they're easier to read on screens
2. **Use headings liberally** — they create scannable structure
3. **Include code examples** — practical examples are more useful than theory
4. **Add links** — connect your readers to relevant resources

## Adding a New Blog Post

To add a new post to this blog:

1. Create a new `.md` file in the `blog/posts/` directory
2. Add an entry to `blog/posts/posts.json` with the title, date, filename, and summary
3. Commit and push — the blog index handles the rest automatically

That's it. Happy writing!
