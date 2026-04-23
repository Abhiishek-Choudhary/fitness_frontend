import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Dumbbell, ChevronLeft, ChevronRight, Newspaper, FileText, Rss,
  Users, Menu, X, Home, LayoutDashboard, Activity, LogOut, Info, Building2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const links = [
  { path: '/profile',   label: 'Home',       Icon: Home },
  { path: '/dashboard', label: 'Dashboard',   Icon: LayoutDashboard },
  { path: '/fitness',   label: 'Progress',    Icon: Activity },
  { path: '/reports',   label: 'Reports',     Icon: FileText },
  { path: '/feed',      label: 'Feed',        Icon: Rss },
  { path: '/community', label: 'Community',   Icon: Users },
  { path: '/gyms',      label: 'Gyms',        Icon: Building2 },
  { path: '/news',      label: 'News',        Icon: Newspaper },
  { path: '/about',     label: 'About',       Icon: Info },
];

const AppNav = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate('/about', { replace: true });
  };

  const go = (path) => { setMenuOpen(false); navigate(path); };

  return (
    <>
      <nav className="bg-gray-950/90 backdrop-blur-xl border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">

          {/* Left: back/forward + logo + desktop links */}
          <div className="flex items-center gap-1.5 min-w-0">

            {/* Back / Forward */}
            <div className="flex items-center gap-0.5 mr-1 flex-shrink-0">
              <button onClick={() => navigate(-1)} title="Go back"
                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-all">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => navigate(1)} title="Go forward"
                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-all">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Logo */}
            <button onClick={() => go('/profile')} className="flex items-center gap-2 mr-2 flex-shrink-0">
              <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center">
                <Dumbbell className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold text-white text-sm hidden sm:block">FitTrack AI</span>
            </button>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-0.5">
              {links.map(({ path, label, Icon }) => (
                <button key={path} onClick={() => go(path)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-all whitespace-nowrap ${
                    pathname === path ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}>
                  <Icon className="w-3.5 h-3.5 opacity-70" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Right: sign out (desktop) + hamburger (mobile) */}
          <div className="flex items-center gap-2">
            <button onClick={handleLogout}
              className="hidden md:block px-4 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm text-gray-300 hover:text-white transition-all">
              Sign out
            </button>
            <button onClick={() => setMenuOpen((v) => !v)}
              className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-all">
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-40" onClick={() => setMenuOpen(false)}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Slide-in panel */}
          <div
            className="absolute top-0 left-0 h-full w-72 max-w-[85vw] bg-gray-950 border-r border-gray-800 flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center">
                  <Dumbbell className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="font-bold text-white text-sm">FitTrack AI</span>
              </div>
              <button onClick={() => setMenuOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Links */}
            <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
              {links.map(({ path, label, Icon }) => (
                <button key={path} onClick={() => go(path)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                    pathname === path
                      ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}>
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {label}
                </button>
              ))}
            </nav>

            {/* Sign out */}
            <div className="px-3 py-4 border-t border-gray-800">
              <button onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all">
                <LogOut className="w-4 h-4 flex-shrink-0" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AppNav;
