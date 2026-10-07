import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import socket from '../services/socket';
import DashboardLayout from '../components/DashboardLayout';

const navItems = [
  { path: '/volunteer-dashboard', label: 'My Tasks', icon: '🚚' },
];

const API_ORIGIN = (api.defaults.baseURL || 'http://localhost:5000/api').replace(
  /\/api\/?$/,
  ''
);

const statusConfig = {
  assigned: {
    label: 'Waiting for pickup',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
  },
  picked_up: {
    label: 'In delivery',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
  },
  delivered: {
    label: 'Delivered',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
  },
};

function foodName(task) {
  return task.foodItems?.map((item) => item.name).join(', ') || 'Food donation';
}

function durationText(milliseconds) {
  if (!milliseconds || milliseconds < 60000) return '0h 0m';

  const minutes = Math.floor(milliseconds / 60000);
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

function VolunteerDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const watches = useRef({});

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [otpInputs, setOtpInputs] = useState({});
  const [verifying, setVerifying] = useState(null);
  const [delivering, setDelivering] = useState(null);
  const [tracking, setTracking] = useState({});
  const [locations, setLocations] = useState({});
  const [now, setNow] = useState(() => Date.now());

  const fetchTasks = useCallback(async () => {
    try {
      const response = await api.get('/donations/my-tasks', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Could not load volunteer tasks:', error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const stopLocation = useCallback((donationId) => {
    const watchId = watches.current[donationId];

    if (watchId !== undefined) {
      navigator.geolocation?.clearWatch(watchId);
      delete watches.current[donationId];
    }

    socket.emit('stopTracking', { donationId });
    setTracking((previous) => ({ ...previous, [donationId]: 'stopped' }));
  }, []);

  const startLocation = useCallback((donationId) => {
    if (!navigator.geolocation) {
      setTracking((previous) => ({ ...previous, [donationId]: 'unsupported' }));
      return;
    }

    if (watches.current[donationId] !== undefined) return;

    setTracking((previous) => ({ ...previous, [donationId]: 'starting' }));
    socket.emit('joinTracking', { donationId });

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          donationId,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: Math.round(position.coords.accuracy || 0),
          timestamp: new Date().toISOString(),
        };

        setLocations((previous) => ({ ...previous, [donationId]: location }));
        setTracking((previous) => ({ ...previous, [donationId]: 'sharing' }));
        socket.emit('locationUpdate', location);
      },
      (error) => {
        console.error('Location error:', error);
        setTracking((previous) => ({
          ...previous,
          [donationId]: error.code === 1 ? 'permission-denied' : 'error',
        }));
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 15000,
      }
    );

    watches.current[donationId] = watchId;
  }, []);

  useEffect(() => {
    let active = true;

    const loadTasks = async () => {
      try {
        const response = await api.get('/donations/my-tasks', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (active) setTasks(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Could not load volunteer tasks:', error);
        if (active) setTasks([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadTasks();
    return () => {
      active = false;
    };
  }, [token]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    tasks
      .filter((task) => task.status === 'picked_up')
      .forEach((task) => startLocation(task._id));
  }, [tasks, startLocation]);

  useEffect(() => {
    return () => {
      Object.entries(watches.current).forEach(([donationId, watchId]) => {
        navigator.geolocation?.clearWatch(watchId);
        socket.emit('stopTracking', { donationId });
      });
      watches.current = {};
    };
  }, []);

  const changeOtp = (id, value) => {
    setOtpInputs((previous) => ({
      ...previous,
      [id]: value.replace(/\D/g, '').slice(0, 6),
    }));
  };

  const verifyPickup = async (id) => {
    const otp = otpInputs[id]?.trim();

    if (!otp || otp.length !== 6) {
      window.alert('Enter the 6-digit OTP shown on the donor page.');
      return;
    }

    setVerifying(id);

    try {
      await api.put(
        `/donations/${id}/verify-pickup`,
        { otp },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setTasks((previous) =>
        previous.map((task) =>
          task._id === id
            ? { ...task, status: 'picked_up', pickedUpAt: new Date().toISOString() }
            : task
        )
      );
      setOtpInputs((previous) => ({ ...previous, [id]: '' }));
      window.alert('Pickup confirmed. Allow location access to start live tracking.');
      startLocation(id);
    } catch (error) {
      window.alert(
        error.response?.data?.message || 'Invalid OTP. Please check with the donor.'
      );
    } finally {
      setVerifying(null);
    }
  };

  const markDelivered = async (id) => {
    if (!window.confirm('Mark this donation as delivered?')) return;

    setDelivering(id);

    try {
      await api.put(
        `/donations/${id}/mark-delivered`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      stopLocation(id);
      setTasks((previous) =>
        previous.map((task) =>
          task._id === id
            ? { ...task, status: 'delivered', deliveredAt: new Date().toISOString() }
            : task
        )
      );
      window.alert('Delivery completed. Your certificate is ready.');
    } catch (error) {
      window.alert(error.response?.data?.message || 'Could not mark delivery complete.');
    } finally {
      setDelivering(null);
    }
  };

  const stats = useMemo(() => {
    const delivered = tasks.filter((task) => task.status === 'delivered').length;
    const active = tasks.filter(
      (task) => task.status === 'assigned' || task.status === 'picked_up'
    ).length;

    const workingMilliseconds = tasks.reduce((total, task) => {
      if (!task.pickedUpAt) return total;

      const start = new Date(task.pickedUpAt).getTime();
      const end = task.deliveredAt
        ? new Date(task.deliveredAt).getTime()
        : task.status === 'picked_up'
        ? now
        : start;

      return total + Math.max(0, end - start);
    }, 0);

    return { delivered, active, workingMilliseconds };
  }, [tasks, now]);

  if (loading) {
    return (
      <DashboardLayout navItems={navItems}>
        <div className="flex min-h-[420px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-green-100 border-t-green-600" />
            <p className="font-medium text-gray-500">Loading your tasks...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={navItems}>
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-green-700">
              <span className="h-2 w-2 rounded-full bg-green-600" />
              Volunteer workspace
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              My delivery tasks
            </h1>
            <p className="mt-2 max-w-2xl text-gray-500">
              Enter the donor OTP to confirm pickup. Live location starts after confirmation.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchTasks}
            className="min-h-11 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 shadow-sm hover:border-green-300 hover:text-green-700"
          >
            ↻ Refresh tasks
          </button>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Working hours</p>
            <p className="mt-2 text-2xl font-extrabold text-gray-900">
              {durationText(stats.workingMilliseconds)}
            </p>
            <p className="mt-1 text-xs text-gray-500">Pickup to delivery time</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Delivered orders</p>
            <p className="mt-2 text-2xl font-extrabold text-green-700">{stats.delivered}</p>
            <p className="mt-1 text-xs text-gray-500">Certificates available</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Active tasks</p>
            <p className="mt-2 text-2xl font-extrabold text-blue-700">{stats.active}</p>
            <p className="mt-1 text-xs text-gray-500">Assigned or in delivery</p>
          </div>
        </div>

        {tasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-2xl">🚚</div>
            <h2 className="mt-4 text-xl font-bold text-gray-900">No tasks assigned yet</h2>
            <p className="mx-auto mt-2 max-w-md text-gray-500">
              Ask the NGO to click Assign volunteer for your donation.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {tasks.map((task) => {
              const status = statusConfig[task.status] || statusConfig.assigned;
              const location = locations[task._id];
              const trackingState = tracking[task._id];
              const certificateUrl = `${API_ORIGIN}/api/donations/${task._id}/certificate/volunteer?token=${encodeURIComponent(token || '')}`;

              return (
                <article key={task._id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                  <div className="flex flex-col justify-between gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-start sm:p-6">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="truncate text-lg font-extrabold text-gray-900">{foodName(task)}</h2>
                        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${status.badge}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                          {status.label}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-gray-500">
                        {task.foodItems?.map((item) => `${item.name}: ${item.quantity}`).join(' • ')}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
                    <div className="rounded-xl bg-gray-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Pickup location</p>
                      <p className="mt-2 text-sm font-semibold leading-6 text-gray-800">
                        {task.pickupLocation?.address || 'Address not available'}
                      </p>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Donor</p>
                      <p className="mt-2 text-sm font-semibold text-gray-800">{task.donor?.name || 'Donor'}</p>
                      {task.donor?.phone && <p className="mt-1 text-sm text-gray-500">{task.donor.phone}</p>}
                    </div>
                  </div>

                  <div className="border-t border-gray-100 px-5 py-5 sm:px-6">
                    {task.status === 'assigned' && (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                        <p className="text-sm font-bold text-amber-900">Confirm pickup with the donor</p>
                        <p className="mt-1 text-sm text-amber-800">
                          Ask the donor for the 6-digit OTP shown on the donor page.
                        </p>
                        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                          <label className="sr-only" htmlFor={`otp-${task._id}`}>Pickup OTP</label>
                          <input
                            id={`otp-${task._id}`}
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            maxLength={6}
                            placeholder="Enter 6-digit OTP"
                            value={otpInputs[task._id] || ''}
                            onChange={(event) => changeOtp(task._id, event.target.value)}
                            className="min-h-11 w-full rounded-xl border border-amber-300 bg-white px-3 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 sm:max-w-xs"
                          />
                          <button
                            type="button"
                            onClick={() => verifyPickup(task._id)}
                            disabled={verifying === task._id}
                            className="min-h-11 rounded-xl bg-green-700 px-5 text-sm font-bold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:bg-green-300"
                          >
                            {verifying === task._id ? 'Confirming...' : 'Confirm pickup'}
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(`/scan?donationId=${task._id}`)}
                            className="min-h-11 rounded-xl border border-green-300 bg-white px-5 text-sm font-bold text-green-800 hover:bg-green-50"
                          >
                            Scan donor QR
                          </button>
                        </div>
                      </div>
                    )}

                    {task.status === 'picked_up' && (
                      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                        <p className="text-sm font-bold text-blue-900">Live location sharing</p>
                        <p className="mt-1 text-sm text-blue-800">
                          {trackingState === 'sharing'
                            ? 'The donor and NGO can see your latest location.'
                            : 'Start location sharing so the donor and NGO can follow the delivery.'}
                        </p>
                        {location && (
                          <p className="mt-2 text-xs font-semibold text-blue-700">
                            Last update: {new Date(location.timestamp).toLocaleTimeString()}
                          </p>
                        )}
                        <div className="mt-4 flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() => startLocation(task._id)}
                            className="min-h-11 rounded-xl bg-blue-700 px-4 py-2 text-sm font-bold text-white hover:bg-blue-800"
                          >
                            {trackingState === 'sharing' ? 'Location sharing active' : 'Start live location'}
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(`/track/${task._id}`)}
                            className="min-h-11 rounded-xl border border-blue-300 bg-white px-4 py-2 text-sm font-bold text-blue-700 hover:bg-blue-100"
                          >
                            View tracking
                          </button>
                          <button
                            type="button"
                            onClick={() => markDelivered(task._id)}
                            disabled={delivering === task._id}
                            className="min-h-11 rounded-xl bg-purple-700 px-4 py-2 text-sm font-bold text-white hover:bg-purple-800 disabled:bg-purple-300"
                          >
                            {delivering === task._id ? 'Saving...' : 'Mark delivered'}
                          </button>
                        </div>
                      </div>
                    )}

                    {task.status === 'delivered' && (
                      <div className="flex flex-col justify-between gap-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center">
                        <div>
                          <p className="font-bold text-emerald-900">Delivery completed 🎉</p>
                          <p className="mt-1 text-sm text-emerald-800">Your certificate is ready.</p>
                        </div>
                        <a
                          href={certificateUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800"
                        >
                          Download certificate
                        </a>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default VolunteerDashboard;
