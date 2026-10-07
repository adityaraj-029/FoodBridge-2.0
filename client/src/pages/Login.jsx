import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../services/api';
import { useAuth } from '../context/useAuth';

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userCredential = await login(email.trim(), password);
      const response = await loginUser({
        firebaseUID: userCredential.user.uid,
      });

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userInfo', JSON.stringify(response.data.user));

      const role = response.data.user.role;
      navigate(
        role === 'donor'
          ? '/donor-dashboard'
          : role === 'ngo'
          ? '/ngo-dashboard'
          : role === 'volunteer'
          ? '/volunteer-dashboard'
          : '/admin'
      );
    } catch (loginError) {
      setError(
        loginError.response?.data?.message ||
          loginError.message ||
          'Login failed.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-md"
      >
        <h1 className="mb-2 text-2xl font-bold text-green-700">
          Login - FoodBridge
        </h1>
        <p className="mb-6 text-sm text-gray-500">
          Login with your email and password.
        </p>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          className="mb-4 w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          className="mb-2 w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
        />

        <div className="mb-5 text-right">
          <Link
            to="/forgot-password"
            className="text-sm font-semibold text-green-700 hover:text-green-800"
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-green-700 py-3 font-semibold text-white hover:bg-green-800 disabled:bg-green-300"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>

        <p className="mt-6 text-center text-sm text-gray-500">
          Do not have an account?{' '}
          <Link to="/signup" className="font-semibold text-green-700">
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}

export default Login;
