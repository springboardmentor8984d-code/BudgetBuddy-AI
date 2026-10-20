
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
const COLORS = [
  "#238b57",
  "#4385e8",
  "#f59e0b",
  "#e05252",
  "#8b5cf6",
  "#14b8a6",
];

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

function Analytics() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [budgets, setBudgets] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/");
      return;
    }

    const headers = {
      Authorization: `Bearer ${token}`,
    };

    async function loadAnalytics() {
      try {
        setLoading(true);
        setError("");

        const [dashboardResponse, budgetResponse, expenseResponse] =
          await Promise.all([
            fetch(`${API}/dashboard/`, { headers }),
            fetch(`${API}/budgets/`, { headers }),
            fetch(`${API}/expenses/`, { headers }),
          ]);

        if (
          !dashboardResponse.ok ||
          !budgetResponse.ok ||
          !expenseResponse.ok
        ) {
          throw new Error(
            "Could not load analytics. Please check your backend and login."
          );
        }

        const [dashboardData, budgetData, expenseData] =
          await Promise.all([
            dashboardResponse.json(),
            budgetResponse.json(),
            expenseResponse.json(),
          ]);

        setDashboard(dashboardData);
        setBudgets(budgetData);
        setExpenses(expenseData);
      } catch (err) {
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, [navigate]);

  const cardStyle = {
    background: "#ffffff",
    borderRadius: "16px",
    padding: "22px",
    boxShadow: "0 4px 16px rgba(20, 40, 30, 0.06)",
    border: "1px solid #e8eee9",
    minWidth: 0,
  };

  const pageStyle = {
    minHeight: "100vh",
    background: "#f4f7f5",
    padding: "30px",
    fontFamily: "Arial, sans-serif",
    color: "#202923",
  };

  if (loading) {
    return (
      <div style={pageStyle}>
        <p style={{ textAlign: "center", marginTop: "80px" }}>
          Loading your analytics...
        </p>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div style={pageStyle}>
        <div style={{ maxWidth: "1000px", margin: "auto" }}>
          <h1>Financial Analytics</h1>
          <p style={{ color: "#c0392b" }}>
            {error || "Analytics data is unavailable."}
          </p>
          <button onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const totalIncome = Number(dashboard.total_income || 0);
  const totalExpenses = Number(dashboard.total_expenses || 0);
  const balance = Number(dashboard.remaining_balance || 0);

  const categoryData = Object.entries(
    dashboard.category_wise_expenses || {}
  ).map(([name, amount]) => ({
    name,
    amount: Number(amount || 0),
  }));

  const monthlyData = (dashboard.monthly_trends || []).map((item) => ({
    month: item.month,
    Income: Number(item.income || 0),
    Expenses: Number(item.expenses || 0),
  }));

  // Calculate spending during each budget's date range.
  const budgetData = budgets.map((budget) => {
    const start = new Date(budget.start_date).getTime();
    const end = new Date(budget.end_date).getTime();

    const spent = expenses.reduce((sum, expense) => {
      const expenseDate = new Date(expense.expense_date).getTime();

      if (
        expense.category === budget.category &&
        Number.isFinite(expenseDate) &&
        expenseDate >= start &&
        expenseDate <= end
      ) {
        return sum + Number(expense.amount || 0);
      }

      return sum;
    }, 0);

    const limit = Number(budget.amount_limit || 0);

    return {
      category: budget.category,
      limit,
      spent,
      percentage: limit > 0 ? (spent / limit) * 100 : 0,
      key: budget.budget_id,
    };
  });

  const overBudgetCount = budgetData.filter(
    (item) => item.spent > item.limit
  ).length;

  const maxSpend = Math.max(
    1,
    ...categoryData.map((item) => item.amount)
  );

  return (
    <div style={pageStyle}>
      <div style={{ maxWidth: "1200px", margin: "auto" }}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap",
            marginBottom: "28px",
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: "32px" }}>
              Financial Analytics
            </h1>
            <p style={{ color: "#68756d", marginBottom: 0 }}>
              Understand your spending and financial trends.
            </p>
          </div>

          <button
            onClick={() => navigate("/dashboard")}
            style={{
              padding: "11px 18px",
              border: "none",
              borderRadius: "9px",
              background: "#238b57",
              color: "white",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            ← Dashboard
          </button>
        </header>

        {/* Financial summary */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
            gap: "18px",
            marginBottom: "24px",
          }}
        >
          {[
            {
              label: "Total Income",
              value: totalIncome,
              color: "#238b57",
            },
            {
              label: "Total Expenses",
              value: totalExpenses,
              color: "#dc3545",
            },
            {
              label: "Remaining Balance",
              value: balance,
              color: "#1769aa",
            },
            {
              label: "Budgets Exceeded",
              value: overBudgetCount,
              color: overBudgetCount ? "#dc3545" : "#238b57",
              isCount: true,
            },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                ...cardStyle,
                borderLeft: `5px solid ${item.color}`,
              }}
            >
              <p style={{ margin: 0, color: "#68756d" }}>
                {item.label}
              </p>
              <h2
                style={{
                  color: item.color,
                  marginBottom: 0,
                  overflowWrap: "anywhere",
                }}
              >
                {item.isCount ? item.value : money(item.value)}
              </h2>
            </div>
          ))}
        </div>

        {/* Monthly comparison */}
        <section style={{ ...cardStyle, marginBottom: "24px" }}>
          <h2 style={{ marginTop: 0 }}>
            Monthly Income vs Expenses
          </h2>

          {monthlyData.length === 0 ? (
            <p style={{ color: "#68756d" }}>
              No monthly data is available yet.
            </p>
          ) : (
            <div style={{ width: "100%", height: "330px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyData}
                  margin={{ top: 15, right: 15, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5ebe6" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => money(value)} />
                  <Legend />
                  <Bar
                    dataKey="Income"
                    fill="#238b57"
                    radius={[5, 5, 0, 0]}
                  />
                  <Bar
                    dataKey="Expenses"
                    fill="#e05252"
                    radius={[5, 5, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        {/* Category spending */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))",
            gap: "24px",
            marginBottom: "24px",
          }}
        >
          <section style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Spending by Category</h2>

            {categoryData.length === 0 ? (
              <p style={{ color: "#68756d" }}>
                Add expenses to see category analytics.
              </p>
            ) : (
              <>
                <div style={{ width: "100%", height: "280px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        dataKey="amount"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {categoryData.map((item, index) => (
                          <Cell
                            key={item.name}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => money(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {categoryData
                  .slice()
                  .sort((a, b) => b.amount - a.amount)
                  .map((item) => (
                    <div
                      key={item.name}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "12px",
                        padding: "10px 0",
                        borderBottom: "1px solid #edf0ed",
                      }}
                    >
                      <span>{item.name}</span>
                      <strong>{money(item.amount)}</strong>
                    </div>
                  ))}
              </>
            )}
          </section>

          {/* Budget utilization */}
          <section style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Budget Utilization</h2>

            {budgetData.length === 0 ? (
              <p style={{ color: "#68756d" }}>
                Create a budget to track utilization.
              </p>
            ) : (
              budgetData.map((item) => {
                const exceeded = item.spent > item.limit;
                const percentage = Math.min(item.percentage, 100);

                return (
                  <div
                    key={item.key}
                    style={{
                      padding: "14px 0",
                      borderBottom: "1px solid #edf0ed",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "10px",
                        marginBottom: "8px",
                      }}
                    >
                      <strong>{item.category}</strong>
                      <span
                        style={{
                          color: exceeded ? "#dc3545" : "#238b57",
                          fontWeight: "bold",
                        }}
                      >
                        {item.percentage.toFixed(0)}%
                      </span>
                    </div>

                    <div
                      style={{
                        height: "10px",
                        background: "#e8eee9",
                        borderRadius: "10px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${percentage}%`,
                          height: "100%",
                          background: exceeded ? "#dc3545" : "#238b57",
                          borderRadius: "10px",
                        }}
                      />
                    </div>

                    <p
                      style={{
                        marginBottom: 0,
                        color: "#68756d",
                        fontSize: "14px",
                      }}
                    >
                      {money(item.spent)} spent of {money(item.limit)}
                      {exceeded ? " — Over budget" : ""}
                    </p>
                  </div>
                );
              })
            )}
          </section>
        </div>

        {/* Spending insights */}
        <section style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>Spending Insights</h2>

          {categoryData.length === 0 ? (
            <p>
              Your spending insights will appear when you start recording
              expenses.
            </p>
          ) : (
            <>
              <p>
                Your highest-spending category is{" "}
                <strong>
                  {
                    categoryData.reduce((highest, item) =>
                      item.amount > highest.amount ? item : highest
                    ).name
                  }
                </strong>
                .
              </p>

              <p>
                Total recorded expenses:{" "}
                <strong>{money(totalExpenses)}</strong>.
              </p>

              {overBudgetCount > 0 ? (
                <p style={{ color: "#dc3545" }}>
                  You have {overBudgetCount} budget
                  {overBudgetCount === 1 ? "" : "s"} exceeding the limit.
                  Review the Budget Utilization section above.
                </p>
              ) : (
                <p style={{ color: "#238b57" }}>
                  None of your listed budgets currently exceed their limits.
                </p>
              )}

              <div style={{ marginTop: "18px" }}>
                {categoryData
                  .slice()
                  .sort((a, b) => b.amount - a.amount)
                  .map((item, index) => (
                    <div
                      key={item.name}
                      style={{
                        marginBottom: "14px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "6px",
                        }}
                      >
                        <span>{item.name}</span>
                        <strong>{money(item.amount)}</strong>
                      </div>
                      <div
                        style={{
                          height: "8px",
                          background: "#e8eee9",
                          borderRadius: "10px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${(item.amount / maxSpend) * 100}%`,
                            height: "100%",
                            background: COLORS[index % COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default Analytics;
