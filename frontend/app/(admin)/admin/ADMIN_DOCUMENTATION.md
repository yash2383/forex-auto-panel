# Nexus Capital Super Admin Dashboard Documentation

Welcome to the comprehensive technical and operational documentation of the Nexus Capital Super Admin subsystem. This document describes the structure, routes, permission matrix, UI screens, database/state fields, and operational workflows of the admin portal located in `app/admin`.

---

## 1. Directory Structure

The `app/admin` directory is structured as follows:

*   **`_components/`**: Shared admin shell layout components.
    *   [AdminShell.js](file:///c:/xampp/htdocs/final/app/admin/_components/AdminShell.js): Standard shell layout with sidebar navigation, search bar, website quick-links, theme-toggle, and admin profile status.
*   **`profit-distribution/`**: Financial operations dashboard.
    *   [page.js](file:///c:/xampp/htdocs/final/app/admin/profit-distribution/page.js): Dynamic calculation and platform-revenue distribution tool.
*   **`white-label/`**: Partner and brand management system.
    *   [page.js](file:///c:/xampp/htdocs/final/app/admin/white-label/page.js): Directory listing all active/inactive white-label partners.
    *   **`_components/`**: Specific components for white-label operations.
        *   [WhiteLabelUI.js](file:///c:/xampp/htdocs/final/app/admin/white-label/_components/WhiteLabelUI.js): Shared UI controls (form fields, permission matrices, table wrappers, custom pills).
        *   [whiteLabelData.js](file:///c:/xampp/htdocs/final/app/admin/white-label/_components/whiteLabelData.js): Mock data structure representing partners, white-label users, transactions, and earnings logs.
    *   **`create/`**: Onboarding portal.
        *   [page.js](file:///c:/xampp/htdocs/final/app/admin/white-label/create/page.js): Brand registration and configuration wizard.
    *   **`earnings/`**: Finance logs.
        *   [page.js](file:///c:/xampp/htdocs/final/app/admin/white-label/earnings/page.js): Partner commission split and platform revenue reports.
    *   **`[id]/`**: Partner profile workspace.
        *   [page.js](file:///c:/xampp/htdocs/final/app/admin/white-label/%5Bid%5D/page.js): Dynamic dashboard showcasing partner details, users registered, and transaction logs.
*   **`layout.js`**: Next.js route segment wrapper providing state suspension (`Suspense`) and the base admin shell structure.
*   **`page.js`**: Core admin dispatcher that parses search parameters to load respective management section tables (Users, Payments, Trades, Campaigns, etc.), falling back to the Platform Overview.

---

## 2. Navigation & Layout Shell

The Admin Dashboard uses the `AdminShell` component which imports navigation routes and configurations from `app/dashboard/_components/dashboardData.js`. 

The sidebar options are categorized into four logical operational groups:

### I. Management
1.  **Dashboard** (`/admin`): Main platform health, charts, and action grids.
2.  **Users** (`/admin?section=users`): Registry of clients and active plans.
3.  **Payments** (`/admin?section=payments`): Manual checkout review log.
4.  **Trades** (`/admin?section=trades`): Global ledger of executed market options.
5.  **PnL Reports** (`/admin?section=pnl-reports`): Strategy metrics export.
6.  **Profit Distribution** (`/admin/profit-distribution`): Fee-claiming tool.

### II. Communication
7.  **Notifications** (`/admin?section=notifications`): Direct marketing broadcast manager.
8.  **Campaigns** (`/admin?section=campaigns`): Acquisition link generator.
9.  **Referrals** (`/admin?section=referrals`): Organic affiliate system details.

### III. White Label
10. **All Partners** (`/admin/white-label`): White-label brand dashboard.
11. **Create Partner** (`/admin/white-label/create`): Sub-brand onboarding wizard.
12. **Earnings** (`/admin/white-label/earnings`): Multi-tenant revenue split logs.

### IV. Administration
13. **Admins** (`/admin?section=admins`): Access management for moderators.
14. **Reports** (`/admin?section=reports`): Comprehensive operations logger.
15. **Settings** (`/admin?section=settings`): QR configurations, UPI configuration, and system variables.
16. **Activity Logs** (`/admin?section=activity-logs`): Immutable audit history.

---

## 3. Platform Overview (Core Dashboard)

Located at `/admin` (when no `?section` query parameter is present), this screen presents the system health metrics, financial overview, and recent activity.

### A. Performance Statistics (Metric Cards)
*   **Total Users**: `12,648` *(+18.6% this week)*
*   **Active Subscriptions**: `5,892` *(+14.3% this week)*
*   **Total Revenue**: `$248,250.75` *(+23.8% this week)*
*   **Pending Payments**: `32` *(Actionable link to Payments section)*
*   **Total Trades**: `18,562` *(+11.7% this week)*
*   **Total PnL**: `$356,780.45` *(+31.2% this week)*

### B. Analytical Charts
1.  **Revenue Overview**: An SVG-rendered line chart depicting daily earnings trend lines (e.g., May 19 to May 25). Supports a "This Week" filter drop-down.
2.  **Subscription Status**: A conic-gradient pie chart visualizing user tier ratios:
    *   *Active*: `4,250 (72.1%)` - Green
    *   *Expired*: `1,012 (17.2%)` - Red
    *   *Pending*: `492 (8.4%)` - Yellow
    *   *Cancelled*: `138 (2.3%)` - Slate
3.  **Recent Activity**: Real-time event feed log tracking registrations, payment clearances, open orders, and rejections.

### C. Pending Payments Table
A compact, quick-action grid showing current checkout forms awaiting review.
*   **Data Fields**: `Payment ID`, `User Profile`, `Plan Selected`, `Amount`, `UTR Number`, `Timestamp`, `Status`.
*   **Actions**:
    *   `Approve`: Instantly upgrades user account.
    *   `Reject`: Cancels approval and triggers client notification.
    *   `More Options`: Opens detailed remark drawer.

---

## 4. Operational Section Details

Admin sections are dynamically rendered through `AdminSectionPage` inside `app/admin/page.js` based on `?section=<key>`. Each section maps to a CRUD Permission Matrix which defines allowed features.

```
+-----------------------------------------------------------------------------------+
| SECTION        | CREATE / ADD           | EDIT / UPDATE          | DELETE         |
+-----------------------------------------------------------------------------------+
| Users          | Manually Add           | Name, Email, Plan      | Soft Delete    |
| Payments       | N/A (User Initiated)   | Edit Status Only       | Blocked        |
| Trades         | Manual Execution       | Entry, Exit, Status    | Allowed        |
| PnL Reports    | Export Only            | Read-Only              | Blocked        |
| Notifications  | Custom broadcast       | Edit Drafts            | Scheduled only |
| Campaigns      | Trackers, UTMs         | Change Targets         | Preserves stats|
| Referrals      | Auto-Generated         | Adjust Tier %          | Blocked        |
| Admins         | Add New Operator       | Change Group / Role    | Full Remove    |
| Reports        | Export Only            | Read-Only              | Blocked        |
| Settings       | Create payment methods | Replace Active UPI/QR  | Blocked        |
| Activity Logs  | Auto-appended          | Immutable              | Blocked        |
+-----------------------------------------------------------------------------------+
```

---

### Users Section (`?section=users`)
*   **Purpose**: Directory of clients registered on the platform.
*   **Metrics**: Total Users (`12,648`), No Deposit Users (`2,184`), Active Users (`5,892`), VIP Users (`316`).
*   **Data Fields**: `Name`, `Email`, `Deposit Total`, `Active Plan`, `Status`.
*   **Interactions**:
    *   **Filter Pills**: Filter list by `All`, `No Deposit`, `Active`, `VIP`, `Expired`.
    *   **Add User Form**: Fields: *Name, Email, Assigned Plan, Start Date*.
    *   **Edit Button**: Modify email, adjust plan levels, or reset client status.
    *   **Block/Unblock Button**: Toggle login rights.
    *   **Soft Delete Button**: Marks status as "Inactive" to preserve financial and audit logs.

### Payments Section (`?section=payments`)
*   **Purpose**: Log of subscription checkout requests.
*   **Metrics**: Pending (`32`), Approved (`1,284`), Rejected (`19`), Revenue (`$248,250`).
*   **Data Fields**: `ID`, `User`, `Plan`, `Amount`, `Status`, `UTR`, `Payment Screenshot`.
*   **Interactions**:
    *   **Approve Button**: Marks payment as complete and activates the subscription.
    *   **Reject Button**: Rejects payment.
    *   **Remark Button**: Opens a popup form to add a reason for rejection (e.g., "Invalid UTR").

### Trades Section (`?section=trades`)
*   **Purpose**: Log of trading signals and orders.
*   **Metrics**: Active Trades (`184`), Closed Trades (`18,378`), Winning Trades (`13,392`), Open PnL (`$8,420`).
*   **Data Fields**: `Pair`, `Type (BUY/SELL)`, `Entry Price`, `Exit Price`, `Status`.
*   **Interactions**:
    *   **Add Trade Button**: Fields: *Asset Pair, Side, Entry Target, Stop Loss, Target*.
    *   **Edit Button**: Adjust entries or manually set closing targets.
    *   **Close Button**: Instantly settles open trade at the current spot price.
    *   **Delete Button**: Permanently deletes trades.

### Profit & Loss Reports Section (`?section=pnl-reports`)
*   **Purpose**: Trading performance overview.
*   **Metrics**: Total PnL (`$356,780`), User-wise Avg (`$214`), Best Setup (`Breakout`), Win Rate (`72.91%`).
*   **Data Fields**: `Scope`, `PnL`, `ROI`, `Win Rate`.
*   **Interactions**:
    *   **Export Button**: Generates a CSV/Excel sheet.
    *   **View Button**: Detailed stats breakdown.

### Notifications Section (`?section=notifications`)
*   **Purpose**: Bulk and targeted communication manager.
*   **Metrics**: Pending (`18`), Sent Today (`420`), Open Rate (`58%`), Target Groups (`6`).
*   **Data Fields**: `Audience Filter`, `Message Content`, `Channel (In-App/Email)`, `Status`.
*   **Interactions**:
    *   **Send Notification Form**: Fields: *Audience Selector (Dropdown), Subject, Body, Broadcast Time*.
    *   **Audience Filters**: `No Deposit Users`, `One-Time Deposit Users`, `Active Subscribers`, `Expired Users`, `High Value Users`, `Campaign Users`.
    *   **Send Button**: Trigger immediate delivery.
    *   **Draft Button**: Save draft message.
    *   **Delete Button**: Removes scheduled campaigns before they launch.

### Campaigns Section (`?section=campaigns`)
*   **Purpose**: Promotional trackers and UTM link monitoring.
*   **Metrics**: Campaigns (`14`), Users (`335`), Deposits (`142`), Revenue (`$32,500`).
*   **Data Fields**: `Campaign Name`, `Tracking Link`, `Registrations`, `Revenue Generated`.
*   **Interactions**:
    *   **Create Campaign Form**: Fields: *Campaign Name, UTM Tag Code, Target Destination*.
    *   **Tracking Link**: Automatically copyable output (e.g. `/register?campaign=SUMMER2025`).
    *   **Edit / Delete**: Adjust names or remove trackers (historical analytics are preserved).

### Referrals Section (`?section=referrals`)
*   **Purpose**: Commission splits for affiliates.
*   **Metrics**: Referral % (`10%`), Referrals (`1,204`), Payouts (`$18,420`), Revenue (`$92,100`).
*   **Data Fields**: `Referrer`, `User Referred`, `Deposit Amount`, `Reward Amount`.
*   **Interactions**:
    *   **Approve Payout**: Releases pending reward balances.
    *   **Referral Settings**: Opens a field to adjust the platform affiliate commission percentage.

### Admins Section (`?section=admins`)
*   **Purpose**: Super-user access permissions configuration.
*   **Metrics**: Admins (`8`), Support Staff (`3`), Super Admins (`2`), Pending Invites (`1`).
*   **Data Fields**: `Admin Name`, `Role`, `Authorized Modules`, `Status`.
*   **Interactions**:
    *   **Add Admin Form**: Fields: *Username, Email, Role Tier, Modules (Checkbox options)*.
    *   **Edit Permissions**: Adjust modules (e.g., grant access to Payments, hide Settings).
    *   **Remove Admin Button**: Revokes tokens immediately.

### Reports Section (`?section=reports`)
*   **Purpose**: Downloadable platform reports.
*   **Metrics**: Revenue Reports (`24`), Growth Reports (`18`), Exports (`92`), This Month (`$42,800`).
*   **Data Fields**: `Report Name`, `Category`, `Last Updated`, `File Format`.
*   **Interactions**:
    *   **Export File**: Instantly download report in Excel or PDF format.

### Platform Settings & Payment Config Section (`?section=settings`)
*   **Purpose**: Main configuration page for platform rules, payment gateways, and UPI collection details.
*   **Metrics**: Referral % (`10%`), Platform Fee (`4%`), Payment QR (`Active`), Configs (`16`).
*   **Data Fields**: `Setting Name`, `Value`, `Department Owner`, `Status`.
*   **Payment Configuration Form**:
    *   `UPI ID Input`: Enter platform collection UPI ID (default: `tradebot@upi`).
    *   `QR Code Update`: Upload files or rebuild the default visual static QR block.
    *   `Payment Modes Checkbox`: Toggle payment methods on/off (e.g., *UPI*, *Bank Transfer*).
    *   `Save Settings Button`: Commits all changes to the environment configuration.

### Activity Logs Section (`?section=activity-logs`)
*   **Purpose**: Security auditing.
*   **Metrics**: Logs Today (`642`), Admin Actions (`84`), User Actions (`558`), Alerts (`3`).
*   **Data Fields**: `Actor Profile`, `Operation Detail`, `Section Module`, `Timestamp`, `Status`.
*   **Interactions**:
    *   **Search**: Filter logs by operator or targeted action.
    *   *Note: This view is read-only. Entries are immutable.*

---

## 5. Profit Distribution Dashboard

Located at `/admin/profit-distribution`, this dashboard calculates and distributes profit shares from trading outcomes to the platform.

### A. Mathematical Logic
To prevent floating-point calculation issues, the system converts currency inputs to integer cents:
1.  **Profit Cent Calculation**: `profitCents = Math.round(user.profit * 100)`
2.  **Platform Share (Admin Cut)**: `adminCents = Math.floor(profitCents * percentage)` (calculated for profitable users).
3.  **Client Net Share**: `userCents = profitCents - adminCents`
4.  **Formatting**: Resulting values are formatted back to standard floats for UI display.

> [!IMPORTANT]
> Users with net-negative trading outcomes (losses) are excluded from the distribution pool by default. They can be included by selecting the **"Include Loss Users"** checkbox. However, their platform fee (Admin Cut) is skipped (`-`), ensuring the platform only claims revenue on profitable cycles.

### B. Summary Indicators
*   **Total User Profit (Pool)**: Gross user profits (INR). Shows active profitable users.
*   **Platform Earnings (Admin Cut)**: Total platform fee revenue. Displays average earnings per user.
*   **Total Distributed (Net)**: Total funds paid out to users after platform fees.
*   **Status Indicators**: Displays `Pending Review` (yellow) or `Distributed` (green) based on state.

### C. Interactions & Form Actions
*   **Include Loss Users Toggle**: A checkbox that recalculates dashboard stats using a custom React `useMemo` hook to include loss records.
*   **Distribute Now Button**:
    *   *State change*: Updates all pending payouts to `Distributed` status.
    *   *UI change*: Changes the status indicator to green and disables the button.
*   **View Calc Button**: Opens the **Calculation Breakdown Modal** for the selected user.
*   **Calculation Breakdown Modal**:
    *   Displays: *Base Profit*, *Platform Fee Rate*, *Admin Cut*, and *User Net Profit*.
    *   Formula Displayed: `Math.floor(profit * 100 * percentage) / 100`
*   **Profit Settings Override (Sidebar Panel)**:
    *   *Default Platform Fee*: `30%` (read-only Global setting).
    *   *Plan Overrides*: Displays overrides: Basic Plan Fee (`25%`), Pro Plan Fee (`30%`), VIP Plan Fee (`20%`).
    *   *Update Settings Button*: Saves changes to fee structures.

---

## 6. White Label Partner System

The White Label system allows admins to manage independent sub-brands and track partner revenue.

### A. All Partners Screen (`/admin/white-label`)
*   **Purpose**: Main white-label directory table.
*   **Fields**: `Logo Avatar`, `Partner Name`, `Domain Address`, `Total Users`, `Gross Revenue`, `Commission Split %`, `Status (Active/Inactive)`.
*   **Actions**:
    *   `View Profile`: Opens dynamic partner detail page (`/admin/white-label/[id]`).
    *   `Edit`: Modify partner domain or commission rates.
    *   `Disable`: Toggles partner status to "Inactive".
    *   `Optional/Delete`: Removes partner account.

### B. Create Partner Wizard (`/admin/white-label/create`)
*   **Purpose**: Onboard new partners.
*   **Fields**:
    *   *Brand Name* (Text)
    *   *Email* (Email address for partner login)
    *   *Password* (Credentials)
    *   *Commission %* (Partner revenue split)
    *   *Logo Upload* (File upload)
    *   *Custom Domain (optional)* (Custom domain mapping)
    *   *Status toggle*: Enable brand immediately.
*   **Submission Action**: Creates partner and adds them to the partner directory.

### C. White Label Earnings (`/admin/white-label/earnings`)
*   **Purpose**: Tracks platform revenue across all white labels.
*   **Metrics**: Total Platform Revenue (`$137,000`), Total WL Earnings (`$34,120`), Total Admin Earnings (`$41,100`).
*   **Revenue Split Chart**: Visualizes split percentages using three progress bars:
    *   `Platform Overall Share`: `92%` (Green)
    *   `WL Partners Share`: `62%` (Green)
    *   `Platform Admin Share`: `58%` (Blue)
*   **Partner Earnings Table**: Lists: *Partner Name*, *Gross Revenue*, *Commission %*, *Admin Earnings (Admin Cut)*, and *Partner Earnings*.
*   **Export Actions**: Allows admins to export earnings data.

### D. Partner Profile Workspace (`/admin/white-label/[id]`)
*   **Purpose**: Details for a specific partner brand.
*   **Metadata**: Dynamic ID parameter matches the partner profile (e.g., `alpha-traders`). Displays email, branding name, mapped domain, and status badge.
*   **Metrics**: Total Users, Gross Revenue, Your Earnings (Admin Cut), Their Earnings (Commission split).
*   **Sub-Tables**:
    1.  **Users Registry**: Registered users for this partner. Displays `User Name`, `Plan Tier`, `Subscription Payments`, and `Registration Date`.
    2.  **Transaction History**: Financial ledger for this partner. Displays `Payment Amount`, `Admin Cut`, `WL Partner Cut`, and `Transaction Date`.
