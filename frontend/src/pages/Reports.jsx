import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL

function Reports() {
  const now = new Date()

  const [month, setMonth] = useState(
    String(now.getMonth() + 1).padStart(2, '0')
  )

  const [year, setYear] = useState(
    String(now.getFullYear())
  )

  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const selectedMonth = `${year}-${month}`

  const fetchReport = async () => {
    try {
      setLoading(true)
      setError('')

      const token = localStorage.getItem('access_token')

      const response = await axios.get(
        `${API_URL}/reports/monthly/?month=${selectedMonth}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      setReport(response.data)
    } catch (err) {
      console.error(err)

      setError(
        err.response?.data?.detail ||
        'Failed to load report.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
  }, [selectedMonth])

  const downloadFile = async (type) => {
    try {
      setMessage('')

      const token = localStorage.getItem('access_token')

      const response = await axios.get(
        `${API_URL}/reports/monthly/${type}/?month=${selectedMonth}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          responseType: 'blob',
        }
      )

      const url = window.URL.createObjectURL(
        new Blob([response.data])
      )

      const link = document.createElement('a')

      link.href = url

      if (type === 'pdf') {
        link.download =
          `BudgetBuddy_Report_${selectedMonth}.pdf`
      } else {
        link.download =
          `BudgetBuddy_Report_${selectedMonth}.xlsx`
      }

      document.body.appendChild(link)

      link.click()

      link.remove()

      window.URL.revokeObjectURL(url)

      setMessage('Report downloaded successfully.')
    } catch (err) {
      console.error(err)
      setMessage('Failed to download report.')
    }
  }

  const downloadCSV = () => {
    if (!report) return

    const rows = []

    rows.push([
      'BudgetBuddy Monthly Financial Report'
    ])

    rows.push([
      `Month: ${selectedMonth}`
    ])

    rows.push([])

    rows.push([
      'Financial Summary'
    ])

    rows.push([
      'Total Income',
      report.summary.total_income
    ])

    rows.push([
      'Total Expenses',
      report.summary.total_expenses
    ])

    rows.push([
      'Net Savings',
      report.summary.savings
    ])

    rows.push([])

    rows.push([
      'Category-wise Expenses'
    ])

    rows.push([
      'Category',
      'Amount'
    ])

    report.category_wise_expenses.forEach(
      (item) => {
        rows.push([
          item.category,
          item.total
        ])
      }
    )

    rows.push([])

    rows.push([
      'Budget Summary'
    ])

    rows.push([
      'Category',
      'Budget',
      'Spent',
      'Remaining',
      'Status'
    ])

    report.budget_summary.forEach(
      (budget) => {
        rows.push([
          budget.category,
          budget.budget_amount,
          budget.spent_amount,
          budget.remaining_amount,
          budget.status
        ])
      }
    )

    const csv = rows
      .map((row) =>
        row
          .map((value) =>
            `"${String(value ?? '').replaceAll('"', '""')}"`
          )
          .join(',')
      )
      .join('\n')

    const blob = new Blob(
      [csv],
      {
        type: 'text/csv;charset=utf-8;'
      }
    )

    const url = window.URL.createObjectURL(blob)

    const link = document.createElement('a')

    link.href = url

    link.download =
      `BudgetBuddy_Report_${selectedMonth}.csv`

    document.body.appendChild(link)

    link.click()

    link.remove()

    window.URL.revokeObjectURL(url)

    setMessage('CSV report downloaded successfully.')
  }

  const totalIncome =
    Number(report?.summary?.total_income || 0)

  const totalExpenses =
    Number(report?.summary?.total_expenses || 0)

  const savings =
    Number(report?.summary?.savings || 0)

  const savingsRate =
    totalIncome > 0
      ? ((savings / totalIncome) * 100).toFixed(1)
      : '0.0'

  const transactionCount =
    report?.category_wise_expenses?.reduce(
      (total, item) => total + 1,
      0
    ) || 0

  const formatMoney = (value) => {
    return Number(value || 0).toFixed(2)
  }

  return (
    <div style={styles.page}>

      {/* SIDEBAR */}

      <aside style={styles.sidebar}>

        <div style={styles.logo}>
          <div style={styles.logoBox}>
            B
          </div>

          <strong>
            BudgetBuddy
          </strong>
        </div>

        <div style={styles.menuTitle}>
          MENU
        </div>

        <Link
          to="/dashboard"
          style={styles.menuItem}
        >
          Overview
        </Link>

        <Link
          to="/dashboard"
          style={styles.menuItem}
        >
          Budgets
        </Link>

        <Link
          to="/dashboard"
          style={styles.menuItem}
        >
          Savings
        </Link>

        <Link
          to="/dashboard"
          style={styles.menuItem}
        >
          Income
        </Link>

        <Link
          to="/dashboard"
          style={styles.menuItem}
        >
          Expenses
        </Link>

        <Link
          to="/dashboard"
          style={styles.menuItem}
        >
          Analytics
        </Link>

        <Link
          to="/reports"
          style={{
            ...styles.menuItem,
            ...styles.activeMenu
          }}
        >
          Reports
        </Link>

      </aside>

      {/* MAIN CONTENT */}

      <main style={styles.main}>

        <h1 style={styles.title}>
          Reports
        </h1>

        <div style={styles.reportHeader}>

          <div>
            <span style={styles.dot}>
              ●
            </span>

            <strong>
              Monthly Reports
            </strong>
          </div>

          <div style={styles.filters}>

            <select
              value={month}
              onChange={(e) =>
                setMonth(e.target.value)
              }
              style={styles.select}
            >
              <option value="01">
                January
              </option>

              <option value="02">
                February
              </option>

              <option value="03">
                March
              </option>

              <option value="04">
                April
              </option>

              <option value="05">
                May
              </option>

              <option value="06">
                June
              </option>

              <option value="07">
                July
              </option>

              <option value="08">
                August
              </option>

              <option value="09">
                September
              </option>

              <option value="10">
                October
              </option>

              <option value="11">
                November
              </option>

              <option value="12">
                December
              </option>
            </select>

            <select
              value={year}
              onChange={(e) =>
                setYear(e.target.value)
              }
              style={styles.select}
            >
              <option value="2026">
                2026
              </option>

              <option value="2027">
                2027
              </option>

              <option value="2028">
                2028
              </option>
            </select>

          </div>

        </div>

        {/* DOWNLOAD BUTTONS */}

        <div style={styles.buttons}>

          <button
            onClick={() =>
              downloadFile('pdf')
            }
            style={styles.primaryButton}
          >
            ↓ PDF
          </button>

          <button
            onClick={() =>
              downloadFile('excel')
            }
            style={styles.primaryButton}
          >
            ↓ Excel
          </button>

          <button
            onClick={downloadCSV}
            style={styles.primaryButton}
          >
            ↓ CSV
          </button>

          <button
            onClick={fetchReport}
            style={styles.refreshButton}
          >
            Refresh
          </button>

        </div>

        {message && (
          <div style={styles.message}>
            {message}
          </div>
        )}

        {loading && (
          <h2>
            Loading report...
          </h2>
        )}

        {error && (
          <h2 style={styles.error}>
            {error}
          </h2>
        )}

        {!loading && !error && report && (
          <>

            {/* SUMMARY CARDS */}

            <div style={styles.cards}>

              <div
                style={{
                  ...styles.card,
                  borderTop: '3px solid #20c997'
                }}
              >
                <span style={styles.cardIcon}>
                  In
                </span>

                <p>
                  INCOME
                </p>

                <h2 style={styles.income}>
                  INR {formatMoney(totalIncome)}
                </h2>
              </div>

              <div
                style={{
                  ...styles.card,
                  borderTop: '3px solid #ff5c5c'
                }}
              >
                <span style={styles.expenseIcon}>
                  Ex
                </span>

                <p>
                  EXPENSES
                </p>

                <h2 style={styles.expense}>
                  INR {formatMoney(totalExpenses)}
                </h2>
              </div>

              <div
                style={{
                  ...styles.card,
                  borderTop: '3px solid #7467f0'
                }}
              >
                <span style={styles.savingIcon}>
                  Bl
                </span>

                <p>
                  NET SAVINGS
                </p>

                <h2 style={styles.income}>
                  INR {formatMoney(savings)}
                </h2>
              </div>

            </div>

            {/* REPORT INFO */}

            <p style={styles.info}>
              {selectedMonth}
              {' • '}
              Savings rate {savingsRate}%
              {' • '}
              {transactionCount} categories
            </p>

            {/* CATEGORY EXPENSES */}

            <section style={styles.section}>

              <h2>
                Expenses by Category
              </h2>

              {report.category_wise_expenses.length === 0 ? (
                <p>
                  No expenses recorded for this month.
                </p>
              ) : (
                report.category_wise_expenses.map(
                  (item) => {

                    const percentage =
                      totalExpenses > 0
                        ? (
                            Number(item.total) /
                            totalExpenses
                          ) * 100
                        : 0

                    return (
                      <div
                        key={item.category}
                        style={styles.category}
                      >

                        <div
                          style={styles.categoryName}
                        >
                          {item.category}
                        </div>

                        <div>
                          <strong>
                            INR {formatMoney(item.total)}
                          </strong>

                          <div style={styles.smallText}>
                            {percentage.toFixed(1)}% of expenses
                          </div>
                        </div>

                      </div>
                    )
                  }
                )
              )}

            </section>

            {/* BUDGET SUMMARY */}

            <section style={styles.section}>

              <h2>
                Budget Summary
              </h2>

              {report.budget_summary.length === 0 ? (
                <p>
                  No budgets found for this month.
                </p>
              ) : (
                report.budget_summary.map(
                  (budget) => (
                    <div
                      key={budget.category}
                      style={styles.budget}
                    >

                      <strong>
                        {budget.category}
                      </strong>

                      <span>
                        Budget: INR {formatMoney(
                          budget.budget_amount
                        )}
                      </span>

                      <span>
                        Spent: INR {formatMoney(
                          budget.spent_amount
                        )}
                      </span>

                      <span>
                        Remaining: INR {formatMoney(
                          budget.remaining_amount
                        )}
                      </span>

                      <strong>
                        {budget.status}
                      </strong>

                    </div>
                  )
                )
              )}

            </section>

            {/* SAVINGS GOALS */}

            <section style={styles.section}>

              <h2>
                🎯 Savings Goals
              </h2>

              {report.savings_goals.map(
                (goal) => (
                  <div
                    key={goal.id}
                    style={styles.goal}
                  >

                    <h3>
                      {goal.goal_name}
                    </h3>

                    <p>
                      Target: INR {formatMoney(
                        goal.target_amount
                      )}
                    </p>

                    <p>
                      Saved: INR {formatMoney(
                        goal.current_amount
                      )}
                    </p>

                    <p>
                      Progress: {goal.progress_percentage}%
                    </p>

                    <p>
                      Status: <strong>
                        {goal.status}
                      </strong>
                    </p>

                    <p>
                      Deadline: {goal.deadline}
                    </p>

                  </div>
                )
              )}

            </section>

          </>
        )}

      </main>

    </div>
  )
}

