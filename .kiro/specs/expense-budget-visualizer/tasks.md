# Implementation Plan: Expense & Budget Visualizer

## Overview

Build a fully client-side SPA with HTML, CSS, and Vanilla JavaScript. The app lets users log expense transactions, view a pie chart of spending by category, and monitor a running balance — all persisted to `localStorage`. Implementation follows a unidirectional data-flow pattern: **Action → State mutation → Render cycle**, spread across four JS files (`state.js`, `chart.js`, `ui.js`, `app.js`) loaded as plain `<script>` tags.

---

## Tasks

- [x] 1. Scaffold project structure and entry point
  - Create the directory tree: `expense-budget-visualizer/`, `css/`, `js/`
  - Create `index.html` with the five `<main>` sections (`#header`, `#balance-section`, `#input-section`, `#chart-section`, `#transaction-section`) and correct `<script>` loading order (Chart.js CDN without `defer`; `state.js`, `chart.js`, `ui.js`, `app.js` with `defer`)
  - Create empty stub files: `css/style.css`, `js/state.js`, `js/chart.js`, `js/ui.js`, `js/app.js`
  - Add placeholder `<canvas id="spending-chart">` inside `#chart-section`
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 5.5_

- [x] 2. Implement the State module (`js/state.js`)
  - [x] 2.1 Define `AppState` global object and `DEFAULT_CATEGORIES`
    - Declare `AppState` with `transactions`, `categories`, `theme`, and `sortKey` fields
    - Declare `const DEFAULT_CATEGORIES = ["Food", "Transport", "Fun"]`
    - _Requirements: 2.2, 7.1_

  - [x] 2.2 Implement `State_load()` — LocalStorage hydration with corruption handling
    - Parse `ebv_transactions`, `ebv_categories`, `ebv_theme` from localStorage (all inside `try/catch`)
    - Validate each transaction entry against the required shape; discard invalid entries and count discards
    - Validate categories array (non-empty string array); fall back to `DEFAULT_CATEGORIES` if invalid
    - Validate theme value; fall back to `"light"` if not `"light"` or `"dark"`
    - If any items are discarded, call `UI_showStorageWarning()` with a descriptive message
    - If localStorage throws, populate defaults and call `UI_showStorageWarning()`
    - _Requirements: 3.4, 3.5, 6.3, 6.4, 6.5, 9.4, 9.5_

  - [x] 2.3 Implement `State_save()`, `State_addTransaction()`, and `State_deleteTransaction()`
    - `State_save()`: write `AppState.transactions`, `AppState.categories`, and `AppState.theme` to their respective localStorage keys inside `try/catch`; call `UI_showStorageWarning()` on error
    - `State_addTransaction(tx)`: validate the tx shape, generate `id` via `crypto.randomUUID()` (fall back to `Date.now()`), set `createdAt`, push to `AppState.transactions`, call `State_save()`
    - `State_deleteTransaction(id)`: filter out the matching id, call `State_save()`
    - _Requirements: 2.3, 3.3, 6.1, 6.2_

  - [x] 2.4 Implement `State_addCategory()`, `State_setTheme()`, and `State_setSortKey()`
    - `State_addCategory(name)`: trim, validate length ≤ 50, case-insensitive dedupe check, push, call `State_save()`
    - `State_setTheme(theme)`: update `AppState.theme`, call `State_save()`
    - `State_setSortKey(key)`: toggle off if already active (set to `null`), otherwise set; do NOT call `State_save()` (sort key is session-only)
    - _Requirements: 7.2, 7.3, 8.3, 9.3_

  - [x] 2.5 Implement `State_getSortedTransactions()`
    - Return a shallow copy of `AppState.transactions` sorted per `AppState.sortKey`
    - Supported keys: `null` (createdAt desc), `"amount-asc"`, `"amount-desc"`, `"cat-az"`, `"cat-za"`
    - Tiebreaker: `createdAt` descending in all cases
    - Must never mutate `AppState.transactions`
    - _Requirements: 8.1, 8.2_

  - [x] 2.6 Write property test for `State_addTransaction` round-trip (Property 1)
    - **Property 1: Transaction add round-trip persists to LocalStorage**
    - Generate arbitrary valid transactions; call `State_addTransaction`; parse `localStorage.getItem("ebv_transactions")`; assert the entry is present with matching `name`, `amount`, `category`
    - `// Feature: expense-budget-visualizer, Property 1: Transaction add round-trip persists to LocalStorage`
    - **Validates: Requirements 2.3, 6.1**

  - [x] 2.7 Write property test for invalid input rejection (Property 2)
    - **Property 2: Whitespace-only or empty inputs are always rejected**
    - Generate whitespace-only strings and out-of-range numbers; call `State_addTransaction`; assert `AppState.transactions.length` unchanged
    - `// Feature: expense-budget-visualizer, Property 2: Whitespace-only or empty inputs are always rejected`
    - **Validates: Requirements 2.4, 2.5**

  - [x] 2.8 Write property test for `State_deleteTransaction` (Property 3)
    - **Property 3: Delete removes transaction from state and storage**
    - Populate list with generated transactions; delete a random one; assert absence in `AppState.transactions` and in parsed localStorage
    - `// Feature: expense-budget-visualizer, Property 3: Delete removes transaction from state and storage`
    - **Validates: Requirements 3.3, 6.2**

  - [x] 2.9 Write property test for sort immutability (Property 7)
    - **Property 7: Sort does not mutate stored data**
    - Add transactions; capture `localStorage.getItem("ebv_transactions")`; apply each sort key via `State_setSortKey` + `State_getSortedTransactions`; assert localStorage JSON is unchanged
    - `// Feature: expense-budget-visualizer, Property 7: Sort does not mutate stored data`
    - **Validates: Requirements 8.2**

  - [x] 2.10 Write property test for sort tiebreaker (Property 8)
    - **Property 8: Sort order is stable and respects tiebreaker**
    - Generate transactions with equal sort field values; assert `createdAt` descending order among tied pairs for every sort key
    - `// Feature: expense-budget-visualizer, Property 8: Sort order is stable and respects tiebreaker`
    - **Validates: Requirements 8.2**

  - [x] 2.11 Write property test for theme round-trip (Property 9)
    - **Property 9: Theme round-trip persists and restores correctly**
    - For each valid theme value, call `State_setTheme`; simulate reload by calling `State_load` on a fresh `AppState`; assert restored theme equals saved theme
    - `// Feature: expense-budget-visualizer, Property 9: Theme round-trip persists and restores correctly`
    - **Validates: Requirements 9.3, 9.4**

