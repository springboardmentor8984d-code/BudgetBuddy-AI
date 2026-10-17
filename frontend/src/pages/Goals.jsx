import React, { useEffect, useState } from "react";
import api from "../api";

export default function Goals() {
  const [items, setItems] = useState([]);

  const [f, setF] = useState({
    name: "",
    target_amount: "",
    current_amount: "0",
    deadline: "",
  });

  // Load goals from backend
  async function load() {
    try {
      const response = await api.get("/goals");
      setItems(response.data);
    } catch (error) {
      console.error("Failed to load goals:", error);
    }
  }

  // Run load when page opens
  useEffect(() => {
    load();
  }, []);

  // Create a new goal
  async function add(e) {
    e.preventDefault();

    try {
      await api.post("/goals", {
        ...f,
        target_amount: Number(f.target_amount),
        current_amount: Number(f.current_amount),
        deadline: f.deadline || null,
      });

      // Clear form
      setF({
        name: "",
        target_amount: "",
        current_amount: "0",
        deadline: "",
      });

      // Reload goals
      await load();
    } catch (error) {
      console.error("Failed to create goal:", error);
    }
  }

  return (
    <>
      <h1>Savings Goals</h1>

      <div className="card">
        <form className="form" onSubmit={add}>
          <input
            placeholder="Goal name (New Laptop Fund)"
            value={f.name}
            onChange={(e) =>
              setF({ ...f, name: e.target.value })
            }
          />

          <input
            type="number"
            placeholder="Target amount"
            value={f.target_amount}
            onChange={(e) =>
              setF({ ...f, target_amount: e.target.value })
            }
          />

          <input
            type="number"
            placeholder="Current amount"
            value={f.current_amount}
            onChange={(e) =>
              setF({ ...f, current_amount: e.target.value })
            }
          />

          <input
            type="date"
            value={f.deadline}
            onChange={(e) =>
              setF({ ...f, deadline: e.target.value })
            }
          />

          <button className="primary" type="submit">
            Create Goal
          </button>
        </form>
      </div>

      <div className="grid">
        {items.map((x) => (
          <div className="card" key={x.id}>
            <h3>{x.name}</h3>

            <p>
              ₹{x.current_amount} / ₹{x.target_amount}
            </p>

            <div className="progress">
              <div
                style={{
                  width: `${x.progress}%`,
                }}
              />
            </div>

            <p>
              {x.progress}% complete{" "}
              {x.completed ? "✓" : ""}
            </p>
          </div>
        ))}
      </div>
    </>
  );
}
