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

const categories = [
  { value: "house", label: "House", icon: "🏠" },
  { value: "food", label: "Food", icon: "🍔" },
  { value: "pets", label: "Pets", icon: "🐶" },
  { value: "car", label: "Car", icon: "🚗" },
  { value: "subscriptions", label: "Mobile/Broadband/TV", icon: "📱" },
  { value: "streaming", label: "Subscriptions", icon: "🎬" },
  { value: "finance", label: "Utilities", icon: "⚡" },
  { value: "Kids", label: "Kids", icon: "👨" },
  { value: "other", label: "Other", icon: "📌" },
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

function AnimatedMoney({ value }) {
  const [displayValue, setDisplayValue] = useState(Number(value || 0));

  useEffect(() => {
    const startValue = displayValue;
    const endValue = Number(value || 0);
    const duration = 450;
    const startTime = performance.now();

    function animate(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const nextValue = startValue + (endValue - startValue) * easedProgress;

      setDisplayValue(nextValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    const animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [value]);

  return <>{money(displayValue)}</>;
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
  const [targetMonth, setTargetMonth] = useState(
    months[(currentDate.getMonth() + 1) % 12],
  );
  const [targetYear, setTargetYear] = useState(
    currentDate.getMonth() === 11 ? currentYear + 1 : currentYear,
  );
  const [resetOnDuplicate, setResetOnDuplicate] = useState(false);
  const [entries, setEntries] = useState([]);
  const [weeklySpending, setWeeklySpending] = useState([]);
  const [weeklyStatus, setWeeklyStatus] = useState([]);
  const [weeklyForm, setWeeklyForm] = useState({
    week_number: 1,
    description: "",
    amount: "",
    category: "other",
    spent_date: "",
  });
  const [entryFilter, setEntryFilter] = useState("all");
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [openWeeklyCategories, setOpenWeeklyCategories] = useState({});
  const [bankHolidays, setBankHolidays] = useState([]);
  const [toast, setToast] = useState(null);
  const [editingWeeklySpendId, setEditingWeeklySpendId] = useState(null);
  const [weeklyEditForm, setWeeklyEditForm] = useState({
    description: "",
    amount: "",
    category: "other",
    spent_date: "",
  });

  const [sortConfig, setSortConfig] = useState({
    household_bill: { key: "due_day", direction: "asc" },
    regular_payment: { key: "name", direction: "asc" },
  });

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
    category: "other",
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
    async function loadBankHolidays() {
      try {
        const response = await fetch("https://www.gov.uk/bank-holidays.json");
        const data = await response.json();
        const englandAndWalesDates =
          data["england-and-wales"]?.events?.map((event) => event.date) || [];

        setBankHolidays(englandAndWalesDates);
      } catch (error) {
        console.error("Could not load bank holidays", error);
        setBankHolidays([]);
      }
    }

    loadBankHolidays();
  }, []);

  useEffect(() => {
    if (session?.user) {
      loadEntries();
      loadWeeklySpending();
      loadWeeklyStatus();
    }
  }, [session, month, year]);
  async function loadWeeklyStatus() {
    const { data, error } = await supabase
      .from("weekly_budget_status")
      .select("*")
      .eq("month", month)
      .eq("year", year)
      .order("week_number", { ascending: true });

    if (error) return alert(error.message);
    setWeeklyStatus(data || []);
  }

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

  function showToast(message) {
    setToast(message);
    window.clearTimeout(showToast._timer);
    showToast._timer = window.setTimeout(() => setToast(null), 2400);
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

  async function loadWeeklySpending() {
    const { data, error } = await supabase
      .from("weekly_spending")
      .select("*")
      .eq("month", month)
      .eq("year", year)
      .order("week_number", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) return alert(error.message);
    setWeeklySpending(data || []);
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
      category: entry.category || "other",
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
      category: form.category,
    });

    if (error) return alert(error.message);

    setForm({
      section: "household_bill",
      name: "",
      amount: "",
      due_day: "",
      category: "other",
    });

    loadEntries();
  }

  async function addWeeklySpend(e) {
    e.preventDefault();

    if (isWeekClosed(weeklyForm.week_number)) {
      alert("This week is closed. Reopen it before adding more spending.");
      return;
    }

    const { error } = await supabase.from("weekly_spending").insert({
      user_id: session.user.id,
      month,
      year,
      week_number: Number(weeklyForm.week_number),
      description: weeklyForm.description,
      amount: Number(weeklyForm.amount || 0),
      category: weeklyForm.category,
      spent_date: weeklyForm.spent_date || null,
    });

    if (error) return alert(error.message);

    setWeeklyForm({
      week_number: weeklyForm.week_number,
      description: "",
      amount: "",
      category: "other",
      spent_date: "",
    });

    showToast("✅ Spend added");
    loadWeeklySpending();
  }

  async function deleteWeeklySpend(id) {
    const { error } = await supabase.from("weekly_spending").delete().eq("id", id);

    if (error) return alert(error.message);

    showToast("🗑️ Spend removed");
    loadWeeklySpending();
  }

  function startEditWeeklySpend(item) {
    setEditingWeeklySpendId(item.id);
    setWeeklyEditForm({
      description: item.description || "",
      amount: item.amount || "",
      category: item.category || "other",
      spent_date: item.spent_date || "",
    });
  }

  function cancelEditWeeklySpend() {
    setEditingWeeklySpendId(null);
    setWeeklyEditForm({
      description: "",
      amount: "",
      category: "other",
      spent_date: "",
    });
  }

  async function updateWeeklySpend(id) {
    const { error } = await supabase
      .from("weekly_spending")
      .update({
        description: weeklyEditForm.description,
        amount: Number(weeklyEditForm.amount || 0),
        category: weeklyEditForm.category,
        spent_date: weeklyEditForm.spent_date || null,
      })
      .eq("id", id);

    if (error) return alert(error.message);

    cancelEditWeeklySpend();
    showToast("✏️ Spend updated");
    loadWeeklySpending();
  }

  function isWeekClosed(weekNumber) {
    return weeklyStatus.some(
      (status) =>
        Number(status.week_number) === Number(weekNumber) && status.is_closed,
    );
  }

  async function setWeekClosed(weekNumber, isClosed) {
    const existingStatus = weeklyStatus.find(
      (status) => Number(status.week_number) === Number(weekNumber),
    );

    if (existingStatus) {
      const { error } = await supabase
        .from("weekly_budget_status")
        .update({ is_closed: isClosed })
        .eq("id", existingStatus.id);

      if (error) return alert(error.message);
    } else {
      const { error } = await supabase.from("weekly_budget_status").insert({
        user_id: session.user.id,
        month,
        year,
        week_number: Number(weekNumber),
        is_closed: isClosed,
      });

      if (error) return alert(error.message);
    }

    showToast(isClosed ? "🔒 Week closed" : "🔓 Week reopened");
    loadWeeklyStatus();
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
      category: entry.category || "other",
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

  function formatDateForBankHolidayCheck(date) {
    const yearValue = date.getFullYear();
    const monthValue = String(date.getMonth() + 1).padStart(2, "0");
    const dayValue = String(date.getDate()).padStart(2, "0");

    return `${yearValue}-${monthValue}-${dayValue}`;
  }

  function getPaydayForMonth(yearValue, monthIndex, bankHolidayDates = []) {
    const payday = new Date(yearValue, monthIndex + 1, 0);

    while (
      payday.getDay() === 0 ||
      payday.getDay() === 6 ||
      bankHolidayDates.includes(formatDateForBankHolidayCheck(payday))
    ) {
      payday.setDate(payday.getDate() - 1);
    }

    return payday;
  }

  function getPreviousBudgetMonth(yearValue, monthIndex) {
    if (monthIndex === 0) {
      return { year: yearValue - 1, monthIndex: 11 };
    }

    return { year: yearValue, monthIndex: monthIndex - 1 };
  }

  function formatDateRange(startDate, endDate) {
    const formatter = new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
    });

    return `${formatter.format(startDate)} - ${formatter.format(endDate)}`;
  }

  function filterEntriesForView(sectionEntries) {
    if (entryFilter === "paid") return sectionEntries.filter((e) => e.paid);
    if (entryFilter === "unpaid") return sectionEntries.filter((e) => !e.paid);
    if (entryFilter === "due_soon") {
      return sectionEntries.filter((e) => isDueSoon(e));
    }

    return sectionEntries;
  }

  function updateSort(section, key) {
    setSortConfig((prev) => {
      const current = prev[section] || { key, direction: "asc" };
      const direction =
        current.key === key && current.direction === "asc" ? "desc" : "asc";

      return {
        ...prev,
        [section]: { key, direction },
      };
    });
  }

  function sortIndicator(section, key) {
    const current = sortConfig[section];
    if (!current || current.key !== key) return "↕";
    return current.direction === "asc" ? "↑" : "↓";
  }

  function getCategoryLabel(value) {
    return (
      categories.find((category) => category.value === (value || "other"))
        ?.label || "Other"
    );
  }

  function sortEntriesForView(section, sectionEntries) {
    const current = sortConfig[section];

    return [...sectionEntries].sort((a, b) => {
      const aPaid = a.paid ? 1 : 0;
      const bPaid = b.paid ? 1 : 0;

      if (aPaid !== bPaid) return aPaid - bPaid;

      if (!current) return (a.due_day || 0) - (b.due_day || 0);

      let aValue = a[current.key];
      let bValue = b[current.key];

      if (current.key === "category") {
        aValue = getCategoryLabel(a.category);
        bValue = getCategoryLabel(b.category);
      }

      if (current.key === "amount" || current.key === "due_day") {
        aValue = Number(aValue || 0);
        bValue = Number(bValue || 0);
      } else {
        aValue = String(aValue || "").toLowerCase();
        bValue = String(bValue || "").toLowerCase();
      }

      if (aValue < bValue) return current.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return current.direction === "asc" ? 1 : -1;
      return 0;
    });
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

  const chartData = useMemo(() => {
    const calculateSectionProgress = (section) => {
      const sectionEntries = entries.filter((entry) => entry.section === section);
      const total = sectionEntries.reduce(
        (sum, entry) => sum + Number(entry.amount || 0),
        0,
      );
      const paid = sectionEntries
        .filter((entry) => entry.paid)
        .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
      const paidShare = total ? Math.round((paid / total) * 100) : 0;

      return {
        total,
        paid,
        outstanding: total - paid,
        paidShare,
        outstandingShare: Math.max(100 - paidShare, 0),
      };
    };

    const householdProgress = calculateSectionProgress("household_bill");
    const regularProgress = calculateSectionProgress("regular_payment");

    const billEntries = entries.filter(
      (entry) =>
        entry.section === "household_bill" ||
        entry.section === "regular_payment",
    );
    const topBills = [...billEntries]
      .sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0))
      .slice(0, 5);
    const highestBill = topBills[0] ? Number(topBills[0].amount || 0) : 0;

    return {
      householdProgress,
      regularProgress,
      topBills,
      highestBill,
    };
  }, [entries, totals]);

  const weeklySpendData = useMemo(() => {
    const weeklyBudget = totals.weekly;
    const selectedMonthIndex = months.indexOf(month);
    const previousBudgetMonth = getPreviousBudgetMonth(
      Number(year),
      selectedMonthIndex,
    );
    const payday = getPaydayForMonth(
      previousBudgetMonth.year,
      previousBudgetMonth.monthIndex,
      bankHolidays,
    );

    let previousClosedBalance = 0;

    return [1, 2, 3, 4].map((weekNumber) => {
      const weekStart = new Date(payday);
      weekStart.setDate(payday.getDate() + (weekNumber - 1) * 7);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const items = weeklySpending.filter(
        (item) => Number(item.week_number) === weekNumber,
      );
      const spent = items.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0,
      );
      const categoryGroups = categories
        .map((category) => {
          const categoryItems = items.filter(
            (item) => (item.category || "other") === category.value,
          );
          const total = categoryItems.reduce(
            (sum, item) => sum + Number(item.amount || 0),
            0,
          );

          return {
            ...category,
            items: categoryItems,
            total,
          };
        })
        .filter((category) => category.items.length > 0);

      const isClosed = weeklyStatus.some(
        (status) =>
          Number(status.week_number) === weekNumber && status.is_closed,
      );
      const available = weeklyBudget + previousClosedBalance;
      const left = available - spent;
      const carryOver = previousClosedBalance;
      const spentPercent = available > 0 ? Math.min((spent / available) * 100, 100) : 0;

      // Add isCurrentWeek logic
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const weekStartForCheck = new Date(weekStart);
      const weekEndForCheck = new Date(weekEnd);
      weekStartForCheck.setHours(0, 0, 0, 0);
      weekEndForCheck.setHours(23, 59, 59, 999);

      const isCurrentWeek = today >= weekStartForCheck && today <= weekEndForCheck;

      if (isClosed) {
        previousClosedBalance = left;
      }

      return {
        weekNumber,
        dateLabel: formatDateRange(weekStart, weekEnd),
        startDate: weekStart,
        endDate: weekEnd,
        budget: weeklyBudget,
        carryOver,
        available,
        spent,
        left,
        spentPercent,
        isClosed,
        isCurrentWeek,
        items,
        categoryGroups,
      };
    });
  }, [weeklySpending, weeklyStatus, totals.weekly, month, year, bankHolidays]);

  useEffect(() => {
    if (!session?.user || weeklySpendData.length === 0) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentWeek = weeklySpendData.find((week) => {
      const start = new Date(week.startDate);
      const end = new Date(week.endDate);

      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);

      return today >= start && today <= end && !week.isClosed;
    });

    const nextOpenWeek = weeklySpendData.find((week) => !week.isClosed);
    const selectedWeek = currentWeek || nextOpenWeek;

    if (!selectedWeek) return;

    setWeeklyForm((prev) => {
      if (Number(prev.week_number) === Number(selectedWeek.weekNumber)) {
        return prev;
      }

      return {
        ...prev,
        week_number: selectedWeek.weekNumber,
      };
    });
  }, [session, weeklySpendData]);

  function toggleWeeklyCategory(weekNumber, categoryValue) {
    const key = `${weekNumber}-${categoryValue}`;

    setOpenWeeklyCategories((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  if (!session) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>💰Monthly Budget Planner💰</h1>
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
        <h1>💰Monthly Budget Planner💰</h1>
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
          <strong><AnimatedMoney value={totals.income} /></strong>
        </div>
        <div>
          <span>House Bills</span>
          <strong><AnimatedMoney value={totals.household} /></strong>
        </div>
        <div>
          <span>50% Split</span>
          <strong><AnimatedMoney value={totals.half} /></strong>
        </div>
        <div>
          <span>TK Bills</span>
          <strong><AnimatedMoney value={totals.regular} /></strong>
        </div>
        <div className="important-total">
          <span>Monthly Left</span>
          <strong><AnimatedMoney value={totals.monthly} /></strong>
        </div>
        <div className="important-total">
          <span>
            Weekly Left <br></br>(based on 4 weeks)
          </span>
          <strong><AnimatedMoney value={totals.weekly} /></strong>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-heading">
            <span>Household Bills</span>
            <strong>{chartData.householdProgress.paidShare}% paid</strong>
          </div>
          <div className="stacked-chart">
            <div
              className="stacked-paid"
              style={{ width: `${chartData.householdProgress.paidShare}%` }}
            />
            <div
              className="stacked-outstanding"
              style={{ width: `${chartData.householdProgress.outstandingShare}%` }}
            />
          </div>
          <div className="chart-legend">
            <span>Paid: <AnimatedMoney value={chartData.householdProgress.paid} /></span>
            <span>Outstanding: <AnimatedMoney value={chartData.householdProgress.outstanding} /></span>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-heading">
            <span>Regular Payments</span>
            <strong>{chartData.regularProgress.paidShare}% paid</strong>
          </div>
          <div className="stacked-chart">
            <div
              className="stacked-paid"
              style={{ width: `${chartData.regularProgress.paidShare}%` }}
            />
            <div
              className="stacked-outstanding"
              style={{ width: `${chartData.regularProgress.outstandingShare}%` }}
            />
          </div>
          <div className="chart-legend">
            <span>Paid: <AnimatedMoney value={chartData.regularProgress.paid} /></span>
            <span>Outstanding: <AnimatedMoney value={chartData.regularProgress.outstanding} /></span>
          </div>
        </div>
      </div>

      <div className="weekly-spend-section">
        <div className="weekly-spend-header">
          <div>
            <h2>Weekly Spending Tracker</h2>
            <p>Track spending outside of regular bills.</p>
          </div>
          <strong>Weekly budget: <AnimatedMoney value={totals.weekly} /></strong>
        </div>

        <form className="weekly-spend-form" onSubmit={addWeeklySpend}>
          <select
            value={weeklyForm.week_number}
            onChange={(e) =>
              setWeeklyForm({ ...weeklyForm, week_number: e.target.value })
            }
          >
            {weeklySpendData.map((week) => (
              <option
                key={week.weekNumber}
                value={week.weekNumber}
                disabled={week.isClosed}
              >
                Week {week.weekNumber} ({week.dateLabel})
                {week.isClosed ? " - closed" : ""}
              </option>
            ))}
          </select>

          <input
            placeholder="What did you spend on?"
            value={weeklyForm.description}
            onChange={(e) =>
              setWeeklyForm({ ...weeklyForm, description: e.target.value })
            }
            required
          />

          <input
            placeholder="Amount"
            type="number"
            step="0.01"
            value={weeklyForm.amount}
            onChange={(e) =>
              setWeeklyForm({ ...weeklyForm, amount: e.target.value })
            }
            required
          />

          <select
            value={weeklyForm.category}
            onChange={(e) =>
              setWeeklyForm({ ...weeklyForm, category: e.target.value })
            }
          >
            {categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.icon} {category.label}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={weeklyForm.spent_date}
            onChange={(e) =>
              setWeeklyForm({ ...weeklyForm, spent_date: e.target.value })
            }
          />

          <button>Add Spend</button>
        </form>

        <div className="weekly-spend-grid">
          {weeklySpendData.map((week) => (
            <div
              className={`weekly-spend-card ${week.isClosed ? "closed-week" : ""} ${week.isCurrentWeek ? "current-week" : ""}`}
              key={week.weekNumber}
            >
              <div className="weekly-spend-card-header">
                <span>
                  Week {week.weekNumber}
                  <small>{week.dateLabel}</small>
                </span>
                <span className="weekly-spend-badges">
                  {week.isClosed && <em>Closed</em>}
                </span>
              </div>

              <div className="weekly-spend-summary">
                <span>Available: <AnimatedMoney value={week.available} /></span>
                <span>Spent: <AnimatedMoney value={week.spent} /></span>
                <strong>
                  <AnimatedMoney value={week.left} /> {week.isClosed ? "carried forward" : "remaining"}
                </strong>
              </div>

              <div className="weekly-spend-progress">
                <div className="weekly-spend-progress-label">
                  <span>{Math.round(week.spentPercent)}% spent</span>
                  <span>
                    <AnimatedMoney value={week.spent} /> of <AnimatedMoney value={week.available} />
                  </span>
                </div>
                <div className="weekly-spend-progress-bar">
                  <div
                    className="weekly-spend-progress-fill"
                    style={{ width: `${week.spentPercent}%` }}
                  />
                </div>
              </div>

              <div className="weekly-spend-items">
                {week.items.length === 0 ? (
                  <p>No spending added yet.</p>
                ) : (
                  week.categoryGroups.map((category) => {
                    const groupKey = `${week.weekNumber}-${category.value}`;
                    const isOpen = !!openWeeklyCategories[groupKey];

                    return (
                      <div className="weekly-spend-category-group" key={groupKey}>
                        <button
                          type="button"
                          className="weekly-spend-category-toggle"
                          onClick={() =>
                            toggleWeeklyCategory(week.weekNumber, category.value)
                          }
                        >
                          <span>
                            <span className={`category-arrow ${isOpen ? "open" : ""}`}>▶</span>
                            {category.icon} {category.label}
                          </span>
                          <strong><AnimatedMoney value={category.total} /></strong>
                        </button>

                        <div className={`weekly-spend-category-items ${isOpen ? "open" : ""}`}>
                          {category.items.map((item) => (
                            <div
                              className={`weekly-spend-item ${editingWeeklySpendId === item.id ? "editing-weekly-spend" : ""}`}
                              key={item.id}
                            >
                              {editingWeeklySpendId === item.id ? (
                                <>
                                  <input
                                    value={weeklyEditForm.description}
                                    onChange={(e) =>
                                      setWeeklyEditForm({
                                        ...weeklyEditForm,
                                        description: e.target.value,
                                      })
                                    }
                                  />
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={weeklyEditForm.amount}
                                    onChange={(e) =>
                                      setWeeklyEditForm({
                                        ...weeklyEditForm,
                                        amount: e.target.value,
                                      })
                                    }
                                  />
                                  <select
                                    value={weeklyEditForm.category}
                                    onChange={(e) =>
                                      setWeeklyEditForm({
                                        ...weeklyEditForm,
                                        category: e.target.value,
                                      })
                                    }
                                  >
                                    {categories.map((category) => (
                                      <option key={category.value} value={category.value}>
                                        {category.icon} {category.label}
                                      </option>
                                    ))}
                                  </select>
                                  <input
                                    type="date"
                                    value={weeklyEditForm.spent_date}
                                    onChange={(e) =>
                                      setWeeklyEditForm({
                                        ...weeklyEditForm,
                                        spent_date: e.target.value,
                                      })
                                    }
                                  />
                                  <button
                                    type="button"
                                    title="Save"
                                    onClick={() => updateWeeklySpend(item.id)}
                                  >
                                    ✓
                                  </button>
                                  <button
                                    type="button"
                                    title="Cancel"
                                    onClick={cancelEditWeeklySpend}
                                  >
                                    ↩
                                  </button>
                                </>
                              ) : (
                                <>
                                  <span>{item.description}</span>
                                  <strong><AnimatedMoney value={item.amount} /></strong>
                                  {!week.isClosed && (
                                    <>
                                      <button
                                        type="button"
                                        title="Edit"
                                        onClick={() => startEditWeeklySpend(item)}
                                      >
                                        ✎
                                      </button>
                                      <button
                                        type="button"
                                        title="Delete"
                                        onClick={() => deleteWeeklySpend(item.id)}
                                      >
                                        ✕
                                      </button>
                                    </>
                                  )}
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <button
                type="button"
                className="week-status-button"
                onClick={() => setWeekClosed(week.weekNumber, !week.isClosed)}
              >
                {week.isClosed ? "Reopen Week" : "Close Week"}
              </button>
            </div>
          ))}
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

          const visibleSectionEntries = sortEntriesForView(
            section,
            filterEntriesForView(sectionEntries),
          );

          return (
            <div key={section}>
              {section === "household_bill" && (
                <>
                  <div className="add-bill-panel">
                    <h3>Add Bill / Income</h3>
                    <form onSubmit={addEntry} className="entry-form">
                      <select
                        value={form.section}
                        onChange={(e) =>
                          setForm({ ...form, section: e.target.value })
                        }
                      >
                        <option value="income">Income</option>
                        <option value="carried_over">Carried over</option>
                        <option value="household_bill">Household bill</option>
                        <option value="regular_payment">TK Bill</option>
                      </select>

                      <input
                        placeholder="Name"
                        value={form.name}
                        onChange={(e) =>
                          setForm({ ...form, name: e.target.value })
                        }
                        required
                      />

                      <input
                        placeholder="Amount"
                        type="number"
                        step="0.01"
                        value={form.amount}
                        onChange={(e) =>
                          setForm({ ...form, amount: e.target.value })
                        }
                        required
                      />

                      <input
                        placeholder="Due day"
                        type="number"
                        value={form.due_day}
                        onChange={(e) =>
                          setForm({ ...form, due_day: e.target.value })
                        }
                      />

                      <select
                        className="category-select"
                        value={form.category}
                        onChange={(e) =>
                          setForm({ ...form, category: e.target.value })
                        }
                      >
                        {categories.map((category) => (
                          <option key={category.value} value={category.value}>
                            {category.icon} {category.label}
                          </option>
                        ))}
                      </select>

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
                        className={
                          entryFilter === filter ? "active-filter" : ""
                        }
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
                  {section === "regular_payment" ||
                  section === "household_bill" ? (
                    <span className="section-breakdown">
                      <span>Paid: <AnimatedMoney value={sectionPaid} /></span>
                      <span>Outstanding: <AnimatedMoney value={sectionOutstanding} /></span>
                      <strong>Total: <AnimatedMoney value={sectionTotal} /></strong>
                    </span>
                  ) : (
                    <span className="section-total"><AnimatedMoney value={sectionTotal} /></span>
                  )}
                </button>

                {(section === "regular_payment" ||
                  section === "household_bill") && (
                  <div className="paid-progress-wrap">
                    <div className="paid-progress-label">
                      <span>{sectionPaidPercent}% paid</span>
                      <span>
                        <AnimatedMoney value={sectionPaid} /> of <AnimatedMoney value={sectionTotal} />
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
                        <th>
                          <button
                            type="button"
                            className="sort-button"
                            onClick={() => updateSort(section, "name")}
                          >
                            Name {sortIndicator(section, "name")}
                          </button>
                        </th>
                        <th>
                          <button
                            type="button"
                            className="sort-button"
                            onClick={() => updateSort(section, "amount")}
                          >
                            Amount {sortIndicator(section, "amount")}
                          </button>
                        </th>
                        {section === "household_bill" && (
                          <th>
                            <button
                              type="button"
                              className="sort-button"
                              onClick={() => updateSort(section, "due_day")}
                            >
                              Due {sortIndicator(section, "due_day")}
                            </button>
                          </th>
                        )}
                        {section !== "income" && section !== "carried_over" && (
                          <th>
                            <button
                              type="button"
                              className="sort-button"
                              onClick={() => updateSort(section, "category")}
                            >
                              Category {sortIndicator(section, "category")}
                            </button>
                          </th>
                        )}
                        {section !== "income" && section !== "carried_over" && (
                          <th>Paid</th>
                        )}
                        <th></th>
                      </tr>
                    </thead>

                    <tbody>
                      {visibleSectionEntries.map((e) => (
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
                                {editingCategoryId === e.id ? (
                                  <select
                                    className="category-select"
                                    value={e.category || "other"}
                                    autoFocus
                                    onBlur={() => setEditingCategoryId(null)}
                                    onChange={(ev) => {
                                      const val = ev.target.value;
                                      setEntries((prev) =>
                                        prev.map((x) =>
                                          x.id === e.id
                                            ? { ...x, category: val }
                                            : x,
                                        ),
                                      );
                                      updateEntry(e.id, "category", val);
                                      setEditingCategoryId(null);
                                    }}
                                  >
                                    {categories.map((category) => (
                                      <option
                                        key={category.value}
                                        value={category.value}
                                      >
                                        {category.icon} {category.label}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <button
                                    type="button"
                                    className={`category-badge category-${e.category || "other"}`}
                                    onClick={() => setEditingCategoryId(e.id)}
                                  >
                                    {categories.find(
                                      (category) =>
                                        category.value ===
                                        (e.category || "other"),
                                    )?.icon || "📌"}
                                  </button>
                                )}
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
                                  showToast(checked ? "✅ Bill marked paid" : "↩️ Bill marked unpaid");
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

      {toast && <div className="toast-notification">{toast}</div>}
    </div>
  );
}
