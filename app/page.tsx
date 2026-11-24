"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Transaction = { id: number; title: string; category: string; amount: number; date: string; type: "income" | "expense" };
type View = "overview" | "transactions" | "reports" | "budgets" | "profile";

const categories: Record<string, string> = { Food: "#fb806f", Transport: "#7668e8", Shopping: "#e8b94f", Bills: "#48ad8c", Health: "#6297e8", Entertainment: "#bd78d2", Freelance: "#55a98c", Pharmacy: "#6297e8", Clothing: "#7668e8", "Internet + Electricity": "#48ad8c", "Side project": "#55a98c", Other: "#89909f" };
const demoTransactions: Transaction[] = [
  { id: 1, title: "Pharmacy", category: "Pharmacy", amount: 30, date: "2026-07-12", type: "expense" },
  { id: 2, title: "Clothing", category: "Clothing", amount: 85, date: "2026-07-10", type: "expense" },
  { id: 3, title: "Movie night", category: "Entertainment", amount: 60, date: "2026-07-08", type: "expense" },
  { id: 4, title: "Internet + Electricity", category: "Internet + Electricity", amount: 200, date: "2026-07-06", type: "expense" },
  { id: 5, title: "Side project", category: "Side project", amount: 500, date: "2026-07-05", type: "income" },
  { id: 6, title: "Fuel", category: "Transport", amount: 45, date: "2026-07-04", type: "expense" },
  { id: 7, title: "Salary", category: "Freelance", amount: 2500, date: "2026-07-01", type: "income" },
  { id: 8, title: "Groceries", category: "Food", amount: 120, date: "2026-07-03", type: "expense" },
];

const formatMoney = (amount: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(amount);
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const formatDate = (date: string) => new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });

function TransactionModal({ item, onClose, onSave }: { item: Transaction | null; onClose: () => void; onSave: (value: Omit<Transaction, "id">) => void }) {
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = new FormData(event.currentTarget); const title = String(data.get("title") ?? "").trim(); const amount = Number(data.get("amount")); if (!title || amount <= 0) return; onSave({ title, amount, category: String(data.get("category")), date: String(data.get("date")), type: String(data.get("type")) as "income" | "expense" }); }
  return <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><form className="modal" onSubmit={submit}><div className="modalHeading"><div><p>NEW ENTRY</p><h2>New transaction</h2></div><button type="button" onClick={onClose}>×</button></div><div className="typeToggle"><label><input name="type" type="radio" value="expense" defaultChecked={item?.type !== "income"} /> Expense</label><label><input name="type" type="radio" value="income" defaultChecked={item?.type === "income"} /> Income</label></div><label>Description<input name="title" defaultValue={item?.title ?? ""} placeholder="e.g. Grocery shopping" required autoFocus /></label><div className="formRow"><label>Amount (₹)<input name="amount" type="number" min="0.01" step="0.01" defaultValue={item?.amount ?? ""} required /></label><label>Category<select name="category" defaultValue={item?.category ?? "Food"}>{Object.keys(categories).map((name) => <option key={name}>{name}</option>)}</select></label></div><label>Date<input name="date" type="date" defaultValue={item?.date ?? today()} required /></label><div className="modalActions"><button type="button" className="cancel" onClick={onClose}>Cancel</button><button type="submit" className="save">Save transaction</button></div></form></div>;
}

