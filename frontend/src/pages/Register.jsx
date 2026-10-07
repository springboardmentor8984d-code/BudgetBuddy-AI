import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function Register() {
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleRegister = async () => {
    console.log('VITE_API_URL:', import.meta.env.VITE_API_URL)

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          email: email,
          password: password,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        alert('Registration successful! 🎉')

        setUsername('')
        setEmail('')
        setPassword('')

        navigate('/login')
      } else {
        alert(JSON.stringify(data))
      }
    } catch (error) {
      alert('Error connecting to backend!')
      console.error(error)
    }
  }

  return (
    <div className="page">
      <h1>Create Account</h1>

      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button className="submit-btn" onClick={handleRegister}>
        Register
      </button>
    </div>
  )
}

export default Register