import { useState, useEffect } from 'react'
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  Navigate,
  useNavigate,
} from 'react-router-dom'
import axios from 'axios'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import './App.css'

import Home from './pages/Home'
import Register from './pages/Register'
import Login from './pages/Login'

const API_URL = import.meta.env.VITE_API_URL

const CATEGORIES = [
  'Food',
  'Travel',
  'Shopping',
  'Education',
  'Entertainment',
  'Miscellaneous',
]

const CHART_COLORS = [
  '#4f46e5',
  '#16a34a',
  '#dc2626',
  '#f59e0b',
  '#9333ea',
  '#0891b2',
  '#ea580c',
  '#64748b',
]


// ============================================================
// HELPER FUNCTIONS
// ============================================================

function formatAmount(value) {
  const number = Number(value || 0)

  return number.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}


function getMonthKey(dateValue) {
  if (!dateValue) {
    return null
  }

  // Handle YYYY-MM-DD safely without timezone shifting.
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


function formatMonthLabel(monthKey) {
  if (!monthKey) {
    return ''
  }

  const [year, month] = monthKey.split('-')

  const date = new Date(
    Number(year),
    Number(month) - 1,
    1
  )

  return date.toLocaleDateString('en-IN', {
    month: 'short',
    year: 'numeric',
  })
}


function getCategoryTotals(expenses) {
  const totals = {}

  expenses.forEach((expense) => {
    const category = expense.category || 'Other'
    const amount = Number(expense.amount || 0)

    if (!totals[category]) {
      totals[category] = 0
    }

    totals[category] += amount
  })

  return Object.entries(totals)
    .map(([category, amount]) => ({
      category,
      amount,
    }))
    .sort((a, b) => b.amount - a.amount)
}


function getMonthlyTotals(incomes, expenses) {
  const monthlyData = {}

  incomes.forEach((income) => {
    const month = getMonthKey(income.date)

    if (!month) {
      return
    }

    if (!monthlyData[month]) {
      monthlyData[month] = {
        month,
        income: 0,
        expenses: 0,
      }
    }

    monthlyData[month].income += Number(
      income.amount || 0
    )
  })

  expenses.forEach((expense) => {
    const month = getMonthKey(expense.date)

    if (!month) {
      return
    }

    if (!monthlyData[month]) {
      monthlyData[month] = {
        month,
        income: 0,
        expenses: 0,
      }
    }

    monthlyData[month].expenses += Number(
      expense.amount || 0
    )
  })

  return Object.values(monthlyData).sort(
    (a, b) =>
      a.month.localeCompare(b.month)
  )
}


// ============================================================
// CUSTOM PIE CHART TOOLTIP
// ============================================================

function CategoryTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) {
    return null
  }

  const item = payload[0].payload

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #ccc',
        borderRadius: '8px',
        padding: '10px 14px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
      }}
    >
      <p
        style={{
          margin: 0,
          fontWeight: 'bold',
        }}
      >
        {item.category}
      </p>

      <p style={{ margin: '5px 0 0' }}>
        ₹{formatAmount(item.amount)}
      </p>

      <p
        style={{
          margin: '5px 0 0',
          fontSize: '13px',
        }}
      >
        {item.percentage.toFixed(1)}%
      </p>
    </div>
  )
}


// ============================================================
// MONTHLY CHART TOOLTIP
// ============================================================

function MonthlyTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) {
    return null
  }

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #ccc',
        borderRadius: '8px',
        padding: '10px 14px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
      }}
    >
      <p
        style={{
          margin: '0 0 8px',
          fontWeight: 'bold',
        }}
      >
        {label}
      </p>

      {payload.map((item) => (
        <p
          key={item.dataKey}
          style={{
            margin: '4px 0',
          }}
        >
          {item.dataKey === 'income'
            ? '💰 Income'
            : '💸 Expenses'}
          : ₹{formatAmount(item.value)}
        </p>
      ))}
    </div>
  )
}


// ============================================================
// DASHBOARD
// ============================================================

