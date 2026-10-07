import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const CHART_COLORS = ['#6d5dfc', '#00b8a9', '#ff9f43', '#ef5da8', '#4d96ff'];

const statusLabel = (ngo) =>
  ngo?.verificationStatus || (ngo?.isApproved ? 'verified' : 'pending');

const statusClass = (status) => {
  if (status === 'verified') return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
  if (status === 'rejected' || status === 'suspended') return 'bg-rose-50 text-rose-700 ring-rose-200';
  return 'bg-amber-50 text-amber-700 ring-amber-200';
};

const foodSummary = (items) =>
  Array.isArray(items) && items.length
    ? items.map((item) => `${item.name || 'Food'} (${item.quantity || 1})`).join(', ')
    : 'Food donation';

const formatDate = (value) => {
  if (!value) return 'Recently';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently';
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const Icon = ({ name, size = 20, className = '' }) => {
  const props = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    className,
  };

  const icons = {
    shield: <><path d="M12 3 20 6v5c0 5.2-3.3 8.7-8 10-4.7-1.3-8-4.8-8-10V6l8-3Z" /><path d="m9 12 2 2 4-4" /></>,
    refresh: <><path d="M20 11a8 8 0 0 0-14.9-4L3 10" /><path d="M3 5v5h5" /><path d="M4 13a8 8 0 0 0 14.9 4L21 14" /><path d="M21 19v-5h-5" /></>,
    building: <><path d="M4 21V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16" /><path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2" /><path d="M10 21v-3h4v3" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    gift: <><rect x="3" y="8" width="18" height="13" rx="2" /><path d="M12 8v13M3 12h18" /><path d="M7 8c-2.5 0-3.5-4 0-4 2 0 5 4 5 4" /><path d="M17 8c2.5 0 3.5-4 0-4-2 0-5 4-5 4" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M8 13h8M8 17h6" /></>,
    external: <><path d="M14 3h7v7M10 14 21 3" /><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    moon: <path d="M21 12.8A8.5 8.5 0 0 1 11.2 3 7 7 0 1 0 21 12.8Z" />,
    logout: <><path d="M10 17l5-5-5-5" /><path d="M15 12H3" /><path d="M21 19V5a2 2 0 0 0-2-2h-5" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5v.2h-2.6v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1A1.7 1.7 0 0 0 8 15a1.7 1.7 0 0 0-1.5-1H6.3v-2.6h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5v-.2H15v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.2V14h-.2a1.7 1.7 0 0 0-1.5 1Z" /></>,
    chart: <><path d="M4 19V5" /><path d="M4 19h17" /><path d="M8 16v-5M12 16V7M16 16v-3M20 16V9" /></>,
    heart: <path d="M20.8 8.9c0 5.5-8.8 10.1-8.8 10.1S3.2 14.4 3.2 8.9A4.7 4.7 0 0 1 12 6.1a4.7 4.7 0 0 1 8.8 2.8Z" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    eye: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="2.5" /></>,
  };

  return <svg {...props}>{icons[name]}</svg>;
};

const StatCard = ({ label, value, icon, accent }) => (
  <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.05)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(15,23,42,0.09)]">
    <div className={`absolute right-0 top-0 h-20 w-20 rounded-bl-[70px] ${accent}`} />
    <div className="relative flex items-start justify-between gap-4">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.13em] text-slate-400">{label}</p>
        <p className="mt-2 text-3xl font-black tracking-tight text-slate-900">{value}</p>
      </div>
      <div className="relative rounded-xl bg-slate-900 p-2.5 text-white shadow-sm">
        <Icon name={icon} size={20} />
      </div>
    </div>
  </div>
);

