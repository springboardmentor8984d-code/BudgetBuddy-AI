import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

function Budget() {
  const navigate = useNavigate();

  const [budgets, setBudgets] = useState([]);
  const [category, setCategory] = useState("Food");
  const [amount, setAmount] = useState("");
  const [startDate, setStartDate] = useState("2026-09-01T00:00:00");
  const [endDate, setEndDate] = useState("2026-09-30T23:59:59");
  const [editingId, setEditingId] = useState(null);

  const token = localStorage.getItem("token");

  const loadBudgets = () => {
    fetch(`${API}/budgets/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setBudgets(data));
  };

  useEffect(() => {
    loadBudgets();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    const url = editingId
      ? `${API}/budgets/${editingId}`
      : `${API}/budgets/`;

    fetch(url, {
      method: editingId ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        category: category,
        amount_limit: Number(amount),
        start_date: startDate,
        end_date: endDate,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Invalid budget");
        return res.json();
      })
      .then(() => {
        setAmount("");
        setCategory("Food");
        setStartDate("2026-09-01T00:00:00");
        setEndDate("2026-09-30T23:59:59");
        setEditingId(null);
        loadBudgets();
      })
      .catch(() => alert("Failed to save budget"));
  };

  const editBudget = (item) => {
    setEditingId(item.budget_id);
    setAmount(item.amount_limit);
    setCategory(item.category);
    setStartDate(item.start_date);
    setEndDate(item.end_date);
  };

  const deleteBudget = (id) => {
    if (!window.confirm("Delete this budget?")) {
      return;
    }

    fetch(`${API}/budgets/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Delete failed");
        loadBudgets();
      })
      .catch(() => alert("Failed to delete budget"));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setAmount("");
    setCategory("Food");
    setStartDate("2026-09-01T00:00:00");
    setEndDate("2026-09-30T23:59:59");
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
            color: "#1769aa",
            marginTop: 0,
            marginBottom: "25px",
          }}
        >
          📊 Budgets
        </h1>

        {/* FORM */}
        <form onSubmit={handleSubmit}>

          <input
            type="number"
            placeholder="Budget Amount"
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
            type="datetime-local"
            value={startDate.slice(0, 16)}
            onChange={(e) => setStartDate(e.target.value + ":00")}
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

          <input
            type="datetime-local"
            value={endDate.slice(0, 16)}
            onChange={(e) => setEndDate(e.target.value + ":00")}
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
              background: "#1769aa",
              color: "white",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            {editingId ? "Update Budget" : "Add Budget"}
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

        {/* BUDGET HISTORY */}
        <h2
          style={{
            textAlign: "center",
            marginTop: "30px",
            marginBottom: "15px",
          }}
        >
          My Budgets
        </h2>

        <div
          style={{
            maxHeight: "280px",
            overflowY: "auto",
            paddingRight: "5px",
          }}
        >
          {budgets.length === 0 ? (
            <p
              style={{
                textAlign: "center",
                color: "#777",
              }}
            >
              No budgets added yet.
            </p>
          ) : (
            budgets.map((item) => (
              <div
                key={item.budget_id}
                style={{
                  padding: "15px",
                  marginBottom: "10px",
                  borderRadius: "10px",
                  background: "#f5f9ff",
                  border: "1px solid #d5e4f3",
                }}
              >
                {/* TOP ROW */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <strong
                      style={{
                        fontSize: "17px",
                        color: "#1769aa",
                      }}
                    >
                      {item.category}
                    </strong>

                    <div
                      style={{
                        marginTop: "4px",
                        color: "#555",
                        fontSize: "14px",
                      }}
                    >
                      Budget limit: ₹{item.amount_limit}
                    </div>
                  </div>

                  <div>
                    <button
                      onClick={() => editBudget(item)}
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
                      onClick={() => deleteBudget(item.budget_id)}
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

                {/* DATES */}
                <div
                  style={{
                    marginTop: "10px",
                    fontSize: "13px",
                    color: "#777",
                  }}
                >
                  {item.start_date.slice(0, 10)} →{" "}
                  {item.end_date.slice(0, 10)}
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

export default Budget;