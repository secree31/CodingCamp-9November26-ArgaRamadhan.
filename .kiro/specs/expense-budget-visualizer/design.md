# Design Document

## Overview

The Expense & Budget Visualizer is a fully client-side, single-page web application (SPA) built with HTML, CSS, and Vanilla JavaScript — no build tools, no npm, no frameworks. The application runs by opening `index.html` directly in a browser.

The core responsibilities are:
1. Accept user input for expense transactions (name, amount, category).
2. Persist all data (transactions, custom categories, theme preference) in the browser's `localStorage`.
3. Render a live pie chart of spending distribution by category using [Chart.js v4](https://www.chartjs.org/) loaded via CDN.
4. Display a running total balance that updates immediately after any add or delete action.
5. Support optional features: custom categories, sort order control, and dark/light mode toggle.

**Key design principles:**
- **Zero dependencies at runtime except Chart.js CDN.** No package manager, no bundler.
- **Single source of truth in memory.** One in-memory array (`state.transactions`) is the master data; all UI components read from it. LocalStorage is a persistence mirror.
- **Synchronous, event-driven updates.** Every user action (add, delete, sort, toggle theme) triggers a single render cycle that updates all affected UI regions.
- **Defensive LocalStorage access.** All reads and writes are wrapped in try/catch; the app degrades gracefully if storage is unavailable or corrupt.

---

## Architecture

The application follows a **unidirectional data flow** pattern:

```
User Interaction
      │
      ▼
  Action Handler  (js/app.js — event listeners)
      │
      ▼
  State Mutation  (js/state.js — in-memory state + LocalStorage sync)
      │
      ▼
  Render Cycle    (js/ui.js — DOM update functions)
      │            (js/chart.js — Chart.js wrapper)
      ▼
  DOM / Canvas
```

**File layout:**

```
expense-budget-visualizer/
├── index.html          ← Entry point; loads CSS and JS
├── css/
│   └── style.css       ← All styles, CSS custom properties for theming
└── js/
    ├── app.js          ← Bootstraps the app; wires all event listeners
    ├── state.js        ← State object, mutation helpers, LocalStorage I/O
    ├── ui.js           ← DOM rendering functions (list, balance, form feedback)
    └── chart.js        ← Chart.js instance creation and update helpers
```

> **Rationale for splitting into four JS files:** A monolithic script would exceed ~500 lines quickly. Splitting by concern (state, rendering, charting, orchestration) keeps each file focused and independently readable, while still loading them all as plain `<script>` tags with no module bundler.

**Script loading order in `index.html`:**

```html
<!-- Chart.js via CDN (UMD build — exposes window.Chart) -->
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.6/dist/chart.umd.min.js"></script>

<!-- App scripts (defer so DOM is ready) -->
<script src="js/state.js" defer></script>
<script src="js/chart.js" defer></script>
<script src="js/ui.js" defer></script>
<script src="js/app.js" defer></script>
```

Chart.js is loaded without `defer` so the global `Chart` symbol is available to `chart.js` when it runs.

---

## Components and Interfaces

### 1. HTML Layout (`index.html`)

Five top-level sections inside `<main>`:

| Section ID | Purpose |
|---|---|
| `#header` | App title + dark/light mode toggle button |
| `#balance-section` | Displays formatted total balance |
| `#input-section` | Transaction input form + custom category sub-form |
| `#chart-section` | `<canvas>` for the pie chart |
| `#transaction-section` | Sort controls + scrollable transaction list |

### 2. State Module (`js/state.js`)

Exposes a single global `AppState` object (no ES modules, plain global) and mutation functions:

```js
// Global state shape
const AppState = {
  transactions: [],      // Transaction[]
  categories: [],        // string[]  (default + custom, persisted order)
  theme: 'light',        // 'light' | 'dark'
  sortKey: null,         // null | 'amount-asc' | 'amount-desc' | 'cat-az' | 'cat-za'
};

// Public API
function State_load()                          // Reads from localStorage; populates AppState
function State_addTransaction(tx)              // Validates shape, pushes to array, saves
function State_deleteTransaction(id)           // Removes by id, saves
function State_addCategory(name)               // Dedupes (case-insensitive), pushes, saves
function State_setTheme(theme)                 // Updates AppState.theme, saves
function State_setSortKey(key)                 // Toggles or sets sortKey
function State_getSortedTransactions()         // Returns display-order copy (never mutates source)
function State_save()                          // Internal: writes AppState to localStorage
```

### 3. UI Module (`js/ui.js`)

Pure DOM-manipulation functions. Each function accepts data from `AppState` and rebuilds the relevant DOM subtree.

```js
function UI_renderBalance(transactions)
function UI_renderTransactionList(transactions, onDelete)
function UI_renderCategoryDropdown(categories)
function UI_showFormError(fieldId, message)
function UI_clearFormErrors()
function UI_showStorageWarning(message)
function UI_showEmptyState(containerId, message)
function UI_applyTheme(theme)
function UI_setSortButtonState(activeKey)
```

### 4. Chart Module (`js/chart.js`)

Wraps Chart.js. Maintains one `Chart` instance; calling `Chart_update()` replaces datasets in place (no destroy/recreate) to avoid flickering.

```js
function Chart_init(canvasId)                  // Creates Chart instance on the canvas
function Chart_update(transactions)            // Recalculates category aggregates; updates chart
function Chart_showEmpty()                     // Removes all segments; shows empty label
```

Aggregation logic (also used by the chart module for filtering):

- Transactions with `amount <= 0` are excluded from chart calculations (Requirement 5.7).
- Amounts are grouped by `category` (case-sensitive, matching stored string).
- Percentages are computed as `(categoryTotal / grandTotal) * 100`.

### 5. App Orchestrator (`js/app.js`)

Runs after DOM is ready (`DOMContentLoaded`). Responsibilities:

1. Call `State_load()` to hydrate `AppState` from localStorage.
2. Call `Chart_init('spending-chart')`.
3. Perform the initial full render: balance, transaction list, category dropdown, chart, theme.
4. Attach all event listeners:
   - `#transaction-form` → `submit` → add transaction flow
   - `#add-category-form` → `submit` → add custom category flow
   - `#transaction-list` → delegated `click` on delete buttons
   - `#sort-controls` → delegated `click` on sort buttons
   - `#theme-toggle` → `click` → toggle theme

**Full render cycle** (called after every mutation):

```js
function renderAll() {
  const txs = State_getSortedTransactions();
  UI_renderBalance(AppState.transactions);     // balance always uses unsorted full list
  UI_renderTransactionList(txs, handleDelete);
  Chart_update(AppState.transactions);         // chart always uses full unsorted list
  UI_setSortButtonState(AppState.sortKey);
}
```

---

## Data Models

### Transaction

Stored as a JSON array in localStorage under the key `"ebv_transactions"`.

```js
/**
 * @typedef {Object} Transaction
 * @property {string}  id         - UUID (crypto.randomUUID() or Date.now() fallback)
 * @property {string}  name       - Item name, 1–100 characters
 * @property {number}  amount     - Positive number, 0.01 ≤ amount ≤ 999_999_999.99
 * @property {string}  category   - Category label (must exist in AppState.categories)
 * @property {string}  createdAt  - ISO 8601 timestamp (new Date().toISOString())
 */
```

**Example:**
```json
{
  "id": "1a2b3c4d-...",
  "name": "Lunch at Warung",
  "amount": 35000,
  "category": "Food",
  "createdAt": "2025-11-26T08:30:00.000Z"
}
```

### Category List

Stored as a JSON array in localStorage under the key `"ebv_categories"`.

```js
// Default categories (always present; never removed)
const DEFAULT_CATEGORIES = ["Food", "Transport", "Fun"];
```

Custom categories are appended after defaults. The full combined list is what gets persisted. On load, if no stored list exists, `DEFAULT_CATEGORIES` is used.

### Theme Preference

Stored as a plain string in localStorage under the key `"ebv_theme"`. Valid values: `"light"` or `"dark"`. Defaults to `"light"` if key is absent or value is unrecognized.

### Sort Key

Not persisted. Reset to `null` on every page load. Valid values:

| Key | Meaning |
|---|---|
| `null` | Default: descending by `createdAt` |
| `"amount-asc"` | Amount, lowest first |
| `"amount-desc"` | Amount, highest first |
| `"cat-az"` | Category name, A → Z |
| `"cat-za"` | Category name, Z → A |

Ties broken by `createdAt` descending in all cases (Requirement 8.2).

### LocalStorage Key Summary

| Key | Type | Contents |
|---|---|---|
| `"ebv_transactions"` | JSON array | `Transaction[]` |
| `"ebv_categories"` | JSON array | `string[]` (all categories including defaults) |
| `"ebv_theme"` | string | `"light"` \| `"dark"` |

### Validation Rules

| Field | Rule |
|---|---|
| `name` | Non-empty after trim; ≤ 100 characters |
| `amount` | Parseable as a number; `0.01 ≤ value ≤ 999_999_999.99` |
| `category` | Must be a non-empty string present in `AppState.categories` |
| Custom category name | Non-empty after trim; ≤ 50 characters; not duplicate (case-insensitive) |

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Transaction add round-trip persists to LocalStorage

*For any* valid transaction (non-empty name ≤ 100 chars, amount in [0.01, 999,999,999.99], known category), after it is added, querying `localStorage.getItem("ebv_transactions")` and parsing it must produce a list that contains a transaction with an equivalent name, amount, and category.

**Validates: Requirements 2.3, 6.1**

### Property 2: Whitespace-only or empty inputs are always rejected

*For any* string composed entirely of whitespace characters (or the empty string) supplied as the item name, or for any amount value that is non-numeric or ≤ 0 or > 999,999,999.99, the transaction list length must remain unchanged after a submission attempt.

**Validates: Requirements 2.4, 2.5**

### Property 3: Delete removes transaction from state and storage

*For any* transaction currently in the list, after deleting it, the transaction list must no longer contain an entry with that transaction's id, and the parsed LocalStorage array must also not contain that id.

**Validates: Requirements 3.3, 6.2**

### Property 4: Balance equals sum of all transaction amounts

*For any* set of transactions, the displayed balance value must equal the arithmetic sum of all individual transaction amounts, formatted to two decimal places.

**Validates: Requirements 4.1, 4.2, 4.3**

### Property 5: Chart excludes non-positive amounts

*For any* set of transactions where some have amount ≤ 0, the data passed to the chart must include only transactions whose amount > 0, and the category totals must equal the sum of only those positive-amount transactions.

**Validates: Requirements 5.1, 5.7**

### Property 6: Custom category deduplication is case-insensitive

*For any* existing category name (default or custom), attempting to add a string that differs only in letter case must be rejected and the category list length must remain unchanged.

**Validates: Requirements 7.2, 7.3**

### Property 7: Sort does not mutate stored data

*For any* sort key applied to a transaction list, the JSON stored in `localStorage.getItem("ebv_transactions")` before and after the sort operation must be identical (byte-for-byte equal).

**Validates: Requirements 8.2**

### Property 8: Sort order is stable and respects tiebreaker

*For any* two transactions with equal sort values (same amount or same category), after sorting they must appear in descending `createdAt` order relative to each other.

**Validates: Requirements 8.2**

### Property 9: Theme round-trip persists and restores correctly

*For any* theme value (`"light"` or `"dark"`), after setting it and then calling the initialization routine again (simulating a page reload), the restored theme must equal the saved theme.

**Validates: Requirements 9.3, 9.4**

---

## Error Handling

### LocalStorage Unavailability

All `localStorage` calls are wrapped in try/catch. If `localStorage` is unavailable (private browsing restrictions, storage full, security policy):

- On **read**: the app starts with empty transactions and default categories; `UI_showStorageWarning()` displays a banner.
- On **write**: the write silently fails; a warning banner is shown once per session indicating data will not be saved.

### Corrupt / Malformed LocalStorage Data

On initialization, `JSON.parse()` output is validated against the expected shape:

- **Transactions**: each entry must have `id` (string), `name` (string), `amount` (positive number), `category` (string), `createdAt` (parseable ISO string). Entries failing validation are discarded.
- **Categories**: must be a non-empty array of strings. If invalid, fall back to `DEFAULT_CATEGORIES`.
- **Theme**: if value is not `"light"` or `"dark"`, fall back to `"light"`.

If any items are discarded, `UI_showStorageWarning()` is called with a message describing the number of discarded entries.

### Form Validation Errors

Validation runs on form submit (not on blur/change) to avoid premature error messages:

1. Each field is validated in order: name → amount → category.
2. `UI_showFormError(fieldId, message)` inserts an error `<span>` immediately after the offending input using `insertAdjacentElement('afterend', ...)`.
3. `UI_clearFormErrors()` is called at the top of every submit handler before re-validating.
4. Keyboard focus is moved to the first invalid field (`element.focus()`).

### Chart.js Load Failure

If the CDN script fails to load (`window.Chart` is undefined when `Chart_init` runs), the canvas is hidden and replaced with an inline error message: *"Chart could not be loaded. Please check your internet connection."*

### Amount Precision

All monetary arithmetic uses `Math.round(value * 100) / 100` to avoid floating-point drift. The balance is formatted with `toFixed(2)` before display.

---

## Testing Strategy

This feature is a client-side UI application built with Vanilla JS, HTML, and CSS. The testing strategy uses a combination of unit tests and property-based tests.

### Unit Tests

Unit tests are written using **Jest** (can be run via Node.js against the extracted pure functions; DOM-dependent functions use `jsdom`).

Focus areas for unit tests:

- `State_load()`: valid data, corrupt data, missing keys, unavailable storage.
- `State_addTransaction()`: boundary values for name length and amount range.
- `State_addCategory()`: duplicate detection (case-insensitive), length boundary.
- `State_getSortedTransactions()`: each sort key; tiebreaker ordering.
- `UI_renderBalance()`: zero balance, negative balance, two-decimal formatting.
- Validation helpers: each invalid input type for name and amount fields.
- Chart aggregation logic: exclusion of zero/negative amounts, category grouping.

### Property-Based Tests

Property-based tests are written using **[fast-check](https://github.com/dubzzz/fast-check)** (available via CDN or Node) with a minimum of **100 iterations per property**.

Each test is tagged with a comment in the format:
`// Feature: expense-budget-visualizer, Property N: <property_text>`

| Property | Test Strategy |
|---|---|
| **P1** Transaction add round-trip | Generate arbitrary valid transactions; add each; parse storage; assert presence. |
| **P2** Invalid inputs always rejected | Generate whitespace-only strings and out-of-range numbers; assert list length unchanged. |
| **P3** Delete removes from state and storage | Populate list with generated transactions; delete a random one; assert absence. |
| **P4** Balance equals sum | Generate lists of transactions with arbitrary amounts; assert `renderBalance` output matches `sum.toFixed(2)`. |
| **P5** Chart excludes non-positive amounts | Mix positive and non-positive transactions; assert aggregation totals ignore non-positive entries. |
| **P6** Custom category dedup is case-insensitive | Generate pairs of strings differing only in case; assert second add is rejected. |
| **P7** Sort does not mutate storage | Add transactions; apply each sort key; assert localStorage JSON before equals localStorage JSON after. |
| **P8** Sort tiebreaker ordering | Generate transactions with equal sort fields; assert createdAt-descending tie resolution. |
| **P9** Theme round-trip | For each valid theme value; simulate save then reload; assert restored theme matches saved. |

### Integration / Smoke Tests

These are manual browser checks (or automated with Playwright):

- Opening `index.html` cold with an empty LocalStorage loads correctly with defaults.
- Opening `index.html` after seeding LocalStorage with valid data restores full state.
- Chart.js CDN loads and the pie chart renders visually.
- Responsive layout at 320 px, 768 px, 1280 px, and 2560 px viewport widths.
- Cross-browser smoke: Chrome, Firefox, Edge, Safari (latest stable).

### Accessibility Check

Manual verification with a screen reader and keyboard-only navigation to meet WCAG AA requirements (Requirement 11.2). Automated contrast-ratio check using browser dev tools or axe-core bookmarklet.
