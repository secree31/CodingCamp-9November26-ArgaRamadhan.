## Requirements Document

## 1. Project Overview

**Expense & Budget Visualizer** is a mobile-friendly, client-side web application for recording daily expenses. Users can add transactions, review their transaction history, see total spending, and view spending distribution by category.

The application is implemented with HTML, CSS, and Vanilla JavaScript. It does not require a backend server. Transaction data and user preferences are stored in the browser's Local Storage.

## 2. Technology and Project Constraints

- HTML5 for page structure.
- CSS3 for styling and responsive layout.
- Vanilla JavaScript for application behavior.
- Chart.js loaded from a CDN for the pie chart.
- Browser Local Storage for client-side persistence.
- No frontend frameworks (React, Vue, Angular, etc.).
- No backend server or build step is required.
- Exactly one CSS file in `css/` and exactly one JavaScript file in `js/`.

## 3. Required MVP Features

### 3.1 Transaction Input Form

The form provides:
- Item Name.
- Amount.
- Category with the default options Food, Transport, and Fun.
- An Add Transaction button.

Validation rules:
- Item name must not be empty after trimming whitespace.
- Item name must not exceed 100 characters.
- Amount must be a valid number from 0.01 through 999,999,999.99.
- A category must be selected from the available default categories.
- Invalid submissions show an inline message and do not create a transaction.

When a valid transaction is submitted, it is added to the transaction list, saved to Local Storage, and the form is reset.

### 3.2 Transaction List

- Display saved transactions.
- Show the item name, amount, and category.
- Provide a delete control for each transaction.
- Use a scrollable transaction list.
- Show an empty-state message when there are no transactions.
- Restore valid saved transactions when the page is reopened.

### 3.3 Total Spending

- Display the total of all recorded transaction amounts near the top of the page.
- Recalculate the total after a transaction is added or deleted.
- Display zero when there are no transactions.

**Implementation note:** The interface labels this value “Total balance”, but the calculation is the sum of recorded expense amounts. It is not an account balance after income.

### 3.4 Spending Distribution Chart

- Display a pie chart using Chart.js.
- Group and sum transaction amounts by category.
- Update the chart after transactions are added or deleted.
- Show an empty-state message when there is no spending data.
- Display a fallback message if Chart.js cannot be loaded.

## 4. Implemented Optional Challenges

The project implements these three optional challenges from the assignment brief:

### 4.1 Sort Transactions

Available sort options:
- Newest first (default).
- Amount: high to low.
- Amount: low to high.
- Category (A–Z).

Sorting changes the displayed order and does not change the underlying transaction data.

### 4.2 Spending Limit

- The user can enter a spending limit.
- The app compares total recorded spending with the configured limit.
- A progress indicator shows spending against the limit.
- The interface highlights the state when spending exceeds the limit.
- The configured limit is saved in Local Storage.

### 4.3 Dark/Light Mode

- A button switches between dark and light themes.
- The selected theme is saved in Local Storage.
- If no theme preference is saved, the app may use the operating system color preference.

## 5. Data Persistence

The app stores the following values in Local Storage:
- `ebv.transactions`: transaction records.
- `ebv.limit`: configured spending limit.
- `ebv.theme`: selected theme.
- `ebv.sort`: selected transaction sort order.

Local Storage access is wrapped in defensive helper functions so the app can continue operating in memory if storage access fails.

## 6. User Interface and Compatibility

- Use a clean, minimal, readable interface.
- Support mobile and desktop viewport sizes.
- Use semantic HTML elements and visible form labels.
- Provide inline validation feedback.
- Target modern versions of Chrome, Firefox, Edge, and Safari.

## 7. Project Structure

```text
project-root/
├── .kiro/
│   └── specs/
│       └── expense-budget-visualizer/
│           ├── requirements.md
│           ├── design.md
│           ├── tasks.md
│           ├── tasks.meta.json
│           └── .config.kiro
├── css/
│   └── style.css
├── js/
│   └── script.js
├── index.html
└── README.md
```

The `.git/` directory is local Git metadata. It is not required in a source-code ZIP archive; GitHub maintains repository history separately.
