import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function Register() {
  const navigate = useNavigate()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleRegister = async (event) => {
    event.preventDefault()

    if (password !== confirmPassword) {
      alert('Passwords do not match.')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          username: username.trim(),
          email: email.trim(),
          password,
        }),
      })

      const data = await response.json().catch(() => ({}))

      if (response.ok) {
        alert('Registration successful! 🎉')
        setFirstName('')
        setLastName('')
        setUsername('')
        setEmail('')
        setPassword('')
        setConfirmPassword('')
        navigate('/login')
      } else {
        alert(JSON.stringify(data))
      }
    } catch (error) {
      alert('Error connecting to backend!')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card register-card" onSubmit={handleRegister}>
        <h1>Create Account</h1>
        <p className="auth-subtitle">Start managing your finances</p>

        <div className="register-name-row">
          <label>
            First name
            <input
              type="text"
              placeholder="John"
              autoComplete="given-name"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              required
            />
          </label>
          <label>
            Last name
            <input
              type="text"
              placeholder="Doe"
              autoComplete="family-name"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              required
            />
          </label>
        </div>

        <label>
          Username
          <input
            type="text"
            placeholder="johndoe"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />
        </label>

        <label>
          Email
          <input
            type="email"
            placeholder="john@example.com"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            placeholder="Min 8 characters"
            autoComplete="new-password"
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        <label>
          Confirm password
          <input
            type="password"
            placeholder="Repeat password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />
        </label>

        <button className="auth-submit-btn" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </button>

        <p className="auth-switch">
          Already have an account?{' '}
          <button type="button" onClick={() => navigate('/login')}>
            Sign in
          </button>
        </p>
      </form>
    </div>
  )
}

export default Register
