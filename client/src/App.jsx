import { Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/useAuth';
import { getUserInfo } from './context/useUserInfo';

import Signup from './pages/Signup';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import ForgotPassword from './pages/ForgotPassword';
import CreateDonation from './pages/CreateDonation';
import MyDonations from './pages/MyDonations';

import NGODashboard from './pages/NGODashboard';
import VolunteerDashboard from './pages/VolunteerDashboard';
import TrackDelivery from './pages/TrackDelivery';
import QRScanner from './pages/QRScanner';
import AdminDashboard from './pages/AdminDashboard';

import DonorDashboard from './pages/DonorDashboard';
import DonorProfile from './pages/DonorProfile';
import DonorCertificates from './pages/DonorCertificates';


/* =========================================================
   NAVBAR
========================================================= */

function Navbar() {
  const { currentUser, logout } = useAuth();
  const userInfo = getUserInfo();
  const location = useLocation();

  const isHome = location.pathname === '/';

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <nav className="h-[68px] bg-white/95 backdrop-blur-xl border border-gray-200/80 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="h-full px-5 lg:px-7 flex items-center justify-between">

            {/* BRAND */}
            <Link to="/" className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-xl bg-[#14532D] flex items-center justify-center overflow-hidden">
                <div className="absolute w-16 h-16 bg-green-400/20 rounded-full blur-xl" />

                <svg
                  className="relative w-5 h-5 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M20.5 3.5C13 3.7 7.5 6.1 5 10.5c-1.8 3.2-.8 6.8 2.2 8.4 3 1.6 6.4.1 8.1-2.8 1.7-3 1.8-6.5 1.8-8.7" />
                  <path d="M4 20c2.8-4.5 6.4-7.5 11-9" />
                </svg>
              </div>

              <div>
                <div className="text-[19px] leading-none font-black tracking-[-0.03em] text-gray-950">
                  Food<span className="text-[#16803C]">Bridge</span>
                </div>

                <div className="text-[8px] uppercase tracking-[0.14em] text-gray-400 mt-1 whitespace-nowrap">
                  Bridging Food Surplus &amp; Hunger
                </div>
              </div>
            </Link>


            {/* DESKTOP NAV */}
            <div className="hidden lg:flex items-center">

              {currentUser && userInfo ? (
                <>
                  {/* ADMIN */}
                  {userInfo.role === 'admin' && (
                    <Link
                      to="/admin"
                      className="px-4 py-2.5 text-sm font-semibold text-gray-600 hover:text-[#16803C] transition"
                    >
                      Dashboard
                    </Link>
                  )}


                  {/* DONOR */}
                  {userInfo.role === 'donor' && (
                    <>
                      <Link
                        to="/donor-dashboard"
                        className="px-4 py-2.5 text-sm font-semibold text-gray-600 hover:text-[#16803C] transition"
                      >
                        Dashboard
                      </Link>

                      <Link
                        to="/create-donation"
                        className="px-4 py-2.5 text-sm font-semibold text-gray-600 hover:text-[#16803C] transition"
                      >
                        Donate Food
                      </Link>

                      <Link
                        to="/my-donations"
                        className="px-4 py-2.5 text-sm font-semibold text-gray-600 hover:text-[#16803C] transition"
                      >
                        Donations
                      </Link>

                      <Link
                        to="/donor-certificates"
                        className="px-4 py-2.5 text-sm font-semibold text-gray-600 hover:text-[#16803C] transition"
                      >
                        Certificates
                      </Link>
                    </>
                  )}


                  {/* NGO */}
                  {userInfo.role === 'ngo' && (
                    <Link
                      to="/ngo-dashboard"
                      className="px-4 py-2.5 text-sm font-semibold text-gray-600 hover:text-[#16803C] transition"
                    >
                      NGO Dashboard
                    </Link>
                  )}


                  {/* VOLUNTEER */}
                  {userInfo.role === 'volunteer' && (
                    <>
                      <Link
                        to="/volunteer-dashboard"
                        className="px-4 py-2.5 text-sm font-semibold text-gray-600 hover:text-[#16803C] transition"
                      >
                        My Tasks
                      </Link>

                      <Link
                        to="/scan"
                        className="px-4 py-2.5 text-sm font-semibold text-gray-600 hover:text-[#16803C] transition"
                      >
                        Scan QR
                      </Link>
                    </>
                  )}


                  {/* USER PROFILE */}
                  <div className="ml-4 pl-4 border-l border-gray-200 flex items-center gap-3">

                    <div className="w-9 h-9 rounded-full bg-[#E8F5EC] border border-[#CFE8D5] flex items-center justify-center text-[#166534] text-sm font-bold">
                      {userInfo.name?.charAt(0).toUpperCase()}
                    </div>

                    <div className="hidden xl:block">
                      <div className="text-[13px] font-bold text-gray-900 leading-tight">
                        {userInfo.name}
                      </div>

                      <div className="text-[10px] text-gray-400 capitalize mt-0.5">
                        {userInfo.role}
                      </div>
                    </div>

                    <button
                      onClick={logout}
                      className="ml-1 text-xs font-bold text-gray-500 hover:text-red-600 transition"
                    >
                      Logout
                    </button>

                  </div>
                </>

              ) : (

                <>
                  {/* PUBLIC NAV */}
                  {isHome && (
                    <>
                      <a
                        href="#how-it-works"
                        className="px-4 py-2.5 text-sm font-semibold text-gray-600 hover:text-[#16803C] transition"
                      >
                        How It Works
                      </a>

                      <a
                        href="#impact"
                        className="px-4 py-2.5 text-sm font-semibold text-gray-600 hover:text-[#16803C] transition"
                      >
                        Our Impact
                      </a>

                      <a
                        href="#technology"
                        className="px-4 py-2.5 text-sm font-semibold text-gray-600 hover:text-[#16803C] transition"
                      >
                        Technology
                      </a>
                    </>
                  )}

                  <Link
                    to="/login"
                    className="ml-2 px-4 py-2.5 text-sm font-bold text-gray-700 hover:text-[#16803C] transition"
                  >
                    Sign in
                  </Link>

                  <Link
                    to="/signup"
                    className="ml-2 px-5 py-2.5 rounded-xl bg-[#111827] text-white text-sm font-bold hover:bg-[#14532D] transition shadow-lg shadow-gray-900/10"
                  >
                    Get Started
                  </Link>
                </>
              )}

            </div>


            {/* MOBILE */}
            {!currentUser && (
              <Link
                to="/signup"
                className="lg:hidden px-4 py-2.5 rounded-xl bg-[#111827] text-white text-xs font-bold"
              >
                Get Started
              </Link>
            )}

          </div>
        </nav>
      </div>
    </header>
  );
}


/* =========================================================
   SECTION LABEL
========================================================= */

function SectionLabel({ children }) {
  return (
    <div className="inline-flex items-center gap-2 text-[#16803C] text-[11px] font-black uppercase tracking-[0.2em]">
      <span className="w-6 h-px bg-[#16803C]" />
      {children}
    </div>
  );
}


/* =========================================================
   HOME
========================================================= */

function Home() {

  const steps = [
    {
      number: '01',
      title: 'List surplus food',
      description:
        'Donors provide essential details such as quantity, location and preferred pickup time.',
    },
    {
      number: '02',
      title: 'Smart matching',
      description:
        'FoodBridge identifies a suitable verified NGO based on location and requirements.',
    },
    {
      number: '03',
      title: 'Confirm collection',
      description:
        'The NGO accepts the donation and the system generates a secure pickup OTP.',
    },
    {
      number: '04',
      title: 'Verify pickup',
      description:
        'The volunteer confirms collection using an OTP shared by the donor.',
    },
    {
      number: '05',
      title: 'Track delivery',
      description:
        'The donation journey remains visible until the food reaches its destination.',
    },
  ];


  const features = [
    {
      title: 'Intelligent Matching',
      description:
        'Connect surplus food with suitable nearby organizations using location-aware matching.',
      icon: '01',
    },
    {
      title: 'OTP Verification',
      description:
        'Create a reliable chain of custody with secure, OTP-based pickup verification.',
      icon: '02',
    },
    {
      title: 'Live Visibility',
      description:
        'Track the movement of every accepted donation from collection to delivery.',
      icon: '03',
    },
  ];


  return (
    <main className="min-h-screen bg-[#FAFCFA] text-gray-900 overflow-hidden">

      <Navbar />


      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="relative pt-36 lg:pt-40 pb-24">

        {/* BACKGROUND */}
        <div className="absolute inset-0 pointer-events-none">

          <div className="absolute top-0 left-0 right-0 h-[650px] bg-gradient-to-b from-[#EEF8F1] via-[#F7FBF8] to-transparent" />

          <div className="absolute -top-20 -left-20 w-96 h-96 bg-green-200/25 rounded-full blur-3xl" />

          <div className="absolute top-20 right-0 w-96 h-96 bg-orange-100/30 rounded-full blur-3xl" />

        </div>


        <div className="relative max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">

          <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-16 items-center">


            {/* LEFT */}
            <div>

              <SectionLabel>
                Bridging Food Surplus &amp; Hunger
              </SectionLabel>


              <h1 className="mt-6 text-[52px] sm:text-[64px] lg:text-[76px] font-black leading-[0.96] tracking-[-0.055em] text-gray-950">

                Bridging Food
                <br />

                <span className="text-[#16803C]">
                  Surplus &
                </span>

                <br />

                Hunger

              </h1>


              <p className="mt-7 max-w-xl text-[17px] md:text-[19px] leading-[1.7] text-gray-500">
                FoodBridge is a technology-driven food redistribution platform
                connecting surplus food with verified NGOs and volunteers —
                efficiently, transparently and in real time.
              </p>


              {/* CTA */}
              <div className="flex flex-wrap gap-3 mt-9">

                <Link
                  to="/create-donation"
                  className="group px-7 py-4 rounded-xl bg-[#14532D] text-white font-bold text-sm hover:bg-[#166534] transition shadow-xl shadow-green-900/15"
                >
                  Donate Surplus Food

                  <span className="inline-block ml-3 group-hover:translate-x-1 transition">
                    →
                  </span>
                </Link>


                <Link
                  to="/signup"
                  className="px-7 py-4 rounded-xl bg-white border border-gray-200 text-gray-900 font-bold text-sm hover:border-green-300 hover:text-[#16803C] transition"
                >
                  Join the Network
                </Link>

              </div>


              {/* TRUST ROW */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-10">

                <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
                  <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center">
                    ✓
                  </span>
                  Verified organizations
                </div>


                <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
                  <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center">
                    ✓
                  </span>
                  Secure verification
                </div>


                <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
                  <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center">
                    ✓
                  </span>
                  Real-time tracking
                </div>

              </div>

            </div>


            {/* RIGHT */}
            <div className="relative">

              <div className="absolute -inset-5 rounded-[36px] bg-gradient-to-br from-green-200/40 to-orange-100/40 blur-2xl" />

              <div className="relative rounded-[30px] overflow-hidden bg-gray-900 shadow-2xl shadow-gray-900/20">

                <img
                  src="https://images.unsplash.com/photo-1593113646773-028c64a8f1b8?auto=format&fit=crop&w=1200&q=90"
                  alt="Food donation volunteers"
                  className="w-full h-[560px] object-cover"
                  onError={(e) => {
                    e.target.src = 'https://picsum.photos/id/1080/1200/900';
                  }}
                />


                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />


                {/* IMAGE CONTENT */}
                <div className="absolute left-6 right-6 bottom-6">

                  <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-5 shadow-2xl">

                    <div className="flex items-center justify-between">

                      <div className="flex items-center gap-4">

                        <div className="w-12 h-12 rounded-xl bg-[#E9F7ED] flex items-center justify-center">

                          <svg
                            className="w-6 h-6 text-[#16803C]"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>

                        </div>


                        <div>

                          <div className="text-sm font-black text-gray-900">
                            Pickup Verified
                          </div>

                          <div className="text-xs text-gray-500 mt-1">
                            OTP authentication completed
                          </div>

                        </div>

                      </div>


                      <div className="hidden sm:block text-right">

                        <div className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                          STATUS
                        </div>

                        <div className="flex items-center gap-1.5 mt-1 text-xs font-bold text-green-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          Active
                        </div>

                      </div>

                    </div>

                  </div>

                </div>

              </div>


              {/* FLOATING IMPACT CARD */}
              <div className="hidden md:block absolute -left-8 top-16 bg-white rounded-2xl border border-gray-100 shadow-xl p-5">

                <div className="text-[9px] uppercase tracking-widest text-gray-400 font-black">
                  Platform Impact
                </div>

                <div className="text-3xl font-black text-gray-950 mt-2">
                  2.4K+
                </div>

                <div className="text-xs font-semibold text-gray-500 mt-1">
                  donations connected
                </div>

                <div className="flex items-center gap-1 mt-3 text-[10px] font-bold text-green-600">
                  <span>↗</span>
                  Growing every day
                </div>

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          IMPACT
      ===================================================== */}

      <section
        id="impact"
        className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 pb-28"
      >

        <div className="border-y border-gray-200 py-10">

          <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-200">

            <div className="px-6 py-3 md:py-0">

              <div className="text-4xl font-black tracking-tight text-gray-950">
                40%
              </div>

              <div className="text-sm font-bold text-gray-800 mt-2">
                Food wastage
              </div>

              <div className="text-xs text-gray-400 mt-1">
                A challenge requiring better redistribution
              </div>

            </div>


            <div className="px-6 py-6 md:py-0">

              <div className="text-4xl font-black tracking-tight text-gray-950">
                820M+
              </div>

              <div className="text-sm font-bold text-gray-800 mt-2">
                People facing hunger
              </div>

              <div className="text-xs text-gray-400 mt-1">
                Food access remains a global challenge
              </div>

            </div>


            <div className="px-6 py-6 md:py-0">

              <div className="text-4xl font-black tracking-tight text-gray-950">
                24/7
              </div>

              <div className="text-sm font-bold text-gray-800 mt-2">
                Digital coordination
              </div>

              <div className="text-xs text-gray-400 mt-1">
                Connecting the redistribution ecosystem
              </div>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          HOW IT WORKS
      ===================================================== */}

      <section
        id="how-it-works"
        className="bg-white border-y border-gray-100 py-28"
      >

        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">

          <div className="max-w-3xl">

            <SectionLabel>
              How it works
            </SectionLabel>

            <h2 className="mt-5 text-4xl md:text-5xl font-black tracking-[-0.04em] text-gray-950">
              From surplus to impact,
              <span className="text-[#16803C]">
                {' '}systematically.
              </span>
            </h2>

            <p className="mt-5 text-lg leading-relaxed text-gray-500">
              FoodBridge simplifies the entire redistribution workflow through
              digital coordination, verification and visibility.
            </p>

          </div>


          <div className="mt-16 grid md:grid-cols-5 gap-4">

            {steps.map((step, index) => (

              <div
                key={step.number}
                className="relative group"
              >

                <div className="h-full rounded-2xl border border-gray-200 bg-[#FBFCFB] p-6 hover:bg-white hover:shadow-xl hover:shadow-gray-900/5 hover:-translate-y-1 transition-all">

                  <div className="flex items-center justify-between">

                    <span className="text-[11px] font-black tracking-widest text-gray-300">
                      {step.number}
                    </span>

                    {index !== steps.length - 1 && (
                      <span className="hidden md:block text-gray-300">
                        →
                      </span>
                    )}

                  </div>


                  <div className="w-10 h-1 bg-[#16803C] rounded-full mt-7 mb-5 group-hover:w-16 transition-all" />

                  <h3 className="text-base font-black text-gray-900">
                    {step.title}
                  </h3>

                  <p className="text-sm leading-relaxed text-gray-500 mt-3">
                    {step.description}
                  </p>

                </div>

              </div>

            ))}

          </div>

        </div>

      </section>


      {/* =====================================================
          TECHNOLOGY
      ===================================================== */}

      <section
        id="technology"
        className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-28"
      >

        <div className="grid lg:grid-cols-2 gap-20 items-center">


          {/* LEFT */}
          <div>

            <SectionLabel>
              Built for accountability
            </SectionLabel>

            <h2 className="mt-5 text-4xl md:text-5xl font-black tracking-[-0.04em] text-gray-950">
              A digital layer for
              <span className="text-[#16803C]">
                {' '}food redistribution.
              </span>
            </h2>

            <p className="mt-6 text-lg leading-relaxed text-gray-500">
              Instead of relying on fragmented communication, FoodBridge
              creates a connected workflow between donors, NGOs and volunteers.
            </p>


            <div className="mt-9 space-y-2">

              {features.map((feature) => (

                <div
                  key={feature.icon}
                  className="group flex gap-5 p-5 rounded-2xl hover:bg-white hover:shadow-lg hover:shadow-gray-900/5 transition"
                >

                  <div className="w-10 h-10 shrink-0 rounded-xl bg-[#EFF8F1] flex items-center justify-center text-[10px] font-black text-[#16803C]">
                    {feature.icon}
                  </div>

                  <div>

                    <h3 className="font-black text-gray-900">
                      {feature.title}
                    </h3>

                    <p className="text-sm leading-relaxed text-gray-500 mt-1.5 max-w-md">
                      {feature.description}
                    </p>

                  </div>

                </div>

              ))}

            </div>

          </div>


          {/* RIGHT DASHBOARD */}
          <div className="relative">

            <div className="absolute -inset-4 rounded-[35px] bg-green-100/40 blur-2xl" />

            <div className="relative rounded-[28px] bg-[#101714] p-6 md:p-8 shadow-2xl shadow-gray-900/20">

              {/* HEADER */}
              <div className="flex items-center justify-between pb-6 border-b border-white/10">

                <div>

                  <div className="text-[9px] uppercase tracking-[0.2em] text-gray-500 font-black">
                    FoodBridge Network
                  </div>

                  <div className="text-xl font-black text-white mt-1">
                    Operations Overview
                  </div>

                </div>

                <div className="w-9 h-9 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
                  ↗
                </div>

              </div>


              {/* METRICS */}
              <div className="grid grid-cols-2 gap-3 mt-5">

                <div className="rounded-xl bg-white/[0.045] border border-white/[0.07] p-5">

                  <div className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">
                    Active Donations
                  </div>

                  <div className="text-3xl font-black text-white mt-3">
                    128
                  </div>

                  <div className="text-[10px] text-green-400 font-semibold mt-2">
                    +12% this week
                  </div>

                </div>


                <div className="rounded-xl bg-white/[0.045] border border-white/[0.07] p-5">

                  <div className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">
                    Verified NGOs
                  </div>

                  <div className="text-3xl font-black text-white mt-3">
                    180+
                  </div>

                  <div className="text-[10px] text-green-400 font-semibold mt-2">
                    Network growing
                  </div>

                </div>


                <div className="col-span-2 rounded-xl bg-white/[0.045] border border-white/[0.07] p-5">

                  <div className="flex items-end justify-between">

                    <div>

                      <div className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">
                        Successful Deliveries
                      </div>

                      <div className="text-4xl font-black text-white mt-3">
                        96.8%
                      </div>

                    </div>

                    <div className="text-xs font-bold text-green-400">
                      Operational
                    </div>

                  </div>


                  <div className="mt-5 h-2 rounded-full bg-white/10 overflow-hidden">

                    <div className="h-full w-[96.8%] bg-green-500 rounded-full" />

                  </div>

                </div>

              </div>


              {/* ACTIVITY */}
              <div className="mt-5 rounded-xl bg-white/[0.045] border border-white/[0.07] p-5">

                <div className="flex items-center justify-between mb-4">

                  <div className="text-xs font-bold text-gray-300">
                    Recent Activity
                  </div>

                  <div className="text-[9px] text-gray-600 uppercase tracking-widest">
                    Live
                  </div>

                </div>


                {[
                  ['Donation accepted', '2 min ago'],
                  ['Pickup verified', '8 min ago'],
                  ['Delivery completed', '14 min ago'],
                ].map(([title, time]) => (

                  <div
                    key={title}
                    className="flex items-center justify-between py-2.5 border-t border-white/5"
                  >

                    <div className="flex items-center gap-2">

                      <span className="w-1.5 h-1.5 rounded-full bg-green-400" />

                      <span className="text-xs text-gray-400">
                        {title}
                      </span>

                    </div>

                    <span className="text-[9px] text-gray-600">
                      {time}
                    </span>

                  </div>

                ))}

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          PHOTO / MISSION
      ===================================================== */}

      <section className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 pb-28">

        <div className="grid lg:grid-cols-[0.85fr_1.15fr] gap-5">

          <div className="rounded-[26px] overflow-hidden h-[430px]">

            <img
              src="https://images.unsplash.com/photo-1593113630400-ea4288922497?auto=format&fit=crop&w=900&q=90"
              alt="Volunteers preparing food"
              className="w-full h-full object-cover hover:scale-105 transition duration-700"
              onError={(e) => {
                e.target.src = 'https://picsum.photos/id/292/900/700';
              }}
            />

          </div>


          <div className="relative rounded-[26px] overflow-hidden bg-[#14532D] min-h-[430px]">

            <img
              src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1100&q=90"
              alt="Community receiving food"
              className="absolute inset-0 w-full h-full object-cover opacity-20"
              onError={(e) => {
                e.target.src = 'https://picsum.photos/id/1059/1100/700';
              }}
            />


            <div className="relative h-full min-h-[430px] p-8 md:p-12 flex flex-col justify-end">

              <SectionLabel>
                Our mission
              </SectionLabel>

              <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white mt-5 max-w-xl">
                Less waste.
                <br />
                More dignity.
                <br />
                Greater impact.
              </h2>

              <p className="text-green-100/80 max-w-lg mt-5 leading-relaxed">
                We believe technology can make food redistribution faster,
                more transparent and accessible to communities that need it.
              </p>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          CTA
      ===================================================== */}

      <section className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 pb-24">

        <div className="relative overflow-hidden rounded-[30px] bg-[#111827]">

          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-green-500/10 blur-3xl" />

          <div className="absolute -bottom-40 -left-20 w-96 h-96 rounded-full bg-green-500/10 blur-3xl" />

          <div className="relative px-7 py-20 md:px-16 md:py-24 text-center">

            <SectionLabel>
              Join the movement
            </SectionLabel>

            <h2 className="text-4xl md:text-6xl font-black tracking-[-0.04em] text-white mt-5">
              Turn surplus into
              <span className="text-green-400">
                {' '}something meaningful.
              </span>
            </h2>

            <p className="max-w-xl mx-auto text-gray-400 text-lg leading-relaxed mt-6">
              Whether you are a donor, NGO or volunteer, FoodBridge gives you
              the tools to participate in a more connected food ecosystem.
            </p>


            <div className="flex justify-center flex-wrap gap-3 mt-9">

              <Link
                to="/signup"
                className="px-8 py-4 rounded-xl bg-white text-gray-950 font-black text-sm hover:bg-green-50 transition"
              >
                Create an Account →
              </Link>

              <Link
                to="/login"
                className="px-8 py-4 rounded-xl border border-white/15 text-white font-bold text-sm hover:bg-white/5 transition"
              >
                Sign In
              </Link>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="border-t border-gray-200 bg-white">

        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-12">

          <div className="grid md:grid-cols-3 gap-10 items-start">

            {/* BRAND */}
            <div>

              <Link to="/" className="flex items-center gap-3">

                <div className="w-9 h-9 rounded-lg bg-[#14532D] flex items-center justify-center text-white">

                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M20.5 3.5C13 3.7 7.5 6.1 5 10.5c-1.8 3.2-.8 6.8 2.2 8.4 3 1.6 6.4.1 8.1-2.8 1.7-3 1.8-6.5 1.8-8.7" />
                    <path d="M4 20c2.8-4.5 6.4-7.5 11-9" />
                  </svg>

                </div>

                <span className="font-black text-gray-950">
                  Food<span className="text-[#16803C]">Bridge</span>
                </span>

              </Link>


              <p className="text-sm text-gray-400 leading-relaxed mt-4 max-w-xs">
                Bridging Food Surplus &amp; Hunger — a technology-driven
                platform for smarter food redistribution and measurable
                social impact.
              </p>

            </div>


            {/* PLATFORM */}
            <div>

              <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                Platform
              </div>

              <div className="flex flex-col gap-3 mt-4">

                <Link
                  to="/signup"
                  className="text-sm text-gray-500 hover:text-green-700 transition"
                >
                  Create Account
                </Link>

                <Link
                  to="/login"
                  className="text-sm text-gray-500 hover:text-green-700 transition"
                >
                  Sign In
                </Link>

                <Link
                  to="/create-donation"
                  className="text-sm text-gray-500 hover:text-green-700 transition"
                >
                  Donate Food
                </Link>

              </div>

            </div>


            {/* STATUS */}
            <div className="md:text-right">

              <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                Platform Status
              </div>

              <div className="inline-flex items-center gap-2 mt-4 text-sm font-semibold text-gray-500">

                <span className="w-2 h-2 rounded-full bg-green-500" />

                All systems operational

              </div>

            </div>

          </div>


          <div className="border-t border-gray-100 mt-10 pt-6 flex flex-col sm:flex-row justify-between gap-3">

            <div className="text-xs text-gray-400">
              © 2026 FoodBridge. All rights reserved.
            </div>

            <div className="text-xs text-gray-400">
              Bridging Food Surplus &amp; Hunger.
            </div>

          </div>

        </div>

      </footer>

    </main>
  );
}


