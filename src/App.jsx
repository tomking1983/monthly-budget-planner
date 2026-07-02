import { useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import "./App.css";
const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const templateEntries = [
  { section: "income", name: "Wage", amount: 2101.51 },
  { section: "carried_over", name: "Money Carried Over", amount: 84 },

  { section: "household_bill", name: "TV Licence MBP", amount: 15, due_day: 1 },
  {
    section: "household_bill",
    name: "Wrekin Housing",
    amount: 739,
    due_day: 1,
  },
  {
    section: "household_bill",
    name: "Severn Trent Water",
    amount: 50,
    due_day: 1,
  },
  { section: "household_bill", name: "Plusnet", amount: 37.99, due_day: 2 },
  {
    section: "household_bill",
    name: "Epson Subscription",
    amount: 1.99,
    due_day: 9,
  },
  {
    section: "household_bill",
    name: "Moneybarn Range Rover",
    amount: 270.62,
    due_day: 10,
  },
  { section: "household_bill", name: "Creation", amount: 71, due_day: 10 },
  {
    section: "household_bill",
    name: "British Gas",
    amount: 129.18,
    due_day: 13,
  },
  {
    section: "household_bill",
    name: "Shropshire Council",
    amount: 191.81,
    due_day: 15,
  },
  { section: "household_bill", name: "RAC", amount: 10.54, due_day: 11 },
  { section: "household_bill", name: "Ring", amount: 4.99, due_day: 9 },
  { section: "household_bill", name: "Private Internet Access", amount: 10.99 },
  { section: "household_bill", name: "National Trust", amount: 15 },
  {
    section: "household_bill",
    name: "Amazon Prime",
    amount: 8.99,
    due_day: 22,
  },
  { section: "household_bill", name: "Netflix", amount: 12.99, due_day: 24 },
  { section: "household_bill", name: "School", amount: 55, due_day: 99 },
  { section: "household_bill", name: "Holiday", amount: 36 },
  { section: "household_bill", name: "Noah Nursery", amount: 60 },
  { section: "household_bill", name: "Nursery", amount: 56, due_day: 99 },
  { section: "household_bill", name: "Food", amount: 570, due_day: 99 },

  { section: "regular_payment", name: "DVLA T99CTY", amount: 17.09 },
  { section: "regular_payment", name: "Apple Bill", amount: 0.99 },
  {
    section: "regular_payment",
    name: "Go Skippy Car Insurance",
    amount: 67.84,
  },
  { section: "regular_payment", name: "iPhone Sky", amount: 30.62 },
  { section: "regular_payment", name: "Google One", amount: 1.59 },
  { section: "regular_payment", name: "Spotify", amount: 6.5 },
  { section: "regular_payment", name: "Debt Plans", amount: 10 },
  { section: "regular_payment", name: "Animal Friends", amount: 27.12 },
  { section: "regular_payment", name: "Microsoft 365", amount: 8.99 },
  { section: "regular_payment", name: "Ionos & Hostinger", amount: 25.19 },
  { section: "regular_payment", name: "Capital One", amount: 160 },
  { section: "regular_payment", name: "Crumb", amount: 4.95 },
  { section: "regular_payment", name: "EE Top Up", amount: 9 },
  { section: "regular_payment", name: "James", amount: 400 },
  { section: "regular_payment", name: "Klarna", amount: 55 },
];

function money(value) {
  return `£${Number(value || 0).toFixed(2)}`;
}

export default function App() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const currentDate = new Date();
  const currentMonth = months[currentDate.getMonth()];
  const currentYear = currentDate.getFullYear();

  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);
  const [targetMonth, setTargetMonth] = useState(months[(currentDate.getMonth() + 1) % 12]);
  const [targetYear, setTargetYear] = useState(
    currentDate.getMonth() === 11 ? currentYear + 1 : currentYear,
  );
  const [resetOnDuplicate, setResetOnDuplicate] = useState(false);
  const [entries, setEntries] = useState([]);
  const [entryFilter, setEntryFilter] = useState("all");

  const [openSections, setOpenSections] = useState({
    income: false,
    carried_over: false,
    household_bill: false,
    regular_payment: false,
  });

  const [form, setForm] = useState({
    section: "household_bill",
    name: "",
    amount: "",
    due_day: "",
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      },
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user) loadEntries();
  }, [session, month, year]);

  async function signIn() {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
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

  async function addTemplate() {
    // check if entries already exist for this month
    const { data: existing } = await supabase
      .from("budget_entries")
      .select("id")
      .eq("month", month)
      .eq("year", year)
      .limit(1);

    if (existing && existing.length > 0) {
      alert(
        "This month already has data. Clear it first if you want to recreate.",
      );
      return;
    }

    const rows = templateEntries.map((entry) => ({
      ...entry,
      user_id: session.user.id,
      month,
      year,
    }));

    const { error } = await supabase.from("budget_entries").insert(rows);

    if (error) alert(error.message);
    else loadEntries();
  }

  async function clearMonth() {
    if (!confirm("Are you sure you want to delete this month's data?")) return;

    const { error } = await supabase
      .from("budget_entries")
      .delete()
      .eq("month", month)
      .eq("year", year);

    if (error) alert(error.message);
    else loadEntries();
  }

  async function resetMonthValues() {
    if (!confirm("Reset all amounts for this month to £0?")) return;

    const { error } = await supabase
      .from("budget_entries")
      .update({ amount: 0 })
      .eq("month", month)
      .eq("year", year);

    if (error) alert(error.message);
    else loadEntries();
  }

  async function duplicateMonth() {
    if (!targetMonth || !targetYear) {
      alert("Enter a target month and year.");
      return;
    }

    const { data: existing } = await supabase
      .from("budget_entries")
      .select("id")
      .eq("month", targetMonth)
      .eq("year", Number(targetYear))
      .limit(1);

    if (existing && existing.length > 0) {
      const confirmOverwrite = confirm(
        `${targetMonth} ${targetYear} already has data. Do you want to overwrite it?`,
      );

      if (!confirmOverwrite) return;

      const { error: deleteError } = await supabase
        .from("budget_entries")
        .delete()
        .eq("month", targetMonth)
        .eq("year", Number(targetYear));

      if (deleteError) {
        alert(deleteError.message);
        return;
      }
    }

    const rows = entries.map((entry) => ({
      user_id: session.user.id,
      month: targetMonth,
      year: Number(targetYear),
      section: entry.section,
      name: entry.name,
      amount: resetOnDuplicate ? 0 : entry.amount,
      due_day: entry.due_day,
      week_number: entry.week_number,
      notes: entry.notes,
      paid: false,
    }));

    const { error } = await supabase.from("budget_entries").insert(rows);

    if (error) alert(error.message);
    else alert(`Copied ${month} ${year} to ${targetMonth} ${targetYear}.`);
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
      paid: false,
    });

    if (error) alert(error.message);
    else loadEntries();
  }

  function toggleSection(section) {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  }

  function isDueSoon(entry) {
  if (!entry.due_day || entry.paid) return false;

  const today = new Date();
  const currentMonth = months[today.getMonth()];
  const currentYear = today.getFullYear();

  if (month !== currentMonth || Number(year) !== currentYear) return false;

  const daysUntilDue = Number(entry.due_day) - today.getDate();
  return daysUntilDue >= 0 && daysUntilDue <= 7;
}

