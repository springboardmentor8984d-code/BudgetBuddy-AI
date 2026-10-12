import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

function Login() {
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async () => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/login/`,
        {
          username: username,
          password: password,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      const data = response.data
      console.log('Login response:', data)

      alert('Login successful! 🎉')

     localStorage.setItem('access_token', data.access)
     localStorage.setItem('username', data.username || username.trim())
     localStorage.setItem('email', data.email || '')
     localStorage.setItem('refresh_token', data.refresh)

      navigate('/dashboard')
    } catch (error) {
      console.error(error)

      if (error.response) {
        alert(JSON.stringify(error.response.data))
      } else {
        alert('Error connecting to backend!')
      }
    }
  }

  return (
    <div className="page">
      <h1>Login</h1>

      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button
        className="submit-btn"
        onClick={handleLogin}
      >
        Login
      </button>
            <p>
        Don't have an account?{' '}
        <button onClick={() => navigate('/register')}>
          Register
        </button>
      </p>
    </div>
  )
}

export default Login