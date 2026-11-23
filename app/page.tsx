"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Expense = {
  id: number;
  title: string;
  category: string;
  amount: number;
  date: string;
  color: string;
};

const categories: Record<string, string> = {
  Food: "#ff8d7d",
  Transport: "#7b6cf6",
  Shopping: "#f4c96b",
  Bills: "#62bfa4",
  Health: "#82aaf7",
  Entertainment: "#d58be8",
};

const sampleExpenses: Expense[] = [
  { id: 1, title: "Whole Foods Market", category: "Food", amount: 86.24, date: "2026-11-22", color: categories.Food },
  { id: 2, title: "Metro Card", category: "Transport", amount: 45.0, date: "2026-11-20", color: categories.Transport },
  { id: 3, title: "Nike Store", category: "Shopping", amount: 124.5, date: "2026-11-18", color: categories.Shopping },
  { id: 4, title: "Electric Bill", category: "Bills", amount: 112.0, date: "2026-11-15", color: categories.Bills },
  { id: 5, title: "Cinema Tickets", category: "Entertainment", amount: 32.0, date: "2026-11-12", color: categories.Entertainment },
];

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    card: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/></>,
    chart: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></>,
    wallet: <><path d="M3 7h18v12H3zM3 7l2-3h13l3 3M14 12h7v5h-7a2.5 2.5 0 0 1 0-5z"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2H12v-.2a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L7.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 6 14H5.8v-4H6a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L7.2 7 9 5.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 12 4v-.2h4V4a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L20.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H22a1.7 1.7 0 0 0-2.6 1z"/></>,
    plus: <path d="M12 5v14M5 12h14"/>,
    search: <><circle cx="11" cy="11" r="7"/><path d="M16 16l5 5"/></>,
    bell: <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>,
    more: <><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

