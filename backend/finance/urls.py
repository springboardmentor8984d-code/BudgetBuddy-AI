from django.urls import path
from . import views
from .views import MonthlyReportView, MonthlyReportPDFView

urlpatterns = [

    # ========================================================
    # HOME
    # ========================================================

    path(
        '',
        views.home,
        name='home'
    ),


    # ========================================================
    # AUTHENTICATION
    # ========================================================

    path(
        'register/',
        views.RegisterView.as_view(),
        name='register'
    ),

    path(
        'login/',
        views.LoginView.as_view(),
        name='login'
    ),


    # ========================================================
    # INCOME
    # ========================================================

    path(
        'incomes/',
        views.IncomeListCreateView.as_view(),
        name='income-list'
    ),

    path(
        'incomes/<int:pk>/',
        views.IncomeDetailView.as_view(),
        name='income-detail'
    ),


    # ========================================================
    # EXPENSE
    # ========================================================

    path(
        'expenses/',
        views.ExpenseListCreateView.as_view(),
        name='expense-list'
    ),

    path(
        'expenses/<int:pk>/',
        views.ExpenseDetailView.as_view(),
        name='expense-detail'
    ),


    # ========================================================
    # BUDGET
    # ========================================================

    path(
        'budgets/',
        views.BudgetListCreateView.as_view(),
        name='budget-list'
    ),

    path(
        'budgets/<int:pk>/',
        views.BudgetDetailView.as_view(),
        name='budget-detail'
    ),


    # ========================================================
    # BUDGET UTILIZATION
    # ========================================================

    path(
        'budget-utilization/',
        views.BudgetUtilizationView.as_view(),
        name='budget-utilization'
    ),


    # ========================================================
    # TRANSACTION DASHBOARD
    # ========================================================

    path(
        'transaction-dashboard/',
        views.TransactionDashboardView.as_view(),
        name='transaction-dashboard'
    ),


    # ========================================================
    # ANALYTICS
    # ========================================================

    path(
        'analytics/',
        views.AnalyticsView.as_view(),
        name='analytics'
    ),


    # ========================================================
    # SAVINGS GOALS
    # ========================================================

    path(
        'savings-goals/',
        views.SavingsGoalListCreateView.as_view(),
        name='savings-goal-list'
    ),

    path(
        'savings-goals/<int:pk>/',
        views.SavingsGoalDetailView.as_view(),
        name='savings-goal-detail'
    ),

    path(
        'savings-goals/<int:pk>/progress/',
        views.SavingsGoalProgressView.as_view(),
        name='savings-goal-progress'
    ),

    path(
        'savings-goals/<int:pk>/completion/',
        views.SavingsGoalCompletionView.as_view(),
        name='savings-goal-completion'
    ),


    # ========================================================
    # NOTIFICATIONS
    # ========================================================

    path(
        'notifications/',
        views.NotificationListCreateView.as_view(),
        name='notification-list'
    ),

    path(
        'notifications/unread/',
        views.UnreadNotificationView.as_view(),
        name='notification-unread'
    ),

    path(
        'notifications/<int:pk>/read/',
        views.NotificationReadView.as_view(),
        name='notification-read'
    ),


    # ========================================================
    # MONTHLY REPORT
    # ========================================================

    path(
        'reports/monthly/',
        views.MonthlyReportView.as_view(),
        name='monthly-report'
    ),
    path(
        'reports/monthly/pdf/',
        MonthlyReportPDFView.as_view(),
        name='monthly-report-pdf'
    ),
    path(
    'reports/monthly/excel/',
    views.MonthlyReportExcelView.as_view(),
    name='monthly-report-excel'
),
]