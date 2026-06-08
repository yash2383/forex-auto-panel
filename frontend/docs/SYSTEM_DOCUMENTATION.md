# Forex Auto Panel Platform - System Architecture & Comprehensive Documentation

Welcome to the comprehensive technical documentation for the Forex Auto Panel Automated Trading Platform. This document outlines the architectural patterns, technical requirements, structural directory mappings, state management systems, and functional features across all three major panels: the **User Website**, the **User Dashboard**, and the **Super Admin Panel**.

---

## 1. System Requirements & Tech Stack

The application is built using a modern, fast, and highly modular front-end architecture.

*   **Core Framework**: Next.js v16.2.6 (App Router structure)
*   **Library**: React v19.2.4 (utilizing Client Components with `"use client"` for dynamic interactivity)
*   **Styling & Design System**: 
    *   Tailwind CSS v4 (configured via `@tailwindcss/postcss`)
    *   Vanilla CSS variables and interactive custom classes for advanced transitions, aura backgrounds, and animations.
*   **State Management**: Zustand v5.0.13 (managing client states, simulated API interactions, user list, trades, transactions, and role-based permissions).
*   **Icons**: Lucide React v1.16.0
*   **Animations**: Framer Motion v12.40.0 and CSS transitions.

---

## 2. Directory Structure Mappings

The project root is structured as follows:

```
c:\xampp\htdocs\final\
├── app/                        # Next.js App Router root
│   ├── admin/                  # Super Admin Dashboard Panel
│   │   ├── _components/        # Admin-only shared layouts (AdminShell, navigation details)
│   │   ├── profit-distribution/ # Financial calculations and revenue distributions
│   │   ├── white-label/        # Multi-tenant sub-brand onboarding and earnings split
│   │   ├── layout.js           # Admin segment layout
│   │   └── page.js             # Main admin section table dispatcher
│   ├── auth/                   # Common Authentication helpers
│   ├── components/             # User website shared layout elements (Navbar, Footer, SiteChrome)
│   ├── dashboard/              # User Trading Dashboard Panel
│   │   ├── _components/        # DashboardShell, enriched default metrics and datasets
│   │   ├── live-trades/        # (Hidden) Real-time automated trading telemetry
│   │   ├── past-trades/        # History logs of completed trade signals
│   │   ├── reports/            # Exportable account growth and performance statements
│   │   ├── subscription/       # Tier information, plan details, and active status
│   │   ├── wallet/             # Funding wallet (deposits tracking, withdraw actions)
│   │   ├── settings/           # User configuration, security preferences
│   │   └── page.js             # User dashboard home page (PnL widgets and stats)
│   ├── data/                   # Common static mocks (e.g. pastTrades.js)
│   ├── login/                  # User website Sign In screen
│   ├── signup/                 # User website Registration wizard
│   ├── pricing/                # Landing page price catalog and plan tiers
│   ├── profit-simulator/       # Visual tool simulating compounding earnings
│   ├── layout.js               # Global html structure, scripts, and google fonts loading
│   └── page.js                 # User Website main landing page
├── docs/                       # Project documentation folder
├── hooks/                      # Custom hooks (e.g. adminStore Zustand definition)
├── components/                 # Global UI controls
├── package.json                # Project dependencies and operational scripts
└── README.md                   # Quick start and repository metadata
```

---

## 3. The 3 Major Panels

The platform is divided into three distinct functional layers:

### Panel I: User Website (Public Facing)
The public-facing user website acts as the primary marketing and onboarding funnel.

1.  **Main Landing Page (`/`)**:
    *   Premium responsive hero section with scrolling intersection animation triggers (`animate-on-scroll`).
    *   Interactive terminal representation highlighting core value propositions: *Automated Trading*, *24/7 Monitoring*, and *Optimal Signal Execution*.
    *   Live-updating visual connection flow showcasing API links to Binance, TradingView, MetaTrader, and KuCoin.
    *   Highlights of strategic modules: *Trend Following*, *Scalping*, and *Breakout* signaling.
    *   Past trades table displaying live execution results.
2.  **Infrastructure Overview (`/infrastructure`)**: Detailed technical representation of the high-speed execution API and server routing.
3.  **Profit Simulator (`/profit-simulator`)**: Interactive page allowing prospects to simulate future growth based on starting capital and compound frequency.
4.  **Pricing Catalog (`/pricing`)**: Detailed pricing cards showcasing the **Club Plan** (Micro Capital: $10 - $100 limits) and the **Individual Plan** (Full Access: $1000+ limits).
5.  **Authentication (`/login` & `/signup`)**: Secure client onboarding endpoints mapping credentials to platform database logic.
6.  **Subscription Checkout (`/checkout?plan=club`)**: Custom payment initiation page prompting the user to submit transaction IDs (UTR) and payment receipts for approval.

---

### Panel II: User Dashboard (Private Clients)
Once a client is authenticated and holds an active plan, they access the User Dashboard at `/dashboard`.

1.  **Performance Overview (PnL Widget)**:
    *   Displays current Account Growth, daily PnL stats, and a visual target success indicator (Win Rate: 72.9%).
2.  **Statistical Indicators Grid**:
    *   Displays *Total Profit*, *Unrealized PnL* (with active ping animations on live trades), *Realized PnL*, *Win Rate*, and *Active Trade Count*.
3.  **Comprehensive Past Trades Ledger**:
    *   Searchable, filterable, and exportable grid displaying executed stock/pair signals.
    *   Metrics: Entry Price, Exit Price, Targets, Stop Losses, Breakevens, execution timestamps, and calculated INR equivalents based on fixed exchange values.