- [~] 3. Checkpoint — State module complete
  - Ensure all tests pass, ask the user if questions arise.

- [~] 4. Implement the Chart module (`js/chart.js`)
  - [x] 4.1 Implement `Chart_init(canvasId)`
    - Check `window.Chart` is defined; if not, hide the canvas and insert inline error message: *"Chart could not be loaded. Please check your internet connection."*
    - Create a `Chart` instance of type `"pie"` with empty initial data; store reference in module-level variable
    - _Requirements: 5.1, 5.5_

  - [-] 4.2 Implement `Chart_update(transactions)` with category aggregation
    - Filter to `amount > 0` only
    - Group by `category`; sum amounts per category
    - Compute percentages; update `chart.data.labels` and `chart.data.datasets[0].data` in place; call `chart.update()`
    - Assign distinct colors per category (at least 8 preset palette colors, cycling if more categories exist)
    - _Requirements: 5.1, 5.2, 5.3, 5.6, 5.7_

  - [ ] 4.3 Implement `Chart_showEmpty()`
    - Set datasets to empty; call `chart.update()` so no segments render
    - _Requirements: 5.4_

  - [ ] 4.4 Write property test for chart exclusion of non-positive amounts (Property 5)
    - **Property 5: Chart excludes non-positive amounts**
    - Mix positive and non-positive transactions; call the aggregation logic; assert totals include only `amount > 0` entries
    - `// Feature: expense-budget-visualizer, Property 5: Chart excludes non-positive amounts`
    - **Validates: Requirements 5.1, 5.7**

