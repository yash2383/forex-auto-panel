# Dynamic Data Roadmap

This document is the single checklist for making Tradebot fully dynamic. It records what is already connected to PostgreSQL through the NestJS API, what is still local/mock data, and the order to finish the remaining work.

## Current Data Flow

Frontend calls the backend through `frontend/lib/apiFetch.js`.

Authenticated requests read the token from `localStorage.tradebot-user.token` and send:

```text
Authorization: Bearer <token>
```

Route protection in `frontend/proxy.js` reads the browser cookie:

```text
tradebot-token
```

Backend runs at:

```text
http://localhost:4000/api
```

Frontend uses:

```text
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## Dynamic Modules Already Working

| Area | Frontend | Backend API | Database Models | Status |
| --- | --- | --- | --- | --- |
| Login / Signup / Session | `app/auth/AuthPage.js`, `app/admin/login/page.js` | `/api/auth/login`, `/api/auth/signup`, `/api/auth/me` | `User`, `Admin`, `Partner` | Dynamic |
| Pricing Plans | `hooks/adminStore.js`, pricing/admin plans UI | `/api/plans`, `/api/admin/plans` | `Plan` | Dynamic |
| User Dashboard Data | `hooks/adminStore.js`, `app/dashboard/page.js` | `/api/dashboard/data` | `User`, `Wallet`, `Trade`, `Payment`, `Withdrawal` | Dynamic |
| Dashboard Deposits | checkout/wallet flows through store | `/api/dashboard/deposit` | `Payment` | Dynamic |
| Dashboard Withdrawals | wallet flow through store | `/api/dashboard/withdraw` | `Withdrawal` | Dynamic |
| User Settings | dashboard settings through store | `/api/dashboard/settings` | `User.autoTrading`, `User.riskSetting` | Dynamic |
| Admin Users | `app/admin?section=users` | `/api/admin/users` | `User`, `Wallet`, `SecurityEvent` | Dynamic |
| Admin Payments | `app/admin?section=payments` | `/api/admin/payments/:id/...` | `Payment`, `LedgerEntry`, `TransactionGroup` | Dynamic |
| Admin Settings | `app/admin?section=settings` | `/api/admin/settings` | `SystemSettings` | Dynamic |
| Admin Trades | `app/admin?section=trades` | `/api/admin/trades`, `/api/admin/trades/:id/close` | `Trade`, `Wallet`, `LedgerEntry` | Dynamic |
| User Past Trades | `app/dashboard/past-trades` | `/api/dashboard/data` | `Trade` | Dynamic |
| Transaction Reversal | admin transaction actions | `/api/admin/transactions/:id/reverse` | `TransactionGroup`, `LedgerEntry` | Dynamic |

## Recently Completed Trade Flow

Admin manages trades here:

```text
http://localhost:3000/admin?section=trades
```

User sees closed trades here:

```text
http://localhost:3000/dashboard/past-trades
```

Flow:

1. Admin logs in as `harsh@nexus.com`.
2. Admin opens `?section=trades`.
3. Admin creates a trade and assigns it to a client.
4. Admin closes the trade with an exit price.
5. Backend calculates PnL and stores the closed trade.
6. The assigned user logs in.
7. User sees the closed trade on `/dashboard/past-trades`.

## Still Static Or Local-Only

These areas need backend models/endpoints before they are truly dynamic.

| Area | Current Location | Current Data Source | Needed Backend Work |
| --- | --- | --- | --- |
| Notifications | `hooks/adminStore.js`, `app/admin?section=notifications` | Zustand local array | Add `Notification` model and CRUD APIs |
| OTP Override UI | `hooks/adminStore.js`, `app/admin?section=otp` | Zustand local array | Connect to existing `OtpRequest` model with admin APIs |
| Partner Earnings Adjustments | `hooks/adminStore.js`, `app/admin/white-label/earnings` | Zustand local array | Add `PartnerAdjustment` or ledger-backed adjustment API |
| Admin Campaign CRUD | `hooks/adminStore.js`, `app/admin?section=campaigns` | Mixed DB display plus local mutations | Add campaign create/update/delete APIs |
| Admin Referral CRUD | `hooks/adminStore.js`, `app/admin?section=referrals` | Mixed DB display plus local mutations | Add referral create/update/delete/status APIs |
| Admin Management CRUD | `hooks/adminStore.js`, `app/admin?section=admins` | DB display plus local add/edit/delete | Add admin create/update/delete APIs |
| White Label Edit/Delete | `app/admin/white-label/*` | Mostly store/local actions | Add partner update/suspend/delete APIs |
| Reports Download | `app/dashboard/reports/page.js` | Generated mock text file | Add report generation/export APIs |
| Public Past Trades | `app/past-trades/page.js`, `app/page.js` | `app/data/pastTrades.js` | Add public read-only trade-performance API |
| Dashboard Wallet Display Defaults | `app/dashboard/wallet/page.js` | Some local default balances | Fully bind display to `wallet`, `payments`, `withdrawals` from `/api/dashboard/data` |
| Admin Overview Metrics | `app/admin/page.js` overview cards | Some hardcoded totals | Return all totals from `/api/admin/data` or new `/api/admin/metrics` |

## Recommended Order

1. Finish wallet page dynamic data.
   This is user-facing and already has the API data available in `fetchData()`.

2. Finish admin overview metrics.
   Replace hardcoded totals with computed values from `AdminService.getData()`.

3. Add notification APIs.
   Create `Notification` model, then wire admin notifications to real CRUD.

4. Add OTP admin APIs.
   Reuse existing `OtpRequest` model instead of keeping override requests in Zustand.

5. Add campaign and referral mutation APIs.
   Existing schema already has `Campaign` and `Referral`, so this is mostly service/controller/store wiring.

6. Add admin account CRUD APIs.
   Admin list is DB-backed, but create/edit/delete actions are still local.

7. Add partner update/suspend APIs.
   Partner create exists; edit/delete/suspend should become backend actions.

8. Replace public marketing trade tables.
   Use a safe public endpoint that only returns anonymized closed trades.

9. Replace report mocks.
   Generate real CSV/PDF/text exports from payments, trades, withdrawals, and ledger entries.

## API Inventory

Public:

```text
GET  /api/plans
```

Auth:

```text
POST /api/auth/login
POST /api/auth/signup
GET  /api/auth/me
POST /api/auth/logout
```

User dashboard:

```text
GET  /api/dashboard/data
POST /api/dashboard/deposit
POST /api/dashboard/withdraw
POST /api/dashboard/settings
```

User trades:

```text
GET  /api/trade
POST /api/trade/create
POST /api/trade/close
```

Admin:

```text
GET    /api/admin/data
POST   /api/admin/users
PUT    /api/admin/users/:id
DELETE /api/admin/users/:id
POST   /api/admin/partners
POST   /api/admin/plans
PUT    /api/admin/plans/:id
DELETE /api/admin/plans/:id
GET    /api/admin/settings
POST   /api/admin/settings
POST   /api/admin/trades
POST   /api/admin/trades/:id/close
POST   /api/admin/payments/:id/verify
POST   /api/admin/payments/:id/approve
POST   /api/admin/payments/:id/reject
POST   /api/admin/withdrawals/:id/approve
POST   /api/admin/withdrawals/:id/reject
POST   /api/admin/transactions/:id/reverse
```

## Acceptance Checklist

A module is fully dynamic only when all items are true:

- The data is stored in PostgreSQL.
- The backend exposes read and mutation APIs.
- The frontend reads through `apiFetch()`.
- The frontend mutation calls refresh `useAdminStore.getState().fetchData()` or a dedicated fetch action.
- The UI does not use hardcoded rows for production data.
- Auth and role checks are enforced in backend guards.
- A build passes for both frontend and backend.
- At least one smoke test verifies create/read/update behavior.

## Local Test Accounts

Admin:

```text
harsh@nexus.com
password123
```

User:

```text
rahul@mail.com
password123
```

## Local Verification Commands

Build:

```powershell
cd backend
npm run build

cd ../frontend
npm run build
```

Run backend:

```powershell
cd backend
npm run start:dev
```

Run frontend:

```powershell
cd frontend
npm run dev
```

Primary URLs:

```text
http://localhost:3000/admin?section=trades
http://localhost:3000/dashboard/past-trades
http://localhost:4000/api/plans
```
