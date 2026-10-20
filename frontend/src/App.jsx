import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Income from "./pages/Income";
import Expense from "./pages/Expense";
import Budget from "./pages/Budget";
import SavingsGoals from "./pages/SavingsGoals";
import Notifications from "./pages/Notifications";
import Reports from "./pages/Reports";
import NotificationToast from "./NotificationToast";
import Analytics from "./pages/Analytics";

function App() {
  return (
    <BrowserRouter>
      <NotificationToast />

      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/income" element={<Income />} />
        <Route path="/expenses" element={<Expense />} />
        <Route path="/budgets" element={<Budget />} />
        <Route path="/savings-goals" element={<SavingsGoals />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/analytics" element={<Analytics />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;