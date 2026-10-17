# BudgetBuddy Project Tree

BudgetBuddy/
├── README.md
├── .gitignore
├── docs/
│   ├── PROJECT_TREE.md
│   ├── DATABASE_SCHEMA.md
│   ├── API_ENDPOINTS.md
│   └── PROJECT_WORKFLOW.md
├── backend/
│   ├── .env.example
│   ├── requirements.txt
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── security.py
│   │   └── routers/
│   │       ├── auth.py
│   │       ├── users.py
│   │       ├── incomes.py
│   │       ├── expenses.py
│   │       ├── budgets.py
│   │       ├── goals.py
│   │       ├── notifications.py
│   │       ├── analytics.py
│   │       └── reports.py
│   └── tests/
│       └── test_health.py
└── frontend/
    ├── package.json
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── api.js
        ├── styles.css
        └── pages/
            ├── Login.jsx
            ├── Register.jsx
            ├── Dashboard.jsx
            ├── Expenses.jsx
            ├── Income.jsx
            ├── Budgets.jsx
            └── Goals.jsx
