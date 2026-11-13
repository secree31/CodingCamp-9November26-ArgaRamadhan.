# Requirements Document

## Introduction

The Expense & Budget Visualizer is a client-side web application that allows users to track personal spending by logging transactions, viewing a categorized breakdown via a pie chart, and monitoring their total balance — all without a backend server. The application stores all data in the browser's Local Storage and is built using HTML, CSS, and Vanilla JavaScript only.

Three optional challenges are included in scope: (1) custom categories, (2) sort transactions by amount or category, and (3) dark/light mode toggle.

## Glossary

- **App**: The Expense & Budget Visualizer web application.
- **Transaction**: A single expense entry consisting of an item name, an amount, and a category.
- **Category**: A label that classifies a transaction (e.g., Food, Transport, Fun, or a user-defined custom category).
- **Balance**: The running total calculated as the sum of all transaction amounts currently stored.
- **Chart**: The pie chart that displays the spending distribution grouped by category.
- **LocalStorage**: The browser's Web Storage API used to persist transaction data client-side.
- **Transaction_List**: The scrollable UI component that renders all stored transactions.
- **Input_Form**: The UI form component through which the user submits new transactions.
- **Theme**: The visual color scheme of the App (light or dark mode).
- **Spending_Limit**: A user-configurable threshold amount used to flag overspending per category.

---

## Requirements

### Requirement 1: Project Structure and Technology Stack

**User Story:** As a developer, I want the app to use only HTML, CSS, and Vanilla JavaScript so that there are no framework dependencies and the app is easy to open in any browser.

#### Acceptance Criteria

1. THE App SHALL be implemented using only HTML, CSS, and Vanilla JavaScript — no frontend frameworks (React, Vue, Angular, etc.) are permitted.
2. THE App SHALL contain exactly one CSS file located inside a `css/` directory.
3. THE App SHALL contain exactly one JavaScript file located inside a `js/` directory.
4. THE App SHALL provide an `index.html` file at the project root that serves as the entry point and can be opened directly in a browser without a build step or server.
5. THE App SHALL be compatible with the latest stable releases of Chrome, Firefox, Edge, and Safari within 2 years prior to development, meaning all features render correctly, no uncaught JavaScript errors occur, and behavior is identical across all four browsers.

---

### Requirement 2: Transaction Input Form

**User Story:** As a user, I want to fill in a form with an item name, amount, and category so that I can log a new expense transaction.

#### Acceptance Criteria

1. THE Input_Form SHALL provide a text field for the item name (up to 100 characters), a numeric field for the amount (between 0.01 and 999,999,999.99), and a dropdown selector for the category.
2. THE Input_Form SHALL include the default categories: Food, Transport, and Fun.
3. WHEN the user submits the Input_Form with all fields filled and valid, THE App SHALL add the transaction to the Transaction_List and persist it to LocalStorage.
4. WHEN the user submits the Input_Form with one or more empty or whitespace-only fields, THE App SHALL display a validation error message adjacent to each offending field and SHALL NOT add the transaction.
5. WHEN the user submits the Input_Form with an amount value that is not a positive number or exceeds 999,999,999.99, THE App SHALL display a validation error message adjacent to the amount field and SHALL NOT add the transaction.
6. WHEN a transaction is successfully added, THE Input_Form SHALL reset the item name field to empty and reset the category dropdown to its first default option (Food).

---

### Requirement 3: Transaction List

**User Story:** As a user, I want to see a scrollable list of all my transactions so that I can review my spending history.

#### Acceptance Criteria

1. THE Transaction_List SHALL display all stored transactions in descending order by date added, each showing the item name, amount, category, and date.
2. THE Transaction_List SHALL be scrollable when the number of transactions exceeds the visible area of the transaction list container.
3. WHEN the user clicks the delete control on a transaction entry, THE App SHALL remove that transaction entry from the Transaction_List, delete it from LocalStorage, and recalculate the total balance.
4. WHEN LocalStorage contains transactions from a previous session, THE App SHALL load and display them in the Transaction_List on page load in descending order by date added.
5. IF LocalStorage contains malformed or corrupt transaction data at initialization, THEN THE App SHALL discard the malformed entries, display only valid transactions, and show a warning message to the user.
6. IF no transactions exist, THEN THE Transaction_List SHALL display an empty-state message indicating that no transactions have been added.

---

### Requirement 4: Total Balance Display

**User Story:** As a user, I want to see my total balance update automatically so that I always know the current sum of my expenses.

#### Acceptance Criteria

1. THE App SHALL display the total balance — formatted to two decimal places with a currency symbol — in a visually distinct section at the top of the page above the transaction list.
2. WHEN a transaction is added, THE App SHALL recalculate and update the displayed total balance without requiring a page reload.
3. WHEN a transaction is deleted, THE App SHALL recalculate and update the displayed total balance without requiring a page reload.
4. IF no transactions exist, THEN THE App SHALL display a total balance of 0.00.
5. IF the net total balance is negative, THEN THE App SHALL apply a visually distinct style (e.g., red color) to the balance display to indicate overspending.

---

### Requirement 5: Spending Distribution Chart

**User Story:** As a user, I want to see a pie chart of my spending by category so that I can understand where my money is going.

#### Acceptance Criteria