const SectionHeader = ({ eyebrow, title, description, count }) => (
  <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
    <div>
      {eyebrow && <p className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-violet-600">{eyebrow}</p>}
      <h2 className="text-xl font-black tracking-tight text-slate-900">{title}</h2>
      {description && <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>}
    </div>
    {count !== undefined && <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700">{count}</span>}
  </div>
);

const StatusBadge = ({ status }) => (
  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ring-1 ${statusClass(status)}`}>
    <span className="h-1.5 w-1.5 rounded-full bg-current" />
    {status || 'pending'}
  </span>
);

const EmptyState = ({ title, description, icon = 'file' }) => (
  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-10 text-center">
    <div className="mb-3 rounded-2xl bg-white p-3 text-slate-400 shadow-sm"><Icon name={icon} size={23} /></div>
    <p className="font-bold text-slate-700">{title}</p>
    <p className="mt-1 max-w-md text-sm text-slate-500">{description}</p>
  </div>
);

const DocumentModal = ({ document, onClose }) => {
  if (!document) return null;

  const isImage = /^(data:image|https?:\/\/.*\.(png|jpe?g|webp|gif)(\?.*)?$)/i.test(document.url || '');
  const isPdf = /^(data:application\/pdf|https?:\/\/.*\.pdf(\?.*)?$)/i.test(document.url || '') || document.type === 'application/pdf';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="rounded-xl bg-violet-50 p-2.5 text-violet-600"><Icon name="file" size={20} /></div>
            <div className="min-w-0">
              <p className="truncate font-black text-slate-900">{document.name || 'Uploaded document'}</p>
              <p className="text-xs text-slate-500">Document submitted for verification</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900" aria-label="Close document">
            <Icon name="close" size={21} />
          </button>
        </div>
        <div className="min-h-[55vh] flex-1 bg-slate-100 p-4">
          {isImage ? (
            <div className="flex h-full min-h-[55vh] items-center justify-center overflow-auto rounded-2xl bg-slate-900 p-3">
              <img src={document.url} alt={document.name || 'Uploaded document'} className="max-h-[70vh] max-w-full rounded-xl object-contain" />
            </div>
          ) : isPdf ? (
            <iframe title={document.name || 'Uploaded PDF'} src={document.url} className="h-[65vh] w-full rounded-2xl border border-slate-200 bg-white" />
          ) : (
            <div className="flex h-full min-h-[55vh] flex-col items-center justify-center rounded-2xl bg-white p-8 text-center">
              <div className="rounded-2xl bg-violet-50 p-4 text-violet-600"><Icon name="file" size={32} /></div>
              <h3 className="mt-4 text-lg font-black text-slate-900">Document is ready to open</h3>
              <p className="mt-1 max-w-md text-sm text-slate-500">This file type cannot be previewed inside the dashboard. Use the button below to open it in a new tab.</p>
              <a href={document.url} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800">
                <Icon name="external" size={16} /> Open document
              </a>
            </div>
          )}
        </div>
        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 bg-white px-5 py-4">
          <a href={document.url} target="_blank" rel="noreferrer" download={document.name || 'foodbridge-document'} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">
            <Icon name="external" size={16} /> Open / Download
          </a>
          <button type="button" onClick={onClose} className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-violet-700">Close</button>
        </div>
      </div>
    </div>
  );
};

function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [pendingNGOs, setPendingNGOs] = useState([]);
  const [allNGOs, setAllNGOs] = useState([]);
  const [allVolunteers, setAllVolunteers] = useState([]);
  const [pendingVolunteers, setPendingVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [search, setSearch] = useState('');
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchData = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      const [analyticsRes, pendingRes, allNGOsRes, volunteersRes] = await Promise.all([
        api.get('/analytics', { headers }),
        api.get('/ngos/pending', { headers }),
        api.get('/ngos/all', { headers }),
        api.get('/auth/volunteers/all', { headers }),
      ]);

      setAnalytics(analyticsRes.data || {});
      setPendingNGOs(Array.isArray(pendingRes.data) ? pendingRes.data : []);
      setAllNGOs(Array.isArray(allNGOsRes.data) ? allNGOsRes.data : []);

      const volunteers = Array.isArray(volunteersRes.data) ? volunteersRes.data : [];
      setAllVolunteers(volunteers);
      setPendingVolunteers(
        volunteers.filter((volunteer) => ['pending', undefined, null].includes(volunteer.verificationStatus))
      );
    } catch (error) {
      console.error('Failed to load admin dashboard:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        alert('Your admin session has expired. Please login again.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchData(), 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goTo = (section) => {
    setActiveSection(section);
    setMobileMenu(false);
    const target = document.getElementById(`section-${section}`);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const approveNGO = async (id) => {
    try {
      await api.put(`/ngos/${id}/approve`, {}, { headers });
      await fetchData(true);
    } catch (error) {
      console.error(error);
      alert('NGO verification failed');
    }
  };

  const rejectNGO = async (id) => {
    const rejectionReason = window.prompt('Why is this NGO being rejected?', 'Registration proof could not be verified');
    if (rejectionReason === null) return;
    try {
      await api.put(`/ngos/${id}/reject`, { rejectionReason }, { headers });
      await fetchData(true);
    } catch (error) {
      console.error(error);
      alert('NGO rejection failed');
    }
  };

  const suspendNGO = async (id) => {
    if (!window.confirm('Suspend this verified NGO?')) return;
    try {
      await api.put(`/ngos/${id}/suspend`, {}, { headers });
      await fetchData(true);
    } catch (error) {
      console.error(error);
      alert('NGO suspension failed');
    }
  };

  const approveVolunteer = async (id) => {
    try {
      await api.put(`/auth/volunteers/${id}/approve`, {}, { headers });
      await fetchData(true);
    } catch (error) {
      console.error(error);
      alert('Volunteer verification failed');
    }
  };

  const rejectVolunteer = async (id) => {
    const rejectionReason = window.prompt('Why is this volunteer being rejected?', 'ID proof could not be verified');
    if (rejectionReason === null) return;
    try {
      await api.put(`/auth/volunteers/${id}/reject`, { rejectionReason }, { headers });
      await fetchData(true);
    } catch (error) {
      console.error(error);
      alert('Volunteer rejection failed');
    }
  };

  const suspendVolunteer = async (id) => {
    if (!window.confirm('Suspend this verified volunteer?')) return;
    try {
      await api.put(`/auth/volunteers/${id}/suspend`, {}, { headers });
      await fetchData(true);
    } catch (error) {
      console.error(error);
      alert('Volunteer suspension failed');
    }
  };

  const filteredNGOs = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return allNGOs;
    return allNGOs.filter((ngo) => [
      ngo.organizationName,
      ngo.ngoDarpanId,
      ngo.registrationNumber,
      ngo.user?.email,
      ngo.location?.address,
    ].some((value) => String(value || '').toLowerCase().includes(query)));
  }, [allNGOs, search]);

  const filteredVolunteers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return allVolunteers;
    return allVolunteers.filter((volunteer) => [
      volunteer.name,
      volunteer.email,
      volunteer.phone,
      volunteer.address,
    ].some((value) => String(value || '').toLowerCase().includes(query)));
  }, [allVolunteers, search]);

  const statusData = analytics?.statusBreakdown || [];
  const donationBarData = statusData.map((item) => ({ name: item._id || 'unknown', count: item.count || 0 }));

  const cards = [
    ['Total NGOs', analytics?.totalNGOs ?? 0, 'building', 'bg-violet-100'],
    ['Verified NGOs', analytics?.verifiedNGOs ?? 0, 'check', 'bg-emerald-100'],
    ['Pending NGOs', analytics?.pendingNGOs ?? pendingNGOs.length, 'clock', 'bg-amber-100'],
    ['Donations', analytics?.totalDonations ?? 0, 'gift', 'bg-blue-100'],
    ['Delivered', analytics?.delivered ?? 0, 'check', 'bg-cyan-100'],
    ['Volunteers', analytics?.totalVolunteers ?? allVolunteers.length, 'users', 'bg-pink-100'],
    ['Pending Volunteers', pendingVolunteers.length, 'clock', 'bg-orange-100'],
    ['Donors', analytics?.totalDonors ?? 0, 'user', 'bg-indigo-100'],
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f8fc]">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 animate-pulse items-center justify-center rounded-2xl bg-violet-100 text-violet-600"><Icon name="shield" size={30} /></div>
          <h2 className="font-black text-slate-900">Loading FoodBridge</h2>
          <p className="mt-1 text-sm text-slate-500">Preparing your admin workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-900">
      <aside className={`fixed inset-y-0 left-0 z-50 w-[270px] transform bg-[#111827] text-white shadow-2xl transition-transform duration-300 lg:translate-x-0 ${mobileMenu ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-full flex-col">
          <div className="flex h-[82px] items-center gap-3 border-b border-white/10 px-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-900/30"><Icon name="heart" size={23} /></div>
            <div><p className="text-lg font-black tracking-tight">FoodBridge</p><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">Admin Console</p></div>
          </div>

          <div className="mx-4 mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center gap-3"><div className="rounded-xl bg-violet-500/15 p-2.5 text-violet-300"><Icon name="shield" size={19} /></div><div><p className="text-sm font-bold">FoodBridge</p><div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-400"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />System operational</div></div></div>
          </div>

          <nav className="mt-7 flex-1 px-3">
            <p className="px-3 pb-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Workspace</p>
            {[
              ['dashboard', 'Dashboard', 'chart'],
              ['ngos', 'NGOs', 'building'],
              ['donations', 'Donations', 'gift'],
              ['volunteers', 'Volunteers', 'users'],
              ['analytics', 'Analytics', 'chart'],
            ].map(([key, label, icon]) => (
              <button key={key} type="button" onClick={() => goTo(key)} className={`mb-1.5 flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-bold transition ${activeSection === key ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                <Icon name={icon} size={18} /> <span>{label}</span>
                {key === 'ngos' && pendingNGOs.length > 0 && <span className="ml-auto rounded-full bg-amber-400 px-2 py-0.5 text-[10px] text-slate-900">{pendingNGOs.length}</span>}
                {key === 'volunteers' && pendingVolunteers.length > 0 && <span className="ml-auto rounded-full bg-pink-400 px-2 py-0.5 text-[10px] text-slate-900">{pendingVolunteers.length}</span>}
              </button>
            ))}

            <p className="px-3 pb-3 pt-7 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">System</p>
            <button type="button" onClick={() => setShowSettings(true)} className="mb-1.5 flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-bold text-slate-400 transition hover:bg-white/5 hover:text-white"><Icon name="settings" size={18} />Settings</button>
          </nav>

          <div className="border-t border-white/10 p-4">
            <div className="mb-3 flex items-center gap-3 rounded-2xl bg-white/[0.04] p-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-xs font-black">F</div><div className="min-w-0"><p className="truncate text-xs font-black">FoodBridge</p><p className="text-[10px] text-slate-500">Administrator</p></div></div>
            <button type="button" onClick={handleLogout} className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-400/20 bg-rose-500/5 px-3 py-2.5 text-xs font-black text-rose-300 transition hover:bg-rose-500/10"><Icon name="logout" size={15} />Logout</button>
          </div>
        </div>
      </aside>

      {mobileMenu && <button type="button" aria-label="Close menu" onClick={() => setMobileMenu(false)} className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden" />}

      <div className="lg:pl-[270px]">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
          <div className="flex h-[76px] items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button type="button" onClick={() => setMobileMenu(true)} className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 lg:hidden"><Icon name="menu" /></button>
            <div className="min-w-0 flex-1"><p className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-600">FoodBridge</p><h1 className="text-lg font-black text-slate-900">{activeSection === 'dashboard' ? 'Dashboard' : activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}</h1></div>

            <div className="hidden w-full max-w-[500px] md:block">
              <div className="relative"><Icon name="search" size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search NGOs, volunteers, emails..." className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-11 pr-4 text-sm outline-none transition focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-500/10" /></div>
            </div>

            <div className="relative">
              <button type="button" onClick={() => setNotificationsOpen((value) => !value)} className="relative rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm hover:bg-slate-50"><Icon name="bell" size={19} />{(pendingNGOs.length + pendingVolunteers.length) > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-orange-500 ring-2 ring-white" />}</button>
              {notificationsOpen && <div className="absolute right-0 top-14 w-80 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl"><p className="font-black text-slate-900">Notifications</p><p className="mt-1 text-xs text-slate-500">Items that need your attention.</p><div className="mt-4 space-y-2">{pendingNGOs.length > 0 && <button type="button" onClick={() => { setNotificationsOpen(false); goTo('ngos'); }} className="w-full rounded-xl bg-amber-50 p-3 text-left text-xs font-bold text-amber-800">{pendingNGOs.length} NGO verification request(s)</button>}{pendingVolunteers.length > 0 && <button type="button" onClick={() => { setNotificationsOpen(false); goTo('volunteers'); }} className="w-full rounded-xl bg-pink-50 p-3 text-left text-xs font-bold text-pink-800">{pendingVolunteers.length} volunteer request(s)</button>}{pendingNGOs.length === 0 && pendingVolunteers.length === 0 && <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">Everything is up to date.</p>}</div></div>}
            </div>

            <button type="button" onClick={() => fetchData(true)} disabled={refreshing} className="hidden items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800 disabled:opacity-60 sm:flex"><Icon name="refresh" size={15} className={refreshing ? 'animate-spin' : ''} />{refreshing ? 'Syncing' : 'Sync'}</button>
            <button type="button" onClick={() => setShowSettings(true)} className="hidden h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 sm:flex"><Icon name="settings" size={17} /></button>
          </div>
        </header>

        <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <section id="section-dashboard" className="scroll-mt-28">
            <div className="relative mb-7 overflow-hidden rounded-[28px] bg-slate-950 px-6 py-8 text-white shadow-2xl sm:px-8 lg:px-10">
              <div className="absolute -right-20 -top-28 h-80 w-80 rounded-full bg-violet-600/20 blur-3xl" />
              <div className="absolute -bottom-32 right-1/3 h-72 w-72 rounded-full bg-fuchsia-500/10 blur-3xl" />
              <div className="relative flex flex-col gap-7 xl:flex-row xl:items-center xl:justify-between">
                <div className="max-w-3xl"><div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.17em] text-violet-200 ring-1 ring-white/10"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />Live platform overview</div><h2 className="text-3xl font-black tracking-tight sm:text-4xl">FoodBridge control center</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">Review organizations, verify volunteers, monitor donations and keep every food delivery moving from one place.</p><div className="mt-6 flex flex-wrap gap-3"><button type="button" onClick={() => goTo('ngos')} className="inline-flex items-center gap-2 rounded-xl bg-violet-500 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-violet-500/20 hover:bg-violet-400">Review NGOs <Icon name="arrow" size={16} /></button><button type="button" onClick={() => goTo('volunteers')} className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-bold text-white ring-1 ring-white/10 hover:bg-white/15">Review volunteers</button></div></div>
                <div className="grid w-full max-w-[470px] grid-cols-2 gap-3"><div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4"><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Pending actions</p><p className="mt-2 text-3xl font-black">{pendingNGOs.length + pendingVolunteers.length}</p><p className="mt-1 text-xs text-slate-400">verifications</p></div><div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4"><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Delivered</p><p className="mt-2 text-3xl font-black text-emerald-300">{analytics?.delivered ?? 0}</p><p className="mt-1 text-xs text-slate-400">food donations</p></div><div className="col-span-2 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-4"><div><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Platform health</p><p className="mt-1 font-black">Operational</p></div><div className="rounded-xl bg-emerald-400/10 p-3 text-emerald-300"><Icon name="shield" size={22} /></div></div></div>
              </div>
            </div>

            <section className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
              {cards.map(([label, value, icon, accent]) => <StatCard key={label} label={label} value={value} icon={icon} accent={accent} />)}
            </section>
          </section>

          <section id="section-analytics" className="mb-8 scroll-mt-28 grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:p-6">
              <SectionHeader eyebrow="Analytics" title="Donation distribution" description="Current donation status across FoodBridge." />
              {statusData.length ? <div className="h-[290px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={statusData} dataKey="count" nameKey="_id" cx="50%" cy="45%" outerRadius={92} innerRadius={56} paddingAngle={4}>{statusData.map((entry, index) => <Cell key={entry._id || index} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}</Pie><Tooltip /><Legend iconType="circle" /></PieChart></ResponsiveContainer></div> : <EmptyState title="No donation data yet" description="Donation activity will appear here once records are available." icon="gift" />}
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:p-6">
              <SectionHeader eyebrow="Operations" title="Donation status volume" description="A quick view of how donation records are progressing." />
              {donationBarData.length ? <div className="h-[290px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={donationBarData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="count" name="Donations" fill="#6d5dfc" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></div> : <EmptyState title="Waiting for activity" description="The chart will populate as donations are created." icon="chart" />}
            </div>
          </section>

          <section id="section-ngos" className="mb-8 scroll-mt-28 rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:p-6">
            <SectionHeader eyebrow="Action required" title="NGO approvals" description="Review registration details and uploaded proof before verification." count={`${pendingNGOs.length} pending`} />
            {pendingNGOs.length === 0 ? <EmptyState title="No pending NGOs" description="All current NGO verification requests have been processed." icon="check" /> : <div className="grid gap-4 xl:grid-cols-2">{pendingNGOs.map((ngo) => <div key={ngo._id} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 transition hover:border-violet-200 hover:bg-white hover:shadow-md"><div className="flex flex-col gap-5 sm:flex-row sm:justify-between"><div className="min-w-0 flex-1"><div className="mb-4 flex items-center gap-3"><div className="rounded-xl bg-violet-100 p-2.5 text-violet-600"><Icon name="building" size={20} /></div><div className="min-w-0"><h3 className="truncate font-black text-slate-900">{ngo.organizationName || 'Unnamed NGO'}</h3><p className="truncate text-xs text-slate-500">{ngo.user?.email || 'Account email unavailable'}</p></div></div><div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2"><p><b className="text-slate-800">Address:</b> {ngo.location?.address || 'Not available'}</p><p><b className="text-slate-800">Capacity:</b> {ngo.capacity || 'Not available'}</p><p><b className="text-slate-800">Registration:</b> {ngo.registrationNumber || 'Not available'}</p><p><b className="text-slate-800">DARPAN ID:</b> {ngo.ngoDarpanId || 'Not available'}</p></div><div className="mt-4 flex flex-wrap gap-2">{ngo.documentData ? <button type="button" onClick={() => setSelectedDocument({ url: ngo.documentData, name: ngo.documentName || 'NGO registration document', type: ngo.documentType })} className="inline-flex items-center gap-2 rounded-xl bg-violet-50 px-3 py-2 text-xs font-black text-violet-700 hover:bg-violet-100"><Icon name="eye" size={15} />View registration document</button> : <span className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-400"><Icon name="file" size={15} />No registration document uploaded</span>}</div></div><div className="flex shrink-0 gap-2 sm:flex-col"><button type="button" onClick={() => approveNGO(ngo._id)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-black text-white hover:bg-slate-800"><Icon name="check" size={16} />Verify</button><button type="button" onClick={() => rejectNGO(ngo._id)} className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm font-black text-rose-700 hover:bg-rose-100">Reject</button></div></div></div>)}</div>}
          </section>

          <section id="section-volunteers" className="mb-8 scroll-mt-28 rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:p-6">
            <SectionHeader eyebrow="Action required" title="Volunteer approvals" description="Review volunteer details and uploaded ID proof before allowing pickup assignments." count={`${pendingVolunteers.length} pending`} />
            {pendingVolunteers.length === 0 ? <EmptyState title="No pending volunteers" description="There are currently no volunteer requests waiting for verification." icon="check" /> : <div className="grid gap-4 xl:grid-cols-2">{pendingVolunteers.map((volunteer) => <div key={volunteer._id} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 transition hover:border-pink-200 hover:bg-white hover:shadow-md"><div className="flex flex-col gap-5 sm:flex-row sm:justify-between"><div className="min-w-0 flex-1"><div className="mb-4 flex items-center gap-3"><div className="rounded-xl bg-pink-100 p-2.5 text-pink-600"><Icon name="user" size={20} /></div><div className="min-w-0"><h3 className="truncate font-black text-slate-900">{volunteer.name || 'Unnamed volunteer'}</h3><p className="truncate text-xs text-slate-500">{volunteer.email || 'Email unavailable'}</p></div></div><div className="space-y-2 text-sm text-slate-600"><p><b className="text-slate-800">Phone:</b> {volunteer.phone || 'Not provided'}</p><p><b className="text-slate-800">Address:</b> {volunteer.address || 'Not provided'}</p><p><b className="text-slate-800">Registered:</b> {formatDate(volunteer.createdAt)}</p></div><div className="mt-4 flex flex-wrap gap-2">{volunteer.idProofData ? <button type="button" onClick={() => setSelectedDocument({ url: volunteer.idProofData, name: volunteer.idProofName || 'Volunteer ID proof', type: volunteer.idProofType })} className="inline-flex items-center gap-2 rounded-xl bg-violet-50 px-3 py-2 text-xs font-black text-violet-700 hover:bg-violet-100"><Icon name="eye" size={15} />View ID proof</button> : <span className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-400"><Icon name="file" size={15} />No ID proof uploaded</span>}</div></div><div className="flex shrink-0 gap-2 sm:flex-col"><button type="button" onClick={() => approveVolunteer(volunteer._id)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-black text-white hover:bg-slate-800"><Icon name="check" size={16} />Verify</button><button type="button" onClick={() => rejectVolunteer(volunteer._id)} className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm font-black text-rose-700 hover:bg-rose-100">Reject</button></div></div></div>)}</div>}
          </section>

          <section id="section-donations" className="mb-8 scroll-mt-28 rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:p-6">
            <SectionHeader eyebrow="Operations" title="Recent donations" description="Latest donation activity, assignments and certificate readiness." count={`${analytics?.recentDonations?.length || 0} recent`} />
            <div className="overflow-hidden rounded-2xl border border-slate-200"><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50"><tr className="border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500"><th className="px-4 py-3 font-black">Donation</th><th className="px-4 py-3 font-black">Donor</th><th className="px-4 py-3 font-black">NGO</th><th className="px-4 py-3 font-black">Volunteer</th><th className="px-4 py-3 font-black">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{(analytics?.recentDonations || []).map((donation) => <tr key={donation._id} className="transition hover:bg-slate-50"><td className="px-4 py-4"><p className="font-bold text-slate-800">{foodSummary(donation.foodItems)}</p><p className="mt-1 text-xs text-slate-400">{formatDate(donation.createdAt)}</p></td><td className="px-4 py-4 text-slate-600">{donation.donor?.name || 'Unknown'}</td><td className="px-4 py-4 text-slate-600">{donation.assignedNGO?.organizationName || 'Not assigned'}</td><td className="px-4 py-4 text-slate-600">{donation.assignedVolunteer?.name || 'Not assigned'}</td><td className="px-4 py-4"><StatusBadge status={donation.status || 'pending'} /></td></tr>)}{!(analytics?.recentDonations || []).length && <tr><td colSpan="5" className="p-5"><EmptyState title="No donations yet" description="Recent donation records will appear here." icon="gift" /></td></tr>}</tbody></table></div></div>
          </section>

          <section className="mb-8 grid gap-5 xl:grid-cols-2">
            <div id="section-ngos-directory" className="scroll-mt-28 rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:p-6"><SectionHeader eyebrow="Directory" title="All NGO records" description="Search, review and manage registered organizations." count={`${filteredNGOs.length} organizations`} /><div className="overflow-hidden rounded-2xl border border-slate-200"><div className="max-h-[440px] overflow-auto"><table className="min-w-full text-left text-sm"><thead className="sticky top-0 bg-slate-50"><tr className="border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500"><th className="px-4 py-3 font-black">Organization</th><th className="px-4 py-3 font-black">DARPAN ID</th><th className="px-4 py-3 font-black">Status</th><th className="px-4 py-3 text-right font-black">Action</th></tr></thead><tbody className="divide-y divide-slate-100">{filteredNGOs.map((ngo) => { const status = statusLabel(ngo); return <tr key={ngo._id} className="hover:bg-slate-50"><td className="px-4 py-4"><p className="font-bold text-slate-800">{ngo.organizationName || 'Unnamed NGO'}</p><p className="mt-1 max-w-[220px] truncate text-xs text-slate-400">{ngo.user?.email || ngo.location?.address || '—'}</p></td><td className="px-4 py-4 text-slate-600">{ngo.ngoDarpanId || '—'}</td><td className="px-4 py-4"><StatusBadge status={status} /></td><td className="px-4 py-4 text-right">{ngo.documentData && <button type="button" onClick={() => setSelectedDocument({ url: ngo.documentData, name: ngo.documentName || 'NGO registration document', type: ngo.documentType })} className="mr-2 rounded-lg px-2.5 py-1.5 text-xs font-black text-violet-600 hover:bg-violet-50">View</button>}{status === 'verified' && <button type="button" onClick={() => suspendNGO(ngo._id)} className="rounded-lg px-2.5 py-1.5 text-xs font-black text-rose-600 hover:bg-rose-50">Suspend</button>}</td></tr>; })}{!filteredNGOs.length && <tr><td colSpan="4" className="p-4"><EmptyState title="No NGO records found" description="Try another search term." icon="building" /></td></tr>}</tbody></table></div></div></div>

            <div id="section-volunteers-directory" className="scroll-mt-28 rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:p-6"><SectionHeader eyebrow="Directory" title="All volunteer records" description="Review volunteer status and manage verified accounts." count={`${filteredVolunteers.length} volunteers`} /><div className="overflow-hidden rounded-2xl border border-slate-200"><div className="max-h-[440px] overflow-auto"><table className="min-w-full text-left text-sm"><thead className="sticky top-0 bg-slate-50"><tr className="border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500"><th className="px-4 py-3 font-black">Volunteer</th><th className="px-4 py-3 font-black">Phone</th><th className="px-4 py-3 font-black">Status</th><th className="px-4 py-3 text-right font-black">Action</th></tr></thead><tbody className="divide-y divide-slate-100">{filteredVolunteers.map((volunteer) => { const status = volunteer.verificationStatus || (volunteer.isVerified ? 'verified' : 'pending'); return <tr key={volunteer._id} className="hover:bg-slate-50"><td className="px-4 py-4"><p className="font-bold text-slate-800">{volunteer.name || 'Unnamed volunteer'}</p><p className="mt-1 max-w-[220px] truncate text-xs text-slate-400">{volunteer.email || '—'}</p></td><td className="px-4 py-4 text-slate-600">{volunteer.phone || '—'}</td><td className="px-4 py-4"><StatusBadge status={status} /></td><td className="px-4 py-4 text-right">{volunteer.idProofData && <button type="button" onClick={() => setSelectedDocument({ url: volunteer.idProofData, name: volunteer.idProofName || 'Volunteer ID proof', type: volunteer.idProofType })} className="mr-2 rounded-lg px-2.5 py-1.5 text-xs font-black text-violet-600 hover:bg-violet-50">View</button>}{status === 'verified' && <button type="button" onClick={() => suspendVolunteer(volunteer._id)} className="rounded-lg px-2.5 py-1.5 text-xs font-black text-rose-600 hover:bg-rose-50">Suspend</button>}</td></tr>; })}{!filteredVolunteers.length && <tr><td colSpan="4" className="p-4"><EmptyState title="No volunteer records found" description="Try another search term." icon="users" /></td></tr>}</tbody></table></div></div></div>
          </section>

          <footer className="border-t border-slate-200 py-8 text-center text-xs text-slate-400">FoodBridge Admin Console · Secure platform operations</footer>
        </main>
      </div>

      {selectedDocument && <DocumentModal document={selectedDocument} onClose={() => setSelectedDocument(null)} />}

      {showSettings && <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" onMouseDown={() => setShowSettings(false)}><div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl" onMouseDown={(event) => event.stopPropagation()}><div className="flex items-start justify-between"><div><div className="mb-3 inline-flex rounded-xl bg-violet-50 p-2.5 text-violet-600"><Icon name="settings" size={20} /></div><h3 className="text-xl font-black text-slate-900">Settings</h3><p className="mt-1 text-sm text-slate-500">Quick admin controls for this session.</p></div><button type="button" onClick={() => setShowSettings(false)} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"><Icon name="close" size={19} /></button></div><div className="mt-6 space-y-3"><div className="flex items-center justify-between rounded-2xl border border-slate-200 p-4"><div><p className="text-sm font-black text-slate-800">Session</p><p className="text-xs text-slate-500">Admin access is currently active.</p></div><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700">Active</span></div><button type="button" onClick={() => { setShowSettings(false); fetchData(true); }} className="flex w-full items-center justify-between rounded-2xl border border-slate-200 p-4 text-left hover:bg-slate-50"><div><p className="text-sm font-black text-slate-800">Refresh platform data</p><p className="text-xs text-slate-500">Fetch the latest NGO, volunteer and donation records.</p></div><Icon name="refresh" size={18} /></button><button type="button" onClick={handleLogout} className="flex w-full items-center justify-between rounded-2xl border border-rose-100 bg-rose-50 p-4 text-left text-rose-700 hover:bg-rose-100"><div><p className="text-sm font-black">Logout</p><p className="text-xs text-rose-500">End this admin session.</p></div><Icon name="logout" size={18} /></button></div></div></div>}
    </div>
  );
}

export default AdminDashboard;
