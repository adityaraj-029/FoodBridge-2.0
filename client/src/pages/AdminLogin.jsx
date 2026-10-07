import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../services/api';
import { useAuth } from '../context/useAuth';

function AdminLogin() {
  const navigate = useNavigate();
  const { login, logout } = useAuth();
  const [email, setEmail] = useState('rajadityaraj005@gmail.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (email.trim().toLowerCase() !== 'rajadityaraj005@gmail.com') {
        setError('Only the configured admin account can use this page.');
        setLoading(false);
        return;
      }

      const userCredential = await login(email.trim(), password);
      const response = await loginUser({ firebaseUID: userCredential.user.uid });

      if (response.data.user.role !== 'admin') {
        setError('This account does not have admin access.');
        await logout();
        return;
      }

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userInfo', JSON.stringify(response.data.user));
      navigate('/admin');
    } catch (loginError) {
      setError(
        loginError.response?.data?.message ||
          loginError.message ||
          'Admin login failed.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl"
      >
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 text-2xl">
            🛡️
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Login</h1>
          <p className="mt-2 text-sm text-gray-500">
            Access NGO verification and platform overview.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <label className="mb-1 block text-sm font-medium text-gray-700">Admin email</label>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="rajadityaraj005@gmail.com"
          readOnly
          required
          className="mb-4 w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
        />

        <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter admin password"
          required
          className="mb-5 w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-green-700 py-3 font-semibold text-white hover:bg-green-800 disabled:bg-green-300"
        >
          {loading ? 'Checking admin access...' : 'Login as Admin'}
        </button>

        <p className="mt-6 text-center text-sm text-gray-500">
          <Link to="/login" className="font-semibold text-green-700 hover:text-green-800">
            Back to normal login
          </Link>
        </p>
      </form>
    </div>
  );
}

export default AdminLogin;
