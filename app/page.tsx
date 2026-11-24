"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Expense = {
  id: number;
  title: string;
  category: string;
  amount: number;
  date: string;
};

type View = "overview" | "transactions" | "reports" | "budgets";

const categories: Record<string, string> = {
  Food: "#fb806f",
  Transport: "#7668e8",
  Shopping: "#e8b94f",
  Bills: "#48ad8c",
  Health: "#6297e8",
  Entertainment: "#bd78d2",
  Other: "#89909f",
};

const views: { id: View; label: string; icon: string }[] = [
  { id: "overview", label: "Overview", icon: "⌂" },
  { id: "transactions", label: "Transactions", icon: "↔" },
  { id: "reports", label: "Reports", icon: "▥" },
  { id: "budgets", label: "Budgets", icon: "◉" },
];

function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function currentMonthString() {
  return localDateString().slice(0, 7);
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ExpenseForm({
  expense,
  onSave,
  onClose,
}: {
  expense: Expense | null;
  onSave: (expense: Omit<Expense, "id">) => void;
  onClose: () => void;
}) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("title") ?? "").trim();
    const category = String(formData.get("category") ?? "Other");
    const amount = Number(formData.get("amount"));
    const date = String(formData.get("date") ?? "");

    if (!title || !Number.isFinite(amount) || amount <= 0 || !date) return;

    onSave({ title, category, amount, date });
  }

  return (
    <div className="overlay" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <form className="modal" onSubmit={handleSubmit}>
        <div className="modalHeading">
          <div>
            <span className="eyebrow">{expense ? "EDIT ENTRY" : "NEW ENTRY"}</span>
            <h2>{expense ? "Edit expense" : "Add an expense"}</h2>
          </div>
          <button type="button" className="closeButton" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <label>
          Description
          <input
            name="title"
            defaultValue={expense?.title ?? ""}
            placeholder="e.g. Grocery shopping"
            required
            autoFocus
          />
        </label>

        <div className="formRow">
          <label>
            Amount
            <input
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              defaultValue={expense?.amount ?? ""}
              placeholder="0.00"
              required
            />
          </label>
          <label>
            Category
            <select name="category" defaultValue={expense?.category ?? "Food"}>
              {Object.keys(categories).map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </label>
        </div>

        <label>
          Date
          <input
            name="date"
            type="date"
            defaultValue={expense?.date ?? localDateString()}
            required
          />
        </label>

        <div className="modalActions">
          <button type="button" className="secondaryButton" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="primaryButton">
            {expense ? "Save changes" : "Add expense"}
          </button>
        </div>
      </form>
    </div>
  );
}

