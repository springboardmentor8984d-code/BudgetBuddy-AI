
import React, { useEffect, useState } from "react";
import api from "../api";

export default function Income() {
  const [items, setItems] = useState([]);

  const [f, setF] = useState({
    source: "",
    amount: "",
    income_date: new Date().toISOString().slice(0, 10),
    notes: "",
  });

  async function load() {
    try {
      const response = await api.get("/incomes");
      setItems(response.data);
    } catch (error) {
      console.error("Failed to load income:", error);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function add(e) {
    e.preventDefault();

    try {
      await api.post("/incomes", {
        ...f,
        amount: Number(f.amount),
      });

      setF({
        ...f,
        source: "",
        amount: "",
        notes: "",
      });

      await load();
    } catch (error) {
      console.error("Failed to add income:", error);
    }
  }

  return (
    <>
      <h1>Income Management</h1>

      <div className="card">
        <form className="form" onSubmit={add}>
          <input
            placeholder="Source (Pocket Money, Scholarship, Freelance)"
            value={f.source}
            onChange={(e) =>
              setF({ ...f, source: e.target.value })
            }
          />

          <input
            type="number"
            placeholder="Amount"
            value={f.amount}
            onChange={(e) =>
              setF({ ...f, amount: e.target.value })
            }
          />

          <input
            type="date"
            value={f.income_date}
            onChange={(e) =>
              setF({ ...f, income_date: e.target.value })
            }
          />

          <input
            placeholder="Notes"
            value={f.notes}
            onChange={(e) =>
              setF({ ...f, notes: e.target.value })
            }
          />

          <button className="primary" type="submit">
            Add Income
          </button>
        </form>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Source</th>
              <th>Amount</th>
            </tr>
          </thead>

          <tbody>
            {items.map((x) => (
              <tr key={x.id}>
                <td>{x.income_date}</td>
                <td>{x.source}</td>
                <td>₹{x.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
