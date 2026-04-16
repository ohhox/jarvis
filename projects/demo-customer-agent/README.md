# AI Customer Service Agent

AI chatbot that answers customer questions from your knowledge base — powered by Claude.

## Features

- Answers from your knowledge base (no hallucination)
- Auto-escalates to human when needed
- Supports Thai & English
- Tool-use architecture (agent decides when to search)
- Conversation memory within session

## Quick Start

```bash
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env

pnpm install
pnpm start        # Interactive chat
pnpm run demo     # Run demo conversation
```

## How It Works

```
Customer asks question
    → Agent searches knowledge base (tool call)
    → Agent reads relevant articles
    → Agent crafts response
    → If can't help → escalates to human
```

## Customization

Edit `src/knowledge-base.ts` to add your own FAQ articles. In production, this connects to your database or vector store.

## Built by Jarvis AI Solutions
