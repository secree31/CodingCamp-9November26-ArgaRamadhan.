## Design Document

## 1. Overview

Expense & Budget Visualizer is a single-page, client-side web application. It runs directly in a modern browser and uses no build tool, package manager, frontend framework, or backend server.

The implementation intentionally uses one HTML entry point, one stylesheet, and one JavaScript file to comply with the assignment's folder rules.

## 2. Actual Project Architecture

```text
User interaction
      |
      v
Event listeners in js/script.js
      |
      v
In-memory state
(transactions, limit, sort)
      |
      +------> Local Storage persistence
      |
      v
Render functions
      |
      +------> Total spending
      +------> Spending limit indicator
      +------> Transaction list
      +------> Chart.js pie chart
      +------> Theme styling
```

### Files

- `index.html`: page structure, form fields, transaction list container, chart canvas, and CDN/script references.
- `css/style.css`: all visual styling, responsive layout, and light/dark theme variables.
- `js/script.js`: application state, Local Storage helpers, validation, calculations, rendering, event listeners, sorting, spending limit, theme toggle, and Chart.js updates.

There is exactly one CSS file in `css/` and one JavaScript file in `js/`.

## 3. State and Local Storage

The JavaScript keeps an in-memory state object with:
- `transactions`: array of valid transaction objects.
- `limit`: configured spending limit or `null`.
- `sort`: active sort key.

The app uses these Local Storage keys:
- `ebv.transactions`
- `ebv.limit`
- `ebv.theme`
- `ebv.sort`

Each transaction contains:
- `id`: generated unique identifier.
- `name`: trimmed item name.
- `amount`: numeric amount rounded to two decimal places.
- `category`: one of Food, Transport, or Fun.
- `createdAt`: timestamp in milliseconds.

Storage reads and writes are wrapped in `try/catch` helpers. Invalid transaction entries are filtered during initialization.

## 4. Page Components

### 4.1 Header

Contains the application title and the Dark mode / Light mode toggle.

### 4.2 Total Spending and Spending Limit Card

Displays:
- Total spending amount.
- Spending progress meter.
- Spending limit status.
- Numeric spending limit input.

The displayed total is the sum of transaction amounts. The progress meter and status update when transactions or the limit change.

### 4.3 Transaction Form

Contains:
- Item name text input (maximum 100 characters).
- Amount numeric input (0.01 to 999,999,999.99; two decimal places).
- Category selector (Food, Transport, Fun).
- Submit button.
- Inline validation messages.

### 4.4 Transaction List

Displays each transaction's name, amount, and category. Each row has a Delete button. The list supports the following sort options:
- Newest first.
- Amount high to low.
- Amount low to high.
- Category A–Z.

### 4.5 Spending Chart

Uses a Chart.js pie chart to visualize the sum of spending in Food, Transport, and Fun. The chart is updated when transactions change. An empty state is shown when no transaction amounts are available.

## 5. User Interaction Flows

### Add transaction
1. User enters a name, amount, and category.
2. The submit handler validates all fields.
3. If validation fails, inline errors are displayed and no transaction is added.
4. If validation succeeds, a transaction is added to state and saved.
5. The form is reset.
6. The total, spending limit indicator, transaction list, and chart are rendered again.

### Delete transaction
1. User selects Delete on a transaction row.
2. The transaction is removed from the in-memory array.
3. The updated array is saved to Local Storage.
4. The total, spending limit indicator, transaction list, and chart are rendered again.

### Sort transactions
1. User selects a sort option.
2. The selected key is saved.
3. The transaction list is rendered in the selected order.
4. The underlying transaction array is not modified by sorting.

### Set spending limit
1. User enters a positive limit.
2. The value is saved to Local Storage.
3. The progress meter and status are recalculated.

### Toggle theme
1. User activates the theme button.
2. The root element receives the selected `data-theme` attribute.
3. The preference is saved to Local Storage.
4. Chart colors are refreshed to match the active theme.

## 6. Chart Design

Chart.js is loaded from the CDN in `index.html`. The chart type is `pie`. It uses the three fixed categories and their corresponding colors:
- Food: green.
- Transport: blue.
- Fun: orange.

Category totals are calculated from the current transaction array. The chart is hidden and the empty-state message is shown when all category totals are zero.

## 7. Responsive and Visual Design

The stylesheet uses CSS custom properties for:
- Page background.
- Card surface.
- Main and muted text.
- Borders.
- Accent and danger colors.
- Chart/category colors.

The dark theme overrides the root design tokens through `:root[data-theme="dark"]`. The layout uses flexible sizing and a responsive grid so the app can be used on narrow and wide screens.

## 8. Known Scope Boundaries

- The current application does not implement custom user-defined categories.
- The current transaction list displays name, amount, and category; it does not display a date.
- The current chart uses the three default categories only.
- The app is client-side only; Local Storage data is browser/device-specific.
- Chart.js and Google Fonts are external CDN resources, so those resources require an internet connection.
