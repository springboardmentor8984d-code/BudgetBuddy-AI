import React, { useEffect, useState } from "react";
import api from "../api";

export default function Budgets() {
  const [items, setItems] = useState([]);

  const [f, setF] = useState({
    month: new Date().toISOString().slice(0, 7),
    category: "Food",
    limit_amount: "",
  });

  // Load budgets from backend
  async function load() {
    try {
      const response = await api.get("/budgets");
      setItems(response.data);
    } catch (error) {
      console.error("Failed to load budgets:", error);
    }
  }

  // Load budgets when page opens
  useEffect(() => {
    load();
  }, []);

  // Create budget
  async function add(e) {
    e.preventDefault();

    try {
      await api.post("/budgets", {
        ...f,
        limit_amount: Number(f.limit_amount),
      });

      // Reload budget list
      await load();
    } catch (error) {
      console.error("Failed to create budget:", error);
    }
  }

  return (
    <>
      <h1>Budget Planning</h1>

      <div className="card">
        <form className="form" onSubmit={add}>
          <input
            type="month"
            value={f.month}
            onChange={(e) =>
              setF({
                ...f,
                month: e.target.value,
              })
            }
          />

          <input
            placeholder="Category"
            value={f.category}
            onChange={(e) =>
              setF({
                ...f,
                category: e.target.value,
              })
            }
          />

          <input
            type="number"
            placeholder="Budget limit"
            value={f.limit_amount}
            onChange={(e) =>
              setF({
                ...f,
                limit_amount: e.target.value,
              })
            }
          />

          <button className="primary" type="submit">
            Create Budget
          </button>
        </form>
      </div>

      <div className="grid">
        {items.map((x) => {
          const percentage =
            x.limit_amount > 0
              ? Math.min(
                  100,
                  (x.spent / x.limit_amount) * 100
                )
              : 0;

          return (
            <div className="card" key={x.id}>
              <h3>
                {x.category} — {x.month}
              </h3>

              <p>Limit: ₹{x.limit_amount}</p>

              <p>Spent: ₹{x.spent}</p>

              <div className="progress">
                <div
                  style={{
                    width: `${percentage}%`,
                  }}
                />
              </div>

              <p>Remaining: ₹{x.remaining}</p>
            </div>
          );
        })}
      </div>
    </>
  );
}
