import { useEffect, useState } from 'react';
import api, { API_BASE_URL } from '../services/api';
import DashboardLayout from '../components/DashboardLayout';

const navItems = [
  { path: '/donor-dashboard', label: 'List Food', icon: '📝' },
  { path: '/my-donations', label: 'Your Donations', icon: '📦' },
  { path: '/donor-profile', label: 'Profile', icon: '👤' },
  { path: '/donor-certificates', label: 'Certificates', icon: '🏆' },
];

const steps = [
  { key: 'pending', label: 'Listed' },
  { key: 'accepted', label: 'Accepted by NGO' },
  { key: 'assigned', label: 'Volunteer Assigned' },
  { key: 'picked_up', label: 'Picked Up' },
  { key: 'delivered', label: 'Delivered' },
];

function statusIndex(status) {
  return steps.findIndex((s) => s.key === status);
}

function MyDonations() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchDonations = async () => {
      try {
        const res = await api.get('/donations/my-donations', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setDonations(res.data);
      } catch (error) {
        console.error('Failed to fetch donations:', error);
        setDonations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDonations();
  }, [token]);

  if (loading) {
    return (
      <DashboardLayout navItems={navItems}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500 font-medium">
              Loading your donations...
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={navItems}>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 bg-green-600 rounded-full"></span>
          <span className="text-sm font-bold text-green-700 uppercase tracking-wider">
            Donation History
          </span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
              Your Donations
            </h1>
            <p className="text-gray-500 mt-2 text-base">
              Track every donation from listing to successful delivery.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl px-5 py-3 shadow-sm">
            <p className="text-xs text-gray-400 uppercase tracking-wide">
              Total Donations
            </p>
            <p className="text-2xl font-extrabold text-green-700">
              {donations.length}
            </p>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {donations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-5 text-3xl">
            📦
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-2">
            No donations yet
          </h2>

          <p className="text-gray-500 max-w-md mx-auto">
            You haven't listed any food donations yet. Once you create a
            donation, you can track its complete journey here.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {donations.map((d) => {
            const currentStep = statusIndex(d.status);
            const isExpanded = expandedId === d._id;

            const foodNames =
              d.foodItems?.map((i) => i.name).join(', ') ||
              'Food Donation';
            const qrPayload = d.qrCode
              ? JSON.stringify({ donationId: d._id, qrToken: d.qrCode })
              : '';
            const qrCodeUrl = d.qrImage || (d.qrCode
              ? `${API_BASE_URL}/donations/${d._id}/qr-code?token=${encodeURIComponent(token || '')}`
              : '');
            const qrFallbackUrl = qrPayload
              ? `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(qrPayload)}`
              : '';

            return (
              <div
                key={d._id}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200"
              >
                {/* Donation Header */}
                <button
                  onClick={() =>
                    setExpandedId(isExpanded ? null : d._id)
                  }
                  className="w-full flex justify-between items-center p-6 text-left hover:bg-gray-50 transition"
                >
                  <div className="flex items-start gap-4 min-w-0">
                    {/* Icon */}
                    <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-2xl shrink-0">
                      🍱
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-900 text-lg truncate">
                        {foodNames}
                      </h3>

                      <p className="text-sm text-gray-500 mt-1">
                        {foodNames} —{' '}
                        {d.pickupLocation?.address ||
                          'Pickup location not available'}
                      </p>

                      {/* Food Items */}
                      <div className="text-sm text-gray-500 mt-2 space-y-1">
                        {d.foodItems?.map((i, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2"
                          >
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                            <span>
                              {i.name}: {i.quantity}
                            </span>
                          </div>
                        ))}
                      </div>

                      {d.otp && (d.status === 'accepted' || d.status === 'assigned') && (
                        <div className="mt-4 inline-flex flex-wrap items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                          <span className="text-xs font-bold uppercase tracking-wider text-green-700">
                            Pickup OTP
                          </span>
                          <span className="font-mono text-lg font-extrabold tracking-[0.25em] text-green-800">
                            {d.otp}
                          </span>
                          <span className="text-xs font-semibold text-green-700">
                            Give this to the volunteer
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-3 ml-4 shrink-0">
                    <span
                      className={`hidden sm:inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold ${
                        d.status === 'delivered'
                          ? 'bg-green-100 text-green-700'
                          : d.status === 'picked_up'
                          ? 'bg-blue-100 text-blue-700'
                          : d.status === 'assigned'
                          ? 'bg-purple-100 text-purple-700'
                          : d.status === 'accepted'
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current mr-2"></span>
                      {steps[currentStep]?.label || d.status}
                    </span>

                    <span className="text-gray-400 text-sm">
                      {isExpanded ? '▲' : '▼'}
                    </span>
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-6 pb-6 pt-6">
                    {/* Status Tracker */}
                    <div className="mb-8">
                      <div className="flex items-center">
                        {steps.map((step, i) => (
                          <div
                            key={step.key}
                            className="flex items-center flex-1 last:flex-none"
                          >
                            <div
                              className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition ${
                                i <= currentStep
                                  ? 'bg-green-600 text-white shadow-sm'
                                  : 'bg-gray-100 text-gray-400'
                              }`}
                            >
                              {i <= currentStep ? '✓' : i + 1}
                            </div>

                            {i < steps.length - 1 && (
                              <div
                                className={`flex-1 h-1 mx-1 rounded-full ${
                                  i < currentStep
                                    ? 'bg-green-600'
                                    : 'bg-gray-100'
                                }`}
                              />
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-between text-[11px] text-gray-500 mt-3">
                        {steps.map((step) => (
                          <span
                            key={step.key}
                            className="text-center flex-1"
                          >
                            {step.label}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Donation Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                          Pickup Location
                        </p>
                        <p className="text-sm font-semibold text-gray-800">
                          {d.pickupLocation?.address ||
                            'Not available'}
                        </p>
                      </div>

                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                          Expiry
                        </p>
                        <p className="text-sm font-semibold text-gray-800">
                          {d.expiryTime
                            ? new Date(
                                d.expiryTime
                              ).toLocaleString()
                            : 'Not available'}
                        </p>
                      </div>
                    </div>

                    {/* Food Items Details */}
                    {d.foodItems?.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-sm font-bold text-gray-900 mb-3">
                          Food Items
                        </h4>

                        <div className="bg-gray-50 rounded-xl divide-y divide-gray-200 overflow-hidden">
                          {d.foodItems.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between items-center px-4 py-3"
                            >
                              <span className="text-sm font-medium text-gray-700">
                                {item.name}
                              </span>

                              <span className="text-sm font-bold text-green-700">
                                {item.quantity}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Live Tracking */}
                    {d.status === 'picked_up' && (
                      <a
                        href={`/track/${d._id}`}
                        className="inline-flex items-center gap-2 mb-4 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition"
                      >
                        🚴 Track Volunteer Live
                      </a>
                    )}

                    {/* OTP or QR pickup confirmation */}
                    {(d.otp || d.qrCode) && (d.status === 'accepted' || d.status === 'assigned') && (
                      <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-5">
                        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                          {d.otp && (
                            <div className="shrink-0 rounded-xl border-2 border-dashed border-green-300 bg-white px-6 py-4 text-center">
                              <p className="mb-1 text-xs uppercase tracking-wide text-gray-400">Pickup OTP</p>
                              <p className="font-mono text-3xl font-extrabold tracking-widest text-green-700">{d.otp}</p>
                            </div>
                          )}

                          {d.qrCode && qrCodeUrl && (
                            <div className="shrink-0 rounded-xl border border-green-200 bg-white p-3 text-center">
                              <img
                                src={qrCodeUrl}
                                alt="Pickup QR code for the volunteer"
                                onError={(event) => {
                                  if (qrFallbackUrl && event.currentTarget.dataset.fallback !== 'true') {
                                    event.currentTarget.dataset.fallback = 'true';
                                    event.currentTarget.src = qrFallbackUrl;
                                  }
                                }}
                                className="h-40 w-40"
                              />
                              <p className="mt-2 text-xs font-bold text-green-700">Scan this QR</p>
                            </div>
                          )}

                          <div>
                            <h4 className="mb-1 font-bold text-gray-900">Give the OTP or QR to the volunteer</h4>
                            <p className="max-w-md text-sm text-gray-500">
                              The volunteer can enter the 6-digit OTP or scan this QR code. Only one method is needed.
                            </p>
                            <span className="mt-3 inline-flex rounded-full border border-green-200 bg-white px-3 py-1.5 text-xs font-semibold text-green-700">
                              ✓ Ready for pickup
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Delivered Certificate */}
                    {d.status === 'delivered' && (
                      <div className="bg-green-50 border border-green-100 rounded-xl p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xl">🎉</span>
                              <h4 className="font-bold text-gray-900">
                                Donation Delivered
                              </h4>
                            </div>

                            <p className="text-sm text-gray-500">
                              Your contribution has successfully
                              reached the community.
                            </p>
                          </div>

                          <a
                            href={`http://localhost:5000/api/donations/${d._id}/certificate/donor?token=${encodeURIComponent(token || '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-800 transition"
                          >
                            📄 View Certificate
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}

export default MyDonations;
