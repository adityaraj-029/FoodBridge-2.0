import { getUserInfo } from '../context/useUserInfo';
import DashboardLayout from '../components/DashboardLayout';

const navItems = [
  { path: '/donor-dashboard', label: 'List Food', icon: '📝' },
  { path: '/my-donations', label: 'Your Donations', icon: '📦' },
  { path: '/donor-profile', label: 'Profile', icon: '👤' },
  { path: '/donor-certificates', label: 'Certificates', icon: '🏆' },
];

function DonorProfile() {
  const userInfo = getUserInfo();

  return (
    <DashboardLayout navItems={navItems}>
      <h1 className="text-3xl font-extrabold text-gray-900 mb-1">Your Profile</h1>
      <p className="text-gray-500 mb-8">Manage your account information.</p>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-lg">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center text-3xl font-bold text-white">
            {userInfo?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{userInfo?.name}</div>
            <div className="text-gray-500 capitalize">{userInfo?.role} Account</div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Email</div>
            <div className="text-gray-900 font-medium">{userInfo?.email}</div>
          </div>
          <div className="border-t border-gray-100 pt-4">
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Role</div>
            <div className="text-gray-900 font-medium capitalize">{userInfo?.role}</div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default DonorProfile;