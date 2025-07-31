import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('owner')
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const handleRegister = async () => {
    setError(null)
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setError(error.message)
    } else {
      console.log('Signed up:', data)
      const userId = data.user.id
      // Insert into user_profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email,
          role // owner or staff
        })
      if (profileError) {
        setError(profileError.message)
      } else {
        console.log('Profile created!')
        navigate('/login')
      }
    }
  }

  return (
    <div>
      <h2>Register</h2>
      <select value={role} onChange={e => setRole(e.target.value)}>
        <option value="owner">Admin</option>
        <option value="staff">Staff</option>
      </select><br/>
      <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} /><br/>
      <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} /><br/>
      <button onClick={handleRegister}>Register</button>
      <button onClick={() => navigate('/login')}>Back to Login</button>
      {error && <p style={{color:'red'}}>{error}</p>}
    </div>
  )
}