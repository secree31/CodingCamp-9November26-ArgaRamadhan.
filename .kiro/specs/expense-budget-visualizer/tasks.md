## Implementation Tasks and Verification

This checklist describes the implementation currently present in the repository. A checked item means the corresponding code or documentation is present; it does not mean that automated cross-browser testing has been performed.

## 1. Project setup

- [x] Create the root `index.html`.
- [x] Keep exactly one stylesheet in `css/style.css`.
- [x] Keep exactly one JavaScript file in `js/script.js`.
- [x] Use HTML, CSS, and Vanilla JavaScript without a frontend framework.
- [x] Load Chart.js from a CDN.
- [x] Create the Kiro specification files.

## 2. Required MVP

- [x] Provide an item name field.
- [x] Provide an amount field.
- [x] Provide Food, Transport, and Fun category options.
- [x] Validate required fields.
- [x] Validate item name length (maximum 100 characters).
- [x] Validate amount range (0.01 to 999,999,999.99).
- [x] Add valid transactions to the list.
- [x] Save transactions to Local Storage.
- [x] Display transaction name, amount, and category.
- [x] Allow transactions to be deleted.
- [x] Display and recalculate total spending.
- [x] Display a pie chart grouped by the default categories.
- [x] Update the chart when transactions are added or deleted.
- [x] Show empty states for an empty transaction list and chart.

## 3. Selected optional challenges

- [x] Sort transactions by newest, amount descending, amount ascending, or category.
- [x] Configure a spending limit and display progress/overspending status.
- [x] Toggle between dark and light themes and persist the preference.

## 4. Documentation

- [x] Align `requirements.md` with the actual features.
- [x] Align `design.md` with the actual single-file JavaScript architecture.
- [x] Document the implemented features and project constraints in `README.md`.
- [x] Record known scope boundaries rather than documenting unimplemented functionality.

## 5. Manual verification to perform before submission

- [x] Open `index.html` in a browser and confirm the page loads.
- [x] Add a valid transaction and confirm the total, list, and chart update.
- [x] Try an empty name and confirm validation appears.
- [x] Try an amount below 0.01 and above 999,999,999.99 and confirm validation appears.
- [x] Delete a transaction and confirm the total and chart update.
- [x] Refresh the page and confirm transactions remain available.
- [x] Test all four sort options.
- [x] Set a spending limit and confirm the progress indicator updates.
- [x] Toggle dark/light mode and refresh to confirm the preference persists.
- [x] Check the layout at mobile and desktop widths.
- [x] Confirm GitHub Pages deployment loads the published website.

## 6. Submission preparation

- [x] Confirm `.kiro/` is included in the GitHub repository.
- [x] Confirm the source code is pushed to the required GitHub repository.
- [x] Enable GitHub Pages from the `main` branch and `/` (root).
- [x] Prepare the GitHub repository URL and published website URL for the submission form.
- [x] Provide the AWS Builder ID as required by the assignment.
