# Tradebot User Dashboard Subsystem Documentation

Welcome to the comprehensive technical and operational documentation of the Tradebot User Dashboard subsystem. This document describes the structure, sidebar navigation, widgets, interfaces, forms, and business logic of the client-side portal located in `app/dashboard`.

---

## 1. Directory Structure

The `app/dashboard` directory is structured as follows:

*   **`_components/`**: Layout shell and reusable dashboard-specific widgets.
    *   [DashboardShell.js](file:///c:/xampp/htdocs/final/app/dashboard/_components/DashboardShell.js): Main viewport shell with a dark neon background, responsive navigation sidebar, dynamic header profile card, and light/dark theme toggles.
    *   [DashboardPieces.js](file:///c:/xampp/htdocs/final/app/dashboard/_components/DashboardPieces.js): Central registry of shared UI blocks (e.g. `SectionCard`, `PageIntro`, `PastTradesTable`, `TableActions`, and compliance `Disclaimer`).
    *   [dashboardData.js](file:///c:/xampp/htdocs/final/app/dashboard/_components/dashboardData.js): Data source defining user navigation structures, permission definitions, mock transactions, and utility parsers.
*   **`past-trades/`**: signal tracking logs.
    *   [page.js](file:///c:/xampp/htdocs/final/app/dashboard/past-trades/page.js): Extended trading archive showing completed entries with comprehensive telemetry definitions.
*   **`wallet/`**: Ledger and banking integrations.
    *   [page.js](file:///c:/xampp/htdocs/final/app/dashboard/wallet/page.js): Financial control panel displaying total balance, withdrawable profits, locked escrow reserves, transaction histories, and a withdrawal request form.
*   **`subscription/`**: Plan management.
    *   [page.js](file:///c:/xampp/htdocs/final/app/dashboard/subscription/page.js): Visual overview of current subscription tiers and platform plan offerings.
*   **`reports/`**: PDF and spreadsheet billing invoices.
    *   [page.js](file:///c:/xampp/htdocs/final/app/dashboard/reports/page.js): Statement exporter page.
*   **`settings/`**: Account configurations.
    *   [page.js](file:///c:/xampp/htdocs/final/app/dashboard/settings/page.js): Form handles for profile adjustments, UPI keys, and notifications preferences.
*   **`support/`**: Helpdesk.
    *   [page.js](file:///c:/xampp/htdocs/final/app/dashboard/support/page.js): Client ticket center and interactive FAQ.
*   **`layout.js`**: Route segment layout wrapper calling `DashboardShell`.
*   **`page.js`**: Core home viewport showcasing account performance cards and dynamic past trades.

---

## 2. Navigation Sidebar Items

The client portal utilizes a customized navigation sidebar that highlights key utility features for active traders:

1.  **Dashboard** (`/dashboard`): Hub compiling active indicators and performance trends.
2.  **Past Trades** (`/dashboard/past-trades`): Unified signal execution archive.
3.  **Reports** (`/dashboard/reports`): Financial statements, trade logs, and invoices.
4.  **Subscription** (`/dashboard/subscription`): Active membership details, checkout paths, and pricing limits.
5.  **Wallet** (`/dashboard/wallet`): Dynamic withdrawal portal and transaction ledger.
6.  **Settings** (`/dashboard/settings`): Profile security config and preference adjustments.
7.  **Support** (`/dashboard/support`): Customer care ticketing grid and FAQs.

---

## 3. Core Dashboard Home (`/dashboard`)

The main overview screen provides immediately actionable analytics concerning the user's trading account balance.

### A. Performance Overview Widget (`PnLWidget`)
*   **Purpose**: Renders client account growth statistics for the current month.
*   **Visual Highlights**: Rounded gradient box styled with background blur elements (`from-[#06120e] to-[#020907]`) and animated neon status indicator pulses.
*   **Metrics**:
    *   *Total Account Growth*: `+₹12,450.00` *(+18.2% Growth)*
    *   *Today's PnL*: `+₹1,250.00`
    *   *Win Rate*: `72.9%`

### B. Statistical Cards Grid (`StatCard`)
Five cards that display trading dimensions:
*   **Total Profit** (`₹12,450.00`): Combined sum of all settled returns.
*   **Unrealized PnL** (`+₹1,250.00`): Floating profits locked in active live trades. Displays a green pulsing live indicator dot.
*   **Realized PnL** (`₹11,200.00`): Settled returns from closed transactions.
*   **Win Rate** (`72.91%`): Percentage of success over the target limit.
*   **Active Trades** (`3`): Count of automated strategies currently running.

### C. Past Trades Grid
*   **Data Fields**: `Stock/Asset Pair`, `Type (BUY/SELL)`, `Entry Price`, `Exit Price`, `Target Price`, `Stop Loss`, `Breakeven Target`, `Timestamp`, `Outcome Result (WIN/LOSS/BE)`, `Captured Points`, `Quantity (Lot Size)`, `Rupee PnL value`.
*   **Actions**:
    *   *Search Input*: Filters list rows dynamically by stock name or type.
    *   *Export Button*: Triggers spreadsheet generation.
    *   *Filter Drawer*: Allows sorting by trading outcome.

---

## 4. Operational Section Details

### Wallet Ledger (`/dashboard/wallet`)
*   **Purpose**: Manages withdrawals and details transactional balance flows.
*   **Balance Classifications**:
    *   *Total Balance* (₹45,280.00): Includes settled balances and floating capital.
    *   *Withdrawable Balance (Realized)* (₹32,450.00): Settled earnings available for bank settlement.
    *   *Pending Settlements (Unrealized)* (₹1,250.00): Locked trade margins held in escrow.
*   **Initiate Withdrawal Form**:
    *   Allows entering a customized withdrawal amount in Rupees.
    *   Validates input bounds against the settled *Withdrawable Balance*.
    *   Simulates processing using a mock timeout delay, updating store balances and logging the transaction state dynamically.
*   **Compliance Warnings**:
    *   > [!WARNING]
    *   > **Strict Wallet Compliance Warning:** Only realized profits can be withdrawn. Capital tied up in active trades cannot be released until the signals are fully closed and settled. Attempting to withdraw unrealized balances triggers validation errors.
*   **Transaction Ledger Table**: Displays credit/debit records, UTR transfers, dates, and processing status.

### Subscription Settings (`/dashboard/subscription`)
*   **Purpose**: Details current user tier metrics and provides pricing limits overview.
*   **Tiers**:
    *   *Club Plan*: Capital limits between $10 and $100. Subject to a 5% fee on profits.
    *   *Individual Plan*: Capital limits above $1000. Priority low-latency execution and reduced fee (4% on profits).
*   **Actions**: Onboard upgrade paths, display payment receipts configuration settings, and link to billing invoices.

### Past Trades Archive (`/dashboard/past-trades`)
*   **Purpose**: Extended view of all historically executed signals.
*   **Visual Highlights**: Detailed grid wrapping indicators and transaction tables alongside a performance metrics summary.
*   **Disclaimers**: Highlights standard automated trading regulatory boundaries.

---

## 5. State Integration & Data Flow

*   The dashboard relies on the shared [adminStore.js](file:///c:/xampp/htdocs/final/hooks/adminStore.js) Zustand state and standard prop-drilling configurations.
*   *Mock Telemetry*: Trade outcomes, balances, and PnL metrics are computed and updated dynamically to simulate live interaction.
*   *Form Interactivity*: All user inputs (such as withdrawal requests or settings adjustments) validate user authority, issue error warnings, and state updates dynamically.