4.  **Wallet Management (`/dashboard/wallet`)**:
    *   Overview of the current funding wallet.
    *   Tracks deposit transactions, withdrawal requests, and pending statuses.
5.  **Support Portal (`/dashboard/support`)**: Help center with answers to frequently asked questions and ticket creation workflows.

---

### Panel III: Super Admin Panel (System Operators)
Located at `/admin`, the Super Admin Panel is an advanced command-and-control dashboard restricted to staff. It includes a simulated **Role-Based Access Control (RBAC) Switcher** allowing testing between:
*   `Super Admin` (Full view, create, edit, and delete permissions)
*   `Manager` (Standard operational editing permission)
*   `Viewer` (Read-only access)

#### Core Subsections & Features:
1.  **Platform Overview**:
    *   **Responsive Metrics Grid**: Displays crucial KPIs: *Total Users*, *Active Users*, *Total Revenue*, *Total Capital*, *Total User Wallet Balance*, *Active Wallet Balance*, and *Total Profit*.
    *   **Revenue Charts**: SVG line charts showing platform transaction velocity.
    *   **Subscription status split**: Conic-gradient visualization of active, expired, pending, and cancelled client distributions.
2.  **User Management (`?section=users`)**:
    *   Create, view, edit, block/unblock, and soft-delete users.
    *   Change plan assignments and track cumulative deposits.
3.  **Payment Verification (`?section=payments`)**:
    *   Lists subscription fees submitted by users.
    *   Admins can view uploaded payment receipts and transaction hashes.
    *   **Verification Workflow**: Double-check hash details (`Verify` action) before unlocking absolute `Approve` or `Reject` actions.
4.  **Trades Signal Center (`?section=trades`)**:
    *   Manual control over active trading options.
    *   Create signals (Pair, Buy/Sell side, Entry, SL, Target) or close existing ones at market spot rate.
5.  **PnL Export and Reports (`?section=pnl-reports` & `?section=reports`)**:
    *   Read-only analytics with immediate CSV/Excel/PDF export functions.
6.  **Platform Settings (`?section=settings`)**:
    *   Global parameters adjustments: UPI IDs, payment collection QR code image updates, referral percentages, and platform fee sliders.
7.  **Profit Distribution Tool (`/admin/profit-distribution`)**:
    *   Advanced calculator that aggregates all trading outcomes.
    *   *Mathematical Integrity*: Converts float currencies into integer cents (`Math.round(val * 100)`) to calculate exact fees before returning floats to the UI.
    *   *Recalculation Toggles*: Option to include/exclude net-loss users, automatically skipping fees on negative cycles.
8.  **White Label Multi-Brand Management (`/admin/white-label`)**:
    *   **All Partners**: Directory showing partner domains, client numbers, gross revenue, and commission structures.
    *   **Create Partner Wizard**: Configure new onboarding brands (brand name, domains, custom logos, commission split).
    *   **Partner Earnings Details**: Tracking graphs displaying Platform vs Partner commission splits.
9.  **OTP Override Security (`?section=otp`)**:
    *   Generate manual codes to bypass network delivery failures for specific users.
10. **Activity Log Auditor (`?section=activity-logs`)**:
    *   Immutable system timeline mapping every moderator action, IP address, and target module.

---

## 4. State Management (Zustand implementation)

All data flow, simulation states, client lists, and operational tables are driven by a unified Zustand store located at `hooks/adminStore.js`.

### Authentication and RBAC Logic:
*   The store initializes a default `currentUser` profile with simulated permissions:
    ```javascript
    currentUser: {
      name: "Operator",
      role: "SUPER_ADMIN"
    }
    ```
*   `hasPermission(module, action)` evaluates the role permission matrices mapping.
*   The admin console includes a dropdown that calls `setCurrentUserRole(newRole)`, letting developers simulate restrictions in real-time.

### Database Updates:
*   Zustand actions (e.g. `addPayment`, `updatePaymentStatus`, `addUser`, `closeTrade`) dynamically update the UI tables and append appropriate entries into `activity-logs` to audit operations.

---

## 5. Database Architecture (Production Path)

A complete PostgreSQL database architecture using Prisma ORM is detailed in the **[Database Schema Specification](file:///c:/xampp/htdocs/final/docs/DATABASE_SCHEMA.md)**. 

Key characteristics:
*   **Logical Multi-Tenancy**: Scoped data queries utilizing composite indexing keys (e.g. `[partnerId, userId]`) over a shared database instance to isolate customer profiles.
*   **Idempotency & Auditing**: Direct tracking of security overrides, manual payment verifications, and duplicate prevention via unique idempotency keys.
*   **NestJS API Controllers**: Details on code modules, ledger balance transaction services, optimistic locking models, and frontend client fetch controllers are outlined in the **[Backend & Frontend API Integration Specification](file:///c:/xampp/htdocs/final/docs/BACKEND_INTEGRATION.md)**.

---

## 6. Development Guidelines & Best Practices

1.  **Strict Responsive Design**:
    *   Grids, tables, and metric cards must handle dynamic widths. Use responsive CSS grid systems (e.g. `grid-cols-2 lg:grid-cols-4 xl:grid-cols-7` rather than static layouts) to prevent horizontal cutoff or overflow on mobile devices.
2.  **Next.js segment restrictions**:
    *   Always utilize `"use client"` when state hooks (`useState`, `useEffect`, `useAdminStore`) are present.
    *   Keep route segments inside `app/` clean. Offload heavy components to regional folders or `_components`.
3.  **Visual Consistency**:
    *   Maintain the primary theme aesthetic: sleek deep green/black tones (`#020806` / `#05100c` / `#081118`) for dashboards, contrasting neon accents, harmonized pill badge backgrounds, and anti-aliased font weights.