- [x] 5. Implement the UI module (`js/ui.js`)
  - [x] 5.1 Implement `UI_renderBalance(transactions)`
    - Sum all transaction amounts using `Math.round(value * 100) / 100`; format with `toFixed(2)` and a currency symbol
    - Display 0.00 when list is empty
    - Apply a visually distinct style (e.g., red class) when the total is negative
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 5.2 Implement `UI_renderTransactionList(transactions, onDelete)`
    - Rebuild `#transaction-section` list from the passed array
    - Each row shows: item name, formatted amount, category, date
    - Each row has a delete button that calls `onDelete(id)` when clicked
    - If array is empty, call `UI_showEmptyState()` with an appropriate message
    - _Requirements: 3.1, 3.2, 3.6_

  - [x] 5.3 Implement `UI_renderCategoryDropdown(categories)`
    - Rebuild the `<select>` inside `#input-section` from the categories array
    - _Requirements: 2.1, 2.2, 7.4_

  - [x] 5.4 Implement form feedback helpers: `UI_showFormError`, `UI_clearFormErrors`, `UI_showStorageWarning`, `UI_showEmptyState`
    - `UI_showFormError(fieldId, message)`: insert error `<span>` via `insertAdjacentElement('afterend', ...)` on the target field; move keyboard focus to the field
    - `UI_clearFormErrors()`: remove all existing error spans
    - `UI_showStorageWarning(message)`: display a one-time session banner at top of page
    - `UI_showEmptyState(containerId, message)`: insert placeholder text into the target container
    - _Requirements: 2.4, 2.5, 3.5, 3.6, 6.4, 6.5, 11.3_

  - [x] 5.5 Implement `UI_applyTheme(theme)` and `UI_setSortButtonState(activeKey)`
    - `UI_applyTheme(theme)`: toggle `data-theme` attribute on `<html>` (or `<body>`)
    - `UI_setSortButtonState(activeKey)`: mark the matching sort button as active; clear active state from all others
    - _Requirements: 8.1, 8.3, 9.1, 9.2_

  - [ ] 5.6 Write property test for balance calculation (Property 4)
    - **Property 4: Balance equals sum of all transaction amounts**
    - Generate lists of transactions with arbitrary amounts; assert that the value computed by the balance logic equals `amounts.reduce((s, a) => s + a, 0)` formatted to two decimal places
    - `// Feature: expense-budget-visualizer, Property 4: Balance equals sum of all transaction amounts`
    - **Validates: Requirements 4.1, 4.2, 4.3**

- [~] 6. Checkpoint — Core modules complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Implement the App Orchestrator (`js/app.js`)
  - [~] 7.1 Bootstrap: `State_load`, `Chart_init`, and initial full render
    - On `DOMContentLoaded`: call `State_load()`, call `Chart_init('spending-chart')`, then call `renderAll()` and `UI_applyTheme(AppState.theme)`, and populate the category dropdown
    - _Requirements: 3.4, 6.3, 9.4_

  - [~] 7.2 Implement `renderAll()` and wire add-transaction form
    - `renderAll()`: call `UI_renderBalance(AppState.transactions)`, `UI_renderTransactionList(State_getSortedTransactions(), handleDelete)`, `Chart_update(AppState.transactions)`, `UI_setSortButtonState(AppState.sortKey)`
    - Wire `#transaction-form` submit: call `UI_clearFormErrors()`, validate name and amount inline, call `State_addTransaction()`, reset form, call `renderAll()` and `UI_renderCategoryDropdown()`
    - _Requirements: 2.3, 2.4, 2.5, 2.6, 4.2, 5.2_

  - [~] 7.3 Wire delete, sort controls, and add-category form
    - Delete: event delegation on `#transaction-list` for delete buttons → `State_deleteTransaction(id)` → `renderAll()`
    - Sort: event delegation on `#sort-controls` → `State_setSortKey(key)` → `renderAll()`
    - Add category form submit: validate name, call `State_addCategory()`, call `UI_renderCategoryDropdown()`, reset field
    - _Requirements: 3.3, 7.2, 7.3, 8.1, 8.2, 8.3, 8.4, 8.5_

  - [~] 7.4 Wire theme toggle
    - `#theme-toggle` click: derive new theme, call `State_setTheme()`, call `UI_applyTheme()`
    - _Requirements: 9.1, 9.2, 9.3_

