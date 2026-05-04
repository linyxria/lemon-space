<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Prefer Proven Libraries

For established concerns such as editors, validation, drag-and-drop, state/query caching, upload progress, masonry layouts, date handling, and markdown parsing, prefer a proven existing library or platform API already present in the project. Avoid hand-rolling reusable infrastructure unless the local codebase has a clear pattern or the requested behavior is small and project-specific.

## Refactor Without Legacy Drag

This project does not need compatibility layers for old local implementations unless the user explicitly asks for backward compatibility. When a proven library or cleaner architecture replaces custom code, delete the superseded code, stale routes, unused tables, old helpers, dead feature flags, and compatibility shims in the same change. Prefer one clear current implementation over preserving parallel old and new paths.

Large refactors are acceptable when they reduce long-term complexity. Keep the behavioral goal clear, but do not contort new code around outdated names, routes, abstractions, or data shapes just because they already exist.

## Effects Are Not The Default

Do not reach for `useState` + `useEffect` as the first solution. Before adding an effect, check the React guidance at https://react.dev/reference/react/useEffect and prefer these options when they fit:

- Derive values during render instead of syncing duplicated state.
- Put user-triggered work directly in event handlers instead of reacting to state changes.
- Use server components, route handlers, server actions, or tRPC/query mutations for data flow.
- Use TanStack Query, framework APIs, or dedicated libraries for caching, subscriptions, persistence, forms, and external systems.
- Use `useSyncExternalStore` for external subscriptions when needed.

Use effects mainly to synchronize with external systems that React does not control, such as browser APIs, sockets, timers, imperative third-party widgets, or analytics. If an effect only keeps two pieces of React state in sync, refactor it away.