function filterEntriesForView(sectionEntries) {
  if (entryFilter === "paid") return sectionEntries.filter((e) => e.paid);
  if (entryFilter === "unpaid") return sectionEntries.filter((e) => !e.paid);
  if (entryFilter === "due_soon") {
    return sectionEntries.filter((e) => isDueSoon(e));
  }

  return sectionEntries;
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
          <input
            placeholder="Email"
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            placeholder="Password"
            type="password"
            onChange={(e) => setPassword(e.target.value)}
          />
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

      <div className="control-panel">
        <div className="control-row month-row">
          <div className="month-label-center">Select Month</div>
          <div>
            <select value={month} onChange={(e) => setMonth(e.target.value)}>
              {months.map((monthName) => (
                <option key={monthName} value={monthName}>
                  {monthName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="control-row">
          <div className="tool-card compact">
            <h3>Month actions</h3>
            <button onClick={addTemplate}>Create Template</button>
            <button onClick={resetMonthValues}>Reset</button>
            <button className="danger-button" onClick={clearMonth}>
              Clear
            </button>
          </div>

          <div className="tool-card compact">
            <h3>Duplicate</h3>

            <select
              value={targetMonth}
              onChange={(e) => setTargetMonth(e.target.value)}
            >
              {months.map((monthName) => (
                <option key={monthName} value={monthName}>
                  {monthName}
                </option>
              ))}
            </select>

            <input
              type="number"
              value={targetYear}
              onChange={(e) => setTargetYear(e.target.value)}
            />

            <label className="checkbox-group">
              <input
                type="checkbox"
                checked={resetOnDuplicate}
                onChange={(e) => setResetOnDuplicate(e.target.checked)}
              />
              <strong>
                <span>Reset amounts to £0</span>
              </strong>
              
            </label>

            <button onClick={duplicateMonth}>Duplicate</button>
          </div>
        </div>
      </div>

      
      <div className="summary-grid">
      <h2 className="viewing-title">
        Now Viewing:{" "}
        <span>
          {month} {year}
        </span>
      </h2>
        <div>
          <span>Income</span>
          <strong>{money(totals.income)}</strong>
        </div>
        <div>
          <span>House Bills</span>
          <strong>{money(totals.household)}</strong>
        </div>
        <div>
          <span>50% Split</span>
          <strong>{money(totals.half)}</strong>
        </div>
        <div>
          <span>TK Bills</span>
          <strong>{money(totals.regular)}</strong>
        </div>
        <div className="important-total">
          <span>Monthly Left</span>
          <strong>{money(totals.monthly)}</strong>
        </div>
        <div className="important-total">
          <span>Weekly Left</span>
          <strong>{money(totals.weekly)}</strong>
        </div>
      </div>


      {["income", "carried_over", "household_bill", "regular_payment"].map(
        (section) => {
          const sectionEntries = entries.filter((e) => e.section === section);

const sectionTotal = sectionEntries.reduce(
  (sum, e) => sum + Number(e.amount || 0),
  0,
);

const sectionPaid = sectionEntries
  .filter((e) => e.paid)
  .reduce((sum, e) => sum + Number(e.amount || 0), 0);

const sectionOutstanding = sectionTotal - sectionPaid;

const sectionPaidPercent = sectionTotal
  ? Math.round((sectionPaid / sectionTotal) * 100)
  : 0;

const visibleSectionEntries = filterEntriesForView(sectionEntries);

          return (
            <div key={section}>
              {section === "household_bill" && (
                <>
                  <div className="add-bill-panel">
                    <h3>Add Bill / Income</h3>
                    <form onSubmit={addEntry} className="entry-form">
                      <select
                        value={form.section}
                        onChange={(e) => setForm({ ...form, section: e.target.value })}
                      >
                        <option value="income">Income</option>
                        <option value="carried_over">Carried over</option>
                        <option value="household_bill">Household bill</option>
                        <option value="regular_payment">TK Bill</option>
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
                      <button type="button" onClick={() => window.print()}>
                        Print / PDF
                      </button>
                    </form>
                  </div>

                  <div className="quick-filters">
                    {["all", "unpaid", "paid", "due_soon"].map((filter) => (
                      <button
                        key={filter}
                        type="button"
                        className={entryFilter === filter ? "active-filter" : ""}
                        onClick={() => setEntryFilter(filter)}
                      >
                        {filter === "due_soon" ? "Due soon" : filter}
                      </button>
                    ))}
                  </div>
                </>
              )}

              <div className="section-block">
              <button
                type="button"
                className="section-header"
                onClick={() => toggleSection(section)}
              >
                <span>
                  {openSections[section] ? "▼" : "▶"}{" "}
                  {section.replaceAll("_", " ").toUpperCase()}
                </span>
                {section === "regular_payment" || section === "household_bill" ? (
  <span className="section-breakdown">
    <span>Paid: {money(sectionPaid)}</span>
    <span>Outstanding: {money(sectionOutstanding)}</span>
    <strong>Total: {money(sectionTotal)}</strong>
  </span>
) : (
  <span className="section-total">{money(sectionTotal)}</span>
)}
              </button>

              {(section === "regular_payment" || section === "household_bill") && (
  <div className="paid-progress-wrap">
    <div className="paid-progress-label">
      <span>{sectionPaidPercent}% paid</span>
      <span>
        {money(sectionPaid)} of {money(sectionTotal)}
      </span>
    </div>
    <div className="paid-progress-bar">
      <div
        className="paid-progress-fill"
        style={{ width: `${sectionPaidPercent}%` }}
      />
    </div>
  </div>
)}

              {openSections[section] && (
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Amount</th>
                      {section === "household_bill" && <th>Due</th>}
                      {section !== "income" && section !== "carried_over" && (
                        <th>Paid</th>
                      )}
                      <th></th>
                    </tr>
                  </thead>

                  <tbody>
                    {visibleSectionEntries
                      .sort((a, b) => {
                        const aPaid = a.paid ? 1 : 0;
                        const bPaid = b.paid ? 1 : 0;

                        if (aPaid !== bPaid) return aPaid - bPaid;

                        return (a.due_day || 0) - (b.due_day || 0);
                      })
                      .map((e) => (
                        <tr key={e.id} className={e.paid ? "paid-row" : ""}>
                          <td>
                            <input
                              value={e.name}
                              onChange={(ev) => {
                                const val = ev.target.value;
                                setEntries((prev) =>
                                  prev.map((x) =>
                                    x.id === e.id ? { ...x, name: val } : x,
                                  ),
                                );
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
                                setEntries((prev) =>
                                  prev.map((x) =>
                                    x.id === e.id ? { ...x, amount: val } : x,
                                  ),
                                );
                                updateEntry(e.id, "amount", Number(val));
                              }}
                            />
                          </td>

                          {section === "household_bill" && (
                            <td>
                              <input
                                type="number"
                                value={e.due_day || ""}
                                onChange={(ev) => {
                                  const val = ev.target.value;
                                  setEntries((prev) =>
                                    prev.map((x) =>
                                      x.id === e.id
                                        ? { ...x, due_day: val }
                                        : x,
                                    ),
                                  );
                                  updateEntry(
                                    e.id,
                                    "due_day",
                                    val ? Number(val) : null,
                                  );
                                }}
                              />
                            </td>
                          )}

                          {section !== "income" &&
                            section !== "carried_over" && (
                              <td>
                                <input
                                  type="checkbox"
                                  checked={!!e.paid}
                                  onChange={(ev) => {
                                    const checked = ev.target.checked;
                                    setEntries((prev) =>
                                      prev.map((x) =>
                                        x.id === e.id
                                          ? { ...x, paid: checked }
                                          : x,
                                      ),
                                    );
                                    updateEntry(e.id, "paid", checked);
                                  }}
                                />
                              </td>
                            )}

                          <td className="row-actions">
                            <button
                              title="Duplicate"
                              onClick={() => duplicateEntry(e)}
                            >
                              ⧉
                            </button>
                            <button
                              title="Delete"
                              onClick={() => deleteEntry(e.id)}
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
              </div>
            </div>
          );
        },
      )}
    </div>
  );
}