- [ ] 8. Implement CSS — base layout and theming (`css/style.css`)
  - [~] 8.1 Define CSS custom properties for light and dark themes
    - Use `[data-theme="dark"]` selector override pattern for dark-mode variables
    - Define variables for background, surface, text, accent, error, border colors
    - _Requirements: 9.1, 9.2, 11.1_

  - [~] 8.2 Style the five main sections and responsive layout
    - Apply distinct visual properties (background, font-size tier, whitespace) to each section so adjacent sections differ by at least two measurable properties
    - Use CSS Grid or Flexbox for the two-column layout (chart + transaction list side-by-side on wide viewports)
    - Media queries ensuring no horizontal scroll and no content clipping from 320 px to 2560 px
    - Minimum body text font size 14 px; heading hierarchy using the CSS font-size scale
    - _Requirements: 10.3, 11.1, 11.2_

  - [~] 8.3 Style interactive elements, form validation, and accessibility states
    - `:hover`, `:focus-visible`, `:active` styles on all buttons, the theme toggle, sort controls, and delete buttons
    - Error span styling (color, position adjacent to field)
    - WCAG AA contrast ratios: 4.5:1 for normal text, 3:1 for large/bold text — verify with browser dev tools
    - _Requirements: 2.4, 11.2, 11.3, 11.4_

  - [~] 8.4 Style the transaction list (scrollable container) and balance display
    - Set a `max-height` and `overflow-y: auto` on the transaction list container
    - Apply a visually distinct "negative balance" class (e.g., red text) for the balance display
    - _Requirements: 3.2, 4.5_

- [~] 9. Checkpoint — Full render cycle and UI complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Implement custom category feature end-to-end
  - [~] 10.1 Add the add-category sub-form to `index.html`
    - Text input (max 50 chars), submit button, and an inline error placeholder element inside `#input-section`
    - _Requirements: 7.1_

  - [~] 10.2 Verify category persistence and restore on load
    - Confirm `State_load()` restores custom categories into `AppState.categories` and `UI_renderCategoryDropdown()` reflects them
    - Verify the `ebv_categories` localStorage key is written on `State_addCategory()` and read on `State_load()`
    - _Requirements: 7.4_

  - [ ] 10.3 Write property test for category deduplication (Property 6)
    - **Property 6: Custom category deduplication is case-insensitive**
    - Generate pairs of strings differing only in letter case; call `State_addCategory` for both; assert second add is rejected and category list length is unchanged
    - `// Feature: expense-budget-visualizer, Property 6: Custom category deduplication is case-insensitive`
    - **Validates: Requirements 7.2, 7.3**

- [~] 11. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP.
- Each task references specific requirements for traceability.
- Property tests use **fast-check** with a minimum of 100 iterations; tag each with `// Feature: expense-budget-visualizer, Property N: <title>`.
- Unit tests use **Jest** with `jsdom` for DOM-dependent functions.
- Checkpoints at tasks 3, 6, 9, and 11 provide incremental validation gates.
- Chart.js is loaded without `defer` so `window.Chart` is defined before deferred app scripts run.
- All monetary arithmetic uses `Math.round(value * 100) / 100` to avoid floating-point drift.
- The sort key is session-only — never written to localStorage.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1"] },
    { "id": 1, "tasks": ["2.2", "2.3", "2.4", "2.5"] },
    { "id": 2, "tasks": ["2.6", "2.7", "2.8", "2.9", "2.10", "2.11", "4.1", "5.1", "5.2", "5.3", "5.4", "5.5"] },
    { "id": 3, "tasks": ["4.2", "4.3", "4.4", "5.6"] },
    { "id": 4, "tasks": ["7.1", "8.1", "8.2"] },
    { "id": 5, "tasks": ["7.2", "7.3", "7.4", "8.3", "8.4"] },
    { "id": 6, "tasks": ["10.1", "10.2"] },
    { "id": 7, "tasks": ["10.3"] }
  ]
}
```