1. THE App SHALL render a pie chart where each segment's size represents a category's total transaction amount as a percentage of the sum of all transaction amounts.
2. WHEN a transaction is added, THE Chart SHALL update automatically to reflect the new spending distribution.
3. WHEN a transaction is deleted, THE Chart SHALL update automatically to reflect the revised spending distribution.
4. IF no transactions exist, THEN THE Chart SHALL display a message stating that no spending data is available, with no segments rendered.
5. THE Chart SHALL use a charting library loaded via CDN; no local bundler is required.
6. WHEN multiple transactions share the same category, THE Chart SHALL aggregate their amounts by summing them into a single segment for that category.
7. IF a transaction has a zero or negative amount, THEN THE App SHALL exclude that transaction from the chart calculation.

---

### Requirement 6: Data Persistence via Local Storage

**User Story:** As a user, I want my transactions to be saved in the browser so that my data is not lost when I close or refresh the page.

#### Acceptance Criteria

1. WHEN a transaction is added, THE App SHALL write the updated transaction list to LocalStorage before the next user interaction is processed.
2. WHEN a transaction is deleted, THE App SHALL write the updated transaction list to LocalStorage before the next user interaction is processed.
3. WHEN the App initializes and LocalStorage contains a valid transaction list, THE App SHALL read all transactions from LocalStorage and restore the Transaction_List, Balance, and Chart to reflect the stored data.
4. IF LocalStorage is unavailable or throws an error, THEN THE App SHALL display a warning message informing the user that data will not be saved.
5. IF LocalStorage contains corrupt or malformed transaction data at initialization, THEN THE App SHALL discard the bad data, start with an empty transaction list, and display a warning message to the user.

---

### Requirement 7: Custom Categories

**User Story:** As a user, I want to create my own expense categories so that I can track spending in areas beyond the default options.

#### Acceptance Criteria

1. THE Input_Form SHALL provide a text input field and a submit control for the user to add a new custom category name of up to 50 characters.
2. WHEN the user submits a custom category name that is non-empty, does not exceed 50 characters, and is not a duplicate of an existing category name (comparison is case-insensitive), THE App SHALL add it to the category dropdown and persist it to LocalStorage.
3. WHEN the user submits a custom category name that is empty, exceeds 50 characters, or matches an existing category name (case-insensitive), THE App SHALL display a validation error message inline near the category input field and SHALL NOT add the entry to the category list.
4. WHEN the App initializes, THE App SHALL restore all previously added custom categories from LocalStorage so they appear in the category dropdown.
5. WHEN the user attempts to delete a custom category that is referenced by one or more existing transactions, THE App SHALL retain that category in the dropdown and SHALL NOT remove it.

---

### Requirement 8: Sort Transactions

**User Story:** As a user, I want to sort my transaction list by amount or category so that I can find and analyze my expenses more easily.

#### Acceptance Criteria

1. THE Transaction_List SHALL provide sort controls with the following options: amount ascending, amount descending, category name A–Z, and category name Z–A, with no sort option selected by default (default display order is insertion order, most recent first).
2. WHEN the user selects a sort option, THE Transaction_List SHALL re-render with transactions ordered according to the selected sort criteria without modifying the underlying stored data in LocalStorage; if two transactions have equal sort values, they SHALL be ordered by date descending as a tiebreaker.
3. WHEN the user selects the currently active sort option, THE Transaction_List SHALL deactivate that sort and revert the display to the default insertion order (most recent first).
4. WHEN a new transaction is added while a sort is active, THE Transaction_List SHALL display the updated list in the currently active sort order.
5. WHEN a transaction is deleted while a sort is active, THE Transaction_List SHALL display the remaining transactions in the currently active sort order.

---

### Requirement 9: Dark / Light Mode Toggle

**User Story:** As a user, I want to switch between dark and light mode so that I can use the app comfortably in different lighting conditions.

#### Acceptance Criteria

1. THE App SHALL provide a toggle control that switches the Theme between light mode and dark mode.
2. WHEN the user activates the toggle, THE App SHALL apply the selected Theme to all visible UI components within 100 milliseconds without a page reload.
3. WHEN the user sets a Theme preference, THE App SHALL persist the preference to LocalStorage.
4. WHEN the App initializes, THE App SHALL restore the user's previously saved Theme preference from LocalStorage; IF no preference is saved, THEN THE App SHALL default to light mode.
5. IF LocalStorage is unavailable when the App initializes or when a Theme preference is being saved, THEN THE App SHALL default to light mode for the current session.

---

### Requirement 10: Performance and Responsiveness

**User Story:** As a user, I want the app to feel fast and responsive so that adding or deleting transactions never feels sluggish.

#### Acceptance Criteria

1. WHEN the user loads the App on an unthrottled connection, THE App SHALL render the initial page, including the Transaction_List and Chart, within 2 seconds.
2. WHEN the user adds or deletes a transaction, THE App SHALL update the Transaction_List, Balance, and Chart within 300 milliseconds.
3. THE App SHALL remain usable on viewport widths from 320px to 2560px by adapting layout through responsive CSS, with no horizontal scrolling and no content clipping at any supported width.

---

### Requirement 11: Visual Design and Usability

**User Story:** As a user, I want a clean, readable interface so that I can use the app without confusion or visual clutter.

#### Acceptance Criteria

1. THE App SHALL apply a consistent design such that each major section (Balance display, Input_Form, Chart, and Transaction_List) differs from adjacent sections by at least two measurable visual properties (font size tier, background color, or whitespace margin).
2. THE App SHALL use a minimum body text font size of 14px and color contrast ratios meeting WCAG AA standards (4.5:1 for normal text, 3:1 for large or bold text).
3. THE App SHALL display form validation error messages adjacent to the relevant field so users understand which input requires correction.
4. THE App SHALL provide hover, keyboard focus indicator, and active/pressed visual states on all interactive elements including buttons, dropdowns, and delete controls.
