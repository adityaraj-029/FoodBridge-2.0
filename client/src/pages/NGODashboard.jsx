import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import DashboardLayout from '../components/DashboardLayout';

const navItems = [
  {
    path: '/ngo-dashboard',
    label: 'Dashboard',
    icon: '📊',
  },
];

function formatFoodItems(foodItems) {
  if (!Array.isArray(foodItems) || foodItems.length === 0) {
    return 'Food Donation';
  }

  return foodItems.map((i) => i.name).join(', ');
}

function formatQuantities(foodItems) {
  if (!Array.isArray(foodItems) || foodItems.length === 0) {
    return [];
  }

  return foodItems;
}

function NGODashboard() {
  const [stats, setStats] = useState(null);
  const [incoming, setIncoming] = useState([]);
  const [accepted, setAccepted] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [volunteers, setVolunteers] = useState([]);
  const [selectedVolunteers, setSelectedVolunteers] = useState({});
  const [assigning, setAssigning] = useState(null);
  const [verification, setVerification] = useState(null);

  const token = localStorage.getItem('token');

  const fetchDashboard = async (showLoader = false) => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      if (showLoader) {
        setRefreshing(true);
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [statsRes, incomingRes, acceptedRes, volunteersRes, verificationRes] = await Promise.all([
        api.get('/donations/ngo-stats', { headers }),
        api.get('/donations', { headers }),
        api.get('/donations/ngo-accepted', { headers }),
        api.get('/auth/volunteers', { headers }),
        api.get('/ngos/mine', { headers }),
      ]);

      setStats(statsRes.data || {});
      setIncoming(
        Array.isArray(incomingRes.data) ? incomingRes.data : []
      );
      setAccepted(
        Array.isArray(acceptedRes.data) ? acceptedRes.data : []
      );
            setVolunteers(
        Array.isArray(volunteersRes.data) ? volunteersRes.data : []
      );
      setVerification(verificationRes.data || null);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load NGO dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      if (!token) {
        if (active) {
          setLoading(false);
        }
        return;
      }

      try {
        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [statsRes, incomingRes, acceptedRes, volunteersRes, verificationRes] = await Promise.all([
        api.get('/donations/ngo-stats', { headers }),
        api.get('/donations', { headers }),
        api.get('/donations/ngo-accepted', { headers }),
        api.get('/auth/volunteers', { headers }),
        api.get('/ngos/mine', { headers }),
      ]);

        if (!active) return;

        setStats(statsRes.data || {});

        setIncoming(
          Array.isArray(incomingRes.data) ? incomingRes.data : []
        );

        setAccepted(
          Array.isArray(acceptedRes.data) ? acceptedRes.data : []
        );

              setVolunteers(
        Array.isArray(volunteersRes.data) ? volunteersRes.data : []
      );
      setVerification(verificationRes.data || null);
      setLastUpdated(new Date());
      } catch (error) {
        console.error('Failed to load NGO dashboard:', error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      active = false;
    };
  }, [token]);

  const acceptDonation = async (id) => {
    try {
      await api.put(
        `/donations/${id}/accept`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await fetchDashboard(true);
    } catch (error) {
      console.error(error);
      alert('Failed to accept donation');
    }
  };

  const rejectDonation = async (id) => {
    const confirmed = window.confirm(
      'Are you sure you want to reject this donation request?'
    );

    if (!confirmed) return;

    try {
      await api.put(
        `/donations/${id}/reject`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await fetchDashboard(true);
    } catch (error) {
      console.error(error);
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Failed to reject donation';
      alert(`Reject failed${error.response?.status ? ` (${error.response.status})` : ''}: ${message}`);
    }
  };

  const assignVolunteerToDonation = async (id) => {
    const volunteerId = selectedVolunteers[id];

    if (!volunteerId) {
      alert('Please select a volunteer first.');
      return;
    }

    setAssigning(id);

    try {
      await api.put(
        `/donations/${id}/assign-volunteer`,
        { volunteerId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('Volunteer assigned successfully. The task is now visible on the volunteer dashboard.');
      await fetchDashboard(true);
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || 'Failed to assign volunteer');
    } finally {
      setAssigning(null);
    }
  };

  const markDelivered = async (id) => {
    const confirmed = window.confirm(
      'Mark this donation as delivered?'
    );

    if (!confirmed) return;

    try {
      await api.put(
        `/donations/${id}/mark-delivered`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert('Donation marked as delivered successfully.');
      await fetchDashboard(true);
    } catch (error) {
      console.error(error);
      alert('Failed to mark donation as delivered');
    }
  };

  const totalAccepted = stats?.totalAccepted ?? 0;
  const inProgress = stats?.inProgress ?? 0;
  const delivered = stats?.delivered ?? 0;
  const pendingRequests =
    stats?.pendingRequests ?? incoming.length;

  const totalOperations =
    totalAccepted + inProgress + delivered;

  const acceptedPercentage =
    totalOperations > 0
      ? Math.round((totalAccepted / totalOperations) * 100)
      : 0;

  const progressPercentage =
    totalOperations > 0
      ? Math.round((inProgress / totalOperations) * 100)
      : 0;

  const deliveredPercentage =
    totalOperations > 0
      ? Math.round((delivered / totalOperations) * 100)
      : 0;

  const activePickups = useMemo(() => {
    return accepted.filter(
      (item) =>
        item.status === 'accepted' ||
        item.status === 'assigned' ||
        item.status === 'picked_up'
    );
  }, [accepted]);

  const getGreeting = () => {
    const hour = new Date().getHours();

    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';

    return 'Good evening';
  };

  const formatUpdatedTime = () => {
    if (!lastUpdated) return 'Not updated yet';

    return lastUpdated.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const statusConfig = {
    accepted: {
      label: 'Accepted',
      className:
        'bg-blue-50 text-blue-700 border-blue-100',
      dot: 'bg-blue-500',
    },

    assigned: {
      label: 'Volunteer Assigned',
      className:
        'bg-purple-50 text-purple-700 border-purple-100',
      dot: 'bg-purple-500',
    },

    picked_up: {
      label: 'Picked Up',
      className:
        'bg-orange-50 text-orange-700 border-orange-100',
      dot: 'bg-orange-500',
    },

    delivered: {
      label: 'Delivered',
      className:
        'bg-green-50 text-green-700 border-green-100',
      dot: 'bg-green-500',
    },
  };

  if (loading) {
    return (
      <DashboardLayout navItems={navItems}>
        <div className="min-h-[70vh] flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-green-100 border-t-green-600 rounded-full animate-spin mx-auto"></div>

            <p className="mt-4 text-sm font-semibold text-gray-700">
              Loading NGO dashboard...
            </p>

            <p className="mt-1 text-xs text-gray-400">
              Fetching your latest donation activity
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={navItems}>
      {verification && verification.verificationStatus !== 'verified' && (
        <div className="mb-6 rounded-2xl border border-orange-200 bg-orange-50 px-5 py-4 text-orange-800">
          <p className="font-bold">NGO verification: {verification.verificationStatus}</p>
          <p className="text-sm mt-1">
            {verification.verificationStatus === 'rejected'
              ? verification.rejectionReason || 'Please update your registration proof and contact the admin.'
              : 'Your profile is waiting for admin verification. You can accept donations after verification.'}
          </p>
        </div>
      )}

      {/* =====================================================
          PAGE HEADER
      ====================================================== */}

      <section className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>

              <span className="text-xs font-bold uppercase tracking-[0.16em] text-green-700">
                NGO Operations
              </span>
            </div>

            <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight text-[#101722]">
              {getGreeting()}
            </h1>

            <p className="text-lg text-gray-500 mt-2 max-w-2xl">
              Manage incoming donations, coordinate pickups,
              and make sure good food reaches people who need it.
            </p>
          </div>

          {/* Header actions */}

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right mr-2">
              <p className="text-[11px] text-gray-400">
                Last updated
              </p>

              <p className="text-xs font-semibold text-gray-600 mt-0.5">
                {formatUpdatedTime()}
              </p>
            </div>

            <button
              type="button"
              onClick={() => fetchDashboard(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm hover:border-green-300 hover:text-green-700 hover:shadow-md transition-all disabled:opacity-60"
            >
              <span
                className={refreshing ? 'animate-spin' : ''}
              >
                ↻
              </span>

              {refreshing ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>
        </div>
      </section>

      {/* =====================================================
          KPI CARDS
      ====================================================== */}

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {/* Accepted */}

        <div className="group bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Total Accepted
              </p>

              <p className="text-4xl font-extrabold text-[#101722] mt-3">
                {totalAccepted}
              </p>
            </div>

            <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center text-xl">
              📦
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>

            <span className="text-xs font-semibold text-green-600">
              Successfully accepted
            </span>
          </div>
        </div>

        {/* Progress */}

        <div className="group bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                In Progress
              </p>

              <p className="text-4xl font-extrabold text-[#101722] mt-3">
                {inProgress}
              </p>
            </div>

            <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center text-xl">
              🚚
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <span className="w-2 h-2 rounded-full bg-purple-500"></span>

            <span className="text-xs font-semibold text-purple-600">
              Active operations
            </span>
          </div>
        </div>

        {/* Delivered */}

        <div className="group bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Delivered
              </p>

              <p className="text-4xl font-extrabold text-[#101722] mt-3">
                {delivered}
              </p>
            </div>

            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-xl">
              ✓
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>

            <span className="text-xs font-semibold text-blue-600">
              Successfully completed
            </span>
          </div>
        </div>

        {/* Requests */}

        <div className="group bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                New Requests
              </p>

              <p className="text-4xl font-extrabold text-[#101722] mt-3">
                {pendingRequests}
              </p>
            </div>

            <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center text-xl">
              🔔
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <span className="w-2 h-2 rounded-full bg-orange-500"></span>

            <span className="text-xs font-semibold text-orange-600">
              Awaiting response
            </span>
          </div>
        </div>
      </section>

      {/* =====================================================
          MAIN CONTENT GRID
      ====================================================== */}

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.8fr)] gap-6">
        {/* =================================================
            INCOMING REQUESTS
        ================================================== */}

        <section className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#101722]">
                Incoming Donation Requests
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Review and respond to new food donations.
              </p>
            </div>

            <div className="px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-xs font-bold">
              {incoming.length} Pending
            </div>
          </div>

          {incoming.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-2xl mx-auto">
                ✓
              </div>

              <h3 className="text-lg font-bold text-gray-800 mt-5">
                No new requests
              </h3>

              <p className="text-sm text-gray-400 mt-2 max-w-sm mx-auto">
                New donation requests from donors will appear
                here when they are submitted.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {incoming.map((donation) => (
                <div
                  key={donation._id}
                  className="p-5 hover:bg-gray-50/70 transition"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-bold text-gray-900">
                          {formatFoodItems(donation.foodItems)}
                        </h3>

                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-100 text-[11px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                          Pending
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mt-3">
                        <div className="text-sm text-gray-500">
                          <span className="font-medium text-gray-700">
                            Items:
                          </span>{' '}

                          {formatQuantities(donation.foodItems).length === 0 ? (
                            'Not specified'
                          ) : (
                            <span>
                              {formatQuantities(donation.foodItems).map(
                                (item, idx) => (
                                  <span key={idx}>
                                    {item.name} ({item.quantity})
                                    {idx < donation.foodItems.length - 1
                                      ? ', '
                                      : ''}
                                  </span>
                                )
                              )}
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-gray-500">
                          <span className="font-medium text-gray-700">
                            Donor:
                          </span>{' '}
                          {donation.donor?.name || 'Anonymous'}
                        </p>

                        <p className="text-sm text-gray-500 sm:col-span-2">
                          <span className="font-medium text-gray-700">
                            Pickup:
                          </span>{' '}
                          {donation.pickupLocation?.address ||
                            'Location not specified'}
                        </p>

                        {donation.expiryTime && (
                          <p className="text-sm text-gray-500 sm:col-span-2">
                            <span className="font-medium text-gray-700">
                              Expiry:
                            </span>{' '}
                            {new Date(
                              donation.expiryTime
                            ).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          acceptDonation(donation._id)
                        }
                        className="bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 shadow-sm hover:shadow transition"
                      >
                        Accept
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          rejectDonation(donation._id)
                        }
                        className="bg-white text-red-600 border border-red-100 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-50 transition"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* =================================================
            OPERATIONS PIPELINE
        ================================================== */}

        <section className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#101722]">
                Operations
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Current donation status
              </p>
            </div>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-green-50 text-green-700 text-[11px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
              LIVE
            </span>
          </div>

          <div className="mt-7">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700">
                Accepted
              </span>

              <span className="text-sm font-bold text-gray-900">
                {totalAccepted}
              </span>
            </div>

            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-700"
                style={{
                  width: `${acceptedPercentage}%`,
                }}
              ></div>
            </div>

            <p className="text-[11px] text-gray-400 mt-1.5">
              {acceptedPercentage}% of total operations
            </p>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700">
                In Progress
              </span>

              <span className="text-sm font-bold text-gray-900">
                {inProgress}
              </span>
            </div>

            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded-full transition-all duration-700"
                style={{
                  width: `${progressPercentage}%`,
                }}
              ></div>
            </div>

            <p className="text-[11px] text-gray-400 mt-1.5">
              {progressPercentage}% of total operations
            </p>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700">
                Delivered
              </span>

              <span className="text-sm font-bold text-gray-900">
                {delivered}
              </span>
            </div>

            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-700"
                style={{
                  width: `${deliveredPercentage}%`,
                }}
              ></div>
            </div>

            <p className="text-[11px] text-gray-400 mt-1.5">
              {deliveredPercentage}% of total operations
            </p>
          </div>

          <div className="mt-7 pt-5 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">
                Total operations
              </span>

              <span className="text-lg font-extrabold text-gray-900">
                {totalOperations}
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* =====================================================
          SECOND ROW
      ====================================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* =================================================
            ACTIVE PICKUPS
        ================================================== */}

        <section className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#101722]">
                Active Pickups
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Donations currently being coordinated.
              </p>
            </div>

            <span className="px-2.5 py-1.5 rounded-lg bg-purple-50 text-purple-700 text-xs font-bold">
              {activePickups.length} Active
            </span>
          </div>

          {activePickups.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-xl mx-auto">
                🚚
              </div>

              <p className="font-semibold text-gray-700 mt-4">
                No active pickups
              </p>

              <p className="text-xs text-gray-400 mt-1">
                Accepted, assigned, and picked-up donations will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {activePickups.slice(0, 4).map((donation) => {
                const config =
                  statusConfig[donation.status] ||
                  statusConfig.accepted;

                return (
                  <div
                    key={donation._id}
                    className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-gray-50 transition"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-800 truncate">
                          {formatFoodItems(donation.foodItems)}
                        </p>
                      </div>

                      <p className="text-xs text-gray-400 mt-1">
                        {donation.donor?.name || 'Donor'} •{' '}
                        {formatQuantities(donation.foodItems)
                          .map(
                            (i) =>
                              `${i.name}: ${i.quantity}`
                          )
                          .join(', ') || 'Quantity unavailable'}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold ${config.className}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${config.dot}`}
                        ></span>

                        {config.label}
                      </span>

                      {donation.status === 'picked_up' && (
                        <div className="mt-2">
                          <a
                            href={`/track/${donation._id}`}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                          >
                            Track →
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* =================================================
            COMMUNITY IMPACT
        ================================================== */}

        <section className="bg-[#101722] rounded-2xl shadow-sm p-6 text-white overflow-hidden relative">
          <div className="absolute -right-16 -top-16 w-40 h-40 rounded-full bg-green-500/10"></div>

          <div className="absolute -left-20 -bottom-20 w-48 h-48 rounded-full bg-emerald-500/5"></div>

          <div className="relative">
            <div className="flex items-start justify-between">
              <div>
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.08] text-xs font-semibold text-green-300">
                  <span>🌱</span>
                  Community Impact
                </span>

                <h2 className="text-2xl font-extrabold mt-5">
                  Making every donation count.
                </h2>

                <p className="text-sm text-gray-400 mt-2 max-w-md leading-relaxed">
                  Every successful donation helps reduce food waste
                  and connects surplus food with people who need it.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-7">
              <div className="rounded-xl bg-white/[0.05] border border-white/[0.06] p-4">
                <p className="text-2xl font-extrabold">
                  {delivered}
                </p>

                <p className="text-xs text-gray-400 mt-1">
                  Donations delivered
                </p>
              </div>

              <div className="rounded-xl bg-white/[0.05] border border-white/[0.06] p-4">
                <p className="text-2xl font-extrabold">
                  {totalAccepted}
                </p>

                <p className="text-xs text-gray-400 mt-1">
                  Donations accepted
                </p>
              </div>

              <div className="rounded-xl bg-white/[0.05] border border-white/[0.06] p-4">
                <p className="text-2xl font-extrabold">
                  {activePickups.length}
                </p>

                <p className="text-xs text-gray-400 mt-1">
                  Active pickups
                </p>
              </div>

              <div className="rounded-xl bg-white/[0.05] border border-white/[0.06] p-4">
                <p className="text-2xl font-extrabold">
                  {pendingRequests}
                </p>

                <p className="text-xs text-gray-400 mt-1">
                  Requests waiting
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* =====================================================
          RECENT ACCEPTED DONATIONS
      ====================================================== */}

      <section className="bg-white border border-gray-200 rounded-2xl shadow-sm mt-6 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold text-[#101722]">
                Recent Donations
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Latest donations handled by your organization.
              </p>
            </div>

            <span className="text-xs font-semibold text-gray-400">
              {accepted.length} total records
            </span>
          </div>
        </div>

        {accepted.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center mx-auto text-xl">
              📋
            </div>

            <p className="font-semibold text-gray-700 mt-4">
              No donation history yet
            </p>

            <p className="text-xs text-gray-400 mt-1">
              Accepted donations will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {accepted.slice(0, 5).map((donation) => {
              const config =
                statusConfig[donation.status] ||
                statusConfig.accepted;

              return (
                <div
                  key={donation._id}
                  className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-gray-50/70 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-lg">
                      📦
                    </div>

                    <div>
                      <p className="font-semibold text-gray-800">
                        {formatFoodItems(donation.foodItems)}
                      </p>

                      <p className="text-xs text-gray-400 mt-1">
                        {formatQuantities(donation.foodItems)
                          .map(
                            (i) =>
                              `${i.name}: ${i.quantity}`
                          )
                          .join(', ') || 'Quantity unavailable'}{' '}
                        •{' '}
                        {donation.donor?.name || 'Donor'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
                    {donation.status === 'accepted' && !donation.assignedVolunteer && (
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <label className="sr-only" htmlFor={`volunteer-${donation._id}`}>
                          Select volunteer
                        </label>
                        <select
                          id={`volunteer-${donation._id}`}
                          value={selectedVolunteers[donation._id] || ''}
                          onChange={(event) =>
                            setSelectedVolunteers((previous) => ({
                              ...previous,
                              [donation._id]: event.target.value,
                            }))
                          }
                          className="min-h-10 rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
                        >
                          <option value="">
                            {volunteers.length ? 'Select volunteer' : 'No volunteers found'}
                          </option>
                          {volunteers.map((volunteer) => (
                            <option key={volunteer._id} value={volunteer._id}>
                              {volunteer.name}{volunteer.phone ? ` — ${volunteer.phone}` : ''}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => assignVolunteerToDonation(donation._id)}
                          disabled={assigning === donation._id || volunteers.length === 0}
                          className="min-h-10 rounded-lg bg-green-700 px-3 py-2 text-xs font-bold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:bg-gray-300"
                        >
                          {assigning === donation._id ? 'Assigning...' : 'Assign volunteer'}
                        </button>
                      </div>
                    )}

                    {donation.assignedVolunteer && (
                      <span className="text-xs font-semibold text-gray-500">
                        Volunteer: {donation.assignedVolunteer.name}
                      </span>
                    )}

                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold ${config.className}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${config.dot}`}
                      ></span>

                      {config.label}
                    </span>

                    {(donation.status === 'accepted' ||
                      donation.status === 'assigned' ||
                      donation.status === 'picked_up') && (
                      <button
                        type="button"
                        onClick={() =>
                          markDelivered(donation._id)
                        }
                        className="text-xs font-semibold text-purple-600 hover:text-purple-700"
                      >
                        Mark delivered
                      </button>
                    )}

                    {donation.status === 'picked_up' && (
                      <a
                        href={`/track/${donation._id}`}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                      >
                        Track
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* =====================================================
          FOOTER NOTE
      ====================================================== */}

      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 py-6 text-xs text-gray-400">
        <p>
          FoodBridge • Community Management Platform
        </p>

        <p>
          Your work helps reduce food waste and support communities.
        </p>
      </div>
    </DashboardLayout>
  );
}

export default NGODashboard;