# Whyit

An AI workspace built around how people actually learn.

---

## Project Structure

```
src/
├── app/                          # Next.js App Router — routes only
│   ├── (marketing)/              # Route group: landing + auth (shared minimal layout)
│   │   ├── layout.tsx            # Marketing layout (nav + footer)
│   │   ├── page.tsx              # Landing page  /
│   │   ├── sign-in/page.tsx      # Sign In  /sign-in
│   │   └── sign-up/page.tsx      # Sign Up  /sign-up
│   ├── goal-capture/page.tsx     # Goal Capture  /goal-capture
│   ├── workspace/
│   │   └── [projectId]/          # Dynamic workspace route
│   │       ├── layout.tsx        # Workspace layout (three-panel shell)
│   │       ├── page.tsx          # Conversation page  /workspace/:id
│   │       ├── WorkspaceShell.tsx # Three-panel client component
│   │       ├── loading.tsx       # Suspense loading skeleton
│   │       └── error.tsx         # Error boundary
│   ├── settings/page.tsx         # Settings placeholder  /settings
│   ├── global-error.tsx          # Global error boundary
│   ├── not-found.tsx             # 404 page
│   ├── layout.tsx                # Root layout (font + metadata)
│   └── globals.css               # Design system — single source of truth for all tokens
│
├── features/                     # Feature-scoped components (co-located with their route)
│   ├── landing/
│   │   ├── Wordmark.tsx          # Original brand logotype (server component)
│   │   ├── LandingHero.tsx       # Hero section — CTA + wordmark (server component)
│   │   └── LandingContent.tsx    # Editorial content — Problem/Solution/How (server component)
│   ├── goal-capture/
│   │   └── GoalCaptureFlow.tsx   # Multi-step conversational form (client component)
│   └── workspace/
│       ├── LeftSidebar.tsx       # Projects + nav sidebar (client — collapse state)
│       ├── RightSidebar.tsx      # Context panel placeholder (client — collapse state)
│       └── ChatInterface.tsx     # Streaming-ready chat (client — message state)
│
├── components/
│   └── ui/                       # Shared primitive components
│       ├── Button.tsx            # CVA-based button with design token variants
│       ├── Textarea.tsx          # Auto-resizing textarea (forwardRef)
│       └── MessageBubble.tsx     # Chat message — user + assistant, streaming-aware
│
└── lib/                          # Non-UI utilities and data
    ├── types.ts                  # Shared TypeScript types (Message, Project, etc.)
    ├── utils.ts                  # cn(), generateId(), formatRelativeDate(), truncate()
    └── mock/
        └── data.ts               # ALL mock data — never inlined in components
```

---

## Design System

All visual values live in `src/app/globals.css` as CSS custom properties.
The Tailwind `@theme inline` block registers these as Tailwind utilities.

**Never use ad-hoc values** — every color, size, duration traces back to a token.

Key token groups:
- `--color-surface-*` — background layers (0 is deepest / darkest)
- `--color-text-*` — text hierarchy (primary → secondary → muted)
- `--color-accent` — the single accent color (violet-indigo)
- `--color-border-*` — border hierarchy
- `--text-*` — typography scale
- `--spacing-*` — spacing scale
- `--duration-*` — motion durations
- `--radius-*` — border radii

Light mode is a `.light` class swap — no hardcoded colors in components.

---

## Adding AI

The `ChatInterface` component is designed for a clean AI handoff:

1. Implement a function matching: `(content: string, history: Message[]) => Promise<string>`
2. Pass it as the `onSendMessage` prop to `<ChatInterface>`
3. The streaming simulation (`mockStreamingHandler`) can be removed once real streaming is wired

No structural changes to `ChatInterface` are required.

---

## Development

```bash
npm run dev        # Start development server
npm run type-check # TypeScript check
npm run lint       # ESLint
npm run format     # Prettier
npm run build      # Production build
```

---

## Tech Stack

- **Next.js 16** — App Router, React Server Components
- **TypeScript** — strict mode, noImplicitAny
- **Tailwind CSS v4** — design tokens via `@theme inline`
- **lucide-react** — icons
- **class-variance-authority** — component variant system
- **clsx + tailwind-merge** — class merging utility
