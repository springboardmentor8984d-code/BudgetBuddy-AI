import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const formData = new URLSearchParams();

      formData.append("username", email);
      formData.append("password", password);

      const response = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.access_token);
        setMessage("Login successful! 🎉");

        navigate("/dashboard");
      } else {
        setMessage(data.detail || "Invalid email or password.");
      }
    } catch (error) {
      setMessage("Could not connect to the backend.");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>💰 BudgetBuddy</h1>
        <p className="subtitle">Manage your money smarter.</p>

        <h2>Welcome Back!</h2>

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit">Login</button>
        </form>

        {message && <p>{message}</p>}

        <p>
          Don't have an account?{" "}
          <a href="/register">Create one</a>
        </p>
      </div>
    </div>
  );
}

export default Login;