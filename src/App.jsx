import { useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import "./App.css";

function money(value) {
  return `£${Number(value || 0).toFixed(2)}`;
}

export default function App() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [month] = useState("May");
  const [year] = useState(2026);
  const [entries, setEntries] = useState([]);

  const [form, setForm] = useState({
    section: "household_bill",
    name: "",
    amount: "",
    due_day: "",
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user) loadEntries();
  }, [session]);

  async function signIn() {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
  }

  async function signUp() {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert(error.message);
    else alert("Check your email.");
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function loadEntries() {
    const { data, error } = await supabase
      .from("budget_entries")
      .select("*")
      .eq("month", month)
      .eq("year", year)
      .order("created_at", { ascending: true });

    if (error) return alert(error.message);
    setEntries(data || []);
  }

  async function addEntry(e) {
    e.preventDefault();

    const { error } = await supabase.from("budget_entries").insert({
      user_id: session.user.id,
      month,
      year,
      section: form.section,
      name: form.name,
      amount: Number(form.amount || 0),
      due_day: form.due_day ? Number(form.due_day) : null,
    });

    if (error) return alert(error.message);

    setForm({
      section: "household_bill",
      name: "",
      amount: "",
      due_day: "",
    });

    loadEntries();
  }

  async function updateEntry(id, field, value) {
    const { error } = await supabase
      .from("budget_entries")
      .update({ [field]: value })
      .eq("id", id);

    if (error) alert(error.message);
  }

  async function deleteEntry(id) {
    await supabase.from("budget_entries").delete().eq("id", id);
    loadEntries();
  }

  async function duplicateEntry(entry) {
    const { error } = await supabase.from("budget_entries").insert({
      user_id: session.user.id,
      month,
      year,
      section: entry.section,
      name: `${entry.name} copy`,
      amount: entry.amount,
      due_day: entry.due_day,
    });

    if (error) alert(error.message);
    else loadEntries();
  }

  const totals = useMemo(() => {
    const total = (section) =>
      entries
        .filter((e) => e.section === section)
        .reduce((sum, e) => sum + Number(e.amount), 0);

    const household = total("household_bill");
    const regular = total("regular_payment");
    const income = total("income") + total("carried_over");

    return {
      income,
      household,
      half: household / 2,
      regular,
      monthly: income - household / 2 - regular,
      weekly: (income - household / 2 - regular) / 4,
    };
  }, [entries]);

  if (!session) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>Monthly Budget Planner</h1>
          <input placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
          <input placeholder="Password" type="password" onChange={(e) => setPassword(e.target.value)} />
          <button onClick={signIn}>Login</button>
          <button onClick={signUp}>Create account</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="topbar">
        <h1>Monthly Budget Planner</h1>
        <button onClick={signOut}>Logout</button>
      </div>

      <div className="summary-grid">
        <div><span>Income</span><strong>{money(totals.income)}</strong></div>
        <div><span>Household</span><strong>{money(totals.household)}</strong></div>
        <div><span>50%</span><strong>{money(totals.half)}</strong></div>
        <div><span>Regular</span><strong>{money(totals.regular)}</strong></div>
        <div><span>Monthly Left</span><strong>{money(totals.monthly)}</strong></div>
        <div><span>Weekly Left</span><strong>{money(totals.weekly)}</strong></div>
      </div>

      <form onSubmit={addEntry} className="entry-form">
        <select value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })}>
          <option value="income">Income</option>
          <option value="carried_over">Carried over</option>
          <option value="household_bill">Household bill</option>
          <option value="regular_payment">Regular payment</option>
          <option value="weekly_spending">Weekly spending</option>
        </select>

        <input
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />

        <input
          placeholder="Amount"
          type="number"
          step="0.01"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          required
        />

        <input
          placeholder="Due day"
          type="number"
          value={form.due_day}
          onChange={(e) => setForm({ ...form, due_day: e.target.value })}
        />

        <button>Add Entry</button>
        <button type="button" onClick={() => window.print()}>Print / PDF</button>
      </form>

      <table>
        <thead>
          <tr>
            <th>Section</th>
            <th>Name</th>
            <th>Amount</th>
            <th>Due</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          {entries.map((e) => (
            <tr key={e.id}>
              <td>{e.section.replaceAll("_", " ")}</td>

              <td>
                <input
                  value={e.name}
                  onChange={(ev) => {
                    const val = ev.target.value;
                    setEntries((prev) => prev.map((x) => x.id === e.id ? { ...x, name: val } : x));
                    updateEntry(e.id, "name", val);
                  }}
                />
              </td>

              <td>
                <input
                  type="number"
                  value={e.amount}
                  onChange={(ev) => {
                    const val = ev.target.value;
                    setEntries((prev) => prev.map((x) => x.id === e.id ? { ...x, amount: val } : x));
                    updateEntry(e.id, "amount", Number(val));
                  }}
                />
              </td>

              <td>
                <input
                  type="number"
                  value={e.due_day || ""}
                  onChange={(ev) => {
                    const val = ev.target.value;
                    setEntries((prev) => prev.map((x) => x.id === e.id ? { ...x, due_day: val } : x));
                    updateEntry(e.id, "due_day", val ? Number(val) : null);
                  }}
                />
              </td>

              <td>
                <button onClick={() => duplicateEntry(e)}>Duplicate</button>
                <button onClick={() => deleteEntry(e.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
