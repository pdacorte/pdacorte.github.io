# Notes on AI Agents and Best Practices

I've been taking a lot of time to learn how to best leverage AI agents. It does seem like the very early days of what will trivialize a LOT of mundane low-engagement tasks, so I'm all for it. It's also a super accelerator, allowing for fast note taking and MVP development for any idea. Rarely does a new tech hit so fast, so I'm aboard this ship. 


I'll post here some of my notes taken while researching and working on Agents. A lot of them were taken for a presentation I had on AI Agents and Marketing Automation at Auto1. 

## AGENTS.md

The AGENTS.md file is always parsed by the agent and contains instructions that are crucial to the project and should be kept in mind.

This is the main file for agentic working and should be the most in-depth containing all the important details of the project, leaving highly specialized context for the SKILL.md files.

As a currently supported standard, there are templates coming from frameworks that users can use to ensure best performance with agents.

## SKILL.md

Skills are an open standard started by Anthropic and now adopted by most major providers.

They are modular folders of instructions, scripts, and resources that agents can discover and use to do things more accurately and efficiently.

They are used on demand according to the task at hand, and must be **EXPLICITLY** called in the prompt to ensure usage. The agent won't always reliably use the best skills for the job, so it's up to the human to ensure they do.

While the AGENTS.md file is the main hub for context and important information, skills aren't useless. Skills outperform for vertical, action-specific workflows that users **EXPLICITLY** trigger, like "Use the best practices skill to refactor something" or "Use the tester skill to check for bugs and debug"

That said general knowledge, passive context currently outperforms on-demand retrieval.

### SKILL.md Anatomy

SKILL.md files are formatted this way:

#### Metadata
name:
description:
version:

#### Overview (< 5000 tokens recommended)

Recommended sections:
Step-by-step instructions
Examples of inputs and outputs
Common edge cases


The main SKILL.md file should be kept under 500 lines, with all the other context items going in the optional directories.

### Skill Directory

```
my-skill/
├── SKILL.md          # Required: instructions + metadata
├── scripts/          # Optional: executable code
├── references/       # Optional: documentation, examples
└── assets/           # Optional: templates, resources, images, fonts
```

The optional items are loaded when required.

## Adding Documentation Without Blowing Up Context Window

The best way to do this is by adding a documentation INDEX in the agents.md file. This is a list of file paths to the individual documentation files inside the AGENTS.md.

With this, it'll only load the relevant documentation when required.

The following must also be specified:
"IMPORTANT: Prefer retrieval-led reasoning over pre-training-led reasoning for any Next.js tasks."

In this case, we're using Next.js, but it could pertain to any technology or system that has documentation that is so long it has to be segmented as not to break the context window.

It is important to compress aggressively and not have the full documentation in context. An index pointing to retrievable files works just as well without bloating the context window.

# Agentic Best Practices

* Progressive Disclosure

* Version Matching Dependencies

* Having Specific Testing Methodology

* Having a Defined Loop for Documentation Updates

* AVOID Context Bloat > The more free context window, the better the results

* Passive context outperforms on-demand retrieval (Agents.md > Skills.md)

* Have AI support you in writing and structuring high quality prompts and reference Agents.md / Skills.md files
