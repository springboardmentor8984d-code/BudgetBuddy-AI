# BudgetBuddy Database Schema

users
- id (PK)
- username
- email
- password_hash
- role
- monthly_income
- financial_preferences
- created_at

incomes
- id (PK)
- user_id (FK -> users.id)
- source
- amount
- income_date
- notes

expenses
- id (PK)
- user_id (FK -> users.id)
- title
- amount
- category
- expense_date
- notes

budgets
- id (PK)
- user_id (FK -> users.id)
- month
- category
- limit_amount

savings_goals
- id (PK)
- user_id (FK -> users.id)
- name
- target_amount
- current_amount
- deadline
- completed

notifications
- id (PK)
- user_id (FK -> users.id)
- message
- notification_type
- is_read
- created_at

Relationships:
users 1---* incomes
users 1---* expenses
users 1---* budgets
users 1---* savings_goals
users 1---* notifications
