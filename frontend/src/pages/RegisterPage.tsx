import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PlaySquare, UserPlus, Lock, User, ShieldCheck } from 'lucide-react';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('EDITOR');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setSuccess('Account created successfully! Redirecting...');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Server error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-16">
      <div className="glass-card rounded-3xl p-8 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-600/10 rounded-full blur-2xl"></div>

        <div className="flex items-center gap-2 justify-center mb-6">
          <PlaySquare className="text-saffron w-8 h-8" />
          <h3 className="text-xl font-bold">PIB-TV Register Access</h3>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-950/40 border border-red-500/30 text-red-300 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-lg bg-green-950/40 border border-green-500/30 text-green-300 text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1.5 font-bold">Username</label>
            <div className="relative">
              <User className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
              <input 
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose username"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-purple-500 transition-colors placeholder:text-gray-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1.5 font-bold">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
              <input 
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Choose password"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-purple-500 transition-colors placeholder:text-gray-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1.5 font-bold">Access Role</label>
            <div className="relative">
              <ShieldCheck className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
              <select 
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-purple-500 transition-colors appearance-none"
              >
                <option value="EDITOR" className="bg-govNavy text-white">Editor (Compile Videos)</option>
                <option value="REVIEWER" className="bg-govNavy text-white">Reviewer (Audit Videos)</option>
                <option value="ADMIN" className="bg-govNavy text-white">Administrator (Full Control)</option>
              </select>
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white font-bold transition-all flex items-center justify-center gap-2 mt-6"
          >
            <UserPlus className="w-5 h-5" />
            <span>{loading ? 'Registering...' : 'Request Access'}</span>
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-6">
          Already have an account? <Link to="/login" className="text-purple-400 hover:underline">Log In</Link>
        </p>
      </div>
    </div>
  );
}
