
import React, { useEffect, useState } from "react";
import api from "../api";

const cats = [
  "Food",
  "Travel",
  "Shopping",
  "Education",
  "Entertainment",
  "Miscellaneous",
];

export default function Expenses() {
  const [items, setItems] = useState([]);

  const [f, setF] = useState({
    title: "",
    amount: "",
    category: "Food",
    expense_date: new Date().toISOString().slice(0, 10),
    notes: "",
  });

  async function load() {
    try {
      const response = await api.get("/expenses");
      setItems(response.data);
    } catch (error) {
      console.error("Failed to load expenses:", error);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function add(e) {
    e.preventDefault();

    try {
      await api.post("/expenses", {
        ...f,
        amount: Number(f.amount),
      });

      setF({
        ...f,
        title: "",
        amount: "",
        notes: "",
      });

      await load();
    } catch (error) {
      console.error("Failed to add expense:", error);
    }
  }

  async function del(id) {
    try {
      await api.delete(`/expenses/${id}`);
      await load();
    } catch (error) {
      console.error("Failed to delete expense:", error);
    }
  }

  return (
    <>
      <h1>Expense Tracking</h1>

      <div className="card">
        <form className="form" onSubmit={add}>
          <input
            placeholder="Expense title"
            value={f.title}
            onChange={(e) =>
              setF({ ...f, title: e.target.value })
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

          <select
            value={f.category}
            onChange={(e) =>
              setF({ ...f, category: e.target.value })
            }
          >
            {cats.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={f.expense_date}
            onChange={(e) =>
              setF({ ...f, expense_date: e.target.value })
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
            Add Expense
          </button>
        </form>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Title</th>
              <th>Category</th>
              <th>Amount</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {items.map((x) => (
              <tr key={x.id}>
                <td>{x.expense_date}</td>
                <td>{x.title}</td>
                <td>{x.category}</td>
                <td>₹{x.amount}</td>
                <td>
                  <button onClick={() => del(x.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

