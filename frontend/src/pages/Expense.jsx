import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

function Expense() {
  const navigate = useNavigate();

  const [expenses, setExpenses] = useState([]);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState(null);

  const token = localStorage.getItem("token");

  const loadExpenses = () => {
    fetch(`${API}/expenses/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setExpenses(data));
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    const url = editingId
  ? `${API}/expenses/${editingId}`
  : `${API}/expenses/`;
    fetch(url, {
      method: editingId ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        amount: Number(amount),
        category: category,
        description: description,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Invalid expense");
        return res.json();
      })
      .then(() => {
        setAmount("");
        setCategory("Food");
        setDescription("");
        setEditingId(null);
        loadExpenses();
      })
      .catch(() => alert("Failed to save expense"));
  };

  const editExpense = (item) => {
    setEditingId(item.expense_id);
    setAmount(item.amount);
    setCategory(item.category);
    setDescription(item.description || "");
  };

  const deleteExpense = (id) => {
    if (!window.confirm("Delete this expense?")) {
      return;
    }

    fetch(`${API}/expenses/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Delete failed");
        loadExpenses();
      })
      .catch(() => alert("Failed to delete expense"));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setAmount("");
    setCategory("Food");
    setDescription("");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f4f7f5",
        padding: "30px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "650px",
          margin: "auto",
          background: "white",
          padding: "30px",
          borderRadius: "18px",
          boxShadow: "0 5px 20px rgba(0,0,0,0.08)",
        }}
      >

        {/* HEADER */}
        <h1
          style={{
            textAlign: "center",
            color: "#dc3545",
            marginTop: 0,
            marginBottom: "25px",
          }}
        >
          💸 Expenses
        </h1>

        {/* FORM */}
        <form onSubmit={handleSubmit}>

          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "14px",
              marginBottom: "12px",
              border: "1px solid #ddd",
              borderRadius: "10px",
              fontSize: "16px",
            }}
          />

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "14px",
              marginBottom: "12px",
              border: "1px solid #ddd",
              borderRadius: "10px",
              fontSize: "16px",
              background: "white",
            }}
          >
            <option>Food</option>
            <option>Travel</option>
            <option>Shopping</option>
            <option>Education</option>
            <option>Entertainment</option>
            <option>Miscellaneous</option>
          </select>

          <input
            type="text"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "14px",
              marginBottom: "15px",
              border: "1px solid #ddd",
              borderRadius: "10px",
              fontSize: "16px",
            }}
          />

          <button
            type="submit"
            style={{
              width: "100%",
              padding: "13px",
              border: "none",
              borderRadius: "10px",
              background: "#dc3545",
              color: "white",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            {editingId ? "Update Expense" : "Add Expense"}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              style={{
                width: "100%",
                padding: "11px",
                marginTop: "8px",
                border: "1px solid #aaa",
                borderRadius: "10px",
                background: "white",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          )}
        </form>

        {/* HISTORY */}
        <h2
          style={{
            textAlign: "center",
            marginTop: "30px",
            marginBottom: "15px",
          }}
        >
          Expense History
        </h2>

        <div
          style={{
            maxHeight: "280px",
            overflowY: "auto",
            paddingRight: "5px",
          }}
        >
          {expenses.length === 0 ? (
            <p
              style={{
                textAlign: "center",
                color: "#777",
              }}
            >
              No expenses added yet.
            </p>
          ) : (
            expenses.map((item) => (
              <div
                key={item.expense_id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "14px",
                  marginBottom: "10px",
                  borderRadius: "10px",
                  background: "#fff7f7",
                  border: "1px solid #f3d5d5",
                }}
              >

                {/* EXPENSE DETAILS */}
                <div>
                  <strong
                    style={{
                      fontSize: "17px",
                      color: "#dc3545",
                    }}
                  >
                    ₹{item.amount}
                  </strong>

                  <div
                    style={{
                      marginTop: "4px",
                      color: "#555",
                      fontSize: "14px",
                    }}
                  >
                    {item.category}
                  </div>

                  {item.description && (
                    <div
                      style={{
                        marginTop: "3px",
                        color: "#888",
                        fontSize: "13px",
                      }}
                    >
                      {item.description}
                    </div>
                  )}
                </div>

                {/* ACTIONS */}
                <div>
                  <button
                    onClick={() => editExpense(item)}
                    style={{
                      padding: "8px 12px",
                      marginRight: "6px",
                      border: "none",
                      borderRadius: "7px",
                      background: "#238b57",
                      color: "white",
                      cursor: "pointer",
                    }}
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => deleteExpense(item.expense_id)}
                    style={{
                      padding: "8px 12px",
                      border: "none",
                      borderRadius: "7px",
                      background: "#dc3545",
                      color: "white",
                      cursor: "pointer",
                    }}
                  >
                    Delete
                  </button>
                </div>

              </div>
            ))
          )}
        </div>

        {/* BACK */}
        <button
          onClick={() => navigate("/dashboard")}
          style={{
            display: "block",
            margin: "22px auto 0",
            padding: "11px 20px",
            border: "none",
            borderRadius: "9px",
            background: "#238b57",
            color: "white",
            fontSize: "15px",
            cursor: "pointer",
          }}
        >
          ← Back to Dashboard
        </button>

      </div>
    </div>
  );
}

export default Expense;