function ExpenseRow({
  expense,
  onEdit,
  onDelete,
}: {
  expense: Expense;
  onEdit: (expense: Expense) => void;
  onDelete: (id: number) => void;
}) {
  const color = categories[expense.category] ?? categories.Other;

  return (
    <div className="expenseRow">
      <div className="categoryIcon" style={{ color, background: `${color}20` }}>
        {expense.category.slice(0, 1)}
      </div>
      <div className="expenseInfo">
        <strong>{expense.title}</strong>
        <span>{expense.category} · {formatDate(expense.date)}</span>
      </div>
      <strong className="expenseAmount">−{formatMoney(expense.amount)}</strong>
      <div className="rowActions">
        <button type="button" onClick={() => onEdit(expense)} aria-label={`Edit ${expense.title}`}>
          Edit
        </button>
        <button type="button" onClick={() => onDelete(expense.id)} aria-label={`Delete ${expense.title}`}>
          ×
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const [view, setView] = useState<View>("overview");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budget, setBudget] = useState(1200);
  const [month, setMonth] = useState(currentMonthString());
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const savedExpenses = localStorage.getItem("expensio-expenses");
      const savedBudget = localStorage.getItem("expensio-budget");

      if (savedExpenses) {
        const parsed: unknown = JSON.parse(savedExpenses);
        if (Array.isArray(parsed)) setExpenses(parsed as Expense[]);
      }

      if (savedBudget) {
        const parsedBudget = Number(savedBudget);
        if (Number.isFinite(parsedBudget) && parsedBudget >= 0) {
          setBudget(parsedBudget);
        }
      }
    } catch {
      // If saved browser data is invalid, keep the app usable with empty defaults.
    }

    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem("expensio-expenses", JSON.stringify(expenses));
    localStorage.setItem("expensio-budget", String(budget));
  }, [expenses, budget, loaded]);

  const monthExpenses = useMemo(
    () => expenses.filter((expense) => expense.date.startsWith(month)),
    [expenses, month],
  );

  const monthTotal = useMemo(
    () => monthExpenses.reduce((sum, expense) => sum + expense.amount, 0),
    [monthExpenses],
  );

  const filteredExpenses = useMemo(() => {
    const query = search.trim().toLowerCase();

    return expenses
      .filter((expense) => expense.date.startsWith(month))
      .filter((expense) => categoryFilter === "All" || expense.category === categoryFilter)
      .filter((expense) => !query || expense.title.toLowerCase().includes(query))
      .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  }, [expenses, month, categoryFilter, search]);

  const categoryTotals = useMemo(
    () =>
      Object.keys(categories)
        .map((name) => ({
          name,
          amount: monthExpenses
            .filter((expense) => expense.category === name)
            .reduce((sum, expense) => sum + expense.amount, 0),
        }))
        .filter((item) => item.amount > 0)
        .sort((a, b) => b.amount - a.amount),
    [monthExpenses],
  );

  const remainingBudget = Math.max(budget - monthTotal, 0);
  const budgetPercent = budget > 0 ? Math.min((monthTotal / budget) * 100, 100) : 0;
  const monthLabel = new Date(`${month}-01T00:00:00`).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  function openAddForm() {
    setEditingExpense(null);
    setModalOpen(true);
  }

  function openEditForm(expense: Expense) {
    setEditingExpense(expense);
    setModalOpen(true);
  }

  function saveExpense(details: Omit<Expense, "id">) {
    if (editingExpense) {
      setExpenses((current) =>
        current.map((expense) =>
          expense.id === editingExpense.id ? { ...expense, ...details } : expense,
        ),
      );
    } else {
      setExpenses((current) => [{ ...details, id: Date.now() }, ...current]);
    }
    setModalOpen(false);
    setEditingExpense(null);
  }

  function deleteExpense(id: number) {
    if (window.confirm("Delete this expense?")) {
      setExpenses((current) => current.filter((expense) => expense.id !== id));
    }
  }

  const pageTitles: Record<View, string> = {
    overview: "Your money, at a glance",
    transactions: "All transactions",
    reports: "Spending reports",
    budgets: "Your monthly budget",
  };

  return (
    <main className="appShell">
      <aside className="sidebar">
        <a className="brand" href="#" onClick={(event) => {
          event.preventDefault();
          setView("overview");
        }}>
          <span className="brandMark">E</span>
          <span>Expensio</span>
        </a>

        <p className="navCaption">MENU</p>
        <nav className="navigation" aria-label="Main navigation">
          {views.map((item) => (
            <button
              type="button"
              key={item.id}
              className={`navButton ${view === item.id ? "selected" : ""}`}
              onClick={() => setView(item.id)}
              aria-current={view === item.id ? "page" : undefined}
            >
              <span className="navIcon" aria-hidden="true">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebarNote">
          <span className="noteIcon">✦</span>
          <strong>Your finances, simply.</strong>
          <p>Every small step adds up.</p>
        </div>

        <div className="account">
          <div className="avatar">ME</div>
          <div><strong>Personal account</strong><span>Local device</span></div>
        </div>
      </aside>

      <section className="mainContent">
        <header className="topbar">
          <div>
            <span className="eyebrow">{view.toUpperCase()}</span>
            <h1>{pageTitles[view]}</h1>
          </div>
          <div className="topActions">
            <label className="monthPicker">
              <span className="srOnly">Choose month</span>
              <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
            </label>
            <button type="button" className="primaryButton addButton" onClick={openAddForm}>
              <span aria-hidden="true">＋</span> Add expense
            </button>
          </div>
        </header>

        {view === "overview" && (
          <section className="pageContent">
            <div className="summaryGrid">
              <article className="summaryCard">
                <span className="summaryLabel">Spent in {monthLabel}</span>
                <strong>{formatMoney(monthTotal)}</strong>
                <small>{monthExpenses.length} expense{monthExpenses.length === 1 ? "" : "s"}</small>
              </article>
              <article className="summaryCard">
                <span className="summaryLabel">Monthly budget</span>
                <strong>{formatMoney(budget)}</strong>
                <small>{budgetPercent.toFixed(0)}% used</small>
              </article>
              <article className="summaryCard">
                <span className="summaryLabel">Still available</span>
                <strong>{formatMoney(remainingBudget)}</strong>
                <small>{monthTotal > budget ? "Budget exceeded" : "Left for this month"}</small>
              </article>
            </div>

            <div className="contentGrid">
              <article className="panel">
                <div className="panelHeading">
                  <div><span className="eyebrow">THIS MONTH</span><h2>Budget progress</h2></div>
                  <button className="textButton" onClick={() => setView("budgets")}>Manage budget →</button>
                </div>
                <div className="progressSummary">
                  <strong>{budgetPercent.toFixed(0)}%</strong>
                  <span>{formatMoney(monthTotal)} spent of {formatMoney(budget)}</span>
                </div>
                <div className="progressTrack">
                  <div className={monthTotal > budget ? "overBudget" : ""} style={{ width: `${budgetPercent}%` }} />
                </div>
                <p className={`statusText ${monthTotal > budget ? "warning" : ""}`}>
                  {monthTotal > budget
                    ? `You are ${formatMoney(monthTotal - budget)} over budget.`
                    : `${formatMoney(remainingBudget)} left to spend this month.`}
                </p>
              </article>

              <article className="panel">
                <div className="panelHeading">
                  <div><span className="eyebrow">BREAKDOWN</span><h2>By category</h2></div>
                  <button className="textButton" onClick={() => setView("reports")}>See report →</button>
                </div>
                {categoryTotals.length ? (
                  <div className="categoryList">
                    {categoryTotals.slice(0, 5).map((item) => (
                      <div className="categoryLine" key={item.name}>
                        <span className="categoryDot" style={{ background: categories[item.name] }} />
                        <span>{item.name}</span>
                        <strong>{formatMoney(item.amount)}</strong>
                      </div>
                    ))}
                  </div>
                ) : <p className="emptyMessage">Add an expense to see your category breakdown.</p>}
              </article>
            </div>

            <article className="panel">
              <div className="panelHeading">
                <div><span className="eyebrow">LATEST ACTIVITY</span><h2>Recent transactions</h2></div>
                <button className="textButton" onClick={() => setView("transactions")}>View all →</button>
              </div>
              {monthExpenses.length ? (
                <div className="expenseList">
                  {[...monthExpenses]
                    .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
                    .slice(0, 5)
                    .map((expense) => (
                      <ExpenseRow
                        key={expense.id}
                        expense={expense}
                        onEdit={openEditForm}
                        onDelete={deleteExpense}
                      />
                    ))}
                </div>
              ) : <p className="emptyMessage">No expenses recorded for {monthLabel}. Add one to get started.</p>}
            </article>
          </section>
        )}

        {view === "transactions" && (
          <section className="pageContent">
            <div className="summaryStrip">
              <div><span>Transactions in {monthLabel}</span><strong>{filteredExpenses.length}</strong></div>
              <div><span>Total for this month</span><strong>{formatMoney(monthTotal)}</strong></div>
            </div>

            <article className="panel">
              <div className="filterBar">
                <label className="searchBox">
                  <span aria-hidden="true">⌕</span>
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search descriptions"
                    aria-label="Search transactions"
                  />
                </label>
                <select
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                  aria-label="Filter by category"
                >
                  <option>All</option>
                  {Object.keys(categories).map((name) => <option key={name}>{name}</option>)}
                </select>
              </div>

              {filteredExpenses.length ? (
                <div className="expenseList">
                  {filteredExpenses.map((expense) => (
                    <ExpenseRow
                      key={expense.id}
                      expense={expense}
                      onEdit={openEditForm}
                      onDelete={deleteExpense}
                    />
                  ))}
                </div>
              ) : (
                <p className="emptyMessage">
                  {expenses.length
                    ? "No transactions match these filters."
                    : "No expenses yet. Use “Add expense” to record your first one."}
                </p>
              )}
            </article>
          </section>
        )}

        {view === "reports" && (
          <section className="pageContent">
            <div className="summaryGrid">
              <article className="summaryCard">
                <span className="summaryLabel">Total spent</span>
                <strong>{formatMoney(monthTotal)}</strong>
                <small>{monthLabel}</small>
              </article>
              <article className="summaryCard">
                <span className="summaryLabel">Number of expenses</span>
                <strong>{monthExpenses.length}</strong>
                <small>Recorded this month</small>
              </article>
              <article className="summaryCard">
                <span className="summaryLabel">Average expense</span>
                <strong>{formatMoney(monthExpenses.length ? monthTotal / monthExpenses.length : 0)}</strong>
                <small>Per transaction</small>
              </article>
            </div>

            <article className="panel reportPanel">
              <div className="panelHeading">
                <div><span className="eyebrow">{monthLabel.toUpperCase()}</span><h2>Spending by category</h2></div>
              </div>

              {categoryTotals.length ? (
                <div className="reportList">
                  {categoryTotals.map((item) => {
                    const percent = monthTotal > 0 ? (item.amount / monthTotal) * 100 : 0;
                    return (
                      <div className="reportItem" key={item.name}>
                        <div className="reportLabel">
                          <span><i style={{ background: categories[item.name] }} />{item.name}</span>
                          <strong>{formatMoney(item.amount)} <small>{percent.toFixed(0)}%</small></strong>
                        </div>
                        <div className="reportTrack">
                          <div style={{ width: `${percent}%`, background: categories[item.name] }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="emptyMessage">No expenses to report for {monthLabel}.</p>
              )}
            </article>

            <article className="panel">
              <div className="panelHeading">
                <div><span className="eyebrow">HIGHEST SPENDING</span><h2>Top category</h2></div>
              </div>
              {categoryTotals[0] ? (
                <div className="topCategory">
                  <span className="largeCategoryIcon" style={{
                    color: categories[categoryTotals[0].name],
                    background: `${categories[categoryTotals[0].name]}20`,
                  }}>
                    {categoryTotals[0].name.slice(0, 1)}
                  </span>
                  <div><strong>{categoryTotals[0].name}</strong><span>{formatMoney(categoryTotals[0].amount)} spent in {monthLabel}</span></div>
                </div>
              ) : <p className="emptyMessage">Your top category will appear after you add expenses.</p>}
            </article>
          </section>
        )}

        {view === "budgets" && (
          <section className="pageContent">
            <div className="summaryGrid">
              <article className="summaryCard">
                <span className="summaryLabel">Monthly limit</span>
                <strong>{formatMoney(budget)}</strong>
                <small>{monthLabel}</small>
              </article>
              <article className="summaryCard">
                <span className="summaryLabel">Spent so far</span>
                <strong>{formatMoney(monthTotal)}</strong>
                <small>{monthExpenses.length} expense{monthExpenses.length === 1 ? "" : "s"}</small>
              </article>
              <article className="summaryCard">
                <span className="summaryLabel">{monthTotal > budget ? "Over budget" : "Available"}</span>
                <strong>{formatMoney(Math.abs(budget - monthTotal))}</strong>
                <small>{monthTotal > budget ? "Above your monthly limit" : "Remaining this month"}</small>
              </article>
            </div>

            <article className="panel budgetPanel">
              <div className="panelHeading">
                <div><span className="eyebrow">BUDGET SETTINGS</span><h2>Monthly spending limit</h2></div>
              </div>

              <label className="budgetField">
                <span>Set your budget in USD</span>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={budget}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    setBudget(Number.isFinite(value) ? Math.max(0, value) : 0);
                  }}
                />
              </label>

              <div className="budgetProgressHeading">
                <strong>{budgetPercent.toFixed(0)}% used</strong>
                <span>{formatMoney(monthTotal)} of {formatMoney(budget)}</span>
              </div>
              <div className="progressTrack largeTrack">
                <div className={monthTotal > budget ? "overBudget" : ""} style={{ width: `${budgetPercent}%` }} />
              </div>

              <p className={`statusText ${monthTotal > budget ? "warning" : ""}`}>
                {monthTotal > budget
                  ? `You have exceeded your budget by ${formatMoney(monthTotal - budget)}.`
                  : `${formatMoney(remainingBudget)} remaining for ${monthLabel}.`}
              </p>

              <p className="finePrint">Your budget is saved in this browser and updates as you add or edit expenses.</p>
            </article>
          </section>
        )}
      </section>

      {modalOpen && (
        <ExpenseForm
          key={editingExpense?.id ?? "new-expense"}
          expense={editingExpense}
          onSave={saveExpense}
          onClose={() => {
            setModalOpen(false);
            setEditingExpense(null);
          }}
        />
      )}

      <style jsx global>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: #f5f6f8; color: #24252d; font-family: Arial, Helvetica, sans-serif; }
        button, input, select { font: inherit; }
        button { cursor: pointer; }
        .appShell { min-height: 100vh; display: grid; grid-template-columns: 238px minmax(0, 1fr); }
        .sidebar { height: 100vh; position: sticky; top: 0; display: flex; flex-direction: column; padding: 27px 18px 18px; background: #fff; border-right: 1px solid #e9e9ee; }
        .brand { display: flex; align-items: center; gap: 10px; padding: 0 10px 38px; color: #23242b; font-size: 19px; font-weight: 800; text-decoration: none; }
        .brandMark { width: 34px; height: 34px; display: grid; place-items: center; border-radius: 11px; background: #6258d6; color: white; }
        .navCaption, .eyebrow { color: #999aa3; font-size: 10px; font-weight: 800; letter-spacing: 1.3px; }
        .navCaption { margin: 0 11px 10px; }
        .navigation { display: grid; gap: 5px; }
        .navButton { height: 44px; display: flex; align-items: center; gap: 12px; border: 0; border-radius: 9px; padding: 0 12px; background: transparent; color: #777983; text-align: left; font-size: 13px; }
        .navButton:hover { background: #f7f6ff; }
        .navButton.selected { background: #f0efff; color: #6258d6; font-weight: 700; }
        .navIcon { width: 20px; font-size: 19px; text-align: center; }
        .sidebarNote { margin-top: auto; padding: 14px; border-radius: 10px; background: #f6f5ff; }
        .noteIcon { color: #6258d6; }
        .sidebarNote strong { display: block; margin-top: 8px; font-size: 12px; }
        .sidebarNote p { margin: 5px 0 0; color: #898a93; font-size: 11px; }
        .account { display: flex; align-items: center; gap: 10px; margin-top: 15px; padding: 14px 5px 0; border-top: 1px solid #eeeef2; }
        .avatar { width: 36px; height: 36px; display: grid; place-items: center; border-radius: 50%; background: #e7e4ff; color: #6258d6; font-size: 11px; font-weight: 800; }
        .account strong, .account span { display: block; }
        .account strong { font-size: 11px; }
        .account span { margin-top: 4px; color: #999aa3; font-size: 10px; }
        .mainContent { min-width: 0; padding: 28px 34px 48px; }
        .topbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 24px; }
        .topbar .eyebrow { margin: 0 0 6px; }
        .topbar h1 { margin: 0; font-size: 25px; letter-spacing: -.5px; }
        .topActions { display: flex; align-items: center; gap: 9px; }
        .monthPicker input { height: 40px; border: 1px solid #e6e6eb; border-radius: 8px; padding: 0 10px; background: white; color: #555660; font-size: 12px; }
        .primaryButton, .secondaryButton { min-height: 40px; border-radius: 8px; padding: 0 14px; font-size: 12px; font-weight: 700; }
        .primaryButton { border: 0; background: #6258d6; color: white; }
        .primaryButton:hover { background: #5147c6; }
        .addButton { white-space: nowrap; }
        .addButton span { font-size: 17px; }
        .pageContent { display: grid; gap: 15px; }
        .summaryGrid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
        .summaryCard, .panel { border: 1px solid #eaeaef; border-radius: 12px; background: #fff; }
        .summaryCard { min-height: 120px; display: flex; flex-direction: column; justify-content: center; padding: 18px 20px; }
        .summaryLabel { color: #888992; font-size: 12px; }
        .summaryCard strong { margin: 8px 0 5px; font-size: 25px; letter-spacing: -.5px; }
        .summaryCard small { color: #55a487; font-size: 11px; }
        .panel { padding: 20px; }
        .contentGrid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        .panelHeading { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 20px; }
        .panelHeading .eyebrow { display: block; margin-bottom: 5px; }
        .panelHeading h2 { margin: 0; font-size: 16px; }
        .textButton { border: 0; padding: 4px 0; background: transparent; color: #6258d6; font-size: 11px; white-space: nowrap; }
        .progressSummary, .budgetProgressHeading { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .progressSummary strong { font-size: 23px; }
        .progressSummary span, .budgetProgressHeading span { color: #898a93; font-size: 11px; }
        .progressTrack, .reportTrack { height: 9px; overflow: hidden; border-radius: 20px; background: #eeedf5; }
        .progressTrack { margin-top: 12px; }
        .progressTrack > div, .reportTrack > div { height: 100%; border-radius: inherit; background: #6258d6; transition: width .2s ease; }
        .progressTrack > div.overBudget { background: #df7069; }
        .statusText { margin: 10px 0 0; color: #55a487; font-size: 11px; }
        .statusText.warning { color: #c55750; }
        .categoryList { display: grid; gap: 14px; }
        .categoryLine { display: grid; grid-template-columns: 9px 1fr auto; align-items: center; gap: 9px; color: #666771; font-size: 12px; }
        .categoryLine strong { color: #292a31; font-size: 12px; }
        .categoryDot { width: 8px; height: 8px; border-radius: 50%; }
        .expenseList { display: grid; }
        .expenseRow { min-height: 60px; display: grid; grid-template-columns: 36px minmax(100px, 1fr) auto 60px; align-items: center; gap: 11px; border-top: 1px solid #f0f0f3; }
        .categoryIcon { width: 34px; height: 34px; display: grid; place-items: center; border-radius: 9px; font-size: 12px; font-weight: 800; }
        .expenseInfo { display: grid; gap: 4px; min-width: 0; }
        .expenseInfo strong { overflow: hidden; font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
        .expenseInfo span { color: #999aa3; font-size: 10px; }
        .expenseAmount { font-size: 12px; white-space: nowrap; }
        .rowActions { display: flex; justify-content: flex-end; gap: 6px; }
        .rowActions button { border: 0; padding: 3px; background: transparent; color: #81828a; font-size: 11px; }
        .rowActions button:last-child { font-size: 17px; }
        .emptyMessage { padding: 18px 0; color: #999aa3; font-size: 12px; text-align: center; }
        .summaryStrip { display: flex; justify-content: space-between; gap: 12px; padding: 16px 20px; border: 1px solid #eaeaef; border-radius: 12px; background: #fff; }
        .summaryStrip div { display: grid; gap: 5px; }
        .summaryStrip span { color: #898a93; font-size: 11px; }
        .summaryStrip strong { font-size: 16px; }
        .filterBar { display: flex; gap: 10px; margin-bottom: 14px; }
        .searchBox { height: 38px; flex: 1; display: flex; align-items: center; gap: 8px; border: 1px solid #e6e6eb; border-radius: 8px; padding: 0 10px; color: #92939b; }
        .searchBox input { width: 100%; border: 0; outline: 0; color: #33343b; font-size: 12px; }
        .filterBar select { min-width: 125px; border: 1px solid #e6e6eb; border-radius: 8px; padding: 0 10px; background: white; color: #555660; font-size: 12px; }
        .reportPanel { min-height: 250px; }
        .reportList { display: grid; gap: 20px; }
        .reportItem { display: grid; gap: 8px; }
        .reportLabel { display: flex; justify-content: space-between; gap: 10px; font-size: 12px; }
        .reportLabel > span { display: flex; align-items: center; gap: 8px; }
        .reportLabel i { width: 8px; height: 8px; border-radius: 50%; }
        .reportLabel strong small { margin-left: 8px; color: #9697a0; font-weight: 400; }
        .reportTrack { height: 8px; }
        .budgetPanel { max-width: 800px; }
        .budgetField { display: grid; gap: 8px; color: #6f7078; font-size: 12px; font-weight: 700; }
        .budgetField input { width: min(100%, 300px); height: 43px; border: 1px solid #e4e4e9; border-radius: 8px; padding: 0 12px; outline: 0; }
        .budgetField input:focus { border-color: #6258d6; }
        .budgetProgressHeading { margin-top: 26px; }
        .budgetProgressHeading strong { font-size: 14px; }
        .largeTrack { height: 12px; margin-top: 10px; }
        .finePrint { margin: 15px 0 0; color: #999aa3; font-size: 11px; }
        .topCategory { display: flex; align-items: center; gap: 12px; }
        .largeCategoryIcon { width: 42px; height: 42px; display: grid; place-items: center; border-radius: 11px; font-weight: 800; }
        .topCategory div { display: grid; gap: 4px; }
        .topCategory strong { font-size: 13px; }
        .topCategory span { color: #898a93; font-size: 11px; }
        .overlay { position: fixed; inset: 0; z-index: 20; display: grid; place-items: center; padding: 16px; background: #20212a66; backdrop-filter: blur(3px); }
        .modal { width: min(440px, 100%); display: grid; gap: 16px; border-radius: 14px; padding: 22px; background: #fff; box-shadow: 0 20px 70px #17182133; }
        .modalHeading { display: flex; justify-content: space-between; align-items: flex-start; }
        .modalHeading .eyebrow { display: block; margin-bottom: 5px; }
        .modalHeading h2 { margin: 0; font-size: 19px; }
        .closeButton { width: 32px; height: 32px; border: 0; border-radius: 50%; background: #f1f1f4; color: #73747c; font-size: 20px; }
        .modal label { display: grid; gap: 7px; color: #686971; font-size: 11px; font-weight: 700; }
        .modal input, .modal select { width: 100%; height: 42px; border: 1px solid #e4e4e9; border-radius: 8px; padding: 0 11px; outline: 0; background: #fff; color: #33343b; }
        .modal input:focus, .modal select:focus { border-color: #6258d6; box-shadow: 0 0 0 3px #6258d615; }
        .formRow { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .modalActions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 2px; }
        .secondaryButton { border: 1px solid #e4e4e9; background: #fff; color: #666771; }
        .srOnly { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; }
        @media (max-width: 900px) {
          .appShell { grid-template-columns: 78px minmax(0, 1fr); }
          .sidebar { align-items: center; padding-inline: 12px; }
          .brand { padding-inline: 0; }
          .brand > span:last-child, .navCaption, .navButton:not(.selected), .navButton { }
          .brand > span:last-child, .sidebarNote, .account > div:last-child { display: none; }
          .navigation { width: 100%; }
          .navButton { justify-content: center; padding: 0; font-size: 0; }
          .navIcon { font-size: 19px; }
          .account { padding-inline: 0; }
          .contentGrid { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          .appShell { display: block; padding-bottom: 66px; }
          .sidebar { position: fixed; z-index: 10; top: auto; bottom: 0; width: 100%; height: 62px; display: block; padding: 6px 12px; border-top: 1px solid #e9e9ee; border-right: 0; }
          .brand, .navCaption, .sidebarNote, .account { display: none; }
          .navigation { height: 100%; grid-template-columns: repeat(4, 1fr); }
          .navButton { width: 100%; height: 48px; }
          .mainContent { padding: 20px 14px 30px; }
          .topbar { align-items: flex-start; }
          .topbar h1 { font-size: 20px; }
          .topActions { gap: 6px; }
          .monthPicker input { width: 132px; height: 38px; }
          .addButton { width: 38px; min-width: 38px; overflow: hidden; justify-content: center; padding: 0; font-size: 0; }
          .addButton span { font-size: 20px; }
          .summaryGrid { grid-template-columns: 1fr; gap: 9px; }
          .summaryCard { min-height: 95px; }
          .summaryCard strong { font-size: 22px; }
          .panel { padding: 16px; }
          .expenseRow { grid-template-columns: 34px minmax(70px, 1fr) auto 48px; gap: 7px; }
          .expenseAmount { font-size: 10px; }
          .rowActions { gap: 3px; }
          .rowActions button { font-size: 10px; }
          .summaryStrip { padding: 14px; }
          .summaryStrip strong { font-size: 14px; }
          .formRow { grid-template-columns: 1fr; }
        }
      `}</style>
    </main>
  );
}