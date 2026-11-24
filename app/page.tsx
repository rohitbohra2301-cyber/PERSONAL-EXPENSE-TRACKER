"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import "./auth.css";

type Transaction = { id: number; title: string; category: string; amount: number; date: string; type: "income" | "expense" };
type View = "overview" | "transactions" | "reports" | "budgets" | "profile";
type Account = { email: string; name: string };

const DEMO_EMAIL = "demo@demo.com";
const DEMO_PASSWORD = "demo123";
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
const nav: { id: View; label: string; icon: string }[] = [{ id: "overview", label: "Dashboard", icon: "◉" }, { id: "transactions", label: "Transactions", icon: "≡" }, { id: "reports", label: "Reports", icon: "▥" }, { id: "budgets", label: "Budget", icon: "▣" }, { id: "profile", label: "Profile", icon: "♟" }];
const formatMoney = (amount: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(amount);
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const formatDate = (date: string) => new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });

function LoginScreen({ onLogin }: { onLogin: (account: Account) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (email.trim().toLowerCase() !== DEMO_EMAIL || password !== DEMO_PASSWORD) {
      setError("Those details don't match the demo account. Use the demo credentials below.");
      return;
    }
    onLogin({ email: DEMO_EMAIL, name: "Demo" });
  }
  return <main className="loginScreen"><section className="loginFormSide"><div className="loginBrand"><i />Ledger.</div><div className="loginContent"><h1>Welcome back</h1><p className="loginSubtitle">Sign in to keep tracking every rupee.</p><form onSubmit={login}><label>Email<input type="email" autoComplete="username" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus /></label><label>Password<input type="password" autoComplete="current-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>{error && <p className="loginError" role="alert">{error}</p>}<button className="loginSubmit" type="submit">Sign in <span>→</span></button></form><p className="localNote">This demo stores your session and data in this browser only. It is not secure authentication.</p><button className="demoCredentials" onClick={() => { setEmail(DEMO_EMAIL); setPassword(DEMO_PASSWORD); setError(""); }}><span>✦</span> Try demo: <strong>{DEMO_EMAIL}</strong><b>/</b><strong>{DEMO_PASSWORD}</strong></button></div></section><section className="loginArtwork"><div className="artCopy"><span>PERSONAL FINANCE, UNFILTERED</span><h2>Every rupee<br />tells a story.</h2><p>A tidy monthly ledger. Zero fluff. Just clarity.</p></div></section></main>;
}

function TransactionModal({ item, onClose, onSave }: { item: Transaction | null; onClose: () => void; onSave: (value: Omit<Transaction, "id">) => void }) {
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = new FormData(event.currentTarget); const title = String(data.get("title") ?? "").trim(); const amount = Number(data.get("amount")); if (!title || amount <= 0) return; onSave({ title, amount, category: String(data.get("category")), date: String(data.get("date")), type: String(data.get("type")) as "income" | "expense" }); }
  return <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><form className="modal" onSubmit={submit}><div className="modalHeading"><div><p>NEW ENTRY</p><h2>{item ? "Edit transaction" : "New transaction"}</h2></div><button type="button" onClick={onClose}>×</button></div><div className="typeToggle"><label><input name="type" type="radio" value="expense" defaultChecked={item?.type !== "income"} /> Expense</label><label><input name="type" type="radio" value="income" defaultChecked={item?.type === "income"} /> Income</label></div><label>Description<input name="title" defaultValue={item?.title ?? ""} placeholder="e.g. Grocery shopping" required autoFocus /></label><div className="formRow"><label>Amount (₹)<input name="amount" type="number" min="0.01" step="0.01" defaultValue={item?.amount ?? ""} required /></label><label>Category<select name="category" defaultValue={item?.category ?? "Food"}>{Object.keys(categories).map((name) => <option key={name}>{name}</option>)}</select></label></div><label>Date<input name="date" type="date" defaultValue={item?.date ?? today()} required /></label><div className="modalActions"><button type="button" className="cancel" onClick={onClose}>Cancel</button><button type="submit" className="save">Save transaction</button></div></form></div>;
}

