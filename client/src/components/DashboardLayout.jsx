import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { getUserInfo } from '../context/useUserInfo';

function DashboardLayout({ children, navItems = [] }) {
  const { logout } = useAuth();
  const userInfo = getUserInfo();
  const location = useLocation();

  const userName = userInfo?.name || 'User';
  const userRole = userInfo?.role || 'User';
  const initial = userName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-[#f7f9f8] text-gray-900">

      {/* =====================================================
          SIDEBAR
      ====================================================== */}

      <aside className="fixed left-0 top-0 z-40 h-screen w-[292px] bg-[#0e1623] text-white flex flex-col border-r border-[#1d2735]">

        {/* Brand */}

        <div className="px-6 py-6 border-b border-[#1d2735]">

          <Link
            to="/"
            className="flex items-center gap-3 group"
          >

            <div className="relative">

              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-xl shadow-lg shadow-green-900/20 group-hover:scale-105 transition-transform">
                🌿
              </div>

              <span className="absolute -right-0.5 -bottom-0.5 w-3.5 h-3.5 rounded-full bg-green-400 border-[3px] border-[#0e1623]"></span>

            </div>

            <div>

              <div className="text-[21px] font-extrabold tracking-tight">
                FoodBridge
              </div>

              <div className="text-[9px] font-semibold tracking-[0.22em] text-gray-500 mt-0.5">
                FOOD • PEOPLE • IMPACT
              </div>

            </div>

          </Link>

        </div>


        {/* =================================================
            USER PROFILE
        ================================================== */}

        <div className="px-5 pt-6">

          <div className="rounded-2xl border border-[#263244] bg-[#151e2c] p-4 shadow-sm">

            <div className="flex items-center gap-3">

              <div className="relative shrink-0">

                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-xl font-extrabold shadow-md">
                  {initial}
                </div>

                <span className="absolute -right-1 -bottom-1 w-4 h-4 rounded-full bg-green-400 border-[3px] border-[#151e2c]"></span>

              </div>


              <div className="min-w-0">

                <p className="font-bold text-white truncate">
                  {userName}
                </p>

                <p className="text-sm text-gray-400 capitalize mt-0.5">
                  {userRole} Account
                </p>

              </div>

            </div>


            <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#253143]">

              <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-green-500/10 border border-green-500/20 text-[11px] font-bold text-green-400">

                <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>

                Active

              </span>

              <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-500">
                Verified
              </span>

            </div>

          </div>

        </div>


        {/* =================================================
            NAVIGATION
        ================================================== */}

        <nav className="flex-1 px-4 pt-7 overflow-y-auto">

          <div className="flex items-center justify-between px-3 mb-3">

            <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-gray-500">
              Main Menu
            </span>

            <span className="text-[9px] uppercase tracking-wider text-gray-600">
              Menu
            </span>

          </div>


          <div className="space-y-1.5">

            {navItems.map((item) => {

              const isActive =
                location.pathname === item.path ||
                location.pathname.startsWith(`${item.path}/`);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`group relative flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-950/20'
                      : 'text-gray-400 hover:text-white hover:bg-[#182231]'
                  }`}
                >

                  {/* Active indicator */}

                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-7 rounded-r-full bg-green-300"></span>
                  )}


                  {/* Icon */}

                  <span
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition ${
                      isActive
                        ? 'bg-white/10'
                        : 'bg-[#192332] group-hover:bg-[#223044]'
                    }`}
                  >
                    {item.icon || '•'}
                  </span>


                  <span className="flex-1">
                    {item.label}
                  </span>


                  <span
                    className={`text-sm transition-transform ${
                      isActive
                        ? 'text-white translate-x-0'
                        : 'text-gray-600 group-hover:text-gray-300 group-hover:translate-x-0.5'
                    }`}
                  >
                    →
                  </span>

                </Link>
              );
            })}

          </div>

        </nav>


        {/* =================================================
            SIDEBAR FOOTER
        ================================================== */}

        <div className="px-4 pb-5">

          {/* System Status */}

          <div className="rounded-xl bg-[#151e2c] border border-[#263244] px-4 py-3 mb-3">

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-2">

                <span className="relative flex w-2.5 h-2.5">

                  <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-40 animate-ping"></span>

                  <span className="relative inline-flex rounded-full w-2.5 h-2.5 bg-green-400"></span>

                </span>

                <span className="text-xs font-semibold text-gray-300">
                  System operational
                </span>

              </div>

              <span className="text-[10px] font-bold text-green-400">
                ONLINE
              </span>

            </div>

          </div>


          {/* Logout */}

          <button
            type="button"
            onClick={logout}
            className="w-full group flex items-center gap-3 px-3 py-3 rounded-xl text-left text-sm font-semibold text-gray-400 hover:text-red-300 hover:bg-red-500/5 transition-all"
          >

            <span className="w-10 h-10 rounded-xl bg-[#192332] group-hover:bg-red-500/10 flex items-center justify-center text-base transition">
              🚪
            </span>

            <div className="flex-1">

              <div>
                Sign out
              </div>

              <div className="text-[10px] text-gray-600 group-hover:text-red-400/60 mt-0.5">
                End current session
              </div>

            </div>

          </button>


          {/* Version */}

          <div className="text-center mt-5">

            <p className="text-[9px] text-gray-600">
              FoodBridge • Community Platform
            </p>

          </div>

        </div>

      </aside>


      {/* =====================================================
          MAIN APPLICATION
      ====================================================== */}

      <div className="ml-[292px] min-h-screen">

        {/* =================================================
            TOP HEADER
        ================================================== */}

        <header className="h-[76px] bg-white border-b border-gray-200 sticky top-0 z-30">

          <div className="h-full px-8 flex items-center justify-between">

            {/* Left */}

            <div>

              <p className="text-[11px] font-medium text-gray-400">
                FoodBridge Workspace
              </p>

              <p className="text-sm font-semibold text-gray-700 mt-0.5">
                Community Management Portal
              </p>

            </div>


            {/* Right */}

            <div className="flex items-center gap-5">

              {/* System status */}

              <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-green-50 border border-green-100">

                <span className="w-2 h-2 rounded-full bg-green-500"></span>

                <span className="text-xs font-bold text-green-700">
                  System Active
                </span>

              </div>


              {/* Divider */}

              <div className="hidden sm:block h-8 w-px bg-gray-200"></div>


              {/* User */}

              <div className="flex items-center gap-3">

                <div className="hidden sm:block text-right">

                  <p className="text-sm font-bold text-gray-800">
                    {userName}
                  </p>

                  <p className="text-[11px] text-gray-400 capitalize mt-0.5">
                    {userRole}
                  </p>

                </div>


                <div className="relative">

                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-extrabold shadow-sm">
                    {initial}
                  </div>

                  <span className="absolute -right-1 -bottom-1 w-3.5 h-3.5 rounded-full bg-green-400 border-[3px] border-white"></span>

                </div>

              </div>

            </div>

          </div>

        </header>


        {/* =================================================
            PAGE CONTENT
        ================================================== */}

        <main className="p-6 sm:p-8 xl:p-9 max-w-[1700px]">
          {children}
        </main>

      </div>

    </div>
  );
}

export default DashboardLayout;