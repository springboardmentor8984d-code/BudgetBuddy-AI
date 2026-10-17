import { useState, useEffect } from 'react'
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  Navigate,
  useNavigate,
  useLocation,
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
import Reports from './pages/Reports'

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
  background: '#111827',
  border: '1px solid #27314A',
  borderRadius: '8px',
  padding: '10px 14px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
  color: '#F8FAFC',
}}
    >
     <p
  style={{
    margin: 0,
    fontWeight: 'bold',
    color: '#E5E7EB',
  }}
>
  {item.category}
</p>
      <p
  style={{
    margin: '5px 0 0',
    color: '#CBD5E1',
  }}
>
  ₹{formatAmount(item.amount)}
</p>

     <p
  style={{
    margin: '5px 0 0',
    fontSize: '13px',
    color: '#CBD5E1',
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
    background: '#111827',
    border: '1px solid #27314A',
    borderRadius: '8px',
    padding: '10px 14px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
    color: '#F8FAFC',
  }}
>
    <p
  style={{
    margin: '0 0 8px',
    fontWeight: 'bold',
    color: '#E5E7EB',
  }}
>
  {label}
</p>

      {payload.map((item) => (
        <p
  key={item.dataKey}
  style={{
    margin: '4px 0',
    color: item.dataKey === 'income'
      ? '#22C55E'
      : '#EF4444',
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

function getLoggedInUsername() {
  const storedUsername =
    localStorage.getItem('username') ||
    localStorage.getItem('user_name') ||
    localStorage.getItem('user')

  if (storedUsername) {
    return storedUsername
  }

  const token = localStorage.getItem('access_token')

  if (!token) {
    return 'User'
  }

  try {
    const encodedPayload = token.split('.')[1]
    const normalizedPayload = encodedPayload
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const payload = JSON.parse(
      window.atob(normalizedPayload)
    )

    return (
      payload.username ||
      payload.user_name ||
      payload.name ||
      payload.email ||
      'User'
    )
  } catch {
    return 'User'
  }
}

function Dashboard() {
  const currentDate = new Date().toLocaleDateString('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric'
})
  const navigate = useNavigate()

  const [message, setMessage] = useState(
    'Loading dashboard...'
  )

  const [loading, setLoading] = useState(true)
  const [selectedSection, setSelectedSection] = useState('overview')
  const username = getLoggedInUsername()

  const [dashboard, setDashboard] = useState(null)

  const [expenses, setExpenses] = useState([])

  const [incomes, setIncomes] = useState([])

  const [budgets, setBudgets] = useState([])
  const [budgetRecords, setBudgetRecords] = useState([])

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

  // UI-only state: keeps the dashboard single-page while allowing
  // inline forms and the top-right notification panel.
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [showIncomeForm, setShowIncomeForm] = useState(false)
  const [showSavingsForm, setShowSavingsForm] = useState(false)
  const [showBudgetForm, setShowBudgetForm] = useState(false)
  const currentBudgetDate = new Date()
  const [budgetMonth, setBudgetMonth] = useState(String(currentBudgetDate.getMonth() + 1).padStart(2, '0'))
  const [budgetYear, setBudgetYear] = useState(String(currentBudgetDate.getFullYear()))
  const [budgetAmounts, setBudgetAmounts] = useState({})
  const [budgetSaving, setBudgetSaving] = useState(false)

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
        budgetRecordsResponse,
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
          `${API_URL}/budgets/`,
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

      setBudgetRecords(
        Array.isArray(budgetRecordsResponse.data)
          ? budgetRecordsResponse.data
          : Array.isArray(budgetRecordsResponse.data?.results)
            ? budgetRecordsResponse.data.results
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
// EDIT INCOME
// ==========================================================

const handleEditIncome = async (income) => {
  const newSource = window.prompt(
    'Enter income source:',
    income.source || ''
  )

  if (newSource === null) return

  const newAmount = window.prompt(
    'Enter income amount:',
    income.amount || ''
  )

  if (newAmount === null) return

  const newDate = window.prompt(
    'Enter income date (YYYY-MM-DD):',
    income.date || ''
  )

  if (newDate === null) return

  const newDescription = window.prompt(
    'Enter description:',
    income.description || ''
  )

  if (newDescription === null) return

  try {
    setError('')

    await axios.put(
      `${API_URL}/incomes/${income.id}/`,
      {
        source: newSource,
        amount: newAmount,
        date: newDate,
        description: newDescription,
      },
      authConfig
    )

    alert('Income updated successfully! ✅')

    await loadData()

  } catch (err) {
    console.error(err)

    const data = err.response?.data

    setError(
      data?.source?.[0] ||
      data?.amount?.[0] ||
      data?.date?.[0] ||
      data?.description?.[0] ||
      data?.detail ||
      'Failed to update income.'
    )
  }
}


// ==========================================================
// DELETE INCOME
// ==========================================================

const handleDeleteIncome = async (incomeId) => {
  const confirmed = window.confirm(
    'Are you sure you want to delete this income?'
  )

  if (!confirmed) return

  try {
    setError('')

    await axios.delete(
      `${API_URL}/incomes/${incomeId}/`,
      authConfig
    )

    alert('Income deleted successfully! ✅')

    await loadData()

  } catch (err) {
    console.error(err)

    setError(
      err.response?.data?.detail ||
      'Failed to delete income.'
    )
  }
}
  // ==========================================================
  // CREATE MONTHLY BUDGETS
  // ==========================================================

  const handleBudgetSubmit = async (event) => {
    event.preventDefault()
    setError('')

    const entries = CATEGORIES
      .filter((category) => String(budgetAmounts[category] || '').trim() !== '')
      .map((category) => ({
        category,
        amount: Number(budgetAmounts[category]),
      }))

    if (entries.length === 0) {
      setError('Enter an amount for at least one category.')
      return
    }

    const invalidEntry = entries.find(
      (entry) => !Number.isFinite(entry.amount) || entry.amount <= 0
    )
    if (invalidEntry) {
      setError(`Enter a valid amount greater than 0 for ${invalidEntry.category}.`)
      return
    }

    const monthDate = `${budgetYear}-${budgetMonth}-01`
    setBudgetSaving(true)

    try {
      for (const entry of entries) {
        await axios.post(
          `${API_URL}/budgets/`,
          { category: entry.category, amount: entry.amount, month: monthDate },
          authConfig
        )
      }

      setBudgetAmounts({})
      setShowBudgetForm(false)
      setMessage('Monthly budget saved successfully!')
      await loadData()
    } catch (err) {
      console.error(err)
      const data = err.response?.data
      const detail =
        data?.non_field_errors?.[0] ||
        data?.category?.[0] ||
        data?.amount?.[0] ||
        data?.month?.[0] ||
        data?.detail ||
        (typeof data === 'string' ? data : '')

      const budgetError =
        detail ||
        'Could not save all budgets. Some categories may already have a budget for this month. Check your saved budgets before trying again.'
      await loadData()
      setError(budgetError)
    } finally {
      setBudgetSaving(false)
    }
  }

  // ==========================================================
  // DELETE BUDGET
  // ==========================================================

  const handleDeleteBudget = async (budgetId) => {
    if (!budgetId) {
      setError('Could not find this saved budget record. Refresh the page and try again.')
      return
    }

    if (!window.confirm('Delete this category budget? This cannot be undone.')) {
      return
    }

    try {
      setError('')
      await axios.delete(`${API_URL}/budgets/${budgetId}/`, authConfig)
      setMessage('Budget deleted successfully.')
      await loadData()
    } catch (err) {
      console.error(err)
      setError(
        err.response?.data?.detail ||
        'Failed to delete this budget. Check that your backend allows DELETE on /budgets/{id}/.'
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
// EDIT SAVINGS GOAL
// ==========================================================

const handleEditSavingsGoal = async (goal) => {

  const newName = window.prompt(
    'Enter savings goal name:',
    goal.goal_name || ''
  )

  if (newName === null) return

  const newTarget = window.prompt(
    'Enter target amount:',
    goal.target_amount || ''
  )

  if (newTarget === null) return

  const newCurrent = window.prompt(
    'Enter current saved amount:',
    goal.current_amount || ''
  )

  if (newCurrent === null) return

  const newDeadline = window.prompt(
    'Enter deadline (YYYY-MM-DD):',
    goal.deadline || ''
  )

  if (newDeadline === null) return

  try {
    setError('')

    await axios.put(
      `${API_URL}/savings-goals/${goal.id}/`,
      {
        goal_name: newName,
        target_amount: newTarget,
        current_amount: newCurrent,
        deadline: newDeadline,
      },
      authConfig
    )

    alert('Savings goal updated successfully! ✅')

    await loadData()

  } catch (err) {
    console.error(err)

    const data = err.response?.data

    setError(
      data?.goal_name?.[0] ||
      data?.target_amount?.[0] ||
      data?.current_amount?.[0] ||
      data?.deadline?.[0] ||
      data?.detail ||
      'Failed to update savings goal.'
    )
  }
}

// ==========================================================
// DELETE SAVINGS GOAL
// ==========================================================

const handleDeleteSavingsGoal =
  async (goalId) => {

    const confirmDelete =
      window.confirm(
        'Are you sure you want to delete this savings goal?'
      )

    if (!confirmDelete) {
      return
    }

    try {
      setError('')

      await axios.delete(
        `${API_URL}/savings-goals/${goalId}/`,
        authConfig
      )

      alert(
        'Savings goal deleted successfully! ✅'
      )

      await loadData()

    } catch (err) {
      console.error(err)

      setError(
        err.response?.data?.detail ||
        err.message ||
        'Failed to delete savings goal.'
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
    



  const unreadNotifications = notifications.filter(
    (notification) => !notification.is_read
  ).length

  const savingsPercent = totalIncome > 0
    ? Math.max(0, Math.min(100, (financialSavings / totalIncome) * 100))
    : 0

  const categoryClass = (category) => {
    const value = String(category || '').toLowerCase()
    if (value.includes('food')) return 'bb-badge-red'
    if (value.includes('travel')) return 'bb-badge-blue'
    if (value.includes('shopping')) return 'bb-badge-purple'
    if (value.includes('education')) return 'bb-badge-green'
    if (value.includes('entertainment')) return 'bb-badge-yellow'
    return 'bb-badge-gray'
  }

  const groupedBudgets = budgets.reduce((groups, budget) => {
    const monthKey = getMonthKey(budget.month) || 'Unknown month'
    if (!groups[monthKey]) groups[monthKey] = []
    groups[monthKey].push(budget)
    return groups
  }, {})

  const sortedBudgetMonths = Object.keys(groupedBudgets)
    .filter((monthKey) => monthKey !== 'Unknown month')
    .sort((a, b) => b.localeCompare(a))

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        html, body, #root { margin:0; min-height:100%; background:#080D1C; }
        body { font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }

        .bb-layout{
          height:100vh;
          width:100%;
          display:flex;
          overflow:hidden;
          background:#080D1C;
          color:#E5E7EB;
        }
        .bb-sidebar{
          width:228px;
          flex:0 0 228px;
          height:100vh;
          position:fixed;
          left:0; top:0; bottom:0;
          display:flex;
          flex-direction:column;
          padding:18px 12px 14px;
          background:#0C1324;
          border-right:1px solid #27314A;
          z-index:50;
        }
        .bb-brand{
          display:flex;
          align-items:center;
          gap:10px;
          padding:4px 9px 20px;
        }
        .bb-logo{
          width:30px;height:30px;border-radius:8px;
          display:grid;place-items:center;
          background:#7C3AED;color:white;font-size:15px;
          box-shadow:0 8px 20px rgba(124,58,237,.25);
        }
        .bb-brand strong{display:block;font-size:13px;color:#F8FAFC}
        .bb-brand span{display:block;margin-top:2px;font-size:9px;color:#64748B}
        .bb-menu-title{
          margin:4px 10px 8px;
          font-size:9px;font-weight:700;letter-spacing:.12em;color:#475569;
        }
        .bb-nav{display:flex;flex-direction:column;gap:4px}
        .bb-nav button{
          width:100%;height:37px;border:0;border-radius:8px;
          display:flex;align-items:center;gap:10px;
          padding:0 11px;background:transparent;color:#94A3B8;
          font-size:11px;text-align:left;cursor:pointer;
          transition:.15s ease;
        }
        .bb-nav button:hover{background:#151E33;color:#E5E7EB}
        .bb-nav button.active{
          color:#fff;background:rgba(124,58,237,.18);
          box-shadow:inset 3px 0 0 #7C3AED;
        }
        .bb-nav-icon{width:16px;text-align:center;color:#8B5CF6;font-size:14px}
        .bb-sidebar-bottom{margin-top:auto}
        .bb-profile{
          display:flex;align-items:center;gap:9px;
          padding:10px;border:1px solid #27314A;border-radius:9px;
          background:#11192D;margin-bottom:8px;
        }
        .bb-avatar{
          width:28px;height:28px;border-radius:50%;
          display:grid;place-items:center;background:#7C3AED;color:#fff;
          font-size:11px;font-weight:700;
        }
        .bb-profile strong{display:block;font-size:10px;color:#E5E7EB;max-width:145px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .bb-profile span{display:block;font-size:8px;color:#64748B;margin-top:2px}
        .bb-signout{
          width:100%;height:34px;border:1px solid #27314A;border-radius:8px;
          background:transparent;color:#94A3B8;cursor:pointer;font-size:10px;
        }
        .bb-signout:hover{background:#171F35;color:#fff}

        .bb-main{
          margin-left:228px;width:calc(100% - 228px);
          height:100vh;overflow:hidden;background:#080D1C;
        }
        .bb-scroll{
          height:100%;overflow-y:auto;overflow-x:hidden;
          padding:22px 25px 28px;
          scrollbar-color:#27314A #080D1C;
        }
        .bb-header{
          min-height:52px;display:flex;align-items:center;justify-content:space-between;
          gap:16px;border-bottom:1px solid #27314A;padding-bottom:13px;margin-bottom:14px;
        }
        .bb-header h1{margin:0;font-size:19px;line-height:1.2;color:#F8FAFC}
        .bb-header p{margin:4px 0 0;font-size:10px;color:#64748B}
        .bb-header-right{position:relative;display:flex;align-items:center;gap:12px;margin-right:20px}
      .bb-bell{
  position:relative;
  width:auto;
  height:auto;
  border:none;
  background:transparent;
  color:#E5E7EB;
  cursor:pointer;
  font-size:22px;
  padding:0;
  margin:0 4px 0 8px;
}
        .bb-bell:hover{border-color:#7C3AED;background:#171F35}
        .bb-count{
          position:absoluteright:-7px;top:-7px;min-width:15px;height:15px;
          padding:0 4px;border-radius:20px;background:#EF4444;color:#fff;
          font-size:8px;display:grid;place-items:center;border:2px solid #080D1C;
        }
        .bb-user-chip{
          padding:8px 10px;border:1px solid #27314A;border-radius:8px;
          background:#11192D;color:#CBD5E1;font-size:10px;
        }
        .bb-notification-pop{
          position:absolute;right:0;top:42px;width:320px;max-height:390px;overflow:auto;
          padding:10px;background:#11192D;border:1px solid #27314A;border-radius:10px;
          box-shadow:0 18px 50px rgba(0,0,0,.45);z-index:100;
        }
        .bb-notification-pop h3{margin:2px 2px 8px;font-size:12px;color:#F8FAFC}
        .bb-notification{
          padding:9px;border:1px solid #27314A;border-radius:7px;background:#171F35;margin-bottom:7px;
        }
        .bb-notification strong{display:block;font-size:10px;color:#E5E7EB}
        .bb-notification p{margin:4px 0;font-size:9px;line-height:1.4;color:#94A3B8}
        .bb-notification small{color:#64748B;font-size:8px}
        .bb-read{margin-top:5px;padding:4px 7px;border:0;border-radius:5px;background:#7C3AED;color:white;font-size:8px;cursor:pointer}

        .bb-message{margin:0 0 10px;font-size:9px;color:#64748B}
        .bb-error{padding:9px 11px;margin-bottom:11px;border:1px solid rgba(239,68,68,.35);border-radius:8px;background:rgba(239,68,68,.08);color:#FCA5A5;font-size:10px}
        .bb-grid-4{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
        .bb-grid-3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
        .bb-grid-2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
        .bb-card{
          background:#171F35;border:1px solid #27314A;border-radius:10px;
          box-shadow:0 8px 24px rgba(0,0,0,.14);
        }
        .bb-stat{position:relative;padding:13px 14px;min-height:94px;overflow:hidden}
        .bb-stat:before{content:"";position:absolute;left:0;right:0;top:0;height:2px;background:#7C3AED}
        .bb-stat.green:before{background:#10B981}.bb-stat.red:before{background:#EF4444}
        .bb-stat.yellow:before{background:#F59E0B}.bb-stat.purple:before{background:#8B5CF6}
        .bb-label{font-size:8px;letter-spacing:.1em;color:#64748B;font-weight:700}
        .bb-value{display:block;margin-top:9px;font-size:19px;font-weight:700;color:#F8FAFC}
        .bb-sub{display:block;margin-top:3px;font-size:8px;color:#64748B}
        .bb-panel{padding:14px}
        .bb-panel-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}
        .bb-panel-head h2{margin:0;font-size:13px;color:#F8FAFC}
        .bb-panel-head span{font-size:9px;color:#64748B}
        .bb-btn{
          border:0;border-radius:6px;padding:7px 10px;background:#7C3AED;color:#fff;
          font-size:9px;font-weight:600;cursor:pointer;
        }
        .bb-btn:hover{background:#8B5CF6}
        .bb-btn.secondary{background:#0C1324;border:1px solid #27314A;color:#CBD5E1}
        .bb-btn.danger{background:rgba(239,68,68,.13);color:#FCA5A5;border:1px solid rgba(239,68,68,.25)}
        .bb-list{display:flex;flex-direction:column}
        .bb-row{
          display:flex;align-items:center;justify-content:space-between;gap:10px;
          padding:9px 0;border-bottom:1px solid #27314A;
        }
        .bb-row:last-child{border-bottom:0}
        .bb-row-main{min-width:0}
        .bb-row-main strong{display:block;font-size:10px;color:#E5E7EB}
        .bb-row-main span{display:block;margin-top:3px;font-size:8px;color:#64748B}
        .bb-positive{color:#10B981;font-size:10px;font-weight:700}.bb-negative{color:#EF4444;font-size:10px;font-weight:700}
        .bb-empty{padding:15px 0;color:#64748B;font-size:10px}
        .bb-badge{display:inline-flex;padding:4px 7px;border-radius:999px;font-size:8px;font-weight:700}
        .bb-badge-red{background:rgba(239,68,68,.13);color:#FCA5A5}.bb-badge-blue{background:rgba(59,130,246,.13);color:#93C5FD}
        .bb-badge-purple{background:rgba(124,58,237,.16);color:#C4B5FD}.bb-badge-green{background:rgba(16,185,129,.13);color:#6EE7B7}
        .bb-badge-yellow{background:rgba(245,158,11,.13);color:#FCD34D}.bb-badge-gray{background:#0C1324;color:#94A3B8}
        .bb-form{
          margin-top:10px;padding:12px;border:1px solid #27314A;border-radius:9px;background:#11192D;
        }
        .bb-form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}
        .bb-field label{display:block;margin-bottom:4px;font-size:8px;color:#94A3B8}
        .bb-field input,.bb-field select,.bb-field textarea{
          width:100%;height:32px;padding:0 8px;border:1px solid #27314A;border-radius:6px;
          background:#0C1324;color:#E5E7EB;font-size:9px;outline:none;
        }
        .bb-field textarea{height:60px;padding-top:7px;resize:vertical}
        .bb-field input:focus,.bb-field select:focus,.bb-field textarea:focus{border-color:#7C3AED}
        .bb-form-actions{display:flex;justify-content:flex-end;gap:7px;margin-top:10px}
        .bb-progress{height:6px;border-radius:99px;background:#0C1324;overflow:hidden;margin:8px 0}
        .bb-progress > div{height:100%;border-radius:99px;background:#7C3AED}
        .bb-goal{padding:12px}.bb-goal h3{margin:0;font-size:11px;color:#F8FAFC}
        .bb-goal-meta{display:flex;justify-content:space-between;margin-top:7px;font-size:8px;color:#94A3B8}
        .bb-goal-actions{display:flex;gap:6px;margin-top:8px}
        .bb-goal-actions input{flex:1;height:28px;padding:0 7px;background:#0C1324;border:1px solid #27314A;border-radius:6px;color:#E5E7EB;font-size:9px}
        .bb-table-row{display:grid;grid-template-columns:1.2fr 1.5fr .8fr .8fr auto;align-items:center;gap:8px;padding:10px 0;border-bottom:1px solid #27314A}
        .bb-table-row:last-child{border-bottom:0}
        .bb-table-row span,.bb-table-row strong{font-size:9px;color:#CBD5E1}
        .bb-table-row .amount{font-size:10px;font-weight:700;color:#E5E7EB;text-align:right}
        .bb-chart-card{padding:12px}
        .bb-chart-card h3{margin:0 0 8px;font-size:11px;color:#F8FAFC}
        .bb-chart-wrap{height:230px}
        .bb-small-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-bottom:10px}
        .bb-mini{padding:10px;border:1px solid #27314A;border-radius:8px;background:#11192D}
        .bb-mini span{font-size:8px;color:#64748B}.bb-mini strong{display:block;margin-top:5px;font-size:12px;color:#E5E7EB}
        .bb-budget-card{padding:13px}
        .bb-budget-card h3{margin:0;font-size:11px;color:#F8FAFC}
        .bb-budget-card .budget-amount{margin-top:8px;font-size:16px;font-weight:700;color:#E5E7EB}
        .bb-budget-item{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #27314A;font-size:8px;color:#94A3B8}
        .bb-budget-item:last-child{border-bottom:0}
        .bb-notice{padding:9px;border:1px dashed #27314A;border-radius:7px;background:#11192D;color:#64748B;font-size:9px}
        .bb-refresh{display:flex;justify-content:flex-end;margin-top:12px}

        @media(max-width:1000px){
          .bb-grid-4{grid-template-columns:repeat(2,minmax(0,1fr))}
          .bb-small-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}
        }
        @media(max-width:760px){
          .bb-sidebar{width:190px;flex-basis:190px}
          .bb-main{margin-left:190px;width:calc(100% - 190px)}
          .bb-grid-2,.bb-grid-3{grid-template-columns:1fr}
          .bb-table-row{grid-template-columns:1fr 1fr auto}
          .bb-table-row .hide-mobile{display:none}
        }
      `}</style>

      <div className="bb-layout">
        <aside className="bb-sidebar">
          <div className="bb-brand">
            <div className="bb-logo">₹</div>
            <div><strong>BudgetBuddy</strong><span>Personal Finance Manager</span></div>
          </div>

          <div className="bb-menu-title">MAIN MENU</div>
          <nav className="bb-nav">
            {[
              ['overview','▦','Overview'],
              ['budgets','▤','Budgets'],
              ['savings','◎','Savings'],
              ['income','↗','Income'],
              ['expenses','↘','Expenses'],
              ['analytics','◌','Analytics'],
              ['reports','▣','Reports'],
            ].map(([key,icon,label]) => (
              <button
                key={key}
                className={selectedSection === key ? 'active' : ''}
                onClick={() => {
                  setSelectedSection(key)
                  setNotificationsOpen(false)
                }}
              >
                <span className="bb-nav-icon">{icon}</span>{label}
              </button>
            ))}
          </nav>

<div className="bb-sidebar-bottom">
  <div className="bb-profile">
    <div className="bb-avatar">
      {String(username || 'U').charAt(0).toUpperCase()}
    </div>

    <div>
      <strong>{username || 'User'}</strong>
      <span>{localStorage.getItem('email') || 'No email available'}</span>
    </div>
  </div>

  <button className="bb-signout" onClick={handleLogout}>
    ⇥ &nbsp; Sign Out
  </button>
</div>
</aside>

        <main className="bb-main">
          <div className="bb-scroll">
            <header className="bb-header">
              <div>
                <h1>
                  {selectedSection === 'overview' && 'Overview'}
                  {selectedSection === 'budgets' && 'Budgets'}
                  {selectedSection === 'savings' && 'Savings'}
                  {selectedSection === 'income' && 'Income'}
                  {selectedSection === 'expenses' && 'Expenses'}
                  {selectedSection === 'analytics' && 'Analytics'}
                  {selectedSection === 'reports' && 'Reports'}
                </h1>
                <p>
                  {selectedSection === 'overview' && 'Your financial overview at a glance.'}
                  {selectedSection === 'budgets' && 'Track your monthly budgets and spending limits.'}
                  {selectedSection === 'savings' && 'Manage your savings goals and progress.'}
                  {selectedSection === 'income' && 'Review and manage your income records.'}
                  {selectedSection === 'expenses' && 'Review and manage your expenses.'}
                  {selectedSection === 'analytics' && 'Understand your spending and financial trends.'}
                  {selectedSection === 'reports' && 'View and export your monthly financial reports.'}
                </p>
              </div>

              <div className="bb-header-right" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="bb-user-chip">● {username || 'User'}</div>
                <button className="bb-bell" onClick={() => setNotificationsOpen(v => !v)} aria-label="Notifications">
                  🔔
                  {unreadNotifications > 0 && <span className="bb-count">{unreadNotifications > 9 ? '9+' : unreadNotifications}</span>}
                </button>
                 <span style={{ marginLeft: 10, fontSize: 14, color: '#6B7280' }}>
                   {currentDate}
                  </span>

                {notificationsOpen && (
                  <div className="bb-notification-pop">
                    <h3>Notifications</h3>
                    {notifications.length === 0 ? (
                      <div className="bb-empty">No notifications found.</div>
                    ) : (
                      notifications.slice(0,8).map(notification => (
                        <div className="bb-notification" key={notification.id}>
                          <strong>{notification.notification_type || 'Financial alert'}</strong>
                          <p>{notification.message}</p>
                          <small>{notification.created_at || ''}</small>
                          {!notification.is_read && (
                            <div>
                              <button className="bb-read" onClick={() => handleMarkNotificationRead(notification.id)}>
                                Mark as Read
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </header>

            {message && !error && <div className="bb-message">{message}</div>}
            {error && <div className="bb-error">{error}</div>}

            {loading ? (
              <div className="bb-card bb-panel">
                <div className="bb-empty">Loading your financial data...</div>
              </div>
            ) : (
              <>
                {selectedSection === 'overview' && (
                  <>
                    <div className="bb-grid-4">
                      <div className="bb-card bb-stat green"><span className="bb-label">TOTAL INCOME</span><span className="bb-value">₹{formatAmount(totalIncome)}</span><span className="bb-sub">All recorded income</span></div>
                      <div className="bb-card bb-stat red"><span className="bb-label">TOTAL EXPENSES</span><span className="bb-value">₹{formatAmount(totalExpenses)}</span><span className="bb-sub">All recorded expenses</span></div>
                      <div className="bb-card bb-stat purple"><span className="bb-label">BALANCE</span><span className="bb-value">₹{formatAmount(financialSavings)}</span><span className="bb-sub">Income minus expenses</span></div>
                      <div className="bb-card bb-stat yellow"><span className="bb-label">TRANSACTIONS</span><span className="bb-value">{incomes.length + expenses.length}</span><span className="bb-sub">Income + expenses</span></div>
                    </div>
                    <div className="bb-grid-2" style={{marginTop:10, gridTemplateColumns:'1fr'}}>
                      <div className="bb-card bb-panel">
                        <div className="bb-panel-head"><div><h2>Recent Activity</h2><span>Latest financial transactions</span></div></div>
                        <div className="bb-list">
                          {(dashboard?.recent_transactions || []).slice(0,7).map((transaction,index) => {
                            const isExpense = String(transaction.type || '').toLowerCase().includes('expense')
                            return (
                              <div className="bb-row" key={index}>
                                <div className="bb-row-main">
                                  <strong>{transaction.source || transaction.category || transaction.type || 'Transaction'}</strong>
                                  <span>{transaction.date || '—'}</span>
                                </div>
                                <span className={isExpense ? 'bb-negative' : 'bb-positive'}>
                                  {isExpense ? '-' : '+'} ₹{formatAmount(transaction.amount)}
                                </span>
                              </div>
                            )
                          })}
                          {(!dashboard?.recent_transactions || dashboard.recent_transactions.length === 0) && <div className="bb-empty">No recent transactions.</div>}
                        </div>
                      </div>

                     
                    </div>

                    <div className="bb-grid-3" style={{marginTop:10}}>
                      <div className="bb-card bb-stat green"><span className="bb-label">SAVINGS RATE</span><span className="bb-value">{savingsPercent.toFixed(1)}%</span><span className="bb-sub">Current balance / income</span></div>
                      <div className="bb-card bb-stat purple"><span className="bb-label">SAVINGS GOALS</span><span className="bb-value">{savingsGoals.length}</span><span className="bb-sub">Active goals</span></div>
                      <div className="bb-card bb-stat yellow"><span className="bb-label">BUDGET CATEGORIES</span><span className="bb-value">{budgets.length}</span><span className="bb-sub">Loaded from your account</span></div>
                    </div>
                  </>
                )}

                {selectedSection === 'budgets' && (
                  <>
                    <div className="bb-card bb-panel">
                      <div className="bb-panel-head">
                        <div>
                          <h2>Monthly Budgets</h2>
                          <span>Create and review your category limits by month</span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="bb-btn" onClick={() => setShowBudgetForm((value) => !value)}>
                            {showBudgetForm ? 'Close Form' : '+ New Budget'}
                          </button>
                          <button className="bb-btn secondary" onClick={loadData}>Refresh</button>
                        </div>
                      </div>

                      {showBudgetForm && (
                        <form className="bb-form" onSubmit={handleBudgetSubmit} style={{ marginTop: 12, padding: 12, border: '1px solid #27314A', borderRadius: 8, background: '#10182B' }}>
                          <h3 style={{ margin: '0 0 10px', fontSize: '12px', color: '#F8FAFC' }}>Create Monthly Budget</h3>
                          <div className="bb-form-grid" style={{ marginBottom: 10, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                            <div className="bb-field">
                              <label>Month</label>
                              <select value={budgetMonth} onChange={(event) => setBudgetMonth(event.target.value)}>
                                {[
                                  ['01', 'January'], ['02', 'February'], ['03', 'March'],
                                  ['04', 'April'], ['05', 'May'], ['06', 'June'],
                                  ['07', 'July'], ['08', 'August'], ['09', 'September'],
                                  ['10', 'October'], ['11', 'November'], ['12', 'December'],
                                ].map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                              </select>
                            </div>
                            <div className="bb-field">
                              <label>Year</label>
                              <select value={budgetYear} onChange={(event) => setBudgetYear(event.target.value)}>
                                {Array.from({ length: 7 }, (_, index) => currentBudgetDate.getFullYear() - 2 + index).map((year) => (
                                  <option key={year} value={String(year)}>{year}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="bb-form-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
                            {CATEGORIES.map((category) => (
                              <div className="bb-field" key={category}>
                                <label>{category} budget (₹)</label>
                                <input
                                  type="number"
                                  min="0.01"
                                  step="0.01"
                                  placeholder="Leave blank to skip"
                                  value={budgetAmounts[category] || ''}
                                  onChange={(event) => setBudgetAmounts((previous) => ({
                                    ...previous,
                                    [category]: event.target.value,
                                  }))}
                                />
                              </div>
                            ))}
                          </div>
                          <div className="bb-form-actions">
                            <button
                              type="button"
                              className="bb-btn secondary"
                              onClick={() => {
                                setShowBudgetForm(false)
                                setBudgetAmounts({})
                                setError('')
                              }}
                              disabled={budgetSaving}
                            >
                              Cancel
                            </button>
                            <button className="bb-btn" type="submit" disabled={budgetSaving}>
                              {budgetSaving ? 'Saving...' : 'Create Budget'}
                            </button>
                          </div>
                        </form>
                      )}

                      {sortedBudgetMonths.length === 0 ? (
                        <div className="bb-empty">No budgets found. Select “New Budget” to create your first monthly budget.</div>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(245px, 1fr))', alignItems: 'start', gap: 10, marginTop: 12 }}>
                          {sortedBudgetMonths.map((monthKey) => {
                            const monthBudgets = groupedBudgets[monthKey]
                            const monthTotal = monthBudgets.reduce((sum, budget) => sum + Number(budget.budget_amount || 0), 0)
                            return (
                              <div className="bb-card bb-budget-card" key={monthKey} style={{ padding: 12, minWidth: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
  <div>
    <h3>{formatMonthLabel(monthKey)}</h3>
  </div>

  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <div style={{ textAlign: 'right' }}>
      <span style={{ display: 'block', fontSize: 8, color: '#94A3B8' }}>
        TOTAL MONTHLY BUDGET
      </span>
      <strong style={{ color: '#C4B5FD', fontSize: 15 }}>
        ₹{formatAmount(monthTotal)}
      </strong>
    </div>

    <button
      type="button"
      onClick={() => {
        const firstBudget = monthBudgets[0]
        const record = budgetRecords.find((item) =>
          item.category === firstBudget?.category &&
          String(item.month || '').slice(0, 7) === monthKey
        )

        handleDeleteBudget(record?.id)
      }}
      title={`Delete ${formatMonthLabel(monthKey)} budget`}
      style={{
        border: '1px solid #27314A',
        background: '#182238',
        color: '#94A3B8',
        borderRadius: 4,
        padding: '4px 7px',
        fontSize: 8,
        cursor: 'pointer'
      }}
    >
      Del
    </button>
  </div>
</div>
                                <div className="bb-form-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
                                  {monthBudgets.map((budget, index) => {
                                    const amount = Number(budget.budget_amount || 0)
                                    const spent = Number(budget.spent_amount || 0)
                                    const remaining = Number(budget.remaining_amount ?? amount - spent)
                                    const percent = amount > 0 ? Math.min(100, Math.max(0, spent / amount * 100)) : 0
                                    return (
                                      <div key={`${budget.category}-${index}`} style={{ padding: 9, minWidth: 0, border: '1px solid #27314A', borderRadius: 7, background: '#11192D' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                                          <strong style={{ fontSize: 10, color: '#E5E7EB' }}>{budget.category}</strong>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                            <strong style={{ fontSize: 10, color: '#C4B5FD' }}>₹{formatAmount(amount)}</strong>

                                          </div>
                                        </div>
                                        <div className="bb-progress">
                                          <div style={{ width: `${percent}%`, background: percent >= 90 ? '#EF4444' : '#7C3AED' }} />
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 8, color: '#94A3B8' }}>
                                          <span>Spent ₹{formatAmount(spent)}</span>
                                          <span>Left ₹{formatAmount(remaining)}</span>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {selectedSection === 'savings' && (
                  <>
                    <div className="bb-card bb-panel">
                      <div className="bb-panel-head">
                        <div><h2>Savings Goals</h2><span>Track progress toward your targets</span></div>
                        <button className="bb-btn" onClick={() => setShowSavingsForm(v => !v)}>+ New Goal</button>
                      </div>

                      {showSavingsForm && (
                        <form className="bb-form" onSubmit={handleSavingsGoalSubmit}>
                          <div className="bb-form-grid">
                            <div className="bb-field"><label>Goal Name</label><input value={savingsGoalForm.goal_name} onChange={e=>setSavingsGoalForm({...savingsGoalForm,goal_name:e.target.value})} required /></div>
                            <div className="bb-field"><label>Target Amount</label><input type="number" step="0.01" min="0.01" value={savingsGoalForm.target_amount} onChange={e=>setSavingsGoalForm({...savingsGoalForm,target_amount:e.target.value})} required /></div>
                            <div className="bb-field"><label>Current Amount</label><input type="number" step="0.01" min="0" value={savingsGoalForm.current_amount} onChange={e=>setSavingsGoalForm({...savingsGoalForm,current_amount:e.target.value})} /></div>
                            <div className="bb-field"><label>Deadline</label><input type="date" value={savingsGoalForm.deadline} onChange={e=>setSavingsGoalForm({...savingsGoalForm,deadline:e.target.value})} /></div>
                          </div>
                          <div className="bb-form-actions">
                            <button type="button" className="bb-btn secondary" onClick={()=>setShowSavingsForm(false)}>Cancel</button>
                            <button className="bb-btn" type="submit">Create Goal</button>
                          </div>
                        </form>
                      )}

                      <div className="bb-grid-3" style={{marginTop:10}}>
                        {savingsGoals.map(goal => {
                          const progress=Math.min(100,Math.max(0,Number(goal.progress_percentage || 0)))
                          return (
                            <div className="bb-card bb-goal" key={goal.id}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                                 <h3>{goal.goal_name}</h3>

                                <div style={{ display: 'flex', gap: 6 }}>
  <button
    type="button"
    className="bb-btn"
    onClick={() => handleProgressUpdate(
      goal.id,
      Number(goal.current_amount || 0) + Number(
        window.prompt('Enter amount to add:', '0') || 0
      )
    )}
  >
    Add
  </button>

  <button
    type="button"
    className="bb-btn"
    onClick={() => handleEditSavingsGoal(goal)}
  >
    Edit
  </button>

  <button
    type="button"
    className="bb-btn"
    onClick={() => handleDeleteSavingsGoal(goal.id)}
  >
    Del
  </button>
</div>
                              </div>
                              <div className="bb-goal-meta"><span>₹{formatAmount(goal.current_amount)} saved</span><span>₹{formatAmount(goal.target_amount)} target</span></div>
                              <div className="bb-progress"><div style={{width:`${progress}%`}} /></div>
                              <div className="bb-goal-meta"><span>{progress.toFixed(0)}% complete</span><span>{goal.status || ''}</span></div>
                          
                            </div>
                          )
                        })}
                      </div>
                      {savingsGoals.length === 0 && <div className="bb-empty">No savings goals found.</div>}
                    </div>
                  </>
                )}

                {selectedSection === 'income' && (
                  <div className="bb-card bb-panel">
                    <div className="bb-panel-head">
                      <div><h2>Income</h2><span>Your recorded income sources</span></div>
                      <button className="bb-btn" onClick={()=>setShowIncomeForm(v=>!v)}>+ Add</button>
                    </div>

                    {showIncomeForm && (
                      <form className="bb-form" onSubmit={handleIncomeSubmit}>
                        <div className="bb-form-grid">
                          <div className="bb-field"><label>Source</label><input value={incomeForm.source} onChange={e=>setIncomeForm({...incomeForm,source:e.target.value})} required /></div>
                          <div className="bb-field"><label>Amount</label><input type="number" step="0.01" min="0.01" value={incomeForm.amount} onChange={e=>setIncomeForm({...incomeForm,amount:e.target.value})} required /></div>
                          <div className="bb-field"><label>Date</label><input type="date" value={incomeForm.date} onChange={e=>setIncomeForm({...incomeForm,date:e.target.value})} required /></div>
                          <div className="bb-field"><label>Description</label><input value={incomeForm.description} onChange={e=>setIncomeForm({...incomeForm,description:e.target.value})}/></div>
                        </div>
                        <div className="bb-form-actions">
                          <button type="button" className="bb-btn secondary" onClick={()=>setShowIncomeForm(false)}>Cancel</button>
                          <button className="bb-btn" type="submit">Add Income</button>
                        </div>
                      </form>
                    )}

                    <div className="bb-list" style={{marginTop:10}}>
  {incomes.map(income => (
    <div className="bb-row" key={income.id}>

      <div className="bb-row-main">
        <strong>{income.source || 'Income'}</strong>

        <span>
          {income.date || '—'}
          {income.description
            ? ` • ${income.description}`
            : ''}
        </span>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>

        <strong className="bb-positive">
          ₹{formatAmount(income.amount)}
        </strong>

        <button
          className="bb-btn"
          onClick={() => handleEditIncome(income)}
        >
          Edit
        </button>

        <button
          className="bb-btn"
          onClick={() => handleDeleteIncome(income.id)}
        >
          Del
        </button>

      </div>

    </div>
  ))}

                      {incomes.length===0 && <div className="bb-empty">No income records found.</div>}
                    </div>
                  </div>
                )}

                {selectedSection === 'expenses' && (
                  <div className="bb-card bb-panel">
                    <div className="bb-panel-head">
                      <div><h2>Expenses</h2><span>Review and manage your spending</span></div>
                      <button className="bb-btn" onClick={()=>setShowExpenseForm(v=>!v)}>+ Add</button>
                    </div>

                    {showExpenseForm && (
                      <form className="bb-form" onSubmit={handleExpenseSubmit}>
                        <div className="bb-form-grid">
                          <div className="bb-field"><label>Category</label><select value={expenseForm.category} onChange={e=>setExpenseForm({...expenseForm,category:e.target.value})}>{CATEGORIES.map(category=><option key={category}>{category}</option>)}</select></div>
                          <div className="bb-field"><label>Amount</label><input type="number" step="0.01" min="0.01" value={expenseForm.amount} onChange={e=>setExpenseForm({...expenseForm,amount:e.target.value})} required /></div>
                          <div className="bb-field"><label>Date</label><input type="date" value={expenseForm.date} onChange={e=>setExpenseForm({...expenseForm,date:e.target.value})} required /></div>
                          <div className="bb-field"><label>Description</label><input value={expenseForm.description} onChange={e=>setExpenseForm({...expenseForm,description:e.target.value})}/></div>
                        </div>
                        <div className="bb-form-actions">
                          <button type="button" className="bb-btn secondary" onClick={()=>setShowExpenseForm(false)}>Cancel</button>
                          <button className="bb-btn" type="submit">Add Expense</button>
                        </div>
                      </form>
                    )}

                    <div className="bb-list" style={{marginTop:10}}>
                      {expenses.map(expense => (
                        <div className="bb-table-row" key={expense.id}>
                          <span><span className={`bb-badge ${categoryClass(expense.category)}`}>{expense.category || 'Other'}</span></span>
                          <span>{expense.description || 'Expense'}</span>
                          <span>{expense.date || '—'}</span>
                          <span className="amount">₹{formatAmount(expense.amount)}</span>
                          <button className="bb-btn danger" onClick={()=>handleDeleteExpense(expense.id)}>Delete</button>
                        </div>
                      ))}
                      {expenses.length===0 && <div className="bb-empty">No expenses found.</div>}
                    </div>
                  </div>
                )}

                {selectedSection === 'analytics' && (
                  <>
                    <div className="bb-small-metrics">
                      <div className="bb-mini"><span>Total Income</span><strong>₹{formatAmount(totalIncome)}</strong></div>
                      <div className="bb-mini"><span>Total Expenses</span><strong>₹{formatAmount(totalExpenses)}</strong></div>
                      <div className="bb-mini"><span>Savings %</span><strong>{savingsPercent.toFixed(1)}%</strong></div>
                      <div className="bb-mini"><span>Transactions</span><strong>{incomes.length + expenses.length}</strong></div>
                    </div>

                    <div className="bb-grid-2">
                      <div className="bb-card bb-chart-card">
                        <h3>Category-wise Spending</h3>
                        <div className="bb-chart-wrap">
                          {categoryChartData.length ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie data={categoryChartData} dataKey="amount" nameKey="category" cx="50%" cy="50%" innerRadius={52} outerRadius={82} paddingAngle={2}>
                                  {categoryChartData.map((entry,index)=><Cell key={entry.category} fill={CHART_COLORS[index % CHART_COLORS.length]}/>)}
                                </Pie>
                                <Tooltip content={<CategoryTooltip/>}/>
                                <Legend wrapperStyle={{fontSize:'9px',color:'#94A3B8'}}/>
                              </PieChart>
                            </ResponsiveContainer>
                          ) : <div className="bb-empty">No expense data available.</div>}
                        </div>
                      </div>

                      <div className="bb-card bb-chart-card">
                        <h3>Monthly Income / Expense Trends</h3>
                        <div className="bb-chart-wrap">
                          {monthlyChartData.length ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={monthlyChartData}>
                                <CartesianGrid stroke="#27314A" strokeDasharray="3 3"/>
                                <XAxis dataKey="monthLabel" tick={{fill:'#94A3B8',fontSize:8}}/>
                                <YAxis tick={{fill:'#94A3B8',fontSize:8}}/>
                                <Tooltip content={<MonthlyTooltip/>}/>
                                <Legend wrapperStyle={{fontSize:'9px'}}/>
                                <Bar dataKey="income" name="Income" fill="#10B981" radius={[4,4,0,0]}/>
                                <Bar dataKey="expenses" name="Expenses" fill="#EF4444" radius={[4,4,0,0]}/>
                              </BarChart>
                            </ResponsiveContainer>
                          ) : <div className="bb-empty">No monthly data available.</div>}
                        </div>
                      </div>
                    </div>

                    <div className="bb-grid-2" style={{marginTop:10}}>
                      <div className="bb-card bb-panel">
                        <div className="bb-panel-head"><div><h2>Savings Progress</h2><span>Overall savings position</span></div><strong style={{fontSize:12,color:'#10B981'}}>{savingsPercent.toFixed(1)}%</strong></div>
                        <div className="bb-progress"><div style={{width:`${savingsPercent}%`,background:'#10B981'}}/></div>
                        <div className="bb-goal-meta"><span>₹{formatAmount(financialSavings)} saved</span><span>₹{formatAmount(totalIncome)} income</span></div>
                      </div>
                      <div className="bb-card bb-panel">
                        <div className="bb-panel-head"><div><h2>Budget Summary</h2><span>Current utilization</span></div></div>
                        <div className="bb-list">
                          {budgets.slice(0,4).map((budget,index)=>{
                            const total=Number(budget.budget_amount||0), spent=Number(budget.spent_amount||0)
                            const pct=total>0?Math.min(100,(spent/total)*100):0
                            return <div className="bb-row" key={budget.id||index}><div className="bb-row-main"><strong>{budget.category||'Budget'}</strong><span>{pct.toFixed(0)}% used</span></div><strong style={{fontSize:10,color:pct>=90?'#EF4444':'#E5E7EB'}}>₹{formatAmount(spent)}</strong></div>
                          })}
                          {budgets.length===0 && <div className="bb-empty">No budgets found.</div>}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {selectedSection === 'reports' && (
                  <div className="bb-card bb-panel" style={{padding:0,overflow:'hidden'}}>
                    <Reports />
                  </div>
                )}
              </>
            )}

            <div className="bb-refresh">
              <button className="bb-btn secondary" onClick={loadData} disabled={loading}>
                {loading ? 'Refreshing...' : 'Refresh Dashboard'}
              </button>
            </div>
          </div>
        </main>
      </div>
    </>
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


function AppLayout() {
  const location = useLocation()
  const isLoggedIn = Boolean(localStorage.getItem('access_token'))

  const isAuthPage =
    location.pathname === '/login' ||
    location.pathname === '/register'

  return (
    <div className="app">
      {!isLoggedIn && isAuthPage && (
        <header className="navbar">
          <Link to="/" style={{ textDecoration: 'none' }}>
            <h2>💰 BudgetBuddy</h2>
          </Link>

          <div>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </div>
        </header>
      )}

      <Routes>
        <Route
          path="/"
          element={
            isLoggedIn
              ? <Navigate to="/dashboard" replace />
              : <Home />
          }
        />

        <Route
          path="/register"
          element={
            isLoggedIn
              ? <Navigate to="/dashboard" replace />
              : <Register />
          }
        />

        <Route
          path="/login"
          element={
            isLoggedIn
              ? <Navigate to="/dashboard" replace />
              : <Login />
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
          path="/reports"
          element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          }
        />

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  )
}

export default App