export default function Home() {
  const [account, setAccount] = useState<Account | null>(null);
  const [view, setView] = useState<View>("overview");
  const [transactions, setTransactions] = useState<Transaction[]>(demoTransactions);
  const [budget, setBudget] = useState(0);
  const [month, setMonth] = useState("2026-07");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [dark, setDark] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("ledger-transactions");
      if (saved) setTransactions(JSON.parse(saved));
      const savedBudget = localStorage.getItem("ledger-budget");
      if (savedBudget !== null) setBudget(Number(savedBudget) || 0);
      setDark(localStorage.getItem("ledger-theme") === "dark");
      setAutoSave(localStorage.getItem("ledger-autosave") !== "false");
      const session = localStorage.getItem("ledger-session");
      if (session) setAccount(JSON.parse(session) as Account);
    } catch { /* Start with demo data if browser storage is unavailable or malformed. */ }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded || !autoSave) return;
    try {
      localStorage.setItem("ledger-transactions", JSON.stringify(transactions));
      localStorage.setItem("ledger-budget", String(budget));
      localStorage.setItem("ledger-theme", dark ? "dark" : "light");
      localStorage.setItem("ledger-autosave", "true");
    } catch { /* Keep the current session usable if storage is unavailable. */ }
  }, [transactions, budget, dark, autoSave, loaded]);

  const monthly = useMemo(() => transactions.filter((item) => item.date.startsWith(month)), [transactions, month]);
  const income = useMemo(() => monthly.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amount, 0), [monthly]);
  const expenses = useMemo(() => monthly.filter((item) => item.type === "expense"), [monthly]);
  const expenseTotal = useMemo(() => expenses.reduce((sum, item) => sum + item.amount, 0), [expenses]);
  const balance = income - expenseTotal;
  const percent = budget > 0 ? Math.min(expenseTotal / budget * 100, 100) : 0;
  const monthLabel = new Date(`${month}-01T00:00:00`).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const categoryTotals = useMemo(() => Object.keys(categories).map((name) => ({ name, amount: expenses.filter((item) => item.category === name).reduce((sum, item) => sum + item.amount, 0) })).filter((item) => item.amount > 0).sort((a, b) => b.amount - a.amount), [expenses]);
  const filtered = useMemo(() => monthly.filter((item) => filter === "All" || (filter === "Income" ? item.type === "income" : item.type === "expense")).filter((item) => !search || item.title.toLowerCase().includes(search.toLowerCase())).sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id), [monthly, filter, search]);

  function login(nextAccount: Account) {
    setAccount(nextAccount);
    try { localStorage.setItem("ledger-session", JSON.stringify(nextAccount)); } catch {}
  }
  function save(value: Omit<Transaction, "id">) {
    const next = editing ? transactions.map((item) => item.id === editing.id ? { ...item, ...value } : item) : [{ ...value, id: Date.now() }, ...transactions];
    setTransactions(next);
    if (!autoSave) setSaveStatus("Unsaved changes");
    setModal(false); setEditing(null);
  }
  function remove(id: number) {
    if (!confirm("Delete this transaction?")) return;
    setTransactions((all) => all.filter((item) => item.id !== id));
    if (!autoSave) setSaveStatus("Unsaved changes");
  }
  const [saveStatus, setSaveStatus] = useState("All changes saved");
  function saveNow() {
    try {
      localStorage.setItem("ledger-transactions", JSON.stringify(transactions));
      localStorage.setItem("ledger-budget", String(budget));
      localStorage.setItem("ledger-theme", dark ? "dark" : "light");
      localStorage.setItem("ledger-autosave", String(autoSave));
      setSaveStatus("All changes saved");
      return true;
    } catch { setSaveStatus("Could not save in this browser"); return false; }
  }
  function toggleAutoSave() {
    if (!autoSave) { setAutoSave(true); localStorage.setItem("ledger-autosave", "true"); saveNow(); }
    else { setAutoSave(false); localStorage.setItem("ledger-autosave", "false"); }
  }
  function logout() {
    if (autoSave) saveNow();
    else if (confirm("Auto-save is off. Save your changes before logging out? Choose OK to save, or Cancel to log out without saving.")) saveNow();
    try { localStorage.removeItem("ledger-session"); } catch {}
    setAccount(null);
  }

  if (!loaded) return <main className="loadingScreen">Loading Ledger…</main>;
  if (!account) return <LoginScreen onLogin={login} />;

  const titles: Record<View, string> = { overview: `Hey, ${account.name}`, transactions: "Transactions", reports: "Reports", budgets: "Monthly budget", profile: "Profile" };
  return <main className={`ledger ${dark ? "dark" : ""}`}><aside className="sidebar"><div className="brand"><span className="brandDot" />Ledger.</div><nav>{nav.map((item) => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => setView(item.id)}><span className="navIcon">{item.icon}</span>{item.label}</button>)}</nav><div className="sidebarBottom"><button onClick={() => setDark((value) => !value)}><span>◐</span>{dark ? "Light" : "Dark"}</button><label className="autoSaveControl"><input type="checkbox" checked={autoSave} onChange={toggleAutoSave} /><span className="autoSaveText">Auto-save</span><small>{autoSave ? "On" : "Off"}</small></label><div className="saveStatus" aria-live="polite">{saveStatus}</div><button onClick={logout}><span>↪</span>Logout</button></div></aside>
    <section className="main"><header className="topbar"><div><p className="eyebrow">{view.toUpperCase()}</p><h1>{titles[view]}</h1>{view === "overview" && <p className="subtitle">Here&apos;s what&apos;s happening with your money today.</p>}</div><div className="topActions"><input className="monthInput" type="month" value={month} onChange={(e) => setMonth(e.target.value)} /><button className="newButton" onClick={() => { setEditing(null); setModal(true); }}>＋ New transaction</button></div></header>
      {view === "overview" && <><div className="summaryGrid"><Card label="Total income" value={formatMoney(income)} note="Money in" tone="white" icon="↓" /><Card label="Total expenses" value={formatMoney(expenseTotal)} note="Money out" tone="white" icon="↑" /><Card label="Current balance" value={formatMoney(balance)} note={balance >= 0 ? "You're in the green" : "You're over budget"} tone="navy" icon="⚖" /><Card label="Transactions" value={String(transactions.length)} note="All time" tone="white" icon="#" /></div><div className="overviewGrid"><section className="panel budgetCard"><div className="panelHeader"><h2>This month&apos;s budget</h2><button onClick={() => setView("budgets")}>Manage →</button></div>{budget > 0 ? <><div className="budgetNumbers"><strong>{percent.toFixed(0)}%</strong><span>{formatMoney(expenseTotal)} of {formatMoney(budget)}</span></div><div className="progress"><i style={{ width: `${percent}%` }} /></div></> : <p>No budget set for this month. <button onClick={() => setView("budgets")}>Set one.</button></p>}</section><section className="panel activityCard"><div className="panelHeader"><h2>Recent activity</h2><button onClick={() => setView("transactions")}>View all →</button></div>{[...monthly].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6).map((item) => <Row key={item.id} item={item} edit={(x) => { setEditing(x); setModal(true); }} remove={remove} />)}</section></div></>}
      {view === "transactions" && <><div className="strip"><div><span>Transactions in {monthLabel}</span><strong>{filtered.length}</strong></div><div><span>Monthly balance</span><strong>{formatMoney(balance)}</strong></div></div><section className="panel"><div className="filterBar"><input placeholder="Search transactions" value={search} onChange={(e) => setSearch(e.target.value)} /><select value={filter} onChange={(e) => setFilter(e.target.value)}><option>All</option><option>Income</option><option>Expense</option></select></div>{filtered.length ? filtered.map((item) => <Row key={item.id} item={item} edit={(x) => { setEditing(x); setModal(true); }} remove={remove} />) : <p className="empty">No matching transactions.</p>}</section></>}
      {view === "reports" && <><div className="summaryGrid"><Card label="Total income" value={formatMoney(income)} note={monthLabel} tone="white" icon="↓" /><Card label="Total expenses" value={formatMoney(expenseTotal)} note={monthLabel} tone="white" icon="↑" /><Card label="Average expense" value={formatMoney(expenses.length ? expenseTotal / expenses.length : 0)} note="Per transaction" tone="white" icon="≈" /><Card label="Top category" value={categoryTotals[0]?.name ?? "—"} note={categoryTotals[0] ? formatMoney(categoryTotals[0].amount) : "No expenses"} tone="navy" icon="◉" /></div><section className="panel reportPanel"><div className="panelHeader"><h2>Spending by category</h2></div>{categoryTotals.map((item) => <div className="reportItem" key={item.name}><div><span><i style={{ background: categories[item.name] }} />{item.name}</span><strong>{formatMoney(item.amount)}</strong></div><div className="reportTrack"><i style={{ width: `${expenseTotal ? item.amount / expenseTotal * 100 : 0}%`, background: categories[item.name] }} /></div></div>)}</section></>}
      {view === "budgets" && <><div className="summaryGrid"><Card label="Monthly limit" value={formatMoney(budget)} note={monthLabel} tone="white" icon="◫" /><Card label="Spent so far" value={formatMoney(expenseTotal)} note={`${expenses.length} expenses`} tone="white" icon="↑" /><Card label={expenseTotal > budget ? "Over budget" : "Available"} value={formatMoney(Math.abs(budget - expenseTotal))} note={expenseTotal > budget ? "Above monthly limit" : "Remaining this month"} tone="white" icon="↓" /><Card label="Budget used" value={`${percent.toFixed(0)}%`} note="of monthly limit" tone="navy" icon="◉" /></div><section className="panel budgetSettings"><h2>Monthly spending limit</h2><label>Set your budget in INR<input type="number" min="0" step="500" value={budget} onChange={(e) => { setBudget(Math.max(0, Number(e.target.value) || 0)); if (!autoSave) setSaveStatus("Unsaved changes"); }} /></label><div className="budgetNumbers"><strong>{percent.toFixed(0)}% used</strong><span>{formatMoney(expenseTotal)} of {formatMoney(budget)}</span></div><div className="progress large"><i style={{ width: `${percent}%` }} /></div></section></>}
      {view === "profile" && <section className="panel profileCard"><div className="profileAvatar">{account.name.slice(0, 1).toUpperCase()}</div><h2>{account.name}</h2><p>{account.email}</p><p>Personal account · saved in this browser</p><label className="profileAutoSave"><input type="checkbox" checked={autoSave} onChange={toggleAutoSave} /> Automatically save my changes</label><button className="newButton" onClick={logout}>Logout</button></section>}
    </section>{modal && <TransactionModal item={editing} onClose={() => { setModal(false); setEditing(null); }} onSave={save} />}</main>;
}

function Card({ label, value, note, tone, icon }: { label: string; value: string; note: string; tone: "white" | "navy"; icon: string }) { return <article className={`summaryCard ${tone}`}><div className="cardIcon">{icon}</div><span>{label}</span><strong>{value}</strong><small>{note}</small></article>; }
function Row({ item, edit, remove }: { item: Transaction; edit: (item: Transaction) => void; remove: (id: number) => void }) { const color = categories[item.category] ?? categories.Other; return <div className="transactionRow"><div className="categoryIcon" style={{ color, background: `${color}20` }}>{item.category.slice(0, 1)}</div><div className="transactionName"><strong>{item.title}</strong><span>{item.category} · {formatDate(item.date)}</span></div><strong className={item.type === "income" ? "amount income" : "amount expense"}>{item.type === "income" ? "+" : "−"}{formatMoney(item.amount)}</strong><div className="rowActions"><button onClick={() => edit(item)}>Edit</button><button onClick={() => remove(item.id)}>×</button></div></div>; }