/* =========================================================
   ROLE GUARD
========================================================= */

function RoleGuard({ role, children }) {
  const userInfo = getUserInfo();

  if (!userInfo) {
    return <Navigate to="/login" replace />;
  }

  if (userInfo.role !== role) {
    const destination =
      userInfo.role === 'volunteer'
        ? '/volunteer-dashboard'
        : userInfo.role === 'ngo'
        ? '/ngo-dashboard'
        : userInfo.role === 'admin'
        ? '/admin'
        : '/donor-dashboard';

    return <Navigate to={destination} replace />;
  }

  return children;
}


/* =========================================================
   ROUTES
========================================================= */

function App() {
  return (
    <Routes>

      {/* PUBLIC */}
      <Route path="/" element={<Home />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin-login" element={<AdminLogin />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />


      {/* DONOR */}
      <Route
        path="/create-donation"
        element={<CreateDonation />}
      />

      <Route
        path="/my-donations"
        element={<MyDonations />}
      />

      <Route
        path="/donor-dashboard"
        element={
          <RoleGuard role="donor">
            <DonorDashboard />
          </RoleGuard>
        }
      />

      <Route
        path="/donor-profile"
        element={<DonorProfile />}
      />

      <Route
        path="/donor-certificates"
        element={<DonorCertificates />}
      />


      {/* NGO */}
      <Route
        path="/ngo-dashboard"
        element={<NGODashboard />}
      />


      {/* VOLUNTEER */}
      <Route
        path="/volunteer-dashboard"
        element={
          <RoleGuard role="volunteer">
            <VolunteerDashboard />
          </RoleGuard>
        }
      />

      <Route
        path="/scan"
        element={
          <RoleGuard role="volunteer">
            <QRScanner />
          </RoleGuard>
        }
      />

      <Route
        path="/track/:donationId"
        element={<TrackDelivery />}
      />


      {/* ADMIN */}
      <Route
        path="/admin"
        element={
          <RoleGuard role="admin">
            <AdminDashboard />
          </RoleGuard>
        }
      />

    </Routes>
  );
}

export default App;