export default function Home() {
  const [view, setView] = useState<View>("overview");
  const [transactions, setTransactions] = useState<Transaction[]>(demoTransactions);
  const [budget, setBudget] = useState(0);
  const [month, setMonth] = useState("2026-07");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [dark, setDark] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { try { const saved = localStorage.getItem("ledger-transactions"); if (saved) setTransactions(JSON.parse(saved)); else setTransactions(demoTransactions); const savedBudget = localStorage.getItem("ledger-budget"); if (savedBudget) setBudget(Number(savedBudget) || 0); setDark(localStorage.getItem("ledger-theme") === "dark"); } catch {} setLoaded(true); }, []);
  useEffect(() => { if (loaded) { localStorage.setItem("ledger-transactions", JSON.stringify(transactions)); localStorage.setItem("ledger-budget", String(budget)); localStorage.setItem("ledger-theme", dark ? "dark" : "light"); } }, [transactions, budget, dark, loaded]);

  const monthly = useMemo(() => transactions.filter((item) => item.date.startsWith(month)), [transactions, month]);
  const income = useMemo(() => monthly.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amount, 0), [monthly]);
  const expenses = useMemo(() => monthly.filter((item) => item.type === "expense"), [monthly]);
  const expenseTotal = useMemo(() => expenses.reduce((sum, item) => sum + item.amount, 0), [expenses]);
  const balance = income - expenseTotal;
  const percent = budget > 0 ? Math.min(expenseTotal / budget * 100, 100) : 0;
  const monthLabel = new Date(`${month}-01T00:00:00`).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const categoryTotals = useMemo(() => Object.keys(categories).map((name) => ({ name, amount: expenses.filter((item) => item.category === name).reduce((sum, item) => sum + item.amount, 0) })).filter((item) => item.amount > 0).sort((a, b) => b.amount - a.amount), [expenses]);
  const filtered = useMemo(() => monthly.filter((item) => filter === "All" || (filter === "Income" ? item.type === "income" : item.type === "expense")).filter((item) => !search || item.title.toLowerCase().includes(search.toLowerCase())).sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id), [monthly, filter, search]);

  function save(value: Omit<Transaction, "id">) { if (editing) setTransactions((all) => all.map((item) => item.id === editing.id ? { ...item, ...value } : item)); else setTransactions((all) => [{ ...value, id: Date.now() }, ...all]); setModal(false); setEditing(null); }
  function remove(id: number) { if (confirm("Delete this transaction?")) setTransactions((all) => all.filter((item) => item.id !== id)); }

  const nav = [{ id: "overview" as View, label: "Dashboard", icon: "◎" }, { id: "transactions" as View, label: "Transactions", icon: "≡" }, { id: "reports" as View, label: "Reports", icon: "▥" }, { id: "budgets" as View, label: "Budget", icon: "▣" }, { id: "profile" as View, label: "Profile", icon: "♟" }];
  const titles: Record<View, string> = { overview: "Hey, Demo", transactions: "Transactions", reports: "Reports", budgets: "Monthly budget", profile: "Profile" };

  return <main className={`ledger ${dark ? "dark" : ""}`}><aside className="sidebar"><div className="brand"><span className="brandDot" />Ledger.</div><nav>{nav.map((item) => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => setView(item.id)}><span className="navIcon">{item.icon}</span>{item.label}</button>)}</nav><div className="sidebarBottom"><button onClick={() => setDark((value) => !value)}><span>◐</span>{dark ? "Light" : "Dark"}</button><button onClick={() => { if (confirm("Reset demo data?")) { setTransactions(demoTransactions); setBudget(0); } }}><span>↪</span>Logout</button></div></aside>
    <section className="main"><header className="topbar"><div><p className="eyebrow">{view.toUpperCase()}</p><h1>{titles[view]}</h1>{view === "overview" && <p className="subtitle">Here&apos;s what&apos;s happening with your money today.</p>}</div><div className="topActions"><input className="monthInput" type="month" value={month} onChange={(e) => setMonth(e.target.value)} /><button className="newButton" onClick={() => { setEditing(null); setModal(true); }}>＋ New transaction</button></div></header>

      {view === "overview" && <><div className="summaryGrid"><Card label="Total income" value={formatMoney(income)} note="Money in" tone="white" icon="↓" /><Card label="Total expenses" value={formatMoney(expenseTotal)} note="Money out" tone="white" icon="↑" /><Card label="Current balance" value={formatMoney(balance)} note={balance >= 0 ? "You're in the green" : "You're over budget"} tone="navy" icon="⚖" /><Card label="Transactions" value={String(monthly.length)} note="All time" tone="white" icon="#" /></div><div className="overviewGrid"><section className="panel budgetCard"><div className="panelHeader"><h2>This month&apos;s budget</h2><button onClick={() => setView("budgets")}>Manage →</button></div>{budget > 0 ? <><div className="budgetNumbers"><strong>{percent.toFixed(0)}%</strong><span>{formatMoney(expenseTotal)} of {formatMoney(budget)}</span></div><div className="progress"><i style={{ width: `${percent}%` }} /></div></> : <p>No budget set for this month. <button onClick={() => setView("budgets")}>Set one.</button></p>}</section><section className="panel activityCard"><div className="panelHeader"><h2>Recent activity</h2><button onClick={() => setView("transactions")}>View all →</button></div>{[...monthly].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6).map((item) => <Row key={item.id} item={item} edit={(x) => { setEditing(x); setModal(true); }} remove={remove} />)}</section></div></>}

      {view === "transactions" && <><div className="strip"><div><span>Transactions in {monthLabel}</span><strong>{filtered.length}</strong></div><div><span>Monthly balance</span><strong>{formatMoney(balance)}</strong></div></div><section className="panel"><div className="filterBar"><input placeholder="Search transactions" value={search} onChange={(e) => setSearch(e.target.value)} /><select value={filter} onChange={(e) => setFilter(e.target.value)}><option>All</option><option>Income</option><option>Expense</option></select></div>{filtered.length ? filtered.map((item) => <Row key={item.id} item={item} edit={(x) => { setEditing(x); setModal(true); }} remove={remove} />) : <p className="empty">No matching transactions.</p>}</section></>}

      {view === "reports" && <><div className="summaryGrid"><Card label="Total income" value={formatMoney(income)} note={monthLabel} tone="white" icon="↓" /><Card label="Total expenses" value={formatMoney(expenseTotal)} note={monthLabel} tone="white" icon="↑" /><Card label="Average expense" value={formatMoney(expenses.length ? expenseTotal / expenses.length : 0)} note="Per transaction" tone="white" icon="≈" /><Card label="Top category" value={categoryTotals[0]?.name ?? "—"} note={categoryTotals[0] ? formatMoney(categoryTotals[0].amount) : "No expenses"} tone="navy" icon="◉" /></div><section className="panel reportPanel"><div className="panelHeader"><h2>Spending by category</h2></div>{categoryTotals.map((item) => <div className="reportItem" key={item.name}><div><span><i style={{ background: categories[item.name] }} />{item.name}</span><strong>{formatMoney(item.amount)}</strong></div><div className="reportTrack"><i style={{ width: `${expenseTotal ? item.amount / expenseTotal * 100 : 0}%`, background: categories[item.name] }} /></div></div>)}</section></>}

      {view === "budgets" && <><div className="summaryGrid"><Card label="Monthly limit" value={formatMoney(budget)} note={monthLabel} tone="white" icon="◫" /><Card label="Spent so far" value={formatMoney(expenseTotal)} note={`${expenses.length} expenses`} tone="white" icon="↑" /><Card label={expenseTotal > budget ? "Over budget" : "Available"} value={formatMoney(Math.abs(budget - expenseTotal))} note={expenseTotal > budget ? "Above monthly limit" : "Remaining this month"} tone="white" icon="↓" /><Card label="Budget used" value={`${percent.toFixed(0)}%`} note="of monthly limit" tone="navy" icon="◉" /></div><section className="panel budgetSettings"><h2>Monthly spending limit</h2><label>Set your budget in INR<input type="number" min="0" step="500" value={budget} onChange={(e) => setBudget(Math.max(0, Number(e.target.value) || 0))} /></label><div className="budgetNumbers"><strong>{percent.toFixed(0)}% used</strong><span>{formatMoney(expenseTotal)} of {formatMoney(budget)}</span></div><div className="progress large"><i style={{ width: `${percent}%` }} /></div></section></>}

      {view === "profile" && <section className="panel profileCard"><div className="profileAvatar">D</div><h2>Demo User</h2><p>Personal account</p><button className="newButton" onClick={() => setView("overview")}>Back to dashboard</button></section>}
    </section>{modal && <TransactionModal item={editing} onClose={() => { setModal(false); setEditing(null); }} onSave={save} />}</main>;
}

function Card({ label, value, note, tone, icon }: { label: string; value: string; note: string; tone: "white" | "navy"; icon: string }) { return <article className={`summaryCard ${tone}`}><div className="cardIcon">{icon}</div><span>{label}</span><strong>{value}</strong><small>{note}</small></article>; }
function Row({ item, edit, remove }: { item: Transaction; edit: (item: Transaction) => void; remove: (id: number) => void }) { const color = categories[item.category] ?? categories.Other; return <div className="transactionRow"><div className="categoryIcon" style={{ color, background: `${color}20` }}>{item.category.slice(0, 1)}</div><div className="transactionName"><strong>{item.title}</strong><span>{item.category} · {formatDate(item.date)}</span></div><strong className={item.type === "income" ? "amount income" : "amount expense"}>{item.type === "income" ? "+" : "−"}{formatMoney(item.amount)}</strong><div className="rowActions"><button onClick={() => edit(item)}>Edit</button><button onClick={() => remove(item.id)}>×</button></div></div>; }
