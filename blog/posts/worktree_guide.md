# Git Worktree Guide for Parallel Agents

Git worktrees let you use multiple working directories from the same repository at the same time. The practical benefit is simple: each agent gets its own checkout and its own branch, so uncommitted changes, editor state, and terminal state do not interfere with each other.

## Why Use Worktrees

Without worktrees, multiple agents sharing one checkout will constantly interrupt each other by:

- switching branches
- overwriting uncommitted changes
- stashing and unstashing work
- colliding in the same editor window or terminal session

With worktrees, each agent works in an isolated folder while still sharing the same Git history and object database.

## Core Rule

One agent should have:

- one worktree
- one branch
- one VS Code window

Do not put two agents on the same branch in different worktrees.

## Base Setup

Start from the main repository:

```bash
cd /home/paulo/repos/pdacorte.github.io
git fetch origin
```

Create a separate worktree for each agent from `origin/main`:

```bash
git worktree add -b agent/home-hero ../pdacorte-home-hero origin/main
git worktree add -b agent/blog-content ../pdacorte-blog-content origin/main
git worktree add -b agent/router-shell ../pdacorte-router-shell origin/main
```

This creates:

- `../pdacorte-home-hero`
- `../pdacorte-blog-content`
- `../pdacorte-router-shell`

Each folder is a separate working tree with its own branch.

## Recommended Setup for This Repo

This repository is a static site with no build step and no package installation, which makes worktrees especially low-friction.

Recommended ownership split:

### 1. Home Agent

Branch:

```bash
agent/home-hero
```

Worktree folder:

```bash
../pdacorte-home-hero
```

Owns:

- `pages/home.html`
- the hero-related block in `css/style.css`

### 2. Blog Agent

Branch:

```bash
agent/blog-content
```

Worktree folder:

```bash
../pdacorte-blog-content
```

Owns:

- `pages/blog.html`
- `pages/post.html`
- `js/blog.js`
- `js/post.js`
- `blog/posts/posts.json`
- markdown files under `blog/posts/`

### 3. Router/Shell Agent

Branch:

```bash
agent/router-shell
```

Worktree folder:

```bash
../pdacorte-router-shell
```

Owns:

- `js/main.js`
- `index.html` if shell-level changes are needed

This split matches the structure of the codebase:

- `js/main.js` is the SPA shell and router
- `js/blog.js` and `js/post.js` contain blog-specific behavior
- `pages/home.html` is isolated content for the homepage
- `css/style.css` is the main shared conflict risk

## Shared File Risk

The biggest merge-conflict hotspot in this repo is:

```bash
css/style.css
```

To reduce conflicts:

- give one agent clear ownership of CSS whenever possible
- avoid having multiple agents edit the same stylesheet block at once
- if a second agent needs styling, defer that styling until integration or assign it to the CSS owner

## Running Local Previews

Each worktree can run its own local server on a different port.

Home worktree:

```bash
cd /home/paulo/repos/pdacorte-home-hero
python -m http.server 8001
```

Blog worktree:

```bash
cd /home/paulo/repos/pdacorte-blog-content
python -m http.server 8002
```

Router worktree:

```bash
cd /home/paulo/repos/pdacorte-router-shell
python -m http.server 8003
```

This allows multiple agents or reviewers to test changes independently at the same time.

## How to Work Safely

Use the original repository checkout only for review and integration. Do not assign an active agent to it.

Good pattern:

- original checkout = integration only
- each worktree = one active agent

That keeps merges and rebases separate from active editing.

## Updating a Worktree

If a branch needs the latest changes from main:

```bash
git fetch origin
git rebase origin/main
```

Run that inside the specific worktree that needs updating.

## Merge Strategy

Recommended merge order for this repo:

1. router/shell
2. home hero
3. blog content

Why this order:

- shell changes are most structural
- homepage work is usually more isolated
- blog work often depends on the app shell staying stable

Example integration flow:

```bash
cd /home/paulo/repos/pdacorte.github.io
git checkout main
git merge --ff-only agent/router-shell
```

Then update the next worktree:

```bash
cd /home/paulo/repos/pdacorte-home-hero
git fetch origin
git rebase main
```

Merge it:

```bash
cd /home/paulo/repos/pdacorte.github.io
git merge --ff-only agent/home-hero
```

Then update the final worktree:

```bash
cd /home/paulo/repos/pdacorte-blog-content
git fetch origin
git rebase main
```

Merge it:

```bash
cd /home/paulo/repos/pdacorte.github.io
git merge --ff-only agent/blog-content
git push origin main
```

## Practical Rules for Parallel Agents

1. One agent, one worktree, one branch.
2. Keep the original checkout clean and use it only for integration.
3. Do not let two agents edit the same shared file unless you expect a manual merge later.
4. If an agent starts changing files outside its assigned area, stop and re-scope early.
5. Name branches by responsibility, not by person, so the purpose stays clear.

Examples of good branch names:

- `agent/home-hero`
- `agent/blog-content`
- `agent/router-shell`

## Dependent Work

If one agent needs to build on another agent's unmerged work, create a new worktree from that agent branch instead of from `main`.

Example:

```bash
git worktree add -b agent/home-polish ../pdacorte-home-polish agent/home-hero
```

This is useful when a follow-up task depends on work that has not yet been merged.

## Useful Commands

List current worktrees:

```bash
git worktree list
```

Remove a finished worktree:

```bash
git worktree remove ../pdacorte-home-hero
```

Delete the branch after it is merged:

```bash
git branch -d agent/home-hero
```

## What Worktrees Do Not Solve

Worktrees prevent local interruption between agents, but they do not eliminate logical conflicts.

You can still get merge conflicts if:

- two agents edit the same file
- two agents make incompatible routing changes
- one agent changes markup while another changes related selectors or scripts

Worktrees solve coordination at the checkout level, not at the design level. You still need file ownership and merge discipline.

## Recommended Team Pattern

For this repository, the safest pattern is:

- assign each agent a narrow file boundary
- keep CSS ownership explicit
- use the original checkout only for reviewing and merging
- rebase remaining branches after each merge
- avoid parallel edits in `css/style.css` unless necessary

This gives you true parallel work without branch-switching interruptions or local-state collisions.