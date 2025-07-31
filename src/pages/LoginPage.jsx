import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('owner') // default
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const handleLogin = async () => {
    setError(null)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      console.error('Login error:', error);
      setError(error.message)
    } else {
      console.log('Logged in:', data)
      // Later: fetch profile & route based on role
    }
  }

  return (
    <div>
      <h2>Login</h2>
      <select value={role} onChange={e => setRole(e.target.value)}>
        <option value="owner">Admin</option>
        <option value="staff">Staff</option>
      </select><br/>
      <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} /><br/>
      <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} /><br/>
      <button onClick={handleLogin}>Login</button>
      <button onClick={() => navigate('/register')}>Register</button>
      {error && <p style={{color:'red'}}>{error}</p>}
    </div>
  )
}