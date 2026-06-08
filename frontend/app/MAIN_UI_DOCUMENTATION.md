# Forex Auto Panel Public Marketing Website Documentation

Welcome to the comprehensive technical and operational documentation of the Forex Auto Panel Public Marketing Website subsystem. This document details the routes, custom layouts, modular styling elements, calculation engines, and interactive views of the public web application located under the root of `app/`.

---

## 1. Directory Structure

The public-facing marketing workspace in `app/` is organized as follows:

*   **`components/`**: Site chrome components governing navigation, layouts, and global actions.
    *   [SiteNavbar.js](file:///c:/xampp/htdocs/final/app/components/SiteNavbar.js): Fixed-top navbar container with interactive links, dark theme toggler, and quick CTA links to the login and dashboard.
    *   [SiteFooter.js](file:///c:/xampp/htdocs/final/app/components/SiteFooter.js): Platform footer compilation outlining risk disclaimers, brand links, and system indicators.
    *   [SiteChrome.js](file:///c:/xampp/htdocs/final/app/components/SiteChrome.js): Global structural template segment binding navbar, footer, and basic style grids together.
*   **`profit-simulator/`**: componding estimator page.
    *   [page.js](file:///c:/xampp/htdocs/final/app/profit-simulator/page.js): Interactive calculator displaying projected returns, platform fees, and net payouts across plans and risks.
*   **`pricing/`**: Catalog of membership options.
    *   [page.js](file:///c:/xampp/htdocs/final/app/pricing/page.js): Visual description of service levels (Club vs Individual plans).
*   **`login/`** & **`signup/`**: Core onboarding modules.
    *   [page.js](file:///c:/xampp/htdocs/final/app/login/page.js) & [page.js](file:///c:/xampp/htdocs/final/app/signup/page.js): Form handles collecting name, email, credentials, and routing tokens.
*   **`checkout/`**: Payment setup.
    *   [page.js](file:///c:/xampp/htdocs/final/app/checkout/page.js): Form for initiating funding, copying platform UPI ID/payment codes, and submitting receipts.
*   **`layout.js`**: Next.js root layout. Controls fonts loading (Inter, Space Grotesk, Cormorant Garamond), configures the global HTML structure, and runs the theme injection script on load.
*   **`page.js`**: Platform homepage with responsive animations and live trade history tables.

---

## 2. Global UI Theme & Site Chrome

The website uses a custom styled dark layout (`#050505`) with green neon accents.

### A. Theme Management (`SiteNavbar.js`)
*   The navbar includes a toggle button `#themeToggle` managing theme variables.
*   It updates the document's body class to `.light-theme` when set to light.
*   Persistent theme configuration is synchronized with the client browser's local storage:
    ```javascript
    localStorage.setItem("forex-auto-panel-theme", isLight ? "light" : "dark");
    ```

### B. Typography & Fonts (`layout.js`)
Loaded directly from Google Fonts:
*   `Inter`: Default sans font mapping text elements.
*   `Space Grotesk`: Header tracking elements.
*   `Cormorant Garamond` & `Instrument Serif`: Specialized serif words.

---

## 3. Platform Homepage Layout (`/`)

The marketing homepage utilizes a sequence of elements to engage prospects:

### A. Hero Module
*   **Aura Background**: Hidden SVGs rendering a subtle green glowing circle that filters underlying container highlights.
*   **Title Header**: Features high-impact neon messaging: *"Your Trading Works Automated. Intelligent. Profitable."*
*   **Interactive Call-to-Actions**: Links to the `/dashboard` or down to `/past-trades`. Includes hover micro-animations (e.g. rotating icons, gradient border expansions).

### B. "Meet Forex Auto Panel" Feature Section
*   A side-by-side showcase detailing structural integration:
    *   *Highlights grid*: Highlights consistent performance, 24/7 active runtimes, and execution triggers.
    *   *Dynamic Exchange Cards*: Four grid items outlining integrations with Binance, TradingView, MetaTrader, and KuCoin.

### C. Live Past Trades Execution Table
*   Displays actual trade signals executed by the bot.
*   Data points: Asset symbol, side, entry target, exit target, timestamp, result outcome (WIN/LOSS/BE), and net points movement.

---

## 4. Profit Compounding Simulator (`/profit-simulator`)

This interactive tool allows prospects to model expected earnings based on investment levels, selected plans, and risk profiles.

### A. Calculation Logic
The simulator calculates outcomes dynamically using React's `useMemo` hook:
1.  **Selectable Plans Configuration**:
    *   *Club Plan*: 4% platform fee on profits. Returns: 1 week (2.5%), 1 month (8%), 3 months (22%).
    *   *Individual Plan*: 6% platform fee on profits. Returns: 1 week (4%), 1 month (12%), 3 months (34%).
2.  **Risk Modifiers**:
    *   *Low Risk*: 0.75x return multiplier.
    *   *Medium Risk*: 1.0x return multiplier.
    *   *High Risk*: 1.35x return multiplier.
3.  **Core Formula**:
    ```javascript
    expectedReturn = plan.returns[durationKey] * risks[riskKey].multiplier;
    profit = investmentAmount * expectedReturn;
    platformFee = profit * plan.fee;
    netProfit = profit - platformFee;
    finalBalance = investmentAmount + netProfit;
    ```

### B. Form Inputs & Interactive Sliders
*   **Investment Amount**: Standard currency input (default: `$1,000`).
*   **Plan Selection Buttons**: Updates parameters between `club` and `individual`.
*   **Duration Buttons**: Fast options for 1 Week, 1 Month, or 3 Months.
*   **Risk Toggle**: Updates returns multipliers.
*   **Result Panel**: Highlights Net Profit and Final Balance, with a CTA linking to the registration page (`/signup`).

---

## 5. Checkout & Payment Onboarding (`/checkout`)

Once a user selects a plan from the website pricing catalogue:
1.  They copy the designated **UPI ID** or scan the visual **QR Code**.
2.  After executing the transfer on their mobile banking application, they input the transaction reference number (UTR) into the checkout form.
3.  The checkout form saves these records, initiates verification states, and passes them to the Super Admin pending reviews table.
