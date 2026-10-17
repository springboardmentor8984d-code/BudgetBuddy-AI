from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import Base, engine
from .routers import auth, users, incomes, expenses, budgets, goals, notifications, analytics, reports

Base.metadata.create_all(bind=engine)

app = FastAPI(title="BudgetBuddy API", version="1.0.0")

origins = [x.strip() for x in settings.CORS_ORIGINS.split(",") if x.strip()]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True,
                   allow_methods=["*"], allow_headers=["*"])

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(incomes.router, prefix="/api/incomes", tags=["Income"])
app.include_router(expenses.router, prefix="/api/expenses", tags=["Expenses"])
app.include_router(budgets.router, prefix="/api/budgets", tags=["Budgets"])
app.include_router(goals.router, prefix="/api/goals", tags=["Savings Goals"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])

@app.get("/")
def root():
    return {"message": "BudgetBuddy API is running", "docs": "/docs"}

@app.get("/api/health")
def health():
    return {"status": "ok"}
