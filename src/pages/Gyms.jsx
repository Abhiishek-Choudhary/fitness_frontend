import { useState, useEffect, useCallback } from 'react';
import {
  Building2, MapPin, Users, Search, Navigation, Loader2, AlertCircle,
  Plus, BadgeCheck, Heart, UserCheck, Dumbbell, X, RefreshCw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AppNav from '../components/AppNav.jsx';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { GYM_TYPES, TYPE_COLORS } from '../utils/gymConstants.js';
import { SkeletonBlock } from '../components/ui/Skeleton.jsx';

/* ── Gym card skeleton ──────────────────────────────────── */
function GymCardSkeleton() {
  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
      <SkeletonBlock className="h-36 w-full rounded-none" />
      <div className="p-4 space-y-3">
        <SkeletonBlock className="h-4 w-40" />
        <SkeletonBlock className="h-3 w-24" />
        <SkeletonBlock className="h-3 w-32" />
      </div>
    </div>
  );
}

/* ── Gym card ───────────────────────────────────────────── */
function GymCard({ gym, isOwner }) {
  const navigate = useNavigate();
  const typeColor = TYPE_COLORS[gym.gym_type] || 'bg-gray-700/50 text-gray-300 border-gray-700/50';
  const typeLabel = gym.gym_type_display || GYM_TYPES[gym.gym_type] || gym.gym_type;

  return (
    <div
      onClick={() => navigate(`/gyms/${gym.id}`)}
      className="bg-gray-900 rounded-2xl border border-gray-800 hover:border-violet-500/40 transition-all duration-200 overflow-hidden cursor-pointer group"
    >
      {/* Cover */}
      <div className="relative h-36 overflow-hidden bg-gradient-to-br from-violet-900/30 via-gray-900 to-gray-950">
        {gym.cover_image
          ? <img src={gym.cover_image} alt={gym.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          : <div className="absolute inset-0 flex items-center justify-center"><Building2 className="w-14 h-14 text-gray-800" /></div>
        }
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-transparent to-transparent" />

        {/* Type badge */}
        <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-lg text-xs font-semibold border ${typeColor}`}>
          {typeLabel}
        </span>

        {/* Logo */}
        <div className="absolute bottom-3 left-3 w-10 h-10 rounded-xl overflow-hidden border-2 border-gray-800 bg-gray-900 flex items-center justify-center">
          {gym.logo
            ? <img src={gym.logo} alt={gym.name} className="w-full h-full object-cover" />
            : <Dumbbell className="w-4 h-4 text-violet-400" />
          }
        </div>

        {/* Verified */}
        {gym.is_verified && (
          <div className="absolute bottom-3 right-3 w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center">
            <BadgeCheck className="w-3.5 h-3.5 text-blue-400" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="min-w-0">
            <h3 className="font-semibold text-white text-sm truncate">{gym.name}</h3>
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{[gym.city, gym.state].filter(Boolean).join(', ')}</span>
            </p>
          </div>
          {gym.monthly_fee && parseFloat(gym.monthly_fee) > 0 && (
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-bold text-white">₹{parseFloat(gym.monthly_fee).toLocaleString('en-IN')}</p>
              <p className="text-xs text-gray-600">/mo</p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 pt-2.5 border-t border-gray-800/60 mt-2.5">
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <Users className="w-3 h-3" /> {gym.followers_count ?? 0}
          </span>
          {gym.distance_km != null && (
            <span className="flex items-center gap-1 text-xs text-violet-400 font-medium">
              <Navigation className="w-3 h-3" /> {parseFloat(gym.distance_km).toFixed(1)} km
            </span>
          )}
          {gym.membership_status === 'member' && (
            <span className="ml-auto flex items-center gap-1 text-xs text-emerald-400">
              <UserCheck className="w-3 h-3" /> Member
            </span>
          )}
          {gym.membership_status === 'following' && gym.membership_status !== 'member' && (
            <span className="ml-auto flex items-center gap-1 text-xs text-blue-400">
              <Heart className="w-3 h-3" /> Following
            </span>
          )}
          {isOwner && (
            <span
              className="ml-auto text-xs text-violet-400 hover:text-violet-300 font-medium"
              onClick={(e) => { e.stopPropagation(); }}
            >
              Owner
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Main page ──────────────────────────────────────────── */
export default function GymBrowse() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState('all');
  const [gyms, setGyms] = useState([]);
  const [myGymIds, setMyGymIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gymType, setGymType] = useState('');
  const [city, setCity] = useState('');
  const [search, setSearch] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [locating, setLocating] = useState(false);

  const fetchGyms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (gymType) params.gym_type = gymType;
      if (city.trim()) params.city = city.trim();

      let results = [];
      if (tab === 'nearby') {
        if (!userLocation) { setLoading(false); return; }
        const data = await api.getNearbyGyms({ lat: userLocation.latitude, lon: userLocation.longitude, ...params });
        results = data.results ?? data;
      } else if (tab === 'my-gyms') {
        const data = await api.getMyGyms();
        results = Array.isArray(data) ? data : (data.results ?? []);
      } else {
        const data = await api.getGyms(params);
        results = data.results ?? data;
      }
      setGyms(results);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [tab, gymType, city, userLocation]);

  useEffect(() => { fetchGyms(); }, [fetchGyms]);

  useEffect(() => {
    if (!user) return;
    api.getMyGyms()
      .then((d) => {
        const arr = Array.isArray(d) ? d : (d.results ?? []);
        setMyGymIds(new Set(arr.map((g) => g.id)));
      })
      .catch(() => {});
  }, [user]);

  const enableNearby = () => {
    setTab('nearby');
    if (userLocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setUserLocation(pos.coords); setLocating(false); },
      () => { setLocating(false); setError('Location access denied. Please allow it in your browser.'); setTab('all'); }
    );
  };

  const filtered = search.trim()
    ? gyms.filter((g) =>
        g.name.toLowerCase().includes(search.toLowerCase()) ||
        g.city?.toLowerCase().includes(search.toLowerCase())
      )
    : gyms;

  const tabs = [
    { id: 'all',     label: 'All Gyms' },
    { id: 'nearby',  label: locating ? '…' : 'Nearby' },
    ...(user ? [{ id: 'my-gyms', label: 'My Gyms' }] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <AppNav />

      {/* Hero */}
      <div className="relative h-36 md:h-52 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1400&h=400&fit=crop&q=80"
          alt="Gyms"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-950/90 via-gray-950/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-center px-4 md:px-10 max-w-7xl mx-auto">
          <p className="text-violet-400 text-xs font-semibold uppercase tracking-widest mb-1">Discover & Connect</p>
          <h1 className="text-xl md:text-4xl font-bold text-white">Find Your Gym</h1>
          <p className="text-gray-300 text-xs md:text-sm mt-1">Browse gyms, follow your favourites, and connect with the community</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-5">

        {/* Search + filters row */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or city…"
              className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <select
            value={gymType}
            onChange={(e) => setGymType(e.target.value)}
            className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors w-full sm:w-44"
          >
            <option value="">All types</option>
            {Object.entries(GYM_TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City…"
            className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors w-full sm:w-36"
          />
          {user && (
            <button
              onClick={() => navigate('/gyms/register')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 rounded-xl text-sm font-medium text-white transition-all whitespace-nowrap"
            >
              <Plus className="w-4 h-4" /> Register Gym
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit">
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => id === 'nearby' ? enableNearby() : setTab(id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                tab === id ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {id === 'nearby' && locating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {id === 'nearby' && !locating && <Navigation className="w-3.5 h-3.5" />}
              {label}
            </button>
          ))}
          <button onClick={fetchGyms} className="p-2 text-gray-600 hover:text-gray-400 rounded-lg hover:bg-gray-800 transition-all">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Nearby badge */}
        {tab === 'nearby' && userLocation && !loading && (
          <div className="flex items-center gap-2 text-sm text-violet-400">
            <Navigation className="w-4 h-4" />
            <span>Showing gyms within 10 km of your location</span>
            <button onClick={() => { setUserLocation(null); setTab('all'); }} className="text-gray-600 hover:text-gray-400 ml-1">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-red-300">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={fetchGyms} className="text-xs underline">Retry</button>
          </div>
        )}

        {/* Nearby — no location yet */}
        {tab === 'nearby' && !userLocation && !locating && !error && (
          <div className="text-center py-20 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto">
              <Navigation className="w-7 h-7 text-violet-400" />
            </div>
            <div>
              <p className="text-white font-medium mb-1">Allow location access</p>
              <p className="text-gray-500 text-sm">We need your location to find gyms near you</p>
            </div>
            <button onClick={enableNearby} className="px-5 py-2 bg-violet-600 hover:bg-violet-700 rounded-xl text-sm font-medium text-white transition-all">
              Enable Location
            </button>
          </div>
        )}

        {/* Skeleton grid */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <GymCardSkeleton key={i} />)}
          </div>
        )}

        {/* Gym grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((gym) => (
              <GymCard key={gym.id} gym={gym} isOwner={myGymIds.has(gym.id)} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filtered.length === 0 && (tab !== 'nearby' || userLocation) && (
          <div className="text-center py-20">
            <div className="w-14 h-14 rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-7 h-7 text-gray-700" />
            </div>
            <p className="text-gray-500 text-sm mb-1">
              {tab === 'my-gyms'
                ? "You haven't registered any gyms yet."
                : search
                  ? `No gyms match "${search}"`
                  : 'No gyms found with the current filters.'}
            </p>
            {user && tab === 'my-gyms' && (
              <button
                onClick={() => navigate('/gyms/register')}
                className="mt-4 px-5 py-2 bg-violet-600 hover:bg-violet-700 rounded-xl text-sm font-medium text-white transition-all"
              >
                Register your gym
              </button>
            )}
          </div>
        )}

        {/* CTA for non-logged-in */}
        {!user && !loading && (
          <div className="mt-6 bg-gradient-to-r from-violet-900/20 to-purple-900/20 border border-violet-500/20 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-white mb-1">Own a gym?</h3>
              <p className="text-sm text-gray-400">List your gym for free and reach thousands of fitness enthusiasts nearby.</p>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 rounded-xl text-sm font-semibold text-white transition-all whitespace-nowrap"
            >
              Get Started — It's Free
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