function Dashboard() {
  const navigate = useNavigate()

  const [message, setMessage] = useState(
    'Loading dashboard...'
  )

  const [loading, setLoading] = useState(true)

  const [dashboard, setDashboard] = useState(null)

  const [expenses, setExpenses] = useState([])

  const [incomes, setIncomes] = useState([])

  const [budgets, setBudgets] = useState([])

  const [savingsGoals, setSavingsGoals] =
    useState([])

  const [notifications, setNotifications] =
    useState([])

  const [expenseForm, setExpenseForm] =
    useState({
      category: 'Food',
      amount: '',
      date: '',
      description: '',
    })

  const [incomeForm, setIncomeForm] =
    useState({
      source: '',
      amount: '',
      date: '',
      description: '',
    })

  const [savingsGoalForm, setSavingsGoalForm] =
    useState({
      goal_name: '',
      target_amount: '',
      current_amount: '',
      deadline: '',
    })

  const [progressValues, setProgressValues] =
    useState({})

  const [error, setError] = useState('')

  const token =
    localStorage.getItem('access_token')

  const authConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  }


  // ==========================================================
  // LOAD ALL DASHBOARD DATA
  // ==========================================================

  const loadData = async () => {
    const currentToken =
      localStorage.getItem('access_token')

    if (!currentToken) {
      navigate('/login')
      return
    }

    const currentAuthConfig = {
      headers: {
        Authorization:
          `Bearer ${currentToken}`,
        'Content-Type':
          'application/json',
      },
    }

    try {
      setLoading(true)
      setError('')
      setMessage(
        'Loading dashboard data...'
      )

      const [
        dashboardResponse,
        expenseResponse,
        incomeResponse,
        budgetResponse,
        savingsGoalResponse,
        notificationResponse,
      ] = await Promise.all([
        axios.get(
          `${API_URL}/transaction-dashboard/`,
          currentAuthConfig
        ),

        axios.get(
          `${API_URL}/expenses/`,
          currentAuthConfig
        ),

        axios.get(
          `${API_URL}/incomes/`,
          currentAuthConfig
        ),

        axios.get(
          `${API_URL}/budget-utilization/`,
          currentAuthConfig
        ),

        axios.get(
          `${API_URL}/savings-goals/`,
          currentAuthConfig
        ),

        axios.get(
          `${API_URL}/notifications/`,
          currentAuthConfig
        ),
      ])

      setDashboard(
        dashboardResponse.data
      )

      setExpenses(
        Array.isArray(
          expenseResponse.data
        )
          ? expenseResponse.data
          : []
      )

      setIncomes(
        Array.isArray(
          incomeResponse.data
        )
          ? incomeResponse.data
          : []
      )

      setBudgets(
        Array.isArray(
          budgetResponse.data
        )
          ? budgetResponse.data
          : []
      )

      setSavingsGoals(
        Array.isArray(
          savingsGoalResponse.data
        )
          ? savingsGoalResponse.data
          : []
      )

      setNotifications(
        Array.isArray(
          notificationResponse.data
        )
          ? notificationResponse.data
          : []
      )

      setMessage(
        'Dashboard data loaded successfully! ✅'
      )

    } catch (err) {
      console.error(err)

      if (
        err.response?.status === 401
      ) {
        localStorage.removeItem(
          'access_token'
        )

        localStorage.removeItem(
          'refresh_token'
        )

        navigate('/login')

        return
      }

      const errorMessage =
        err.response?.data?.detail ||
        err.message ||
        'Failed to load dashboard data.'

      setError(errorMessage)

      setMessage(
        'Failed to load dashboard ❌'
      )

    } finally {
      setLoading(false)
    }
  }


  // ==========================================================
  // LOAD DATA WHEN DASHBOARD OPENS
  // ==========================================================

  useEffect(() => {
    loadData()
  }, [])


  // ==========================================================
  // CREATE EXPENSE
  // ==========================================================

  const handleExpenseSubmit = async (
    event
  ) => {
    event.preventDefault()

    try {
      setError('')

      await axios.post(
        `${API_URL}/expenses/`,
        expenseForm,
        authConfig
      )

      alert(
        'Expense created successfully! ✅'
      )

      setExpenseForm({
        category: 'Food',
        amount: '',
        date: '',
        description: '',
      })

      await loadData()

    } catch (err) {
      console.error(err)

      const data =
        err.response?.data

      setError(
        data?.category?.[0] ||
        data?.amount?.[0] ||
        data?.date?.[0] ||
        data?.description?.[0] ||
        data?.detail ||
        'Failed to create expense.'
      )
    }
  }


  // ==========================================================
  // CREATE INCOME
  // ==========================================================

  const handleIncomeSubmit = async (
    event
  ) => {
    event.preventDefault()

    try {
      setError('')

      await axios.post(
        `${API_URL}/incomes/`,
        incomeForm,
        authConfig
      )

      alert(
        'Income created successfully! ✅'
      )

      setIncomeForm({
        source: '',
        amount: '',
        date: '',
        description: '',
      })

      await loadData()

    } catch (err) {
      console.error(err)

      const data =
        err.response?.data

      setError(
        data?.source?.[0] ||
        data?.amount?.[0] ||
        data?.date?.[0] ||
        data?.description?.[0] ||
        data?.detail ||
        'Failed to create income.'
      )
    }
  }


  // ==========================================================
  // CREATE SAVINGS GOAL
  // ==========================================================

  const handleSavingsGoalSubmit =
    async (event) => {
      event.preventDefault()

      try {
        setError('')

        await axios.post(
          `${API_URL}/savings-goals/`,
          {
            goal_name:
              savingsGoalForm.goal_name,

            target_amount:
              savingsGoalForm.target_amount,

            current_amount:
              savingsGoalForm.current_amount ||
              '0',

            deadline:
              savingsGoalForm.deadline ||
              null,
          },
          authConfig
        )

        alert(
          'Savings goal created successfully! 🎯'
        )

        setSavingsGoalForm({
          goal_name: '',
          target_amount: '',
          current_amount: '',
          deadline: '',
        })

        await loadData()

      } catch (err) {
        console.error(err)

        const data =
          err.response?.data

        setError(
          data?.goal_name?.[0] ||
          data?.target_amount?.[0] ||
          data?.current_amount?.[0] ||
          data?.deadline?.[0] ||
          data?.detail ||
          'Failed to create savings goal.'
        )
      }
    }


  // ==========================================================
  // UPDATE SAVINGS GOAL PROGRESS
  // ==========================================================

  const handleProgressUpdate =
    async (
      goalId,
      currentAmount
    ) => {

      if (
        currentAmount === undefined ||
        currentAmount === ''
      ) {
        setError(
          'Please enter the current saved amount.'
        )

        return
      }

      try {
        setError('')

        await axios.patch(
          `${API_URL}/savings-goals/${goalId}/progress/`,
          {
            current_amount:
              currentAmount,
          },
          authConfig
        )

        alert(
          'Savings goal progress updated! ✅'
        )

        setProgressValues({
          ...progressValues,
          [goalId]: '',
        })

        await loadData()

      } catch (err) {
        console.error(err)

        const data =
          err.response?.data

        setError(
          data?.current_amount?.[0] ||
          data?.detail ||
          'Failed to update savings goal progress.'
        )
      }
    }


  // ==========================================================
  // DELETE EXPENSE
  // ==========================================================

  const handleDeleteExpense =
    async (expenseId) => {

      const confirmDelete =
        window.confirm(
          'Are you sure you want to delete this expense?'
        )

      if (!confirmDelete) {
        return
      }

      try {
        setError('')

        await axios.delete(
          `${API_URL}/expenses/${expenseId}/`,
          authConfig
        )

        alert(
          'Expense deleted successfully! ✅'
        )

        await loadData()

      } catch (err) {
        console.error(err)

        setError(
          err.response?.data?.detail ||
          err.message ||
          'Failed to delete expense.'
        )
      }
    }


  // ==========================================================
  // MARK NOTIFICATION AS READ
  // ==========================================================

  const handleMarkNotificationRead =
    async (notificationId) => {

      try {
        setError('')

        await axios.patch(
          `${API_URL}/notifications/${notificationId}/read/`,
          {},
          authConfig
        )

        alert(
          'Notification marked as read! ✅'
        )

        await loadData()

      } catch (err) {
        console.error(err)

        setError(
          err.response?.data?.detail ||
          err.message ||
          'Failed to mark notification as read.'
        )
      }
    }


  // ==========================================================
  // LOGOUT
  // ==========================================================

  const handleLogout = () => {
    localStorage.removeItem(
      'access_token'
    )

    localStorage.removeItem(
      'refresh_token'
    )

    navigate('/login')
  }


  // ==========================================================
  // ANALYTICS DATA
  // ==========================================================

  const categoryTotals =
    getCategoryTotals(expenses)

  const monthlyTotals =
    getMonthlyTotals(
      incomes,
      expenses
    )

  const totalIncome =
    Number(
      dashboard?.total_income ||
      incomes.reduce(
        (sum, income) =>
          sum +
          Number(
            income.amount || 0
          ),
        0
      )
    )

  const totalExpenses =
    Number(
      dashboard?.total_expenses ||
      expenses.reduce(
        (sum, expense) =>
          sum +
          Number(
            expense.amount || 0
          ),
        0
      )
    )

  const financialSavings =
    totalIncome - totalExpenses

  const totalCategoryExpenses =
    categoryTotals.reduce(
      (sum, item) =>
        sum + item.amount,
      0
    )

  // Data specifically prepared for PieChart.
  const categoryChartData =
    categoryTotals.map(
      (item) => ({
        ...item,
        percentage:
          totalCategoryExpenses > 0
            ? (
                (item.amount /
                  totalCategoryExpenses) *
                100
              )
            : 0,
      })
    )
    
  // Data specifically prepared for BarChart.
  const monthlyChartData =
    monthlyTotals.map(
      (item) => ({
        ...item,
        monthLabel:
          formatMonthLabel(
            item.month
          ),
      })
    )
    

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="page">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <h1>
        Welcome to BudgetBuddy 🎉
      </h1>

      <p>
        You are successfully logged in!
      </p>

      <p>
        {message}
      </p>


      {/* ======================================================
          LOADING STATE
      ====================================================== */}

      {loading && (
        <div
          style={{
            padding: '15px',
            marginBottom: '20px',
            border: '1px solid #ccc',
            borderRadius: '8px',
            background: '#f5f5f5',
          }}
        >
          <strong>
            Loading your financial data...
          </strong>
        </div>
      )}


      {/* ======================================================
          ERROR STATE
      ====================================================== */}

      {error && (
        <div
          style={{
            padding: '15px',
            marginBottom: '20px',
            border: '1px solid #ff6b6b',
            borderRadius: '8px',
            background: '#ffecec',
            color: '#b00020',
          }}
        >
          <strong>
            Error:
          </strong>{' '}
          {error}
        </div>
      )}


      {/* ======================================================
          ANALYTICS DASHBOARD
      ====================================================== */}

      <hr />

      <h2>
        📊 Analytics Dashboard
      </h2>

      <p>
        Real-time financial information
        from your BudgetBuddy account.
      </p>


      {/* ======================================================
          SUMMARY CARDS
      ====================================================== */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '15px',
          marginBottom: '25px',
        }}
      >

        {/* TOTAL INCOME */}

        <div
          style={{
            padding: '20px',
            borderRadius: '10px',
            border: '1px solid #ccc',
            background: '#f0fff4',
          }}
        >
          <h3>
            💰 Total Income
          </h3>

          <h2>
            ₹{formatAmount(totalIncome)}
          </h2>

          <p>
            Total income recorded
            for your account.
          </p>
        </div>


        {/* TOTAL EXPENSES */}

        <div
          style={{
            padding: '20px',
            borderRadius: '10px',
            border: '1px solid #ccc',
            background: '#fff5f5',
          }}
        >
          <h3>
            💸 Total Expenses
          </h3>

          <h2>
            ₹{formatAmount(totalExpenses)}
          </h2>

          <p>
            Total expenses recorded
            for your account.
          </p>
        </div>


        {/* SAVINGS */}

        <div
          style={{
            padding: '20px',
            borderRadius: '10px',
            border: '1px solid #ccc',
            background: '#f5f5ff',
          }}
        >
          <h3>
            💵 Financial Balance
          </h3>

          <h2>
            ₹{formatAmount(financialSavings)}
          </h2>

          <p>
            Income minus expenses.
          </p>
        </div>


        {/* TRANSACTION COUNT */}

        <div
          style={{
            padding: '20px',
            borderRadius: '10px',
            border: '1px solid #ccc',
            background: '#fffdf0',
          }}
        >
          <h3>
            🧾 Transactions
          </h3>

          <h2>
            {incomes.length +
              expenses.length}
          </h2>

          <p>
            Income and expense records.
          </p>
        </div>

      </div>


      {/* ======================================================
          FINANCIAL SUMMARY
      ====================================================== */}

      <div
        style={{
          padding: '20px',
          marginBottom: '25px',
          border: '1px solid #ccc',
          borderRadius: '10px',
        }}
      >

        <h2>
          📋 Financial Summary
        </h2>

        <p>
          <strong>
            Total Income:
          </strong>{' '}
          ₹{formatAmount(totalIncome)}
        </p>

        <p>
          <strong>
            Total Expenses:
          </strong>{' '}
          ₹{formatAmount(totalExpenses)}
        </p>

        <p>
          <strong>
            Savings / Balance:
          </strong>{' '}
          ₹{formatAmount(financialSavings)}
        </p>

        <p>
          <strong>
            Savings Rate:
          </strong>{' '}

          {totalIncome > 0
            ? `${(
                (financialSavings /
                  totalIncome) *
                100
              ).toFixed(2)}%`
            : '0.00%'}
        </p>

        <p>
          <strong>
            Income Records:
          </strong>{' '}
          {incomes.length}
        </p>

        <p>
          <strong>
            Expense Records:
          </strong>{' '}
          {expenses.length}
        </p>

        <p>
          <strong>
            Savings Goals:
          </strong>{' '}
          {savingsGoals.length}
        </p>

        <p>
          <strong>
            Notifications:
          </strong>{' '}
          {notifications.length}
        </p>

      </div>


      {/* ======================================================
          CATEGORY-WISE SPENDING - PIE CHART
      ====================================================== */}

      <div
        style={{
          padding: '20px',
          marginBottom: '25px',
          border: '1px solid #ccc',
          borderRadius: '10px',
        }}
      >

        <h2>
          🛒 Category-wise Spending
        </h2>

        {categoryChartData.length === 0 ? (

          <p>
            No expense data available.
          </p>

        ) : (

          <>

           <div
            style={{
              width: '100%',
              height: '380px',
            }}
          >
            <ResponsiveContainer
              width="100%"
              height={380}
           >

                <PieChart>

                  <Pie
                    data={
                      categoryChartData
                    }
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={125}
                    innerRadius={65}
                    paddingAngle={2}
                    label={({ category, percentage }) =>
                      `${category} ${percentage.toFixed(1)}%`
                    }
                  >

                    {categoryChartData.map(
                      (entry, index) => (
                        <Cell
                          key={
                            entry.category
                          }
                          fill={
                            CHART_COLORS[
                              index %
                                CHART_COLORS.length
                            ]
                          }
                        />
                      )
                    )}

                  </Pie>

                  <Tooltip
                    content={
                      <CategoryTooltip />
                    }
                  />

                  <Legend />

                </PieChart>

              </ResponsiveContainer>
            </div>

            <div
              style={{
                marginTop: '10px',
                textAlign: 'center',
              }}
            >
              <strong>
                Total Spending:
              </strong>{' '}
              ₹
              {formatAmount(
                totalCategoryExpenses
              )}
            </div>

          </>
        )}

      </div>


      {/* ======================================================
          MONTHLY INCOME / EXPENSE - BAR CHART
      ====================================================== */}

      <div
        style={{
          padding: '20px',
          marginBottom: '25px',
          border: '1px solid #ccc',
          borderRadius: '10px',
        }}
      >

        <h2>
          📈 Monthly Income / Expense Trends
        </h2>

        {monthlyChartData.length === 0 ? (

          <p>
            No monthly transaction data
            available.
          </p>

        ) : (

          <>

           <div
            style={{
              width: '100%',
              height: '400px',
            }}
          >

            <ResponsiveContainer
              width="100%"
              height={400}
             >

                <BarChart
                  data={
                    monthlyChartData
                  }
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 20,
                  }}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                  />

                  <XAxis
                    dataKey="monthLabel"
                  />

                  <YAxis
                    tickFormatter={(value) =>
                      `₹${value}`
                    }
                  />

                  <Tooltip
                    content={
                      <MonthlyTooltip />
                    }
                  />

                  <Legend />

                  <Bar
                    dataKey="income"
                    name="Income"
                    fill="#16a34a"
                    radius={[
                      5,
                      5,
                      0,
                      0,
                    ]}
                  />

                  <Bar
                    dataKey="expenses"
                    name="Expenses"
                    fill="#dc2626"
                    radius={[
                      5,
                      5,
                      0,
                      0,
                    ]}
                  />

                </BarChart>

              </ResponsiveContainer>

            </div>

            <p
              style={{
                textAlign: 'center',
                marginTop: '10px',
              }}
            >
              Green = Income &nbsp; | &nbsp;
              Red = Expenses
            </p>

          </>
        )}

      </div>


      {/* ======================================================
          SAVINGS PROGRESS ANALYTICS
      ====================================================== */}

      <div
        style={{
          padding: '20px',
          marginBottom: '25px',
          border: '1px solid #ccc',
          borderRadius: '10px',
        }}
      >

        <h2>
          🎯 Savings Progress
        </h2>

        {savingsGoals.length === 0 ? (

          <p>
            No savings goals available.
          </p>

        ) : (

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '15px',
            }}
          >

            {savingsGoals.map(
              (goal) => {

                const progress =
                  Math.min(
                    100,
                    Math.max(
                      0,
                      Number(
                        goal.progress_percentage ||
                        0
                      )
                    )
                  )

                return (
                  <div
                    key={goal.id}
                    style={{
                      padding:
                        '15px',
                      border:
                        '1px solid #ddd',
                      borderRadius:
                        '10px',
                    }}
                  >

                    <h3>
                      {goal.goal_name}
                    </h3>

                    <p>
                      <strong>
                        Target:
                      </strong>{' '}
                      ₹
                      {formatAmount(
                        goal.target_amount
                      )}
                    </p>

                    <p>
                      <strong>
                        Saved:
                      </strong>{' '}
                      ₹
                      {formatAmount(
                        goal.current_amount
                      )}
                    </p>

                    <p>
                      <strong>
                        Progress:
                      </strong>{' '}
                      {progress.toFixed(
                        2
                      )}
                      %
                    </p>

                    <div
                      style={{
                        width:
                          '100%',
                        height:
                          '20px',
                        background:
                          '#eeeeee',
                        borderRadius:
                          '10px',
                        overflow:
                          'hidden',
                        marginBottom:
                          '10px',
                      }}
                    >

                      <div
                        style={{
                          width:
                            `${progress}%`,
                          height:
                            '100%',
                          background:
                            progress >=
                            100
                              ? '#16a34a'
                              : '#2563eb',
                          borderRadius:
                            '10px',
                          transition:
                            'width 0.5s ease',
                        }}
                      />

                    </div>

                    <p>
                      <strong>
                        Status:
                      </strong>{' '}
                      {goal.status}
                    </p>

                  </div>
                )
              }
            )}

          </div>
        )}

      </div>


      {/* ======================================================
          CREATE EXPENSE
      ====================================================== */}

      <hr />

      <h2>
        💸 Add Expense
      </h2>

      <form
        onSubmit={
          handleExpenseSubmit
        }
      >

        <div>

          <label>
            Category:{' '}
          </label>

          <select
            value={
              expenseForm.category
            }
            onChange={(e) =>
              setExpenseForm({
                ...expenseForm,
                category:
                  e.target.value,
              })
            }
          >

            {CATEGORIES.map(
              (category) => (
                <option
                  key={category}
                  value={category}
                >
                  {category}
                </option>
              )
            )}

          </select>

        </div>

        <br />

        <div>

          <label>
            Amount:{' '}
          </label>

          <input
            type="number"
            step="0.01"
            min="0.01"
            value={
              expenseForm.amount
            }
            onChange={(e) =>
              setExpenseForm({
                ...expenseForm,
                amount:
                  e.target.value,
              })
            }
            required
          />

        </div>

        <br />

        <div>

          <label>
            Date:{' '}
          </label>

          <input
            type="date"
            value={
              expenseForm.date
            }
            onChange={(e) =>
              setExpenseForm({
                ...expenseForm,
                date:
                  e.target.value,
              })
            }
            required
          />

        </div>

        <br />

        <div>

          <label>
            Description:{' '}
          </label>

          <input
            type="text"
            value={
              expenseForm.description
            }
            onChange={(e) =>
              setExpenseForm({
                ...expenseForm,
                description:
                  e.target.value,
              })
            }
          />

        </div>

        <br />

        <button
          className="submit-btn"
          type="submit"
        >
          Add Expense
        </button>

      </form>


      {/* ======================================================
          EXPENSE LIST
      ====================================================== */}

      <hr />

      <h2>
        💸 Expenses
      </h2>

      {expenses.length === 0 ? (

        <p>
          No expenses found.
        </p>

      ) : (

        expenses.map(
          (expense) => (

            <div
              key={expense.id}
            >

              <p>

                <strong>
                  {expense.category}
                </strong>

                {' - '}

                ₹
                {expense.amount}

                {' - '}

                {expense.date}

              </p>

              <p>
                {expense.description}
              </p>

              <button
                onClick={() =>
                  handleDeleteExpense(
                    expense.id
                  )
                }
              >
                Delete
              </button>

              <hr />

            </div>

          )
        )

      )}


      {/* ======================================================
          CREATE INCOME
      ====================================================== */}

      <h2>
        💰 Add Income
      </h2>

      <form
        onSubmit={
          handleIncomeSubmit
        }
      >

        <div>

          <label>
            Source:{' '}
          </label>

          <input
            type="text"
            value={
              incomeForm.source
            }
            onChange={(e) =>
              setIncomeForm({
                ...incomeForm,
                source:
                  e.target.value,
              })
            }
            required
          />

        </div>

        <br />

        <div>

          <label>
            Amount:{' '}
          </label>

          <input
            type="number"
            step="0.01"
            min="0.01"
            value={
              incomeForm.amount
            }
            onChange={(e) =>
              setIncomeForm({
                ...incomeForm,
                amount:
                  e.target.value,
              })
            }
            required
          />

        </div>

        <br />

        <div>

          <label>
            Date:{' '}
          </label>

          <input
            type="date"
            value={
              incomeForm.date
            }
            onChange={(e) =>
              setIncomeForm({
                ...incomeForm,
                date:
                  e.target.value,
              })
            }
            required
          />

        </div>

        <br />

        <div>

          <label>
            Description:{' '}
          </label>

          <input
            type="text"
            value={
              incomeForm.description
            }
            onChange={(e) =>
              setIncomeForm({
                ...incomeForm,
                description:
                  e.target.value,
              })
            }
          />

        </div>

        <br />

        <button
          className="submit-btn"
          type="submit"
        >
          Add Income
        </button>

      </form>


      {/* ======================================================
          INCOME LIST
      ====================================================== */}

      <hr />

      <h2>
        💰 Income Records
      </h2>

      {incomes.length === 0 ? (

        <p>
          No income records found.
        </p>

      ) : (

        incomes.map(
          (income) => (

            <div
              key={income.id}
            >

              <p>

                <strong>
                  {income.source}
                </strong>

                {' - '}

                ₹
                {income.amount}

                {' - '}

                {income.date}

              </p>

              <p>
                {income.description}
              </p>

              <hr />

            </div>

          )
        )

      )}


      {/* ======================================================
          BUDGET UTILIZATION
      ====================================================== */}

      <h2>
        📊 Budget Utilization
      </h2>

      {budgets.length === 0 ? (

        <p>
          No budgets found.
        </p>

      ) : (

        budgets.map(
          (budget, index) => (

            <div
              key={index}
            >

              <p>

                <strong>
                  {budget.category}
                </strong>

              </p>

              <p>
                Budget: ₹
                {budget.budget_amount}
              </p>

              <p>
                Spent: ₹
                {budget.spent_amount}
              </p>

              <p>
                Remaining: ₹
                {budget.remaining_amount}
              </p>

              <p>
                Status:{' '}
                {budget.status}
              </p>

              <hr />

            </div>

          )
        )

      )}


      {/* ======================================================
          NOTIFICATIONS
      ====================================================== */}

      <hr />

      <h2>
        🔔 Notifications
      </h2>

      {notifications.length === 0 ? (

        <p>
          No notifications found.
        </p>

      ) : (

        notifications.map(
          (notification) => (

            <div
              key={
                notification.id
              }
            >

              <p>

                <strong>
                  {
                    notification.notification_type
                  }
                </strong>

              </p>

              <p>
                {
                  notification.message
                }
              </p>

              {notification.is_read ? (

                <p>
                  ✅ Read
                </p>

              ) : (

                <button
                  onClick={() =>
                    handleMarkNotificationRead(
                      notification.id
                    )
                  }
                >
                  Mark as Read
                </button>

              )}

              <p>
                {
                  notification.created_at
                }
              </p>

              <hr />

            </div>

          )
        )

      )}


      {/* ======================================================
          SAVINGS GOALS
      ====================================================== */}

      <hr />

      <h2>
        🎯 Savings Goals
      </h2>

      <form
        onSubmit={
          handleSavingsGoalSubmit
        }
      >

        <div>

          <label>
            Goal Name:{' '}
          </label>

          <input
            type="text"
            placeholder="Example: New Laptop"
            value={
              savingsGoalForm.goal_name
            }
            onChange={(e) =>
              setSavingsGoalForm({
                ...savingsGoalForm,
                goal_name:
                  e.target.value,
              })
            }
            required
          />

        </div>

        <br />

        <div>

          <label>
            Target Amount:{' '}
          </label>

          <input
            type="number"
            step="0.01"
            min="0.01"
            placeholder="50000"
            value={
              savingsGoalForm.target_amount
            }
            onChange={(e) =>
              setSavingsGoalForm({
                ...savingsGoalForm,
                target_amount:
                  e.target.value,
              })
            }
            required
          />

        </div>

        <br />

        <div>

          <label>
            Current Saved Amount:{' '}
          </label>

          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="0"
            value={
              savingsGoalForm.current_amount
            }
            onChange={(e) =>
              setSavingsGoalForm({
                ...savingsGoalForm,
                current_amount:
                  e.target.value,
              })
            }
          />

        </div>

        <br />

        <div>

          <label>
            Deadline:{' '}
          </label>

          <input
            type="date"
            value={
              savingsGoalForm.deadline
            }
            onChange={(e) =>
              setSavingsGoalForm({
                ...savingsGoalForm,
                deadline:
                  e.target.value,
              })
            }
          />

        </div>

        <br />

        <button
          className="submit-btn"
          type="submit"
        >
          Create Savings Goal
        </button>

      </form>


      {/* ======================================================
          SAVINGS GOAL LIST
      ====================================================== */}

      <h3>
        My Savings Goals
      </h3>

      {savingsGoals.length === 0 ? (

        <p>
          No savings goals found.
        </p>

      ) : (

        savingsGoals.map(
          (goal) => (

            <div
              key={goal.id}
            >

              <p>

                <strong>
                  {goal.goal_name}
                </strong>

              </p>

              <p>
                Target Amount: ₹
                {goal.target_amount}
              </p>

              <p>
                Current Saved: ₹
                {goal.current_amount}
              </p>

              <p>
                Progress:{' '}
                {goal.progress_percentage}%
              </p>

              <progress
                value={Number(
                  goal.progress_percentage
                )}
                max="100"
              />

              <p>
                Status:{' '}
                <strong>
                  {goal.status}
                </strong>
              </p>

              {goal.deadline && (
                <p>
                  Deadline:{' '}
                  {goal.deadline}
                </p>
              )}

              {goal.status !==
                'completed' && (

                <div>

                  <label>
                    Update Saved Amount:{' '}
                  </label>

                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={
                      progressValues[
                        goal.id
                      ] || ''
                    }
                    onChange={(e) =>
                      setProgressValues({
                        ...progressValues,
                        [goal.id]:
                          e.target.value,
                      })
                    }
                  />

                  <button
                    onClick={() =>
                      handleProgressUpdate(
                        goal.id,
                        progressValues[
                          goal.id
                        ]
                      )
                    }
                  >
                    Update Progress
                  </button>

                </div>

              )}

              <hr />

            </div>

          )
        )

      )}


      {/* ======================================================
          RECENT TRANSACTIONS
      ====================================================== */}

      {dashboard?.recent_transactions && (

        <div>

          <h2>
            🧾 Recent Transactions
          </h2>

          {dashboard
            .recent_transactions
            .length === 0 ? (

            <p>
              No recent transactions.
            </p>

          ) : (

            dashboard
              .recent_transactions
              .map(
                (
                  transaction,
                  index
                ) => (

                  <div
                    key={index}
                  >

                    <p>

                      <strong>
                        {
                          transaction.type
                        }
                      </strong>

                      {' - '}

                      {
                        transaction.source ||
                        transaction.category
                      }

                      {' - ₹'}

                      {
                        transaction.amount
                      }

                    </p>

                    <p>
                      {
                        transaction.date
                      }
                    </p>

                    <hr />

                  </div>

                )
              )

          )}

        </div>

      )}


      {/* ======================================================
          REFRESH + LOGOUT
      ====================================================== */}

      <br />

      <button
        className="submit-btn"
        onClick={loadData}
        disabled={loading}
      >
        {loading
          ? 'Refreshing...'
          : '🔄 Refresh Dashboard'}
      </button>

      <br />
      <br />

      <button
        className="submit-btn"
        onClick={handleLogout}
      >
        Logout
      </button>

    </div>
  )
}


