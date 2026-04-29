import { useState, useEffect, useCallback } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, ReferenceDot } from "recharts";

const DEFAULT_HABITS = [
  { id: 1, name: "Exercise", emoji: "🏃" },
  { id: 2, name: "Read", emoji: "📚" },
  { id: 3, name: "Meditate", emoji: "🧘" },
  { id: 4, name: "Drink water", emoji: "💧" },
  { id: 5, name: "Sleep 8hrs", emoji: "😴" },
];

const toDateStr = (date) => date.toISOString().split("T")[0];
const today = toDateStr(new Date());

function getLast14Days() {
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(toDateStr(d));
  }
  return days;
}

function formatLabel(dateStr) {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-GB", { month: "short", day: "numeric" });
}

const CustomDot = (props) => {
  const { cx, cy, payload } = props;
  if (payload.count === 0) return null;
  return <circle cx={cx} cy={cy} r={5} fill="#c8a96e" stroke="#1a1612" strokeWidth={2} />;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const count = payload[0].value;
    return (
      <div style={{
        background: "#2a2218",
        border: "1px solid #3d3020",
        borderRadius: 8,
        padding: "8px 14px",
        fontSize: 13,
        color: "#e8dcc8",
      }}>
        <div style={{ color: "#c8a96e", fontWeight: 600, marginBottom: 2 }}>{label}</div>
        <div>{count} habit{count !== 1 ? "s" : ""} completed</div>
      </div>
    );
  }
  return null;
};

