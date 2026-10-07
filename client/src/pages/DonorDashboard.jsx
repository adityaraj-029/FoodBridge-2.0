import { Link } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';

const navItems = [
  { path: '/donor-dashboard', label: 'List Food', icon: '📝' },
  { path: '/my-donations', label: 'Your Donations', icon: '📦' },
  { path: '/donor-profile', label: 'Profile', icon: '👤' },
  { path: '/donor-certificates', label: 'Certificates', icon: '🏆' },
];

function DonorDashboard() {
  return (
    <DashboardLayout navItems={navItems}>
      <div className="max-w-2xl">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-1">Got surplus food?</h1>
        <p className="text-gray-500 mb-8">
          List it in a few minutes and we'll match it with a verified NGO nearby.
        </p>

        <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-3xl p-10 text-white relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <h2 className="text-2xl font-bold mb-2 relative">Ready to donate?</h2>
          <p className="text-green-100 mb-6 relative">
            Tell us what you have, and we'll take care of the rest — matching,
            pickup, and delivery tracking.
          </p>
          <Link
            to="/create-donation"
            className="inline-block bg-white text-green-800 px-6 py-3 rounded-full font-bold hover:bg-green-50 transition relative"
          >
            + List Food Donation
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-8">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 text-center">
            <div className="text-2xl mb-2">🎯</div>
            <div className="text-sm font-semibold text-gray-900">AI Matched</div>
            <div className="text-xs text-gray-500 mt-1">Nearest NGO instantly</div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 text-center">
            <div className="text-2xl mb-2">✅</div>
            <div className="text-sm font-semibold text-gray-900">QR Verified</div>
            <div className="text-xs text-gray-500 mt-1">Secure pickup</div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 text-center">
            <div className="text-2xl mb-2">🚴</div>
            <div className="text-sm font-semibold text-gray-900">Live Tracked</div>
            <div className="text-xs text-gray-500 mt-1">Just like food delivery</div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default DonorDashboard;