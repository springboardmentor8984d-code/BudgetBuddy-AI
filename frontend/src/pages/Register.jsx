
import { useState } from "react";
import API from "../api";

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleRegister = async (e) => {
    console.log("API URL:", API);
    e.preventDefault();
    setMessage("Creating account...");

    try {
      const response = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Account created successfully! 🎉");
      } else {
        setMessage(
          typeof data.detail === "string"
            ? data.detail
            : "Registration failed. Please check your details."
        );
      }
    } catch (error) {
      console.error("Registration error:", error);
      setMessage("Could not connect to the backend.");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>💰 BudgetBuddy</h1>
        <p className="subtitle">
          Start managing your money smarter.
        </p>

        <h2>Create Account</h2>

        <form onSubmit={handleRegister}>
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

          <button type="submit">Create Account</button>
        </form>

        {message && <p>{message}</p>}

        <p>
          Already have an account? <a href="/">Login</a>
        </p>
      </div>
    </div>
  );
}

export default Register;