export default function HabitTracker() {
  const [habits, setHabits] = useState(DEFAULT_HABITS);
  const [completions, setCompletions] = useState({});
  const [newHabit, setNewHabit] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [addingHabit, setAddingHabit] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const h = localStorage.getItem("habits-list");
if (h) setHabits(JSON.parse(h));
      } catch {}
      try {
        const c = localStorage.getItem("habits-completions");
if (c) setCompletions(JSON.parse(c));
      } catch {}
      setLoaded(true);
    }
    load();
  }, []);

  const save = useCallback(async (h, c) => {
    localStorage.setItem("habits-list", JSON.stringify(h));
localStorage.setItem("habits-completions", JSON.stringify(c));
  }, []);

  const toggle = (habitId) => {
    const key = today;
    const current = completions[key] || [];
    const next = current.includes(habitId)
      ? current.filter((id) => id !== habitId)
      : [...current, habitId];
    const newCompletions = { ...completions, [key]: next };
    setCompletions(newCompletions);
    save(habits, newCompletions);
  };

  const addHabit = () => {
    if (!newHabit.trim()) return;
    const newH = { id: Date.now(), name: newHabit.trim(), emoji: "✦" };
    const updated = [...habits, newH];
    setHabits(updated);
    setNewHabit("");
    setAddingHabit(false);
    save(updated, completions);
  };

  const removeHabit = (id) => {
    const updated = habits.filter((h) => h.id !== id);
    setHabits(updated);
    save(updated, completions);
  };

  const days = getLast14Days();
  const chartData = days.map((d) => ({
    date: formatLabel(d),
    count: (completions[d] || []).length,
    isToday: d === today,
  }));

  const todayCount = (completions[today] || []).length;
  const totalHabits = habits.length;
  const streak = (() => {
    let s = 0;
    for (let i = days.length - 1; i >= 0; i--) {
      if ((completions[days[i]] || []).length > 0) s++;
      else break;
    }
    return s;
  })();

  if (!loaded) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, color: "#c8a96e", fontFamily: "'DM Serif Display', serif" }}>
      Loading...
    </div>
  );

  return (
    <div style={{
      fontFamily: "'DM Sans', sans-serif",
      background: "#13100d",
      minHeight: "100vh",
      color: "#e8dcc8",
      padding: "0 0 60px",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input::placeholder { color: #6b5e45; }
        input:focus { outline: none; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #3d3020; border-radius: 4px; }
      `}</style>

      {/* Header */}
      <div style={{ padding: "48px 40px 32px", borderBottom: "1px solid #2a2218" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <p style={{ fontSize: 12, letterSpacing: "0.15em", color: "#c8a96e", textTransform: "uppercase", marginBottom: 10, fontWeight: 500 }}>
            Daily Ritual
          </p>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 42, fontWeight: 400, color: "#f0e6d0", lineHeight: 1.1, marginBottom: 8 }}>
            Your Habits
          </h1>
          <p style={{ color: "#6b5e45", fontSize: 14, fontWeight: 300 }}>
            {new Date().toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 40px" }}>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 32, marginBottom: 40 }}>
          {[
            { label: "Today", value: `${todayCount}/${totalHabits}` },
            { label: "Day streak", value: streak },
            { label: "This week", value: days.slice(-7).reduce((a, d) => a + (completions[d] || []).length, 0) },
          ].map(({ label, value }) => (
            <div key={label} style={{
              background: "#1d1810",
              border: "1px solid #2a2218",
              borderRadius: 12,
              padding: "18px 20px",
            }}>
              <p style={{ fontSize: 11, letterSpacing: "0.1em", color: "#6b5e45", textTransform: "uppercase", marginBottom: 8, fontWeight: 500 }}>
                {label}
              </p>
              <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: 32, color: "#c8a96e" }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Habits list */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, fontWeight: 400, color: "#f0e6d0" }}>
              Today's practices
            </h2>
            <button
              onClick={() => setAddingHabit(!addingHabit)}
              style={{
                background: "transparent",
                border: "1px solid #3d3020",
                color: "#c8a96e",
                borderRadius: 20,
                padding: "6px 16px",
                fontSize: 13,
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                transition: "all 0.2s",
              }}
              onMouseEnter={e => e.target.style.background = "#2a2218"}
              onMouseLeave={e => e.target.style.background = "transparent"}
            >
              + Add habit
            </button>
          </div>

          {addingHabit && (
            <div style={{
              display: "flex",
              gap: 8,
              marginBottom: 16,
              padding: "14px 16px",
              background: "#1d1810",
              border: "1px solid #3d3020",
              borderRadius: 12,
            }}>
              <input
                autoFocus
                value={newHabit}
                onChange={e => setNewHabit(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addHabit()}
                placeholder="New habit name..."
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  color: "#e8dcc8",
                  fontSize: 15,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              />
              <button
                onClick={addHabit}
                style={{
                  background: "#c8a96e",
                  border: "none",
                  color: "#13100d",
                  borderRadius: 8,
                  padding: "6px 16px",
                  fontSize: 13,
                  cursor: "pointer",
                  fontWeight: 500,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Add
              </button>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {habits.map((habit) => {
              const done = (completions[today] || []).includes(habit.id);
              return (
                <div
                  key={habit.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    padding: "16px 20px",
                    background: done ? "#1d1d12" : "#1d1810",
                    border: `1px solid ${done ? "#3d4020" : "#2a2218"}`,
                    borderRadius: 12,
                    cursor: "pointer",
                    transition: "all 0.15s",
                    userSelect: "none",
                  }}
                  onClick={() => toggle(habit.id)}
                  onMouseEnter={e => e.currentTarget.style.borderColor = done ? "#5a6030" : "#3d3020"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = done ? "#3d4020" : "#2a2218"}
                >
                  {/* Checkbox */}
                  <div style={{
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    border: `2px solid ${done ? "#c8a96e" : "#3d3020"}`,
                    background: done ? "#c8a96e" : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    transition: "all 0.15s",
                  }}>
                    {done && (
                      <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
                        <path d="M1 4l3.5 3.5L11 1" stroke="#13100d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>

                  <span style={{ fontSize: 18, lineHeight: 1 }}>{habit.emoji}</span>

                  <span style={{
                    flex: 1,
                    fontSize: 15,
                    color: done ? "#8a9e50" : "#e8dcc8",
                    textDecoration: done ? "line-through" : "none",
                    textDecorationColor: "#6b5e45",
                    transition: "all 0.15s",
                  }}>
                    {habit.name}
                  </span>

                  <button
                    onClick={(e) => { e.stopPropagation(); removeHabit(habit.id); }}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#3d3020",
                      cursor: "pointer",
                      fontSize: 16,
                      padding: "0 4px",
                      lineHeight: 1,
                      transition: "color 0.15s",
                    }}
                    onMouseEnter={e => e.target.style.color = "#8b4040"}
                    onMouseLeave={e => e.target.style.color = "#3d3020"}
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart */}
        <div>
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, fontWeight: 400, color: "#f0e6d0", marginBottom: 4 }}>
              14-day progress
            </h2>
            <p style={{ fontSize: 13, color: "#6b5e45", fontWeight: 300 }}>Habits completed per day</p>
          </div>

          <div style={{
            background: "#1d1810",
            border: "1px solid #2a2218",
            borderRadius: 16,
            padding: "28px 20px 20px",
          }}>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c8a96e" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#c8a96e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#2a2218" strokeDasharray="4 4" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#6b5e45", fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}
                  tickLine={false}
                  axisLine={false}
                  interval={1}
                />
                <YAxis
                  tick={{ fill: "#6b5e45", fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  domain={[0, Math.max(totalHabits, 1)]}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#3d3020", strokeWidth: 1, strokeDasharray: "4 4" }} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#c8a96e"
                  strokeWidth={2}
                  fill="url(#gold)"
                  dot={<CustomDot />}
                  activeDot={{ r: 6, fill: "#c8a96e", stroke: "#13100d", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>

            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, paddingLeft: 8 }}>
              <div style={{ width: 24, height: 2, background: "#c8a96e", borderRadius: 1 }} />
              <span style={{ fontSize: 12, color: "#6b5e45" }}>habits completed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}