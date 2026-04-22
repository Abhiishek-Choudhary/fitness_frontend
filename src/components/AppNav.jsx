import { useNavigate, useLocation } from 'react-router-dom';
import { Dumbbell, ChevronLeft, ChevronRight, Newspaper, FileText, Rss, Users } from 'lucide-react';

/**
 * Shared authenticated navigation bar.
 * Used by: Dashboard, FitnessTracker, FitnessNews, Profile
 */
const AppNav = ({ onLogout }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = () => {
    localStorage.clear();
    if (onLogout) onLogout();
    navigate('/about', { replace: true });
  };

  const links = [
    { path: '/profile',   label: 'Home' },
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/fitness',   label: 'Progress' },
    { path: '/reports',   label: 'Reports' },
    { path: '/feed',      label: 'Feed' },
    { path: '/community', label: 'Community' },
    { path: '/news',      label: 'News' },
    { path: '/about',     label: 'About' },
  ];

  return (
    <nav className="bg-gray-950/90 backdrop-blur-xl border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">

        {/* Left: back/forward + logo + links */}
        <div className="flex items-center gap-1.5 min-w-0">

          {/* Browser-style back / forward */}
          <div className="flex items-center gap-0.5 mr-1 flex-shrink-0">
            <button
              onClick={() => navigate(-1)}
              title="Go back"
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate(1)}
              title="Go forward"
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Logo */}
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2 mr-2 flex-shrink-0"
          >
            <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center">
              <Dumbbell className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-white text-sm hidden sm:block">FitTrack AI</span>
          </button>

          {/* Nav links — hidden on small screens */}
          <div className="hidden md:flex items-center gap-0.5">
            {links.map(({ path, label }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-all whitespace-nowrap ${
                  pathname === path
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                {path === '/news' && (
                  <Newspaper className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5 text-violet-400" />
                )}
                {path === '/reports' && (
                  <FileText className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5 text-blue-400" />
                )}
                {path === '/feed' && (
                  <Rss className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5 text-emerald-400" />
                )}
                {path === '/community' && (
                  <Users className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5 text-pink-400" />
                )}
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Right: sign out */}
        <button
          onClick={handleLogout}
          className="px-4 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm text-gray-300 hover:text-white transition-all flex-shrink-0"
        >
          Sign out
        </button>
      </div>
    </nav>
  );
};

export default AppNav;
