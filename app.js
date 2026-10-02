const STORAGE_KEY = 'bangla-income-expense-tracker-v1';

const sampleEntries = [
  {
    id: crypto.randomUUID(),
    type: 'income',
    category: 'বেতন',
    amount: 42000,
    date: currentDateISO(),
    note: 'সেপ্টেম্বর বেতন'
  },
  {
    id: crypto.randomUUID(),
    type: 'expense',
    category: 'খাদ্য',
    amount: 6500,
    date: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10),
    note: 'বাজার খরচ'
  },
  {
    id: crypto.randomUUID(),
    type: 'expense',
    category: 'ভাড়া',
    amount: 18000,
    date: new Date(Date.now() - 5 * 86400000).toISOString().slice(0, 10),
    note: 'ফ্ল্যাট ভাড়া'
  }
];

const monthFilter = document.getElementById('monthFilter');
const entriesBody = document.getElementById('entriesBody');
const totalIncomeEl = document.getElementById('totalIncome');
const totalExpenseEl = document.getElementById('totalExpense');
const balanceAmountEl = document.getElementById('balanceAmount');
const entryForm = document.getElementById('entryForm');
const resetDataBtn = document.getElementById('resetDataBtn');

let entries = loadEntries();

function currentDateISO() {
  return new Date().toISOString().slice(0, 10);
}

function loadEntries() {
  const stored = localStorage.getItem(STORAGE_KEY);

  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    } catch (error) {
      console.warn('Failed to parse saved entries:', error);
    }
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleEntries));
  return sampleEntries;
}

function saveEntries() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function formatCurrency(value) {
  return new Intl.NumberFormat('bn-BD', {
    style: 'currency',
    currency: 'BDT',
    maximumFractionDigits: 0,
  }).format(value);
}

function monthLabel(dateValue) {
  const date = new Date(dateValue + 'T00:00:00');
  return new Intl.DateTimeFormat('bn-BD', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

function getVisibleEntries() {
  const monthValue = monthFilter.value;

  if (!monthValue) return [...entries].sort((a, b) => new Date(b.date) - new Date(a.date));

  return entries.filter((entry) => entry.date.startsWith(monthValue)).sort((a, b) => new Date(b.date) - new Date(a.date));
}

function renderSummary() {
  const income = entries.filter((entry) => entry.type === 'income').reduce((sum, item) => sum + Number(item.amount), 0);
  const expense = entries.filter((entry) => entry.type === 'expense').reduce((sum, item) => sum + Number(item.amount), 0);
  const balance = income - expense;

  totalIncomeEl.textContent = formatCurrency(income);
  totalExpenseEl.textContent = formatCurrency(expense);
  balanceAmountEl.textContent = formatCurrency(balance);

  balanceAmountEl.style.color = balance >= 0 ? 'var(--balance)' : 'var(--expense)';
}

function renderEntries() {
  const visibleEntries = getVisibleEntries();

  if (!visibleEntries.length) {
    entriesBody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">কোনো লেনদেন পাওয়া যায়নি।</td>
      </tr>
    `;
    return;
  }

  entriesBody.innerHTML = visibleEntries
    .map(
      (entry) => `
        <tr>
          <td><span class="type-badge ${entry.type}">${entry.type === 'income' ? 'আয়' : 'খরচ'}</span></td>
          <td>${entry.category}</td>
          <td class="amount-cell ${entry.type}">${entry.type === 'income' ? '+' : '-'} ${formatCurrency(entry.amount)}</td>
          <td>${monthLabel(entry.date)}</td>
          <td>${entry.note || '—'}</td>
          <td><button class="delete-btn" data-id="${entry.id}">মুছুন</button></td>
        </tr>
      `
    )
    .join('');
}

function render() {
  renderSummary();
  renderEntries();
}

entryForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const form = event.currentTarget;
  const newEntry = {
    id: crypto.randomUUID(),
    type: document.getElementById('type').value,
    category: document.getElementById('category').value,
    amount: Number(document.getElementById('amount').value),
    date: document.getElementById('date').value || currentDateISO(),
    note: document.getElementById('note').value.trim()
  };

  if (!newEntry.amount || newEntry.amount <= 0) {
    alert('সঠিক পরিমাণ লিখুন।');
    return;
  }

  entries.unshift(newEntry);
  saveEntries();
  form.reset();
  document.getElementById('date').value = currentDateISO();
  document.getElementById('type').value = 'income';
  render();
});

entriesBody.addEventListener('click', (event) => {
  const deleteBtn = event.target.closest('.delete-btn');
  if (!deleteBtn) return;

  const { id } = deleteBtn.dataset;
  entries = entries.filter((entry) => entry.id !== id);
  saveEntries();
  render();
});

resetDataBtn.addEventListener('click', () => {
  const confirmed = window.confirm('আপনি কি সমস্ত ডেটা মুছে ফেলতে চান?');
  if (!confirmed) return;

  entries = [...sampleEntries];
  saveEntries();
  monthFilter.value = '';
  render();
});

monthFilter.addEventListener('input', render);

document.getElementById('date').value = currentDateISO();
monthFilter.value = new Date().toISOString().slice(0, 7);
render();