// ============================================================
// PROTECTED ROUTE
// ============================================================

function ProtectedRoute({
  children,
}) {
  const token =
    localStorage.getItem(
      'access_token'
    )

  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
      />
    )
  }

  return children
}


// ============================================================
// APP
// ============================================================

function App() {
  const isLoggedIn =
    !!localStorage.getItem(
      'access_token'
    )

  return (
    <BrowserRouter>

      <div className="app">

        <nav className="navbar">

          <h2>
            💰 BudgetBuddy
          </h2>

          <div>

            <Link to="/">
              Home
            </Link>

            {!isLoggedIn && (
              <>
                <Link to="/register">
                  Register
                </Link>

                <Link to="/login">
                  Login
                </Link>
              </>
            )}

            {isLoggedIn && (
              <Link to="/dashboard">
                Dashboard
              </Link>
            )}

          </div>

        </nav>

        <main>

          <Routes>

            <Route
              path="/"
              element={
                <Home />
              }
            />

            <Route
              path="/register"
              element={
                <Register />
              }
            />

            <Route
              path="/login"
              element={
                <Login />
              }
            />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="*"
              element={
                <Navigate
                  to="/"
                  replace
                />
              }
            />

          </Routes>

        </main>

      </div>

    </BrowserRouter>
  )
}


export default App