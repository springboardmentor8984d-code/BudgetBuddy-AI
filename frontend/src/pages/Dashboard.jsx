import React, { useEffect, useState } from "react";
import { PieChart, Pie, Tooltip, ResponsiveContainer } from "recharts";
import api from "../api";

export default function Dashboard() {
  const [s, setS] = useState({});
  const [data, setData] = useState([]);

  async function loadDashboard() {
    try {
      const [summaryResponse, categoriesResponse] = await Promise.all([
        api.get("/analytics/summary"),
        api.get("/analytics/categories"),
      ]);

      console.log("Dashboard Summary:", summaryResponse.data);
      console.log("Category Data:", categoriesResponse.data);

      setS(summaryResponse.data);
      setData(categoriesResponse.data);
    } catch (error) {
      console.error("Failed to load dashboard:", error);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  return (
    <>
      <h1>Financial Dashboard</h1>

      <div className="grid">
        {[
          ["Total Income", s.total_income],
          ["Total Expenses", s.total_expense],
          ["Balance", s.balance],
          ["Goal Amount Remaining", s.remaining_goal_amount],
        ].map(([k, v]) => (
          <div className="card" key={k}>
            <div className="muted">{k}</div>

            <div className="stat">
              ₹{Number(v || 0).toFixed(2)}
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h2>Category-wise Spending</h2>

        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={data}
                dataKey="amount"
                nameKey="category"
                outerRadius={110}
                label
              />

              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="muted">
            No expense data available yet.
          </p>
        )}
      </div>
    </>
  );
}
