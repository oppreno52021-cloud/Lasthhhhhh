import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { localDB, DEFAULT_SETTINGS, DEFAULT_BUDGET } from '../src/db/indexedDB';
import { 
  calculateAccountSummaries, 
  calculateMonthInsights, 
  calculateBudgetPace, 
  validateBackupJSON,
  AppFullBackup
} from '../src/utils/calculations';
import { Expense, Category, Account, Budget } from '../src/types';

// Polyfill localStorage in test environment
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (k: string) => store.get(k) || null,
    setItem: (k: string, v: string) => store.set(k, String(v)),
    removeItem: (k: string) => store.delete(k),
    clear: () => store.clear(),
    get length() { return store.size; },
    key: (i: number) => Array.from(store.keys())[i] || null,
  } as any;
}

describe('End-to-End Realistic Financial Workflow & Persistence Test', () => {
  beforeEach(async () => {
    // Reset IndexedDB state before each test
    const db = await localDB.openDB();
    const tx = db.transaction(['expenses', 'categories', 'budgets', 'accounts', 'recurring', 'settings'], 'readwrite');
    tx.objectStore('expenses').clear();
    tx.objectStore('categories').clear();
    tx.objectStore('budgets').clear();
    tx.objectStore('accounts').clear();
    tx.objectStore('recurring').clear();
    tx.objectStore('settings').clear();
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  });

  it('executes full realistic financial cycle: accounts, expenses, income, transfers, edits, deletes, and decimal math', async () => {
    // 1. Create two accounts with opening balances
    const bankAccount: Account = {
      id: 'acc-bank',
      name: 'الحساب البنكي',
      type: 'bank',
      openingBalance: 5000.00,
      currency: 'EGP',
      color: '#3B82F6',
      icon: 'Landmark',
      isActive: true,
      isArchived: false,
      showOnHome: true,
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z',
    };
    await localDB.saveAccount(bankAccount);

    const walletAccount: Account = {
      id: 'acc-wallet',
      name: 'محفظة كاش',
      type: 'cash',
      openingBalance: 1200.50,
      currency: 'EGP',
      color: '#10B981',
      icon: 'Wallet',
      isActive: true,
      isArchived: false,
      showOnHome: true,
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z',
    };
    await localDB.saveAccount(walletAccount);

    let accounts = await localDB.getAccounts();
    let expenses = await localDB.getExpenses();
    let summaries = calculateAccountSummaries(accounts, expenses);

    expect(summaries.summaries.find(s => s.account.id === 'acc-bank')?.currentBalance).toBe(5000.00);
    expect(summaries.summaries.find(s => s.account.id === 'acc-wallet')?.currentBalance).toBe(1200.50);
    expect(summaries.totalNetWorth).toBe(6200.50);

    // 2. Add an expense: 99.99 EGP from Bank (Groceries)
    const exp1 = await localDB.addExpense({
      type: 'expense',
      amount: 99.99,
      categoryId: 'cat-groceries',
      accountId: 'acc-bank',
      paymentMethodId: 'acc-bank',
      note: 'مشتريات سوبرماركت',
      merchant: 'كارفور',
      date: '2026-10-05',
      time: '14:00',
    });
    expect(exp1.amount).toBe(99.99);

    expenses = await localDB.getExpenses();
    summaries = calculateAccountSummaries(accounts, expenses);
    // Bank: 5000 - 99.99 = 4900.01
    expect(summaries.summaries.find(s => s.account.id === 'acc-bank')?.currentBalance).toBe(4900.01);
    expect(summaries.totalNetWorth).toBe(6100.51);

    // 3. Add income: 3500.00 EGP into Bank
    const inc1 = await localDB.addExpense({
      type: 'income',
      amount: 3500.00,
      categoryId: 'cat-salary',
      accountId: 'acc-bank',
      paymentMethodId: 'acc-bank',
      note: 'راتب شهري',
      merchant: 'العمل',
      date: '2026-10-06',
      time: '09:00',
    });
    expect(inc1.amount).toBe(3500.00);

    expenses = await localDB.getExpenses();
    summaries = calculateAccountSummaries(accounts, expenses);
    // Bank: 4900.01 + 3500 = 8400.01
    expect(summaries.summaries.find(s => s.account.id === 'acc-bank')?.currentBalance).toBe(8400.01);
    expect(summaries.totalNetWorth).toBe(9600.51);

    // 4. Transfer money: 500.00 EGP from Bank to Wallet
    const transferTx = await localDB.addExpense({
      type: 'transfer',
      amount: 500.00,
      categoryId: 'cat-other',
      accountId: 'acc-bank',
      fromAccountId: 'acc-bank',
      toAccountId: 'acc-wallet',
      paymentMethodId: 'acc-bank',
      note: 'سحب كاش للمحفظة',
      merchant: 'Transfer: البنك -> المحفظة',
      date: '2026-10-07',
      time: '11:00',
    });
    expect(transferTx.amount).toBe(500.00);

    expenses = await localDB.getExpenses();
    summaries = calculateAccountSummaries(accounts, expenses);
    // Bank: 8400.01 - 500 = 7900.01
    // Wallet: 1200.50 + 500 = 1700.50
    // Net Worth: 7900.01 + 1700.50 = 9600.51
    expect(summaries.summaries.find(s => s.account.id === 'acc-bank')?.currentBalance).toBe(7900.01);
    expect(summaries.summaries.find(s => s.account.id === 'acc-wallet')?.currentBalance).toBe(1700.50);
    expect(summaries.totalNetWorth).toBe(9600.51);

    // 5. Decimal expense: 12.35 EGP from Wallet (Transport)
    await localDB.addExpense({
      type: 'expense',
      amount: 12.35,
      categoryId: 'cat-transport',
      accountId: 'acc-wallet',
      paymentMethodId: 'acc-wallet',
      note: 'أجرة مواصلات',
      merchant: 'مترو',
      date: '2026-10-08',
      time: '08:30',
    });

    expenses = await localDB.getExpenses();
    summaries = calculateAccountSummaries(accounts, expenses);
    // Wallet: 1700.50 - 12.35 = 1688.15
    expect(summaries.summaries.find(s => s.account.id === 'acc-wallet')?.currentBalance).toBe(1688.15);
    expect(summaries.totalNetWorth).toBe(9588.16);

    // 6. Two legitimate identical transactions: 25.00 EGP each for Coffee from Wallet
    const coffee1 = await localDB.addExpense({
      type: 'expense',
      amount: 25.00,
      categoryId: 'cat-coffee',
      accountId: 'acc-wallet',
      paymentMethodId: 'acc-wallet',
      note: 'قهوة سريعة',
      merchant: 'كافيه',
      date: '2026-10-09',
      time: '10:00',
    });

    const coffee2 = await localDB.addExpense({
      type: 'expense',
      amount: 25.00,
      categoryId: 'cat-coffee',
      accountId: 'acc-wallet',
      paymentMethodId: 'acc-wallet',
      note: 'قهوة سريعة',
      merchant: 'كافيه',
      date: '2026-10-09',
      time: '10:05',
    });

    expect(coffee1.id).not.toBe(coffee2.id);
    expenses = await localDB.getExpenses();
    expect(expenses.filter(e => e.note === 'قهوة سريعة').length).toBe(2);

    summaries = calculateAccountSummaries(accounts, expenses);
    // Wallet: 1688.15 - 50 = 1638.15
    expect(summaries.summaries.find(s => s.account.id === 'acc-wallet')?.currentBalance).toBe(1638.15);
    expect(summaries.totalNetWorth).toBe(9538.16);

    // 7. Edit existing expense: Update exp1 from 99.99 to 109.99
    await localDB.updateExpense(exp1.id, {
      amount: 109.99,
      note: 'مشتريات سوبرماركت معدلة',
    });

    expenses = await localDB.getExpenses();
    summaries = calculateAccountSummaries(accounts, expenses);
    // Bank: 5000 - 109.99 + 3500 - 500 = 7890.01
    expect(summaries.summaries.find(s => s.account.id === 'acc-bank')?.currentBalance).toBe(7890.01);
    expect(summaries.totalNetWorth).toBe(9528.16);

    // 8. Delete an expense: soft delete coffee1
    await localDB.deleteExpense(coffee1.id, true);
    expenses = await localDB.getExpenses(false);
    expect(expenses.some(e => e.id === coffee1.id)).toBe(false);

    summaries = calculateAccountSummaries(accounts, expenses);
    // Wallet: 1638.15 + 25 = 1663.15
    expect(summaries.summaries.find(s => s.account.id === 'acc-wallet')?.currentBalance).toBe(1663.15);
    expect(summaries.totalNetWorth).toBe(9553.16);

    // 9. Dashboard Totals, Monthly Summaries, and Budget
    const categories: Category[] = [
      { id: 'cat-groceries', name: 'بقالة', icon: 'ShoppingBag', color: '#10B981', type: 'expense', isDefault: true, isActive: true, sortOrder: 1, createdAt: '', updatedAt: '' },
      { id: 'cat-transport', name: 'مواصلات', icon: 'Bus', color: '#F59E0B', type: 'expense', isDefault: true, isActive: true, sortOrder: 2, createdAt: '', updatedAt: '' },
      { id: 'cat-coffee', name: 'قهوة', icon: 'Coffee', color: '#6366F1', type: 'expense', isDefault: true, isActive: true, sortOrder: 3, createdAt: '', updatedAt: '' },
    ];
    for (const c of categories) {
      await localDB.saveCategory(c);
    }

    const budget: Budget = {
      id: 'bgt-2026-10',
      periodStart: '2026-10-01',
      periodEnd: '2026-10-31',
      amount: 2000.00,
      createdAt: '',
      updatedAt: '',
    };
    await localDB.saveBudget(budget);

    const refDate = new Date(2026, 9, 15);
    const pace = calculateBudgetPace(expenses, budget, refDate);
    // Total spent: 109.99 + 12.35 + 25.00 = 147.34
    expect(pace.spent).toBe(147.34);
    expect(pace.remaining).toBe(1852.66);

    const insights = calculateMonthInsights(expenses, categories, '2026-10', refDate);
    expect(insights.totalSpent).toBe(147.34);
    expect(insights.totalIncome).toBe(3500.00);
    expect(insights.netSavings).toBe(3352.66);

    // 10. Data Persistence: Cold restart simulation with null cached connection and wiped localStorage
    (localDB as any).db = null;
    (localDB as any).dbPromise = null;
    localStorage.clear();

    await localDB.openDB();
    const persistedExpenses = await localDB.getExpenses(false);
    const persistedAccounts = await localDB.getAccounts();
    const persistedSettings = await localDB.getSettings();

    expect(persistedExpenses.length).toBe(expenses.length);
    expect(persistedAccounts.length).toBe(2);
    expect(persistedSettings.hasCompletedOnboarding).toBe(true);

    const persistedSummaries = calculateAccountSummaries(persistedAccounts, persistedExpenses);
    expect(persistedSummaries.summaries.find(s => s.account.id === 'acc-bank')?.currentBalance).toBe(7890.01);
    expect(persistedSummaries.summaries.find(s => s.account.id === 'acc-wallet')?.currentBalance).toBe(1663.15);
    expect(persistedSummaries.totalNetWorth).toBe(9553.16);

    // 11. Backup Export & Clean Restore
    const exportedBackup: AppFullBackup = {
      version: 1,
      app: 'Masrofy',
      exportedAt: new Date().toISOString(),
      expenses: persistedExpenses,
      categories,
      budget,
      accounts: persistedAccounts,
      recurring: [],
      settings: persistedSettings,
    };

    const validated = validateBackupJSON(JSON.stringify(exportedBackup));
    expect(validated.valid).toBe(true);
    expect(validated.data).toBeDefined();

    // Clear everything
    await localDB.resetToEmpty();
    expect((await localDB.getAllExpenses()).length).toBe(0);

    // Restore exported backup
    await localDB.restoreFullBackup(validated.data!);
    const restoredExpenses = await localDB.getExpenses(false);
    const restoredAccounts = await localDB.getAccounts();
    const restoredSummaries = calculateAccountSummaries(restoredAccounts, restoredExpenses);

    expect(restoredExpenses.length).toBe(persistedExpenses.length);
    expect(restoredAccounts.length).toBe(2);
    expect(restoredSummaries.totalNetWorth).toBe(9553.16);
  });
});