const styles = {

  page: {
    minHeight: '100vh',
    background: '#111827',
    color: '#f3f4f6',
    display: 'flex',
    fontFamily: 'Arial, sans-serif'
  },

  sidebar: {
    width: '240px',
    minHeight: '100vh',
    background: '#0d1526',
    borderRight: '1px solid #263148',
    padding: '20px',
    boxSizing: 'border-box'
  },

  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '18px',
    marginBottom: '45px'
  },

  logoBox: {
    width: '34px',
    height: '34px',
    borderRadius: '9px',
    background: '#7667f4',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '20px'
  },

  menuTitle: {
    fontSize: '10px',
    color: '#7d879b',
    marginBottom: '15px'
  },

  menuItem: {
    display: 'block',
    color: '#aab3c5',
    textDecoration: 'none',
    padding: '11px 10px',
    borderRadius: '8px',
    marginBottom: '5px'
  },

  activeMenu: {
    background: '#25204f',
    color: '#8d80ff',
    fontWeight: 'bold'
  },

  main: {
    flex: 1,
    padding: '25px 40px',
    overflow: 'auto'
  },

  title: {
    marginTop: 0,
    fontSize: '22px'
  },

  reportHeader: {
    background: '#1b2438',
    padding: '18px 22px',
    borderRadius: '12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },

  dot: {
    color: '#7467f0',
    marginRight: '8px'
  },

  filters: {
    display: 'flex',
    gap: '10px'
  },

  select: {
    background: '#111827',
    color: '#fff',
    border: '1px solid #34405a',
    borderRadius: '8px',
    padding: '9px 15px'
  },

  buttons: {
    display: 'flex',
    gap: '10px',
    margin: '18px 0'
  },

  primaryButton: {
    background: '#6f63f5',
    color: '#fff',
    border: 'none',
    borderRadius: '9px',
    padding: '10px 18px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },

  refreshButton: {
    background: '#172033',
    color: '#ddd',
    border: '1px solid #34405a',
    borderRadius: '9px',
    padding: '10px 18px',
    cursor: 'pointer'
  },

  message: {
    background: '#123d35',
    color: '#7ff0c4',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '15px'
  },

  error: {
    color: '#ff6b6b'
  },

  cards: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(3, minmax(0, 1fr))',
    gap: '20px',
    marginTop: '15px'
  },

  card: {
    background: '#172033',
    padding: '22px',
    borderRadius: '15px',
    boxShadow: '0 5px 20px rgba(0,0,0,0.15)'
  },

  cardIcon: {
    display: 'inline-block',
    background: '#103d39',
    color: '#22c99b',
    padding: '8px',
    borderRadius: '8px',
    fontWeight: 'bold'
  },

  expenseIcon: {
    display: 'inline-block',
    background: '#4a2329',
    color: '#ff5c5c',
    padding: '8px',
    borderRadius: '8px',
    fontWeight: 'bold'
  },

  savingIcon: {
    display: 'inline-block',
    background: '#29275a',
    color: '#8b7fff',
    padding: '8px',
    borderRadius: '8px',
    fontWeight: 'bold'
  },

  income: {
    color: '#20c997'
  },

  expense: {
    color: '#ff5c5c'
  },

  info: {
    color: '#9ca6b8',
    marginTop: '18px'
  },

  section: {
    marginTop: '28px'
  },

  category: {
    background: '#172033',
    padding: '18px',
    borderRadius: '10px',
    marginBottom: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },

  categoryName: {
    background: '#6f63f5',
    padding: '7px 14px',
    borderRadius: '20px',
    fontWeight: 'bold'
  },

  smallText: {
    color: '#8e99ad',
    fontSize: '12px',
    marginTop: '5px'
  },

  budget: {
    background: '#172033',
    padding: '16px',
    borderRadius: '10px',
    marginBottom: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    gap: '15px',
    flexWrap: 'wrap'
  },

  goal: {
    background: '#172033',
    padding: '18px',
    borderRadius: '10px',
    marginBottom: '10px'
  }

}

export default Reports