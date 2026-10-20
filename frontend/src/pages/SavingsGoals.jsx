import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
function SavingsGoals() {
  const navigate = useNavigate();

  const [goals, setGoals] = useState([]);
  const [goalName, setGoalName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [editingId, setEditingId] = useState(null);

  const token = localStorage.getItem("token");

  const loadGoals = () => {
    fetch(`${API}/savings-goals/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load goals");
        return res.json();
      })
      .then((data) => setGoals(data))
      .catch(() => alert("Failed to load savings goals"));
  };

  useEffect(() => {
    loadGoals();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    const url = editingId
      ? `${API}/savings-goals/${editingId}`
      : `${API}/savings-goals/`;

    fetch(url, {
      method: editingId ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        goal_name: goalName,
        target_amount: Number(targetAmount),
        current_amount: Number(currentAmount || 0),
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to save goal");
        return res.json();
      })
      .then(() => {
        setGoalName("");
        setTargetAmount("");
        setCurrentAmount("");
        setEditingId(null);
        loadGoals();
      })
      .catch(() => alert("Failed to save savings goal"));
  };

  const editGoal = (goal) => {
    setEditingId(goal.goal_id);
    setGoalName(goal.goal_name);
    setTargetAmount(goal.target_amount);
    setCurrentAmount(goal.current_amount);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setGoalName("");
    setTargetAmount("");
    setCurrentAmount("");
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
          maxWidth: "700px",
          margin: "auto",
          background: "white",
          padding: "30px",
          borderRadius: "18px",
          boxShadow: "0 5px 20px rgba(0,0,0,0.08)",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            color: "#238b57",
            marginTop: 0,
          }}
        >
          🎯 Savings Goals
        </h1>

        {/* FORM */}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Goal name"
            value={goalName}
            onChange={(e) => setGoalName(e.target.value)}
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

          <input
            type="number"
            placeholder="Target amount"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            min="1"
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

          <input
            type="number"
            placeholder="Current saved amount"
            value={currentAmount}
            onChange={(e) => setCurrentAmount(e.target.value)}
            min="0"
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
              background: "#238b57",
              color: "white",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            {editingId ? "Update Goal" : "Create Goal"}
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

        {/* GOALS */}
        <h2
          style={{
            textAlign: "center",
            marginTop: "30px",
          }}
        >
          My Goals
        </h2>

        {goals.length === 0 ? (
          <p
            style={{
              textAlign: "center",
              color: "#777",
            }}
          >
            No savings goals yet.
          </p>
        ) : (
          goals.map((goal) => (
            <div
              key={goal.goal_id}
              style={{
                padding: "18px",
                marginBottom: "15px",
                borderRadius: "12px",
                background: "#f7fbf8",
                border: "1px solid #dceee2",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <strong style={{ fontSize: "18px" }}>
                  {goal.goal_name}
                </strong>

                <span
                  style={{
                    color:
                      goal.status === "Completed"
                        ? "#238b57"
                        : "#777",
                    fontWeight: "bold",
                  }}
                >
                  {goal.status}
                </span>
              </div>

              <p>
                ₹{goal.current_amount} / ₹{goal.target_amount}
              </p>

              {/* PROGRESS BAR */}
              <div
                style={{
                  width: "100%",
                  height: "12px",
                  background: "#e5e5e5",
                  borderRadius: "10px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${Math.min(goal.progress, 100)}%`,
                    height: "100%",
                    background: "#238b57",
                  }}
                />
              </div>

              <p
                style={{
                  color: "#555",
                  marginBottom: "12px",
                }}
              >
                {goal.progress}% completed
              </p>

              <button
                onClick={() => editGoal(goal)}
                style={{
                  padding: "8px 14px",
                  border: "none",
                  borderRadius: "7px",
                  background: "#238b57",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                Update
              </button>
            </div>
          ))
        )}

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

export default SavingsGoals;