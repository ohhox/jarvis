# Coding Standards

## Default Tech Stack

เลือกตาม project type — ไม่จำเป็นต้องใช้ทุกอัน

| Layer | Default | Alternative |
|---|---|---|
| Frontend | React + TypeScript | Next.js, Svelte |
| Backend | Node.js + TypeScript | Python (FastAPI) |
| Database | PostgreSQL | SQLite, MongoDB |
| Styling | Tailwind CSS | CSS Modules |
| Testing | Vitest / Pytest | Jest, Playwright |
| Package Manager | pnpm | npm, pip |
| Linting | ESLint + Prettier | Biome |
| CI/CD | GitHub Actions | — |

## Conventions

### Naming
- **Files**: kebab-case (`user-profile.ts`)
- **Components**: PascalCase (`UserProfile.tsx`)
- **Functions/Variables**: camelCase (`getUserById`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRY_COUNT`)
- **Database tables**: snake_case (`user_profiles`)
- **Branches**: `feature/`, `fix/`, `chore/` prefix

### Git Commits
```
<type>: <short description>

<optional body>

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `ci`

### Project Structure (TypeScript)
```
src/
├── components/    # UI components
├── lib/           # Shared utilities
├── services/      # Business logic / API calls
├── types/         # TypeScript type definitions
├── hooks/         # React hooks (if frontend)
└── routes/        # Pages or API routes
```

## Code Principles

1. **Simple > Clever** — อ่านง่าย ดีกว่าเท่
2. **No premature abstraction** — 3 lines ซ้ำ ดีกว่า abstraction ที่ใช้ครั้งเดียว
3. **Test at boundaries** — validate user input & external APIs, trust internal code
4. **Security first** — OWASP top 10 awareness, never commit secrets
5. **Small PRs** — PR เล็กรีวิวง่าย merge ไว

## What We Don't Do

- ไม่ over-engineer สิ่งที่ยังไม่ต้องการ
- ไม่เพิ่ม comments สำหรับ code ที่อ่านรู้เรื่องอยู่แล้ว
- ไม่ mock ถ้า test กับของจริงได้
- ไม่ใช้ `any` ใน TypeScript (ยกเว้นจำเป็นจริงๆ)
