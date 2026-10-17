import csv,io
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Expense
from ..security import get_current_user

router=APIRouter()

@router.get("/expenses.csv")
def export_expenses(current=Depends(get_current_user),db:Session=Depends(get_db)):
    rows=db.query(Expense).filter(Expense.user_id==current.id).order_by(Expense.expense_date.desc()).all()
    output=io.StringIO();writer=csv.writer(output)
    writer.writerow(["Date","Title","Category","Amount","Notes"])
    for x in rows: writer.writerow([x.expense_date,x.title,x.category,x.amount,x.notes])
    output.seek(0)
    return StreamingResponse(iter([output.getvalue()]),media_type="text/csv",
        headers={"Content-Disposition":"attachment; filename=budgetbuddy_expenses.csv"})
