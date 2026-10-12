import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const CATEGORY_COLORS = {
  Food: '#EF4444',
  Travel: '#3B82F6',
  Shopping: '#8B5CF6',
  Education: '#10B981',
  Entertainment: '#F59E0B',
  Miscellaneous: '#64748B',
  Other: '#64748B',
}

function formatAmount(value) {
  return Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function getCurrentMonth() {
  return new Date().getMonth()
}

function getCurrentYear() {
  return new Date().getFullYear()
}

function getMonthKey(dateValue) {
  if (!dateValue) return null

  if (
    typeof dateValue === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(dateValue)
  ) {
    return dateValue.substring(0, 7)
  }

  const date = new Date(dateValue)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, '0')}`
}

function downloadCSV(filename, rows) {
  if (!rows.length) {
    alert('No report data available.')
    return
  }

  const csv = rows
    .map((row) =>
      row
        .map((value) =>
          `"${String(value ?? '').replace(/"/g, '""')}"`
        )
        .join(',')
    )
    .join('\n')

  const blob = new Blob([csv], {
    type: 'text/csv;charset=utf-8;',
  })

  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

export default function Reports() {
  const [expenses, setExpenses] = useState([])
  const [incomes, setIncomes] = useState([])
  const [budgets, setBudgets] = useState([])
  const [savingsGoals, setSavingsGoals] = useState([])

  const [selectedMonth, setSelectedMonth] =
    useState(getCurrentMonth())

  const [selectedYear, setSelectedYear] =
    useState(getCurrentYear())

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const token = localStorage.getItem('access_token')

  const authConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  }

  const loadReportData = async () => {
    try {
      setLoading(true)
      setError('')

      const [
        expenseResponse,
        incomeResponse,
        budgetResponse,
        savingsResponse,
      ] = await Promise.all([
        axios.get(
          `${API_URL}/expenses/`,
          authConfig
        ),

        axios.get(
          `${API_URL}/incomes/`,
          authConfig
        ),

        axios.get(
          `${API_URL}/budget-utilization/`,
          authConfig
        ),

        axios.get(
          `${API_URL}/savings-goals/`,
          authConfig
        ),
      ])

      setExpenses(
        Array.isArray(expenseResponse.data)
          ? expenseResponse.data
          : expenseResponse.data?.results || []
      )

      setIncomes(
        Array.isArray(incomeResponse.data)
          ? incomeResponse.data
          : incomeResponse.data?.results || []
      )

      setBudgets(
        Array.isArray(budgetResponse.data)
          ? budgetResponse.data
          : budgetResponse.data?.results || []
      )

      setSavingsGoals(
        Array.isArray(savingsResponse.data)
          ? savingsResponse.data
          : savingsResponse.data?.results || []
      )
    } catch (err) {
      console.error(err)

      setError(
        err.response?.data?.detail ||
          err.message ||
          'Unable to load report data.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReportData()
  }, [])

  const monthKey = `${selectedYear}-${String(
    selectedMonth + 1
  ).padStart(2, '0')}`

  const monthlyExpenses = useMemo(() => {
    return expenses.filter(
      (expense) => getMonthKey(expense.date) === monthKey
    )
  }, [expenses, monthKey])

  const monthlyIncomes = useMemo(() => {
    return incomes.filter(
      (income) => getMonthKey(income.date) === monthKey
    )
  }, [incomes, monthKey])

  const totalIncome = useMemo(() => {
    return monthlyIncomes.reduce(
      (sum, income) =>
        sum + Number(income.amount || 0),
      0
    )
  }, [monthlyIncomes])

  const totalExpenses = useMemo(() => {
    return monthlyExpenses.reduce(
      (sum, expense) =>
        sum + Number(expense.amount || 0),
      0
    )
  }, [monthlyExpenses])

  const netSavings = totalIncome - totalExpenses

  const categoryTotals = useMemo(() => {
    const totals = {}

    monthlyExpenses.forEach((expense) => {
      const category =
        expense.category || 'Other'

      totals[category] =
        (totals[category] || 0) +
        Number(expense.amount || 0)
    })

    return Object.entries(totals)
      .map(([category, amount]) => ({
        category,
        amount,
      }))
      .sort((a, b) => b.amount - a.amount)
  }, [monthlyExpenses])

  const incomeTotals = useMemo(() => {
    const totals = {}

    monthlyIncomes.forEach((income) => {
      const source =
        income.source || 'Other'

      totals[source] =
        (totals[source] || 0) +
        Number(income.amount || 0)
    })

    return Object.entries(totals)
      .map(([source, amount]) => ({
        source,
        amount,
      }))
      .sort((a, b) => b.amount - a.amount)
  }, [monthlyIncomes])

  const categoryTotal = categoryTotals.reduce(
    (sum, item) => sum + item.amount,
    0
  )

  const savingsRate =
    totalIncome > 0
      ? (netSavings / totalIncome) * 100
      : 0

  const exportCSV = () => {
    const rows = [
      ['BudgetBuddy Monthly Report'],
      [
        'Month',
        `${MONTHS[selectedMonth]} ${selectedYear}`,
      ],
      [],
      ['Summary'],
      ['Total Income', totalIncome],
      ['Total Expenses', totalExpenses],
      ['Net Savings', netSavings],
      ['Savings Rate', `${savingsRate.toFixed(2)}%`],
      [],
      ['Expenses by Category'],
      ['Category', 'Amount', 'Percentage'],
    ]

    categoryTotals.forEach((item) => {
      const percentage =
        categoryTotal > 0
          ? (item.amount / categoryTotal) * 100
          : 0

      rows.push([
        item.category,
        item.amount,
        `${percentage.toFixed(2)}%`,
      ])
    })

    rows.push([])
    rows.push(['Income Sources'])
    rows.push(['Source', 'Amount'])

    incomeTotals.forEach((item) => {
      rows.push([
        item.source,
        item.amount,
      ])
    })

    downloadCSV(
      `BudgetBuddy-${selectedYear}-${String(
        selectedMonth + 1
      ).padStart(2, '0')}.csv`,
      rows
    )
  }

  const exportExcel = () => {
    /*
      Keeps the export button available without
      changing your backend.
    */
    exportCSV()
  }

  const exportPDF = () => {
    window.print()
  }

  const years = []

  for (
    let year = getCurrentYear() - 4;
    year <= getCurrentYear() + 1;
    year += 1
  ) {
    years.push(year)
  }

  return (
    <div className="bb-report-page">

      {/* REPORT HEADER */}

      <div className="bb-report-header">
        <div>
          <h2>Monthly Reports</h2>
          <p>
            View and export your monthly financial report.
          </p>
        </div>

        <div className="bb-report-actions">
          <button
            className="bb-report-btn"
            onClick={exportPDF}
          >
            ⇩ PDF
          </button>

          <button
            className="bb-report-btn"
            onClick={exportExcel}
          >
            ⇩ Excel
          </button>

          <button
            className="bb-report-btn"
            onClick={exportCSV}
          >
            ⇩ CSV
          </button>

          <button
            className="bb-report-btn secondary"
            onClick={loadReportData}
            disabled={loading}
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* MONTH SELECTOR */}

      <div className="bb-report-filter">
        <div className="bb-report-filter-group">
          <label>Month</label>

          <select
            value={selectedMonth}
            onChange={(e) =>
              setSelectedMonth(
                Number(e.target.value)
              )
            }
          >
            {MONTHS.map((month, index) => (
              <option
                key={month}
                value={index}
              >
                {month}
              </option>
            ))}
          </select>
        </div>

        <div className="bb-report-filter-group">
          <label>Year</label>

          <select
            value={selectedYear}
            onChange={(e) =>
              setSelectedYear(
                Number(e.target.value)
              )
            }
          >
            {years.map((year) => (
              <option
                key={year}
                value={year}
              >
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="bb-report-error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bb-report-card bb-report-empty">
          Loading report...
        </div>
      ) : (
        <>
          {/* SUMMARY CARDS */}

          <div className="bb-report-summary">

            <div className="bb-report-stat income">
              <div className="bb-report-stat-icon">
                In
              </div>

              <div>
                <span>Total Income</span>
                <strong>
                  INR {formatAmount(totalIncome)}
                </strong>
              </div>
            </div>

            <div className="bb-report-stat expense">
              <div className="bb-report-stat-icon">
                Ex
              </div>

              <div>
                <span>Total Expenses</span>
                <strong>
                  INR {formatAmount(totalExpenses)}
                </strong>
              </div>
            </div>

            <div className="bb-report-stat savings">
              <div className="bb-report-stat-icon">
                Bl
              </div>

              <div>
                <span>Net Savings</span>
                <strong>
                  INR {formatAmount(netSavings)}
                </strong>
              </div>
            </div>

          </div>

          <div className="bb-report-meta">
            {MONTHS[selectedMonth]} {selectedYear}
            {' • '}
            Savings rate {savingsRate.toFixed(1)}%
            {' • '}
            {monthlyExpenses.length} expense records
          </div>

          {/* TWO COLUMN REPORT CONTENT */}

          <div className="bb-report-columns">

            {/* EXPENSES */}

            <section className="bb-report-card">

              <div className="bb-report-section-title">
                <div>
                  <h3>Expenses by Category</h3>
                  <p>
                    Monthly spending breakdown
                  </p>
                </div>
              </div>

              {categoryTotals.length === 0 ? (
                <div className="bb-report-empty">
                  No expenses recorded for this month.
                </div>
              ) : (
                <div className="bb-report-list">
                  {categoryTotals.map((item) => {
                    const percentage =
                      categoryTotal > 0
                        ? (item.amount /
                            categoryTotal) *
                          100
                        : 0

                    const categoryColor =
                      CATEGORY_COLORS[
                        item.category
                      ] || CATEGORY_COLORS.Other

                    return (
                      <div
                        className="bb-report-row"
                        key={item.category}
                      >
                        <div
                          className="bb-report-badge"
                          style={{
                            background:
                              `${categoryColor}22`,
                            color:
                              categoryColor,
                          }}
                        >
                          {item.category
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div className="bb-report-row-main">
                          <div className="bb-report-row-top">
                            <strong>
                              {item.category}
                            </strong>

                            <span>
                              INR{' '}
                              {formatAmount(
                                item.amount
                              )}
                            </span>
                          </div>

                          <div className="bb-report-progress">
                            <div
                              style={{
                                width: `${Math.min(
                                  percentage,
                                  100
                                )}%`,
                                background:
                                  categoryColor,
                              }}
                            />
                          </div>

                          <small>
                            {percentage.toFixed(1)}%
                          </small>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>

            {/* INCOME */}

            <section className="bb-report-card">

              <div className="bb-report-section-title">
                <div>
                  <h3>Income Sources</h3>
                  <p>
                    Monthly income breakdown
                  </p>
                </div>
              </div>

              {incomeTotals.length === 0 ? (
                <div className="bb-report-empty">
                  No income recorded for this month.
                </div>
              ) : (
                <div className="bb-report-list">
                  {incomeTotals.map((item) => {
                    const percentage =
                      totalIncome > 0
                        ? (item.amount /
                            totalIncome) *
                          100
                        : 0

                    return (
                      <div
                        className="bb-report-row"
                        key={item.source}
                      >
                        <div className="bb-report-badge income-badge">
                          In
                        </div>

                        <div className="bb-report-row-main">
                          <div className="bb-report-row-top">
                            <strong>
                              {item.source}
                            </strong>

                            <span className="income-text">
                              INR{' '}
                              {formatAmount(
                                item.amount
                              )}
                            </span>
                          </div>

                          <div className="bb-report-progress">
                            <div
                              className="income-progress"
                              style={{
                                width: `${Math.min(
                                  percentage,
                                  100
                                )}%`,
                              }}
                            />
                          </div>

                          <small>
                            {percentage.toFixed(1)}%
                          </small>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>

          </div>

          {/* BUDGET + SAVINGS */}

          <div className="bb-report-columns">

            <section className="bb-report-card">

              <div className="bb-report-section-title">
                <div>
                  <h3>Budget Summary</h3>
                  <p>
                    Budget information for your account
                  </p>
                </div>
              </div>

              {budgets.length === 0 ? (
                <div className="bb-report-empty">
                  No budgets found for this month.
                </div>
              ) : (
                <div className="bb-report-list">
                  {budgets.map((budget, index) => (
                    <div
                      className="bb-report-simple-row"
                      key={budget.id || index}
                    >
                      <span>
                        {budget.category ||
                          budget.name ||
                          'Budget'}
                      </span>

                      <strong>
                        INR{' '}
                        {formatAmount(
                          budget.amount ||
                            budget.budget_amount ||
                            budget.limit
                        )}
                      </strong>
                    </div>
                  ))}
                </div>
              )}

            </section>

            <section className="bb-report-card">

              <div className="bb-report-section-title">
                <div>
                  <h3>💰 Savings Goals</h3>
                  <p>
                    Current savings progress
                  </p>
                </div>
              </div>

              {savingsGoals.length === 0 ? (
                <div className="bb-report-empty">
                  No savings goals found.
                </div>
              ) : (
                <div className="bb-report-list">
                  {savingsGoals.map(
                    (goal, index) => {
                      const target =
                        Number(
                          goal.target_amount || 0
                        )

                      const current =
                        Number(
                          goal.current_amount || 0
                        )

                      const progress =
                        target > 0
                          ? Math.min(
                              100,
                              Math.max(
                                0,
                                (current /
                                  target) *
                                  100
                              )
                            )
                          : 0

                      return (
                        <div
                          className="bb-report-saving"
                          key={
                            goal.id || index
                          }
                        >
                          <div className="bb-report-row-top">
                            <strong>
                              {goal.goal_name ||
                                'Savings Goal'}
                            </strong>

                            <span>
                              {progress.toFixed(0)}%
                            </span>
                          </div>

                          <div className="bb-report-progress">
                            <div
                              className="saving-progress"
                              style={{
                                width: `${progress}%`,
                              }}
                            />
                          </div>

                          <small>
                            INR{' '}
                            {formatAmount(
                              current
                            )}{' '}
                            / INR{' '}
                            {formatAmount(
                              target
                            )}
                          </small>
                        </div>
                      )
                    }
                  )}
                </div>
              )}

            </section>

          </div>
        </>
      )}

      {/* REPORT-ONLY CSS */}

      <style>{`
        .bb-report-page {
          width: 100%;
          max-width: 1100px;
          margin: 0 auto;
          padding-bottom: 30px;
          color: #E5E7EB;
        }

        .bb-report-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 18px;
        }

        .bb-report-header h2 {
          margin: 0 0 5px;
          font-size: 20px;
          color: #F8FAFC;
        }

        .bb-report-header p {
          margin: 0;
          color: #94A3B8;
          font-size: 12px;
        }

        .bb-report-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .bb-report-btn {
          border: 0;
          border-radius: 7px;
          padding: 9px 13px;
          background: #7C3AED;
          color: white;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
        }

        .bb-report-btn:hover {
          background: #8B5CF6;
        }

        .bb-report-btn.secondary {
          background: #171F35;
          border: 1px solid #27314A;
          color: #CBD5E1;
        }

        .bb-report-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .bb-report-filter {
          display: flex;
          gap: 10px;
          align-items: end;
          background: #10182B;
          border: 1px solid #27314A;
          border-radius: 9px;
          padding: 12px;
          margin-bottom: 14px;
        }

        .bb-report-filter-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .bb-report-filter label {
          color: #94A3B8;
          font-size: 10px;
          font-weight: 700;
        }

        .bb-report-filter select {
          background: #171F35;
          border: 1px solid #34405C;
          color: #E5E7EB;
          border-radius: 6px;
          padding: 7px 10px;
          min-width: 120px;
          outline: none;
        }

        .bb-report-summary {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-bottom: 10px;
        }

        .bb-report-stat {
          display: flex;
          align-items: center;
          gap: 10px;
          min-height: 78px;
          padding: 13px;
          border-radius: 9px;
          background: #171F35;
          border: 1px solid #27314A;
        }

        .bb-report-stat-icon {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 7px;
          font-weight: 800;
          font-size: 12px;
        }

        .bb-report-stat.income {
          border-top: 2px solid #10B981;
        }

        .bb-report-stat.expense {
          border-top: 2px solid #EF4444;
        }

        .bb-report-stat.savings {
          border-top: 2px solid #8B5CF6;
        }

        .bb-report-stat.income .bb-report-stat-icon {
          background: #10B98122;
          color: #10B981;
        }

        .bb-report-stat.expense .bb-report-stat-icon {
          background: #EF444422;
          color: #EF4444;
        }

        .bb-report-stat.savings .bb-report-stat-icon {
          background: #8B5CF622;
          color: #8B5CF6;
        }

        .bb-report-stat span {
          display: block;
          color: #94A3B8;
          font-size: 10px;
          margin-bottom: 4px;
        }

        .bb-report-stat strong {
          color: #F8FAFC;
          font-size: 15px;
        }

        .bb-report-meta {
          color: #94A3B8;
          font-size: 11px;
          margin: 9px 2px 14px;
        }

        .bb-report-columns {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 12px;
        }

        .bb-report-card {
          background: #111A2D;
          border: 1px solid #27314A;
          border-radius: 9px;
          padding: 15px;
          min-width: 0;
        }

        .bb-report-section-title {
          margin-bottom: 12px;
        }

        .bb-report-section-title h3 {
          margin: 0 0 3px;
          color: #F1F5F9;
          font-size: 14px;
        }

        .bb-report-section-title p {
          margin: 0;
          color: #64748B;
          font-size: 10px;
        }

        .bb-report-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .bb-report-row {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .bb-report-badge {
          width: 31px;
          height: 31px;
          min-width: 31px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 7px;
          font-size: 11px;
          font-weight: 800;
        }

        .income-badge {
          background: #10B98122;
          color: #10B981;
        }

        .bb-report-row-main {
          flex: 1;
          min-width: 0;
        }

        .bb-report-row-top {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 5px;
        }

        .bb-report-row-top strong {
          color: #CBD5E1;
          font-size: 11px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .bb-report-row-top span {
          color: #E5E7EB;
          font-size: 11px;
          white-space: nowrap;
        }

        .income-text {
          color: #10B981 !important;
        }

        .bb-report-progress {
          height: 5px;
          background: #202A40;
          border-radius: 99px;
          overflow: hidden;
        }

        .bb-report-progress > div {
          height: 100%;
          border-radius: 99px;
        }

        .income-progress {
          background: #10B981;
        }

        .saving-progress {
          background: #8B5CF6;
        }

        .bb-report-row-main small,
        .bb-report-saving small {
          display: block;
          color: #64748B;
          font-size: 9px;
          margin-top: 4px;
        }

        .bb-report-empty {
          padding: 20px 10px;
          text-align: center;
          color: #64748B;
          font-size: 11px;
        }

        .bb-report-simple-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid #202A40;
          color: #CBD5E1;
          font-size: 11px;
        }

        .bb-report-simple-row:last-child {
          border-bottom: 0;
        }

        .bb-report-simple-row strong {
          color: #E5E7EB;
        }

        .bb-report-saving {
          padding: 8px 0;
        }

        .bb-report-error {
          background: #3B1620;
          border: 1px solid #7F1D1D;
          color: #FCA5A5;
          border-radius: 7px;
          padding: 10px;
          margin-bottom: 12px;
          font-size: 11px;
        }

        @media (max-width: 800px) {
          .bb-report-summary,
          .bb-report-columns {
            grid-template-columns: 1fr;
          }

          .bb-report-header {
            align-items: flex-start;
            flex-direction: column;
          }
        }

        @media print {
          .bb-report-actions,
          .bb-report-filter {
            display: none;
          }

          .bb-report-page {
            color: #111827;
            max-width: none;
          }
        }
      `}</style>
    </div>
  )
}