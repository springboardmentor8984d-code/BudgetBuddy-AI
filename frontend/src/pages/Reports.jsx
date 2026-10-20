
import { useEffect, useState } from "react";
import jsPDF from "jspdf";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const money = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const number = (value) => Number(value || 0);

function Reports() {
  const [report, setReport] = useState(null);
  const [reports, setReports] = useState([]);
  const [month, setMonth] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const token = localStorage.getItem("token");

  const fetchReports = async () => {
    try {
      const response = await fetch(`${API}/reports/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Could not load previous reports.");

      const data = await response.json();
      setReports(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const generateReport = async () => {
    if (!month) {
      setError("Please select a month first.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API}/reports/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          report_type: "monthly",
          report_period: month,
        }),
      });

      if (!response.ok) {
        const detail = await response.json().catch(() => ({}));
        throw new Error(
          detail.detail || "Failed to generate the report."
        );
      }

      const data = await response.json();
      setReport(data);
      setSuccess("Your monthly report has been generated!");
      await fetchReports();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = (item) => {
    if (!item) return;

    const rows = [
      ["BudgetBuddy - Financial Report"],
      ["Report Period", item.report_period],
      [],
      ["Summary"],
      ["Total Income", number(item.total_income).toFixed(2)],
      ["Total Expenses", number(item.total_expenses).toFixed(2)],
      ["Remaining Balance", number(item.remaining_balance).toFixed(2)],
      [],
      ["Category-wise Expenses"],
      ["Category", "Amount (INR)"],
      ...Object.entries(item.category_wise_expenses || {}).map(
        ([category, amount]) => [category, number(amount).toFixed(2)]
      ),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((cell) => {
            const value = String(cell ?? "");
            return `"${value.replace(/"/g, '""')}"`;
          })
          .join(",")
      )
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `BudgetBuddy_Report_${item.report_period}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const downloadPDF = (item) => {
    if (!item) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 18;
    let y = 20;

    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, pageWidth, 43, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("BudgetBuddy", margin, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text("Monthly Financial Report", margin, y + 10);
    doc.text(`Period: ${item.report_period}`, margin, y + 18);

    y = 57;

    doc.setTextColor(35, 40, 60);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text("Financial Summary", margin, y);
    y += 10;

    const summaries = [
      ["Total Income", number(item.total_income)],
      ["Total Expenses", number(item.total_expenses)],
      ["Remaining Balance", number(item.remaining_balance)],
    ];

    summaries.forEach(([label, amount]) => {
      doc.setDrawColor(225, 228, 238);
      doc.setFillColor(248, 249, 253);
      doc.roundedRect(margin, y, pageWidth - margin * 2, 15, 2, 2, "FD");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(80, 86, 105);
      doc.text(label, margin + 5, y + 9);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(35, 40, 60);
      doc.text(
        `INR ${amount.toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
        pageWidth - margin - 5,
        y + 9,
        { align: "right" }
      );

      y += 19;
    });

    y += 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(35, 40, 60);
    doc.text("Category-wise Expenses", margin, y);
    y += 9;

    const categories = Object.entries(item.category_wise_expenses || {});

    if (categories.length === 0) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("No category expense data available.", margin, y);
      y += 9;
    } else {
      doc.setFillColor(238, 240, 250);
      doc.rect(margin, y - 5, pageWidth - margin * 2, 10, "F");
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("Category", margin + 3, y + 1);
      doc.text("Amount (INR)", pageWidth - margin - 3, y + 1, {
        align: "right",
      });
      y += 12;

      categories.forEach(([category, amount]) => {
        if (y > 265) {
          doc.addPage();
          y = 20;
        }

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(65, 70, 90);

        const categoryLines = doc.splitTextToSize(
          String(category),
          pageWidth - margin * 2 - 55
        );

        doc.text(categoryLines, margin + 3, y);
        doc.text(
          number(amount).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }),
          pageWidth - margin - 3,
          y,
          { align: "right" }
        );

        y += Math.max(8, categoryLines.length * 5);
      });
    }

    const pageCount = doc.internal.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(130, 135, 150);
      doc.text(
        `BudgetBuddy | Page ${i} of ${pageCount}`,
        pageWidth / 2,
        287,
        { align: "center" }
      );
    }

    doc.save(`BudgetBuddy_Report_${item.report_period}.pdf`);
  };

  const displayReport = (item) => {
    setReport(item);
    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const categories = Object.entries(report?.category_wise_expenses || {});
  const maxCategoryAmount = Math.max(
    1,
    ...categories.map(([, amount]) => number(amount))
  );

  const styles = {
    page: {
      minHeight: "100vh",
      background: "#F5F6FC",
      padding: "32px",
      color: "#20243A",
      fontFamily: "Inter, system-ui, -apple-system, sans-serif",
    },
    container: { maxWidth: "1180px", margin: "0 auto" },
    muted: { color: "#858BA3", fontSize: "14px" },
    panel: {
      background: "#FFFFFF",
      border: "1px solid #E9EAF2",
      borderRadius: "18px",
      padding: "24px",
      boxShadow: "0 5px 20px rgba(34, 40, 80, 0.035)",
    },
    button: {
      border: "none",
      borderRadius: "10px",
      padding: "12px 17px",
      fontSize: "13px",
      fontWeight: 700,
      cursor: "pointer",
    },
    label: {
      display: "block",
      fontSize: "12px",
      fontWeight: 700,
      color: "#737991",
      marginBottom: "9px",
    },
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "18px",
            marginBottom: "30px",
          }}
        >
          <div>
            <div
              style={{
                color: "#635BDB",
                fontSize: "12px",
                fontWeight: 800,
                letterSpacing: "2px",
                marginBottom: "8px",
              }}
            >
              YOUR MONEY, CLEARLY
            </div>
            <h1
              style={{
                fontSize: "clamp(26px, 4vw, 36px)",
                letterSpacing: "-1.2px",
                margin: "0 0 8px",
              }}
            >
              Financial Reports
            </h1>
            <p style={{ ...styles.muted, margin: 0 }}>
              Understand your spending and track your financial progress.
            </p>
          </div>

          {report && (
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button
                onClick={() => downloadCSV(report)}
                style={{
                  ...styles.button,
                  background: "#E4F7EC",
                  color: "#16834A",
                }}
              >
                ↓ Export CSV
              </button>
              <button
                onClick={() => downloadPDF(report)}
                style={{
                  ...styles.button,
                  background: "#635BDB",
                  color: "#FFFFFF",
                }}
              >
                ↓ Download PDF
              </button>
            </div>
          )}
        </header>

        {error && (
          <div
            role="alert"
            style={{
              padding: "14px 16px",
              background: "#FFF0F0",
              color: "#B42332",
              borderRadius: "12px",
              marginBottom: "18px",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            style={{
              padding: "14px 16px",
              background: "#EAF8EF",
              color: "#187442",
              borderRadius: "12px",
              marginBottom: "18px",
              fontSize: "14px",
            }}
          >
            {success}
          </div>
        )}

        <section
          style={{
            ...styles.panel,
            background: "linear-gradient(120deg, #FFFFFF, #F0EFFF)",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "10px",
            }}
          >
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "13px",
                background: "#E5E2FF",
                display: "grid",
                placeItems: "center",
                fontSize: "22px",
              }}
            >
              ✦
            </div>
            <div>
              <h2 style={{ fontSize: "19px", margin: 0 }}>
                Generate a report
              </h2>
              <p style={{ ...styles.muted, margin: "5px 0 0" }}>
                Choose a month to create your financial summary.
              </p>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
              alignItems: "end",
              marginTop: "22px",
            }}
          >
            <div style={{ flex: "1 1 220px", maxWidth: "330px" }}>
              <label style={styles.label} htmlFor="report-month">
                REPORTING MONTH
              </label>
              <input
                id="report-month"
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "13px",
                  borderRadius: "10px",
                  border: "1px solid #DCDDEA",
                  background: "#FFFFFF",
                  fontSize: "14px",
                  color: "#20243A",
                }}
              />
            </div>

            <button
              onClick={generateReport}
              disabled={loading}
              style={{
                ...styles.button,
                background: loading ? "#A6A2E8" : "#635BDB",
                color: "#FFFFFF",
                minHeight: "44px",
                opacity: loading ? 0.8 : 1,
              }}
            >
              {loading ? "Generating..." : "✦ Generate Report"}
            </button>
          </div>
        </section>

        {report ? (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
                margin: "30px 0 16px",
              }}
            >
              <div>
                <h2 style={{ margin: "0 0 5px", fontSize: "22px" }}>
                  Report overview
                </h2>
                <p style={{ ...styles.muted, margin: 0 }}>
                  Financial summary for {report.report_period}
                </p>
              </div>
              <span
                style={{
                  padding: "7px 12px",
                  background: "#E8F7ED",
                  color: "#187442",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: 700,
                }}
              >
                ✓ Report ready
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
                gap: "17px",
              }}
            >
              {[
                {
                  title: "Total income",
                  value: report.total_income,
                  symbol: "↗",
                  color: "#17834C",
                  bg: "#E6F7ED",
                },
                {
                  title: "Total expenses",
                  value: report.total_expenses,
                  symbol: "↘",
                  color: "#DB7B36",
                  bg: "#FFF0E3",
                },
                {
                  title: "Remaining balance",
                  value: report.remaining_balance,
                  symbol: "₹",
                  color: "#635BDB",
                  bg: "#EBE9FF",
                },
              ].map((card) => (
                <div
                  key={card.title}
                  style={{
                    ...styles.panel,
                    padding: "21px",
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "24px",
                    }}
                  >
                    <span style={{ ...styles.muted, fontWeight: 600 }}>
                      {card.title}
                    </span>
                    <span
                      style={{
                        width: "38px",
                        height: "38px",
                        display: "grid",
                        placeItems: "center",
                        borderRadius: "12px",
                        background: card.bg,
                        color: card.color,
                        fontSize: "20px",
                        fontWeight: 800,
                      }}
                    >
                      {card.symbol}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: "clamp(21px, 3vw, 27px)",
                      fontWeight: 800,
                      letterSpacing: "-0.7px",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {money(card.value)}
                  </div>
                  <div
                    style={{
                      marginTop: "10px",
                      fontSize: "12px",
                      color: "#8A90A6",
                    }}
                  >
                    {report.report_period} summary
                  </div>
                </div>
              ))}
            </div>

            <section style={{ ...styles.panel, marginTop: "22px" }}>
              <div style={{ marginBottom: "22px" }}>
                <h2 style={{ fontSize: "19px", margin: "0 0 6px" }}>
                  Spending by category
                </h2>
                <p style={{ ...styles.muted, margin: 0 }}>
                  See where your money went this month.
                </p>
              </div>

              {categories.length === 0 ? (
                <p style={styles.muted}>No category expenses in this report.</p>
              ) : (
                categories
                  .sort((a, b) => number(b[1]) - number(a[1]))
                  .map(([category, amount], index) => (
                    <div key={category} style={{ marginBottom: "22px" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "12px",
                          marginBottom: "9px",
                          fontSize: "14px",
                        }}
                      >
                        <span style={{ fontWeight: 600, overflowWrap: "anywhere" }}>
                          {category}
                        </span>
                        <strong style={{ whiteSpace: "nowrap" }}>
                          {money(amount)}
                        </strong>
                      </div>
                      <div
                        style={{
                          width: "100%",
                          height: "9px",
                          borderRadius: "20px",
                          background: "#F0F0F7",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${(number(amount) / maxCategoryAmount) * 100}%`,
                            borderRadius: "20px",
                            background: [
                              "#635BDB",
                              "#E89B55",
                              "#42A889",
                              "#D66D9B",
                              "#6394E8",
                              "#A27ADB",
                            ][index % 6],
                            transition: "width 0.3s ease",
                          }}
                        />
                      </div>
                    </div>
                  ))
              )}
            </section>

            <section
              style={{
                ...styles.panel,
                marginTop: "22px",
                background: "#252547",
                color: "#FFFFFF",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "20px",
              }}
            >
              <div>
                <h2 style={{ fontSize: "18px", margin: "0 0 7px" }}>
                  Take your report with you
                </h2>
                <p
                  style={{
                    margin: 0,
                    color: "#C2C2DD",
                    fontSize: "13px",
                    lineHeight: 1.6,
                  }}
                >
                  Save a spreadsheet or a shareable PDF copy.
                </p>
              </div>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button
                  onClick={() => downloadCSV(report)}
                  style={{
                    ...styles.button,
                    background: "#DDF5E7",
                    color: "#187442",
                  }}
                >
                  ↓ Download CSV
                </button>
                <button
                  onClick={() => downloadPDF(report)}
                  style={{
                    ...styles.button,
                    background: "#FFFFFF",
                    color: "#4D46B9",
                  }}
                >
                  ↓ Download PDF
                </button>
              </div>
            </section>
          </>
        ) : (
          <section
            style={{
              ...styles.panel,
              textAlign: "center",
              padding: "48px 20px",
              marginTop: "22px",
            }}
          >
            <div
              style={{
                width: "68px",
                height: "68px",
                borderRadius: "22px",
                background: "#EBE9FF",
                color: "#635BDB",
                fontSize: "30px",
                display: "grid",
                placeItems: "center",
                margin: "0 auto 18px",
              }}
            >
              ▤
            </div>
            <h2 style={{ fontSize: "20px", marginBottom: "8px" }}>
              Your financial story starts here
            </h2>
            <p
              style={{
                ...styles.muted,
                maxWidth: "390px",
                margin: "0 auto",
                lineHeight: 1.7,
              }}
            >
              Select a month above and generate a report to see your income,
              expenses, remaining balance, and spending breakdown.
            </p>
          </section>
        )}

        <section style={{ marginTop: "38px" }}>
          <div style={{ marginBottom: "18px" }}>
            <h2 style={{ fontSize: "22px", margin: "0 0 6px" }}>
              Previous reports
            </h2>
            <p style={{ ...styles.muted, margin: 0 }}>
              Reopen an earlier report or download it again.
            </p>
          </div>

          {reports.length === 0 ? (
            <div style={{ ...styles.panel, textAlign: "center", padding: "30px" }}>
              <p style={styles.muted}>No previous reports found yet.</p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))",
                gap: "15px",
              }}
            >
              {reports.map((item) => (
                <div
                  key={item.report_id}
                  style={{
                    ...styles.panel,
                    padding: "20px",
                    transition: "transform 0.2s ease",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      marginBottom: "18px",
                    }}
                  >
                    <div
                      style={{
                        width: "43px",
                        height: "43px",
                        borderRadius: "13px",
                        display: "grid",
                        placeItems: "center",
                        background: "#EBE9FF",
                        color: "#635BDB",
                        fontSize: "21px",
                      }}
                    >
                      ▤
                    </div>
                    <div>
                      <h3 style={{ margin: "0 0 4px", fontSize: "16px" }}>
                        {item.report_period}
                      </h3>
                      <span style={{ ...styles.muted, fontSize: "12px" }}>
                        Monthly report
                      </span>
                    </div>
                  </div>

                  <div style={{ fontSize: "13px", lineHeight: 2 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
                      <span style={styles.muted}>Income</span>
                      <strong>{money(item.total_income)}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
                      <span style={styles.muted}>Expenses</span>
                      <strong>{money(item.total_expenses)}</strong>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "8px",
                        borderTop: "1px solid #ECECF3",
                        marginTop: "8px",
                        paddingTop: "8px",
                      }}
                    >
                      <span style={styles.muted}>Balance</span>
                      <strong style={{ color: "#635BDB" }}>
                        {money(item.remaining_balance)}
                      </strong>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      marginTop: "18px",
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      onClick={() => displayReport(item)}
                      style={{
                        ...styles.button,
                        flex: "1 1 100px",
                        background: "#635BDB",
                        color: "#FFFFFF",
                      }}
                    >
                      View report
                    </button>
                    <button
                      onClick={() => downloadCSV(item)}
                      style={{
                        ...styles.button,
                        background: "#E4F7EC",
                        color: "#16834A",
                      }}
                    >
                      CSV
                    </button>
                    <button
                      onClick={() => downloadPDF(item)}
                      style={{
                        ...styles.button,
                        background: "#FFF0F0",
                        color: "#B42332",
                      }}
                    >
                      PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <footer
          style={{
            textAlign: "center",
            color: "#969BB0",
            fontSize: "12px",
            padding: "35px 0 10px",
          }}
        >
          BudgetBuddy · Your personal finance overview
        </footer>
      </div>
    </div>
  );
}

export default Reports;
