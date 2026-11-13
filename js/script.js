/* ==========================================================
  Expense & Budget Visualizer
  Vanilla JS. All data is stored in the browser's Local Storage.
   ========================================================== */

(function () {
  'use strict';

  // ---------- Constants ----------

  var STORAGE = {
    transactions: 'ebv.transactions',
    limit: 'ebv.limit',
    theme: 'ebv.theme',
    sort: 'ebv.sort'
  };

  var CATEGORIES = ['Food', 'Transport', 'Fun'];
  var CATEGORY_COLORS = {
    Food: '#1fa971',
    Transport: '#2b59ff',
    Fun: '#f08a24'
  };

  var currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

  // ---------- Element references ----------

  var els = {
    balanceCard: document.getElementById('balance-card'),
    total: document.getElementById('total-balance'),
    limitInput: document.getElementById('limit-input'),
    limitMeter: document.getElementById('limit-meter'),
    limitFill: document.getElementById('limit-fill'),
    limitStatus: document.getElementById('limit-status'),
    form: document.getElementById('transaction-form'),
    name: document.getElementById('item-name'),
    amount: document.getElementById('item-amount'),
    category: document.getElementById('item-category'),
    nameError: document.getElementById('name-error'),
    amountError: document.getElementById('amount-error'),
    categoryError: document.getElementById('category-error'),
    sort: document.getElementById('sort-select'),
    list: document.getElementById('transaction-list'),
    listEmpty: document.getElementById('list-empty'),
    canvas: document.getElementById('category-chart'),
    chartEmpty: document.getElementById('chart-empty'),
    themeToggle: document.getElementById('theme-toggle')
  };

  // ---------- State ----------

  var state = {
    transactions: load(STORAGE.transactions, []),
    limit: load(STORAGE.limit, null),
    sort: load(STORAGE.sort, 'newest')
  };

  var chart = null;

  // ---------- Storage helpers ----------

  function load(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  function save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      /* Storage may be unavailable (private mode); the app still works in memory. */
    }
  }

  // Drop anything malformed that might have been stored earlier.
  state.transactions = Array.isArray(state.transactions)
    ? state.transactions.filter(function (t) {
        return t && typeof t.name === 'string' &&
          typeof t.amount === 'number' && isFinite(t.amount) &&
          CATEGORIES.indexOf(t.category) !== -1;
      })
    : [];

  // ---------- Calculations ----------

  function getTotal() {
    return state.transactions.reduce(function (sum, t) { return sum + t.amount; }, 0);
  }

  function getCategoryTotals() {
    return CATEGORIES.map(function (c) {
      return state.transactions
        .filter(function (t) { return t.category === c; })
        .reduce(function (sum, t) { return sum + t.amount; }, 0);
    });
  }

  function getSorted() {
    var items = state.transactions.slice();
    switch (state.sort) {
      case 'amount-desc':
        items.sort(function (a, b) { return b.amount - a.amount; });
        break;
      case 'amount-asc':
        items.sort(function (a, b) { return a.amount - b.amount; });
        break;
      case 'category':
        items.sort(function (a, b) {
          return a.category.localeCompare(b.category) || b.createdAt - a.createdAt;
        });
        break;
      default: // newest first
        items.sort(function (a, b) { return b.createdAt - a.createdAt; });
    }
    return items;
  }

  // ---------- Rendering ----------

  function render() {
    renderTotal();
    renderLimit();
    renderList();
    renderChart();
  }

  function renderTotal() {
    els.total.textContent = currency.format(getTotal());
  }

  function renderLimit() {
    var total = getTotal();
    var limit = state.limit;
    var hasLimit = typeof limit === 'number' && limit > 0;
    var over = hasLimit && total > limit;

    els.balanceCard.classList.toggle('over', over);

    if (!hasLimit) {
      els.limitFill.style.width = '0%';
      els.limitMeter.setAttribute('aria-valuenow', '0');
      els.limitStatus.textContent = 'No spending limit set';
      return;
    }

    var percent = Math.min(100, (total / limit) * 100);
    els.limitFill.style.width = percent + '%';
    els.limitMeter.setAttribute('aria-valuenow', String(Math.round(percent)));

    if (over) {
      els.limitStatus.textContent =
        currency.format(total - limit) + ' over your ' + currency.format(limit) + ' limit';
    } else {
      els.limitStatus.textContent =
        currency.format(total) + ' of ' + currency.format(limit) + ' limit (' +
        currency.format(limit - total) + ' left)';
    }
  }

  function renderList() {
    var items = getSorted();
    els.list.textContent = '';
    els.listEmpty.hidden = items.length > 0;

    items.forEach(function (t) {
      var li = document.createElement('li');
      li.className = 'tx-item';

      var info = document.createElement('div');
      info.className = 'tx-info';

      var name = document.createElement('p');
      name.className = 'tx-name';
      name.textContent = t.name;

      var amount = document.createElement('p');
      amount.className = 'tx-amount';
      amount.textContent = currency.format(t.amount);

      var chip = document.createElement('span');
      chip.className = 'chip';
      chip.dataset.category = t.category;
      chip.textContent = t.category;

      info.appendChild(name);
      info.appendChild(amount);
      info.appendChild(chip);

      var del = document.createElement('button');
      del.type = 'button';
      del.className = 'btn btn-delete';
      del.dataset.id = t.id;
      del.textContent = 'Delete';
      del.setAttribute('aria-label', 'Delete ' + t.name);

      li.appendChild(info);
      li.appendChild(del);
      els.list.appendChild(li);
    });
  }

  function renderChart() {
    var data = getCategoryTotals();
    var hasData = data.some(function (v) { return v > 0; });

    els.canvas.hidden = !hasData;
    els.chartEmpty.hidden = hasData;

    if (typeof Chart === 'undefined') {
      els.chartEmpty.hidden = false;
      els.chartEmpty.textContent = 'The chart could not load. Check your internet connection.';
      return;
    }

    if (!hasData) {
      return;
    }

    if (!chart) {
      chart = new Chart(els.canvas, {
        type: 'pie',
        data: {
          labels: CATEGORIES,
          datasets: [{
            data: data,
            backgroundColor: CATEGORIES.map(function (c) { return CATEGORY_COLORS[c]; }),
            borderColor: cssVar('--surface'),
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: cssVar('--ink'), usePointStyle: true, padding: 16 }
            },
            tooltip: {
              callbacks: {
                label: function (ctx) {
                  var sum = ctx.dataset.data.reduce(function (a, b) { return a + b; }, 0);
                  var pct = sum ? Math.round((ctx.parsed / sum) * 100) : 0;
                  return ' ' + ctx.label + ': ' + currency.format(ctx.parsed) + ' (' + pct + '%)';
                }
              }
            }
          }
        }
      });
    } else {
      chart.data.datasets[0].data = data;
      chart.resize();
      chart.update();
    }
  }

  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  // ---------- Form handling ----------

  function setError(input, errorEl, message) {
    errorEl.textContent = message;
    if (message) {
      input.setAttribute('aria-invalid', 'true');
    } else {
      input.removeAttribute('aria-invalid');
    }
  }

  function validate() {
    var nameValue = els.name.value.trim();
    var amountValue = parseFloat(els.amount.value);
    var categoryValue = els.category.value;
    var valid = true;

    if (!nameValue) {
      setError(els.name, els.nameError, 'Enter an item name.');
      valid = false;
    } else {
      setError(els.name, els.nameError, '');
    }

    if (els.amount.value === '' || isNaN(amountValue)) {
      setError(els.amount, els.amountError, 'Enter an amount.');
      valid = false;
    } else if (amountValue <= 0) {
      setError(els.amount, els.amountError, 'Amount must be greater than 0.');
      valid = false;
    } else {
      setError(els.amount, els.amountError, '');
    }

    if (CATEGORIES.indexOf(categoryValue) === -1) {
      setError(els.category, els.categoryError, 'Choose a category.');
      valid = false;
    } else {
      setError(els.category, els.categoryError, '');
    }

    return valid ? { name: nameValue, amount: amountValue, category: categoryValue } : null;
  }

  els.form.addEventListener('submit', function (event) {
    event.preventDefault();
    var values = validate();
    if (!values) {
      return;
    }

    state.transactions.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      name: values.name,
      amount: Math.round(values.amount * 100) / 100,
      category: values.category,
      createdAt: Date.now()
    });
    save(STORAGE.transactions, state.transactions);

    els.form.reset();
    els.name.focus();
    render();
  });

  // Clear an error as soon as the person starts fixing it.
  els.name.addEventListener('input', function () { setError(els.name, els.nameError, ''); });
  els.amount.addEventListener('input', function () { setError(els.amount, els.amountError, ''); });
  els.category.addEventListener('change', function () { setError(els.category, els.categoryError, ''); });

  // ---------- Delete ----------

  els.list.addEventListener('click', function (event) {
    var button = event.target.closest('.btn-delete');
    if (!button) {
      return;
    }
    var id = button.dataset.id;
    state.transactions = state.transactions.filter(function (t) { return t.id !== id; });
    save(STORAGE.transactions, state.transactions);
    render();
  });

  // ---------- Optional challenge: sort transactions ----------

  els.sort.value = state.sort;
  els.sort.addEventListener('change', function () {
    state.sort = els.sort.value;
    save(STORAGE.sort, state.sort);
    renderList();
  });

  // ---------- Optional challenge: spending limit ----------

  if (typeof state.limit === 'number' && state.limit > 0) {
    els.limitInput.value = state.limit;
  } else {
    state.limit = null;
  }

  els.limitInput.addEventListener('input', function () {
    var value = parseFloat(els.limitInput.value);
    state.limit = !isNaN(value) && value > 0 ? value : null;
    save(STORAGE.limit, state.limit);
    renderLimit();
  });

  // ---------- Optional challenge: dark / light mode ----------

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    els.themeToggle.textContent = theme === 'dark' ? 'Light mode' : 'Dark mode';
    els.themeToggle.setAttribute('aria-pressed', String(theme === 'dark'));

    if (chart) {
      chart.data.datasets[0].borderColor = cssVar('--surface');
      chart.options.plugins.legend.labels.color = cssVar('--ink');
      chart.update();
    }
  }

  var savedTheme = load(STORAGE.theme, null);
  var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(savedTheme || (prefersDark ? 'dark' : 'light'));

  els.themeToggle.addEventListener('click', function () {
    var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    save(STORAGE.theme, next);
    applyTheme(next);
  });

  // ---------- Start ----------

  render();
})();
