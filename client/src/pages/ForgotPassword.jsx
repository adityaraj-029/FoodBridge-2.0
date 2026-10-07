import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      await resetPassword(email.trim());
      setMessage('A password reset link has been sent to your email address.');
    } catch (resetError) {
      setError(
        resetError.code === 'auth/user-not-found'
          ? 'No account was found with this email address.'
          : resetError.message || 'Could not send the reset email.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl bg-white p-8 shadow-md">
        <h1 className="mb-2 text-2xl font-bold text-green-700">Forgot password?</h1>
        <p className="mb-6 text-sm text-gray-500">
          Enter the email address linked to your FoodBridge account.
        </p>
        {message && <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{message}</div>}
        {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email address"
          required
          className="mb-4 w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-green-700 py-3 font-semibold text-white hover:bg-green-800 disabled:bg-green-300"
        >
          {loading ? 'Sending...' : 'Send reset link'}
        </button>
        <Link to="/login" className="mt-5 block text-center text-sm font-semibold text-green-700 hover:text-green-800">
          Back to login
        </Link>
      </form>
    </div>
  );
}

export default ForgotPassword;
