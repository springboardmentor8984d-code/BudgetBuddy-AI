
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine

from models.user import User
from models.profile import Profile
from models.income import Income
from models.expense import Expense
from models.budget import Budget
from models.savings_goal import SavingsGoal
from models.notification import Notification
from models.report import Report

from routes.auth_routes import router as auth_router
from routes.user_routes import router as user_router
from routes.profile_routes import router as profile_router
from routes.income_routes import router as income_router
from routes.expense_routes import router as expense_router
from routes.budget_routes import router as budget_router
from routes.savings_goal_routes import router as savings_goal_router
from routes.notification_routes import router as notification_router
from routes.report_routes import router as report_router
from routes.dashboard_routes import router as dashboard_router


app = FastAPI(title="BudgetBuddy API")


# CORS configuration
FRONTEND_URL = "https://budget-buddy-sepia-eta.vercel.app"

allowed_origins = [
    "http://localhost:5173",
    FRONTEND_URL,
]

# Also allow the configured frontend URL from Render, if provided.
render_frontend_url = os.getenv("FRONTEND_URL", "").rstrip("/")
if render_frontend_url and render_frontend_url not in allowed_origins:
    allowed_origins.append(render_frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Register API routes
app.include_router(user_router)
app.include_router(profile_router)
app.include_router(income_router)
app.include_router(expense_router)
app.include_router(budget_router)
app.include_router(dashboard_router)
app.include_router(savings_goal_router)
app.include_router(notification_router)
app.include_router(report_router)
app.include_router(auth_router)


# Create database tables
Base.metadata.create_all(bind=engine)


@app.get("/")
def home():
    return {"message": "Welcome to BudgetBuddy API!"}
