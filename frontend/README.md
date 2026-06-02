# Tradebot Automated Trading Platform

Tradebot is an automated trading application built using **Next.js 16 (App Router)**, **React 19**, and **Tailwind CSS v4**. It features high-frequency telemetry simulation, live tracking interfaces, a complete client dashboard, and a multi-tenant White Label super admin panel.

---

## 🚀 Key Modules & Panels

The application includes three core segments:
1.  **User Website (Marketing & Onboarding)**: Landing page (`/`), [Pricing Catalog](/pricing), [Profit Simulator](/profit-simulator), and [Authentication](/login).
2.  **User Dashboard (Client Portal)**: Access points to analyze active performance metrics, track [Past Trades](/dashboard/past-trades), manage the [Wallet](/dashboard/wallet), and coordinate [Subscription Tiers](/dashboard/subscription).
3.  **Super Admin Panel (System Operator)**: Fully functional control system at `/admin` featuring:
    *   **RBAC Simulator**: Toggle between `Super Admin`, `Manager`, and `Viewer` views.
    *   **Profit Distribution System**: Float-to-cent integer calculation tool.
    *   **White Label Portal**: Multi-tenant partner creation, domain routing, and commission tracker.
    *   **Mod Actions**: User approvals, trade closures, settings updates, OTP overrides, and immutable activity audits.

For a detailed breakdown of codebase paths, layouts, state structures, and UI features, read the [System Architecture Documentation](file:///c:/xampp/htdocs/final/docs/SYSTEM_DOCUMENTATION.md). 

For the production-ready PostgreSQL relational database model, see the [Database Schema Specification](file:///c:/xampp/htdocs/final/docs/DATABASE_SCHEMA.md). 

For the complete NestJS backend structure, transaction logic services, and frontend REST query wrapper, read the [Backend & Frontend API Integration Specification](file:///c:/xampp/htdocs/final/docs/BACKEND_INTEGRATION.md).

---

## 🛠️ Requirements & Tech Stack

*   **Node.js**: `v18+` or `v20+` recommended.
*   **Core Framework**: Next.js v16.2.6 (App Router)
*   **UI Core**: React v19.2.4 & Lucide React v1.16.0
*   **State Store**: Zustand v5.0.13
*   **Styling Engine**: Tailwind CSS v4

---

## 🏁 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the client website. Visit [http://localhost:3000/admin](http://localhost:3000/admin) to view the super admin dashboard.

### 3. Production Build
```bash
npm run build
npm run start
```