export default function Home() {
  const [expenses, setExpenses] = useState<Expense[]>(sampleExpenses);
  const [loaded, setLoaded] = useState(false);
  const [modal, setModal] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [editing, setEditing] = useState<Expense | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("expensio-expenses");
    if (saved) setExpenses(JSON.parse(saved));
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem("expensio-expenses", JSON.stringify(expenses));
  }, [expenses, loaded]);

  const filtered = useMemo(() => expenses.filter((expense) => {
    const matchesSearch = expense.title.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "All" || expense.category === category;
    return matchesSearch && matchesCategory;
  }), [expenses, search, category]);

  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const byCategory = Object.keys(categories).map((name) => ({
    name,
    value: expenses.filter((expense) => expense.category === name).reduce((sum, expense) => sum + expense.amount, 0),
  })).filter((item) => item.value > 0);

  const savings = 2840;

  function submitExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") || "").trim();
    const categoryName = String(form.get("category"));
    const amount = Number(form.get("amount"));
    const date = String(form.get("date"));
    if (!title || !amount || !date) return;

    if (editing) {
      setExpenses((items) => items.map((item) => item.id === editing.id ? { ...item, title, category: categoryName, amount, date, color: categories[categoryName] } : item));
    } else {
      setExpenses((items) => [{ id: Date.now(), title, category: categoryName, amount, date, color: categories[categoryName] }, ...items]);
    }
    setModal(false);
    setEditing(null);
  }

  function openEdit(expense: Expense) {
    setEditing(expense);
    setModal(true);
  }

  function deleteExpense(id: number) {
    setExpenses((items) => items.filter((item) => item.id !== id));
  }

  const weekly = [48, 72, 55, 88, 64, 96, 78];
  const donutGradient = byCategory.length ? (() => {
    let start = 0;
    const parts = byCategory.map((item) => {
      const portion = (item.value / total) * 100;
      const part = `${categories[item.name]} ${start}% ${start + portion}%`;
      start += portion;
      return part;
    });
    return `conic-gradient(${parts.join(", ")})`;
  })() : "conic-gradient(#e7e8ec 0 100%)";

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand"><div className="brandMark">E</div><span>Expensio</span></div>
        <nav>
          <button className="navItem active"><Icon name="grid" /><span>Overview</span></button>
          <button className="navItem"><Icon name="card" /><span>Transactions</span></button>
          <button className="navItem"><Icon name="chart" /><span>Reports</span></button>
          <button className="navItem"><Icon name="wallet" /><span>Budgets</span></button>
        </nav>
        <button className="navItem settings"><Icon name="settings" /><span>Settings</span></button>
        <div className="profile"><div className="avatar">RB</div><div><strong>Rohit Bohra</strong><span>Personal account</span></div></div>
      </aside>

      <section className="content">
        <header className="topbar">
          <div><p className="eyebrow">OVERVIEW</p><h1>Good morning, Rohit</h1></div>
          <div className="headerActions">
            <button className="iconButton" aria-label="Notifications"><Icon name="bell" /></button>
            <button className="addButton" onClick={() => { setEditing(null); setModal(true); }}><Icon name="plus" /> Add expense</button>
          </div>
        </header>

        <section className="metrics">
          <article className="metricCard"><span>Total balance</span><strong>${(savings + total).toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong><small className="positive">+8.4% this month</small></article>
          <article className="metricCard"><span>Monthly spending</span><strong>${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong><small>November 2026</small></article>
          <article className="metricCard"><span>Monthly savings</span><strong>${savings.toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong><small className="positive">32% of income</small></article>
        </section>

        <section className="dashboardGrid">
          <article className="panel spendingPanel">
            <div className="panelHeader"><div><p>Spending overview</p><h2>Weekly activity</h2></div><button className="period">November <span>⌄</span></button></div>
            <div className="barChart">
              {weekly.map((height, index) => <div className="barWrap" key={index}><div className={`bar ${index === 5 ? "highlight" : ""}`} style={{ height: `${height}%` }}>{index === 5 && <b>$96</b>}</div><span>{["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][index]}</span></div>)}
            </div>
          </article>

          <article className="panel budgetPanel">
            <div className="panelHeader"><div><p>Monthly budget</p><h2>Budget progress</h2></div><button className="more" aria-label="More options"><Icon name="more" /></button></div>
            <div className="budgetRing" style={{ "--progress": `${Math.min((total / 1200) * 100, 100)}%` } as React.CSSProperties}><div><strong>{Math.round((total / 1200) * 100)}%</strong><span>used</span></div></div>
            <div className="budgetLabels"><div><span>Spent</span><strong>${total.toFixed(2)}</strong></div><div><span>Remaining</span><strong>${Math.max(1200 - total, 0).toFixed(2)}</strong></div></div>
          </article>

          <article className="panel categoryPanel">
            <div className="panelHeader"><div><p>Categories</p><h2>Spending by category</h2></div></div>
            <div className="categoryBody">
              <div className="donut" style={{ background: donutGradient }}><div><strong>${total.toFixed(0)}</strong><span>Total</span></div></div>
              <div className="legend">{[...byCategory].sort((a, b) => b.value - a.value).map((item) => <div className="legendItem" key={item.name}><span className="dot" style={{ background: categories[item.name] }}/><span>{item.name}</span><strong>${item.value.toFixed(2)}</strong></div>)}</div>
            </div>
          </article>

          <article className="panel transactionsPanel">
            <div className="panelHeader"><div><p>Transactions</p><h2>Recent expenses</h2></div><button className="viewAll">View all</button></div>
            <div className="toolbar">
              <label className="search"><Icon name="search" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search expenses" /></label>
              <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter by category"><option>All</option>{Object.keys(categories).map((name) => <option key={name}>{name}</option>)}</select>
            </div>
            <div className="transactionList">
              {filtered.length ? filtered.map((expense) => <div className="transaction" key={expense.id}><div className="categoryIcon" style={{ background: `${expense.color}25`, color: expense.color }}>{expense.category[0]}</div><div className="transactionName"><strong>{expense.title}</strong><span>{expense.category} · {new Date(`${expense.date}T00:00:00`).toLocaleDateString()}</span></div><strong className="amount">-${expense.amount.toFixed(2)}</strong><div className="transactionActions"><button onClick={() => openEdit(expense)}>Edit</button><button onClick={() => deleteExpense(expense.id)} aria-label={`Delete ${expense.title}`}>×</button></div></div>) : <div className="empty">No expenses found.</div>}
            </div>
          </article>
        </section>
      </section>

      {modal && <div className="overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setModal(false); }}><form className="modal" onSubmit={submitExpense}><div className="modalHeader"><div><p>{editing ? "UPDATE EXPENSE" : "NEW EXPENSE"}</p><h2>{editing ? "Edit expense" : "Add an expense"}</h2></div><button type="button" onClick={() => setModal(false)}>×</button></div><label>Title<input name="title" defaultValue={editing?.title || ""} placeholder="e.g. Grocery shopping" required /></label><div className="formRow"><label>Amount<input name="amount" type="number" min="0.01" step="0.01" defaultValue={editing?.amount || ""} placeholder="0.00" required /></label><label>Category<select name="category" defaultValue={editing?.category || "Food"}>{Object.keys(categories).map((name) => <option key={name}>{name}</option>)}</select></label></div><label>Date<input name="date" type="date" defaultValue={editing?.date || "2026-11-23"} required /></label><div className="modalActions"><button type="button" className="cancel" onClick={() => setModal(false)}>Cancel</button><button type="submit" className="save">{editing ? "Save changes" : "Add expense"}</button></div></form></div>}
    </main>
  );
}
