# Multi-Agent Content Production System

4 AI agents collaborate to produce high-quality content — from research to publish.

## The Team

```
Researcher → Writer → Editor → Publisher
```

| Agent | Role |
|---|---|
| Researcher | Analyzes topic, finds key angles and data |
| Writer | Produces the first draft |
| Editor | Reviews quality, suggests improvements |
| Publisher | Applies edits, adds SEO metadata, finalizes |

## Quick Start

```bash
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env

pnpm install
pnpm start    # Run the full pipeline
```

## Output

The pipeline produces:
- Research brief
- First draft
- Editor review with quality score
- Final article with SEO metadata and social captions

## Customization

- Change agent personalities in `src/agents.ts`
- Add more agents (translator, fact-checker, social media writer)
- Swap the orchestration to parallel where stages are independent
- Connect to CMS for auto-publishing

## Built by Jarvis AI Solutions
