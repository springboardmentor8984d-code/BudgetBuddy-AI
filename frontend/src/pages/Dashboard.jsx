import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [budgets, setBudgets] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/");
      return;
    }

    fetch(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => {
        if (!response.ok) throw new Error("Unauthorized");
        return response.json();
      })
      .then((data) => {
        setUser(data);

        return Promise.all([
          fetch(`${API}/dashboard/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API}/budgets/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
      })
      .then(async ([dashboardResponse, budgetResponse]) => {
        if (!dashboardResponse.ok || !budgetResponse.ok) {
          throw new Error("Dashboard error");
        }

        setDashboard(await dashboardResponse.json());
        setBudgets(await budgetResponse.json());
      })
      .catch((error) => {
        console.error("Could not load dashboard:", error);
        localStorage.removeItem("token");
        navigate("/");
      });
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  if (!user || !dashboard) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#f4f7f5",
          fontFamily: "Arial, sans-serif",
          color: "#285c49",
        }}
      >
        <p>Loading your BudgetBuddy dashboard...</p>
      </div>
    );
  }

  const cardStyle = {
    background: "#ffffff",
    padding: "22px",
    borderRadius: "16px",
    border: "1px solid #e8eee9",
    boxShadow: "0 4px 16px rgba(27, 67, 49, 0.05)",
    minWidth: 0,
  };

  const categoryExpenses = dashboard.category_wise_expenses || {};
  const monthlyTrends = dashboard.monthly_trends || [];
  const savingsProgress = dashboard.savings_progress || [];
  const recentTransactions = dashboard.recent_transactions || [];

  const maxCategoryAmount = Math.max(
    ...Object.values(categoryExpenses).map(Number),
    1
  );

  const maxMonthlyAmount = Math.max(
    ...monthlyTrends.flatMap((item) => [
      Number(item.income) || 0,
      Number(item.expenses) || 0,
    ]),
    1
  );

  const navItems = [
    { label: "Dashboard", icon: "⌂", path: "/dashboard" },
    { label: "Income", icon: "↗", path: "/income" },
    { label: "Expenses", icon: "↘", path: "/expenses" },
    { label: "Budgets", icon: "◉", path: "/budgets" },
    { label: "Savings Goals", icon: "☆", path: "/savings-goals" },
    { label: "Analytics", icon: "▥", path: "/analytics" },
    { label: "Reports", icon: "▤", path: "/reports" },
    { label: "Notifications", icon: "♧", path: "/notifications" },
  ];

  const sectionTitle = {
    fontSize: "17px",
    margin: "0 0 18px",
    color: "#20392d",
  };

  const formatAmount = (amount) =>
    Number(amount || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    });

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f4f7f5",
        fontFamily: "Arial, sans-serif",
        color: "#24352c",
      }}
    >
      <style>{`
        * {
          box-sizing: border-box;
        }

        .bb-layout {
          display: flex;
          min-height: 100vh;
        }

        .bb-sidebar {
          width: 250px;
          flex: 0 0 250px;
          background: #173c32;
          color: white;
          padding: 28px 16px 20px;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          position: sticky;
          top: 0;
          height: 100vh;
          overflow-y: auto;
        }

        .bb-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 10px 28px;
        }

        .bb-nav {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .bb-nav button {
          width: 100%;
          border: 0;
          color: #d8e7df;
          background: transparent;
          text-align: left;
          padding: 12px 13px;
          border-radius: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 14px;
          transition: background .15s ease;
        }

        .bb-nav button:hover {
          background: #285648;
          color: #fff;
        }

        .bb-nav button.bb-active {
          background: #2e6953;
          color: #fff;
          font-weight: 700;
        }

        .bb-nav-icon {
          width: 22px;
          text-align: center;
          font-size: 18px;
        }

        .bb-main {
          flex: 1;
          min-width: 0;
          padding: 32px;
        }

        .bb-content {
          max-width: 1450px;
          margin: 0 auto;
        }

        .bb-stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
          margin-bottom: 22px;
        }

        .bb-two-col {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 20px;
          margin-bottom: 22px;
        }

        .bb-manage-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        .bb-manage-card {
          padding: 17px;
          border-radius: 12px;
          border: 1px solid #e3ebe5;
          background: #fbfdfb;
          cursor: pointer;
          text-align: left;
          transition: all .2s ease;
        }

        .bb-manage-card:hover {
          border-color: #83b99b;
          box-shadow: 0 4px 12px rgba(27,67,49,.07);
          transform: translateY(-2px);
        }

        @media (max-width: 1000px) {
          .bb-sidebar {
            width: 220px;
            flex-basis: 220px;
          }

          .bb-main {
            padding: 22px;
          }

          .bb-stats {
            grid-template-columns: 1fr;
          }

          .bb-manage-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 720px) {
          .bb-layout {
            display: block;
          }

          .bb-sidebar {
            position: relative;
            width: 100%;
            height: auto;
            min-height: auto;
            padding: 16px;
          }

          .bb-brand {
            padding: 0 6px 14px;
          }

          .bb-nav {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .bb-nav button {
            padding: 10px;
          }

          .bb-main {
            padding: 16px;
          }

          .bb-two-col {
            grid-template-columns: 1fr;
          }

          .bb-manage-grid {
            grid-template-columns: 1fr;
          }

          .bb-header {
            align-items: flex-start !important;
            flex-direction: column;
          }
        }
      `}</style>

      <div className="bb-layout">
        {/* LEFT SIDEBAR */}
        <aside className="bb-sidebar">
          <div className="bb-brand">
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: "#2e6953",
                display: "grid",
                placeItems: "center",
                fontSize: 23,
              }}
            >
              💰
            </div>

            <div>
              <div
                style={{
                  fontSize: 19,
                  fontWeight: 800,
                  letterSpacing: "-0.4px",
                }}
              >
                BudgetBuddy
              </div>

              <div
                style={{
                  fontSize: 11,
                  color: "#b6d1c2",
                  marginTop: 4,
                }}
              >
                PERSONAL FINANCE
              </div>
            </div>
          </div>

          <div
            style={{
              color: "#9ebcae",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "1.4px",
              padding: "0 13px 10px",
            }}
          >
            WORKSPACE
          </div>

          <nav className="bb-nav" aria-label="Main navigation">
            {navItems.map((item) => (
              <button
                key={item.path}
                className={
                  item.path === "/dashboard" ? "bb-active" : ""
                }
                onClick={() => navigate(item.path)}
                aria-current={
                  item.path === "/dashboard" ? "page" : undefined
                }
              >
                <span className="bb-nav-icon">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>

          <div style={{ marginTop: "auto", padding: "20px 8px 0" }}>
            <div
              style={{
                borderTop: "1px solid #315648",
                paddingTop: 18,
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  color: "#a9c5b7",
                  fontSize: 11,
                  marginBottom: 5,
                }}
              >
                SIGNED IN AS
              </div>

              <div
                style={{
                  color: "#ffffff",
                  fontSize: 12,
                  overflowWrap: "anywhere",
                }}
              >
                {user.email}
              </div>
            </div>

            <button
              onClick={handleLogout}
              style={{
                width: "100%",
                border: "1px solid #4a685d",
                borderRadius: 10,
                padding: "11px 12px",
                background: "transparent",
                color: "#ffe1e1",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              ↪ &nbsp; Log out
            </button>
          </div>
        </aside>

        {/* MAIN DASHBOARD */}
        <main className="bb-main">
          <div className="bb-content">
            {/* HEADER */}
            <header
              className="bb-header"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 16,
                marginBottom: 28,
              }}
            >
              <div>
                <div
                  style={{
                    color: "#4c8b68",
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: "1px",
                    marginBottom: 8,
                  }}
                >
                  YOUR FINANCIAL OVERVIEW
                </div>

                <h1
                  style={{
                    fontSize: 28,
                    margin: 0,
                    color: "#20392d",
                  }}
                >
                  Welcome back! 👋
                </h1>

                <p
                  style={{
                    margin: "8px 0 0",
                    color: "#78877e",
                    fontSize: 14,
                  }}
                >
                  Here’s what’s happening with your money today.
                </p>
              </div>

              <div
                style={{
                  background: "#e6f3e9",
                  color: "#286846",
                  borderRadius: 12,
                  padding: "11px 14px",
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                ● &nbsp; Account active
              </div>
            </header>

            {/* FINANCIAL SUMMARY CARDS */}
            <section className="bb-stats">
              <div
                style={{
                  ...cardStyle,
                  borderTop: "4px solid #238b57",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      color: "#748278",
                      fontSize: 13,
                    }}
                  >
                    Total Income
                  </p>

                  <span
                    style={{
                      background: "#e7f6ec",
                      color: "#238b57",
                      borderRadius: 9,
                      padding: "8px 10px",
                    }}
                  >
                    ↗
                  </span>
                </div>

                <h2
                  style={{
                    margin: "14px 0 0",
                    color: "#238b57",
                    fontSize: 27,
                  }}
                >
                  ₹{formatAmount(dashboard.total_income)}
                </h2>
              </div>

              <div
                style={{
                  ...cardStyle,
                  borderTop: "4px solid #dc5b5b",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      color: "#748278",
                      fontSize: 13,
                    }}
                  >
                    Total Expenses
                  </p>

                  <span
                    style={{
                      background: "#fff0f0",
                      color: "#dc5b5b",
                      borderRadius: 9,
                      padding: "8px 10px",
                    }}
                  >
                    ↘
                  </span>
                </div>

                <h2
                  style={{
                    margin: "14px 0 0",
                    color: "#dc5b5b",
                    fontSize: 27,
                  }}
                >
                  ₹{formatAmount(dashboard.total_expenses)}
                </h2>
              </div>

              <div
                style={{
                  ...cardStyle,
                  borderTop: "4px solid #3478b8",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      color: "#748278",
                      fontSize: 13,
                    }}
                  >
                    Remaining Balance
                  </p>

                  <span
                    style={{
                      background: "#eaf3ff",
                      color: "#3478b8",
                      borderRadius: 9,
                      padding: "8px 10px",
                    }}
                  >
                    ◈
                  </span>
                </div>

                <h2
                  style={{
                    margin: "14px 0 0",
                    color: "#3478b8",
                    fontSize: 27,
                  }}
                >
                  ₹{formatAmount(dashboard.remaining_balance)}
                </h2>
              </div>
            </section>

            {/* CATEGORY SPENDING AND MONTHLY TRENDS */}
            <section className="bb-two-col">
              <div style={cardStyle}>
                <h3 style={sectionTitle}>📊 Spending by Category</h3>

                {Object.keys(categoryExpenses).length === 0 ? (
                  <p style={{ color: "#78877e", fontSize: 14 }}>
                    No expense data yet.
                  </p>
                ) : (
                  Object.entries(categoryExpenses).map(
                    ([category, amount]) => (
                      <div
                        key={category}
                        style={{ marginBottom: 17 }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 10,
                            marginBottom: 7,
                            fontSize: 13,
                          }}
                        >
                          <strong>{category}</strong>
                          <span style={{ color: "#64766a" }}>
                            ₹{formatAmount(amount)}
                          </span>
                        </div>

                        <div
                          style={{
                            height: 9,
                            background: "#edf1ee",
                            borderRadius: 20,
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${Math.min(
                                (Number(amount) / maxCategoryAmount) * 100,
                                100
                              )}%`,
                              height: "100%",
                              background:
                                "linear-gradient(90deg, #32865c, #82c69a)",
                              borderRadius: 20,
                            }}
                          />
                        </div>
                      </div>
                    )
                  )
                )}
              </div>

              <div style={cardStyle}>
                <h3 style={sectionTitle}>
                  📈 Monthly Income vs Expenses
                </h3>

                {monthlyTrends.length === 0 ? (
                  <p style={{ color: "#78877e", fontSize: 14 }}>
                    No monthly data yet.
                  </p>
                ) : (
                  monthlyTrends.map((item) => (
                    <div
                      key={item.month}
                      style={{
                        marginBottom: 16,
                        paddingBottom: 13,
                        borderBottom: "1px solid #edf1ee",
                      }}
                    >
                      <strong style={{ fontSize: 13 }}>
                        {item.month}
                      </strong>

                      <div style={{ marginTop: 10 }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: 12,
                            marginBottom: 5,
                            color: "#238b57",
                          }}
                        >
                          <span>Income</span>
                          <span>₹{formatAmount(item.income)}</span>
                        </div>

                        <div
                          style={{
                            height: 7,
                            background: "#eaf2ec",
                            borderRadius: 20,
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${Math.min(
                                ((Number(item.income) || 0) /
                                  maxMonthlyAmount) *
                                  100,
                                100
                              )}%`,
                              height: "100%",
                              background: "#3b9a68",
                              borderRadius: 20,
                            }}
                          />
                        </div>
                      </div>

                      <div style={{ marginTop: 9 }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: 12,
                            marginBottom: 5,
                            color: "#dc5b5b",
                          }}
                        >
                          <span>Expenses</span>
                          <span>₹{formatAmount(item.expenses)}</span>
                        </div>

                        <div
                          style={{
                            height: 7,
                            background: "#f8eaea",
                            borderRadius: 20,
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${Math.min(
                                ((Number(item.expenses) || 0) /
                                  maxMonthlyAmount) *
                                  100,
                                100
                              )}%`,
                              height: "100%",
                              background: "#dc6868",
                              borderRadius: 20,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* SAVINGS GOALS AND BUDGETS */}
            <section className="bb-two-col">
              <div style={cardStyle}>
                <h3 style={sectionTitle}>🎯 Savings Progress</h3>

                {savingsProgress.length === 0 ? (
                  <p style={{ color: "#78877e", fontSize: 14 }}>
                    No savings goals yet.
                  </p>
                ) : (
                  savingsProgress.map((goal) => (
                    <div
                      key={goal.goal_id}
                      style={{
                        marginBottom: 18,
                        paddingBottom: 15,
                        borderBottom: "1px solid #edf1ee",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 10,
                          marginBottom: 8,
                        }}
                      >
                        <strong style={{ fontSize: 13 }}>
                          {goal.goal_name}
                        </strong>

                        <span
                          style={{
                            color:
                              goal.status === "Completed"
                                ? "#238b57"
                                : "#78877e",
                            fontWeight: 700,
                            fontSize: 13,
                          }}
                        >
                          {goal.progress}%
                        </span>
                      </div>

                      <div
                        style={{
                          height: 10,
                          background: "#eee8f8",
                          borderRadius: 20,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${Math.min(
                              Number(goal.progress) || 0,
                              100
                            )}%`,
                            height: "100%",
                            background: "#8b6ac2",
                            borderRadius: 20,
                          }}
                        />
                      </div>

                      <p
                        style={{
                          margin: "8px 0 0",
                          color: "#78877e",
                          fontSize: 12,
                        }}
                      >
                        ₹{formatAmount(goal.current_amount)} / ₹
                        {formatAmount(goal.target_amount)}
                      </p>
                    </div>
                  ))
                )}

                <button
                  onClick={() => navigate("/savings-goals")}
                  style={{
                    border: 0,
                    background: "transparent",
                    color: "#347b55",
                    padding: "8px 0 0",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Manage savings goals →
                </button>
              </div>

              <div style={cardStyle}>
                <h3 style={sectionTitle}>💳 Budget Summary</h3>

                {budgets.length === 0 ? (
                  <p style={{ color: "#78877e", fontSize: 14 }}>
                    No budgets yet. Create a budget to start tracking limits.
                  </p>
                ) : (
                  budgets.map((budget) => (
                    <div
                      key={budget.budget_id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 12,
                        padding: "13px 0",
                        borderBottom: "1px solid #edf1ee",
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: 13 }}>
                          {budget.category}
                        </strong>

                        <div
                          style={{
                            color: "#78877e",
                            fontSize: 12,
                            marginTop: 4,
                          }}
                        >
                          Budget limit
                        </div>
                      </div>

                      <strong style={{ whiteSpace: "nowrap" }}>
                        ₹{formatAmount(budget.amount_limit)}
                      </strong>
                    </div>
                  ))
                )}

                <button
                  onClick={() => navigate("/budgets")}
                  style={{
                    border: 0,
                    background: "transparent",
                    color: "#347b55",
                    padding: "13px 0 0",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Manage budgets →
                </button>
              </div>
            </section>

            {/* RECENT TRANSACTIONS */}
            <section style={{ ...cardStyle, marginBottom: 22 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 10,
                }}
              >
                <h3 style={{ ...sectionTitle, marginBottom: 0 }}>
                  🧾 Recent Transactions
                </h3>

                <button
                  onClick={() => navigate("/expenses")}
                  style={{
                    border: 0,
                    background: "transparent",
                    color: "#347b55",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  View expenses →
                </button>
              </div>

              {recentTransactions.length === 0 ? (
                <p style={{ color: "#78877e", fontSize: 14 }}>
                  No transactions yet.
                </p>
              ) : (
                recentTransactions.map((transaction, index) => (
                  <div
                    key={`${transaction.type}-${transaction.category_or_source}-${index}`}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                      padding: "14px 4px",
                      borderBottom: "1px solid #edf1ee",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        minWidth: 0,
                      }}
                    >
                      <span
                        style={{
                          width: 36,
                          height: 36,
                          flex: "0 0 36px",
                          borderRadius: 11,
                          display: "grid",
                          placeItems: "center",
                          background:
                            transaction.type === "income"
                              ? "#e7f6ec"
                              : "#fff0f0",
                          color:
                            transaction.type === "income"
                              ? "#238b57"
                              : "#dc5b5b",
                          fontSize: 18,
                        }}
                      >
                        {transaction.type === "income" ? "↗" : "↘"}
                      </span>

                      <div style={{ minWidth: 0 }}>
                        <strong
                          style={{
                            display: "block",
                            fontSize: 13,
                          }}
                        >
                          {transaction.category_or_source}
                        </strong>

                        <span
                          style={{
                            color: "#78877e",
                            fontSize: 12,
                          }}
                        >
                          {transaction.type === "income"
                            ? "Income"
                            : "Expense"}
                        </span>
                      </div>
                    </div>

                    <strong
                      style={{
                        color:
                          transaction.type === "income"
                            ? "#238b57"
                            : "#dc5b5b",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {transaction.type === "income" ? "+" : "-"}₹
                      {formatAmount(transaction.amount)}
                    </strong>
                  </div>
                ))
              )}
            </section>

            {/* QUICK ACTIONS */}
            <section style={{ ...cardStyle, marginBottom: 24 }}>
              <div style={{ marginBottom: 18 }}>
                <h3 style={{ ...sectionTitle, marginBottom: 6 }}>
                  ⚡ Quick actions
                </h3>

                <p
                  style={{
                    margin: 0,
                    color: "#78877e",
                    fontSize: 13,
                  }}
                >
                  Jump straight to the tools you use most.
                </p>
              </div>

              <div className="bb-manage-grid">
                {[
                  {
                    title: "Add Income",
                    description: "Record money you receive",
                    icon: "↗",
                    path: "/income",
                    color: "#238b57",
                  },
                  {
                    title: "Add Expense",
                    description: "Track a purchase or bill",
                    icon: "↘",
                    path: "/expenses",
                    color: "#dc5b5b",
                  },
                  {
                    title: "Manage Budgets",
                    description: "Set and review spending limits",
                    icon: "◉",
                    path: "/budgets",
                    color: "#3478b8",
                  },
                  {
                    title: "Savings Goals",
                    description: "Track progress toward a goal",
                    icon: "☆",
                    path: "/savings-goals",
                    color: "#8b6ac2",
                  },
                  {
                    title: "Analytics",
                    description: "Explore trends and spending",
                    icon: "▥",
                    path: "/analytics",
                    color: "#3478b8",
                  },
                  {
                    title: "Reports",
                    description: "Review your financial reports",
                    icon: "▤",
                    path: "/reports",
                    color: "#278b86",
                  },
                ].map((item) => (
                  <button
                    key={item.path}
                    className="bb-manage-card"
                    onClick={() => navigate(item.path)}
                  >
                    <span
                      style={{
                        display: "inline-grid",
                        placeItems: "center",
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: `${item.color}15`,
                        color: item.color,
                        fontSize: 20,
                        marginBottom: 12,
                      }}
                    >
                      {item.icon}
                    </span>

                    <strong
                      style={{
                        display: "block",
                        color: "#263b30",
                        fontSize: 13,
                        marginBottom: 6,
                      }}
                    >
                      {item.title}
                    </strong>

                    <span
                      style={{
                        display: "block",
                        color: "#78877e",
                        fontSize: 12,
                        lineHeight: 1.5,
                      }}
                    >
                      {item.description}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <footer
              style={{
                textAlign: "center",
                color: "#91a096",
                fontSize: 12,
                padding: "0 0 10px",
              }}
            >
              BudgetBuddy · Your money, made clearer.
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;