# Expense & Budget Visualizer

A responsive, client-side expense tracking web application built for the CodingCamp Software Engineering Fundamentals assignment.

## Features

### Required MVP
- Add expenses with an item name, amount, and category.
- Default categories: Food, Transport, and Fun.
- Inline form validation.
- View and delete transactions.
- View total recorded spending.
- View spending distribution in a pie chart.
- Persist transactions in browser Local Storage.

### Selected optional challenges
1. **Sort transactions** — newest first, amount high-to-low, amount low-to-high, and category.
2. **Spending limit** — configure a spending threshold and view progress/overspending status.
3. **Dark/Light mode** — switch themes; the preference is saved in Local Storage.

## Technology

- HTML5
- CSS3
- Vanilla JavaScript
- Chart.js 4 (loaded from CDN)
- Browser Local Storage API

No frontend framework, backend server, package manager, or build step is required.

## Project Structure

```text
.
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

The project intentionally contains one CSS file in `css/` and one JavaScript file in `js/`.

## Run Locally

1. Download or clone this repository.
2. Open `index.html` in a modern web browser.
3. Internet access is needed to load Chart.js and Google Fonts from their CDNs.

No installation command is required.

## Data Storage

The app stores data in the browser's Local Storage under these keys:

- `ebv.transactions`
- `ebv.limit`
- `ebv.theme`
- `ebv.sort`

Data is stored locally in the browser profile. It is not synchronized between devices or browsers.

## Deployment

The project can be published using GitHub Pages:

1. Open the repository's **Settings**.
2. Select **Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select branch `main` and folder `/ (root)`.
5. Save and wait for GitHub Pages to finish deployment.

## Scope Notes

- The app uses only the three default categories; custom categories are not implemented.
- Transaction rows show item name, amount, and category.
- The displayed “Total balance” is the sum of recorded expenses.
