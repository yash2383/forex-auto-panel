# Forex Auto Panel Dev Guidelines

## Build & Test Commands
*   **Start Dev Server**: `npm run dev`
*   **Build Application**: `npm run build`
*   **Run Linter**: `npm run lint`

## Component Structure & Rules
*   **User Website Pages**: `/` (home), `/infrastructure`, `/profit-simulator`, `/pricing`, `/login`, `/signup`, `/checkout`.
*   **User Dashboard Pages**: `/dashboard`, `/dashboard/past-trades`, `/dashboard/reports`, `/dashboard/subscription`, `/dashboard/wallet`, `/dashboard/settings`, `/dashboard/support`.
*   **Super Admin Dashboard Pages**: `/admin` (handles section tables dynamically via `?section=...`), `/admin/profit-distribution`, `/admin/white-label`.
*   **Responsiveness Guidelines**: Use Tailwind's grid systems (e.g. `grid-cols-2 lg:grid-cols-4 xl:grid-cols-7`) and avoid hardcoded layouts or `grid-flow-col auto-cols-fr` without wrapping, as they cause layout overflow and text cutoffs on smaller viewports.
*   **State Management**: Use Zustand store defined in [adminStore.js](file:///c:/xampp/htdocs/final/hooks/adminStore.js).
