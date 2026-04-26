import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Building2, MapPin, Phone, Mail, Globe, Users, BadgeCheck, Heart,
  Send, ChevronLeft, Loader2, AlertCircle, Clock, Star,
  Image as ImageIcon, Settings, Megaphone, Dumbbell,
} from 'lucide-react';
import AppNav from '../components/AppNav.jsx';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { GYM_TYPES, TYPE_COLORS, DAYS } from '../utils/gymConstants.js';
import { SkeletonBlock } from '../components/ui/Skeleton.jsx';

/* ── Opening hours display ── */
function OpeningHours({ hours }) {
  if (!hours || !Object.keys(hours).length) return <p className="text-gray-500 text-sm">Not specified</p>;
  return (
    <div className="space-y-1.5">
      {DAYS.map(({ key, short }) => (
        <div key={key} className="flex items-center gap-4 text-sm">
          <span className="w-8 text-gray-500 text-xs uppercase font-medium">{short}</span>
          {hours[key]
            ? <span className="text-white">{hours[key].open} – {hours[key].close}</span>
            : <span className="text-gray-600 italic text-xs">Closed</span>
          }
        </div>
      ))}
    </div>
  );
}

/* ── Amenity pill ── */
const AmenityPill = ({ label }) => (
  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs text-gray-300">
    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" />
    {label}
  </span>
);

/* ── Skeleton hero ── */
function DetailSkeleton() {
  return (
    <div>
      <SkeletonBlock className="h-52 w-full rounded-none" />
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        <SkeletonBlock className="h-7 w-64" />
        <SkeletonBlock className="h-4 w-48" />
        <SkeletonBlock className="h-10 w-full" />
        <SkeletonBlock className="h-48 w-full" />
      </div>
    </div>
  );
}

/* ── Messages tab ── */
function MessagesTab({ gymId, user }) {
  const showToast = useToast();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    api.getGymMessages(gymId)
      .then((d) => setMessages(Array.isArray(d) ? d : []))
      .catch(() => setMessages([]))
      .finally(() => setLoading(false));
  }, [gymId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      const msg = await api.sendGymMessage(gymId, { content: text.trim() });
      setMessages((p) => [...p, msg]);
      setText('');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSending(false);
    }
  };

  if (!user) return (
    <div className="text-center py-12">
      <Send className="w-8 h-8 mx-auto text-gray-700 mb-3" />
      <p className="text-gray-500 text-sm">Log in to message this gym</p>
    </div>
  );

  return (
    <div className="flex flex-col h-[420px]">
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-hide">
        {loading && <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-gray-600 animate-spin" /></div>}
        {!loading && messages.length === 0 && (
          <div className="text-center py-12 text-gray-600 text-sm">No messages yet. Say hello!</div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.is_from_owner ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-xs md:max-w-sm px-4 py-2.5 rounded-2xl text-sm ${
              m.is_from_owner
                ? 'bg-gray-800 text-white rounded-tl-sm'
                : 'bg-violet-600 text-white rounded-tr-sm'
            }`}>
              <p>{m.content}</p>
              <p className={`text-xs mt-1 ${m.is_from_owner ? 'text-gray-500' : 'text-violet-200'}`}>
                {new Date(m.created_at || m.sent_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="pt-3 border-t border-gray-800 flex gap-2 mt-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Type a message…"
          className="flex-1 bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors"
        />
        <button
          onClick={send}
          disabled={sending || !text.trim()}
          className="w-10 h-10 flex items-center justify-center bg-violet-600 hover:bg-violet-500 disabled:opacity-40 rounded-xl transition-all"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

/* ── Campaigns tab ── */
function CampaignsTab({ gymId }) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getGymCampaigns(gymId)
      .then((d) => setCampaigns(Array.isArray(d) ? d : (d.results ?? [])))
      .catch(() => setCampaigns([]))
      .finally(() => setLoading(false));
  }, [gymId]);

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-gray-600 animate-spin" /></div>;
  if (!campaigns.length) return (
    <div className="text-center py-12">
      <Megaphone className="w-8 h-8 mx-auto text-gray-700 mb-3" />
      <p className="text-gray-500 text-sm">No campaigns yet</p>
    </div>
  );
  return (
    <div className="space-y-3">
      {campaigns.map((c) => (
        <div key={c.id} className="bg-gray-900/60 border border-gray-800 rounded-xl p-4">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="font-medium text-white text-sm">{c.subject}</p>
            <span className="text-xs text-gray-600 whitespace-nowrap flex-shrink-0">
              {new Date(c.sent_at).toLocaleDateString()}
            </span>
          </div>
          <p className="text-gray-400 text-sm leading-relaxed line-clamp-3">{c.body}</p>
          <span className="inline-block mt-2 text-xs px-2 py-1 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20 capitalize">
            {c.campaign_type}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Main page ── */
export default function GymDetail() {
  const { gymId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const showToast = useToast();

  const [gym, setGym] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('about');

  const load = () => {
    setLoading(true);
    setError(null);
    api.getGymDetail(gymId)
      .then((d) => { setGym(d); setFollowing(d.is_following ?? false); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };
  useEffect(load, [gymId]);

  const handleFollow = async () => {
    if (!user) { navigate('/login'); return; }
    setFollowLoading(true);
    try {
      const res = await api.followGym(gymId);
      setFollowing(res.following);
      setGym((g) => ({ ...g, followers_count: (g.followers_count ?? 0) + (res.following ? 1 : -1) }));
      showToast(res.message || (res.following ? 'Now following' : 'Unfollowed'), 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-950 text-white"><AppNav /><DetailSkeleton /></div>;
  if (error) return (
    <div className="min-h-screen bg-gray-950 text-white">
      <AppNav />
      <div className="max-w-5xl mx-auto px-4 py-12 text-center">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <p className="text-gray-400 mb-4">{error}</p>
        <button onClick={load} className="px-5 py-2 bg-violet-600 hover:bg-violet-700 rounded-xl text-sm font-medium text-white">Retry</button>
      </div>
    </div>
  );

  const typeColor = TYPE_COLORS[gym.gym_type] || 'bg-gray-700/50 text-gray-300 border-gray-700/50';
  const typeLabel = gym.gym_type_display || GYM_TYPES[gym.gym_type] || gym.gym_type;
  const isOwner = user && gym.owner?.id === user.id;

  const tabs = [
    { id: 'about',     label: 'About' },
    { id: 'gallery',   label: `Gallery${gym.media?.length ? ` (${gym.media.length})` : ''}` },
    { id: 'messages',  label: 'Messages' },
    { id: 'campaigns', label: 'Updates' },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <AppNav />

      {/* Hero cover */}
      <div className="relative h-48 md:h-64 overflow-hidden bg-gradient-to-br from-violet-900/30 to-gray-950">
        {gym.cover_image
          ? <img src={gym.cover_image} alt={gym.name} className="w-full h-full object-cover" />
          : <div className="absolute inset-0 flex items-center justify-center"><Building2 className="w-20 h-20 text-gray-800" /></div>
        }
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/30 to-transparent" />

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-9 h-9 flex items-center justify-center rounded-xl bg-gray-950/70 backdrop-blur-sm border border-gray-700 text-gray-300 hover:text-white transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Gym header */}
      <div className="max-w-5xl mx-auto px-4 md:px-6">
        <div className="flex items-end gap-4 -mt-10 mb-6 relative z-10">
          {/* Logo */}
          <div className="w-20 h-20 rounded-2xl overflow-hidden border-4 border-gray-950 bg-gray-900 flex items-center justify-center flex-shrink-0 shadow-xl">
            {gym.logo
              ? <img src={gym.logo} alt={gym.name} className="w-full h-full object-cover" />
              : <Dumbbell className="w-8 h-8 text-violet-400" />
            }
          </div>
          <div className="flex-1 min-w-0 pb-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl md:text-2xl font-bold text-white truncate">{gym.name}</h1>
              {gym.is_verified && <BadgeCheck className="w-5 h-5 text-blue-400 flex-shrink-0" />}
              <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${typeColor}`}>{typeLabel}</span>
            </div>
            <p className="text-sm text-gray-500 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              {[gym.address, gym.city, gym.state, gym.country].filter(Boolean).join(', ')}
            </p>
          </div>
          <div className="flex items-center gap-2 pb-1 flex-shrink-0">
            {isOwner && (
              <button
                onClick={() => navigate('/gyms/dashboard')}
                className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-sm text-gray-300 hover:text-white transition-all"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Manage</span>
              </button>
            )}
            <button
              onClick={handleFollow}
              disabled={followLoading}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                following
                  ? 'bg-blue-500/10 border border-blue-500/30 text-blue-300 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-300'
                  : 'bg-violet-600 hover:bg-violet-500 text-white'
              }`}
            >
              {followLoading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Heart className={`w-4 h-4 ${following ? 'fill-current' : ''}`} />
              }
              <span className="hidden sm:inline">{following ? 'Following' : 'Follow'}</span>
              <span className="text-xs opacity-70">· {gym.followers_count ?? 0}</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 overflow-x-auto scrollbar-hide mb-6">
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                activeTab === id ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── ABOUT ── */}
        {activeTab === 'about' && (
          <div className="space-y-5 pb-10">
            {gym.description && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">About</h3>
                <p className="text-gray-300 text-sm leading-relaxed">{gym.description}</p>
              </div>
            )}

            {gym.amenities?.length > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Amenities</h3>
                <div className="flex flex-wrap gap-2">
                  {gym.amenities.map((a) => <AmenityPill key={a} label={a} />)}
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Opening Hours
                </h3>
                <OpeningHours hours={gym.opening_hours} />
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Contact</h3>
                {gym.monthly_fee && parseFloat(gym.monthly_fee) > 0 && (
                  <div className="flex items-center gap-3">
                    <Star className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Monthly Fee</p>
                      <p className="text-white font-semibold">₹{parseFloat(gym.monthly_fee).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                )}
                {gym.phone && (
                  <a href={`tel:${gym.phone}`} className="flex items-center gap-3 hover:text-violet-400 transition-colors">
                    <Phone className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <span className="text-sm text-gray-300">{gym.phone}</span>
                  </a>
                )}
                {gym.email && (
                  <a href={`mailto:${gym.email}`} className="flex items-center gap-3 hover:text-violet-400 transition-colors">
                    <Mail className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <span className="text-sm text-gray-300">{gym.email}</span>
                  </a>
                )}
                {gym.website && (
                  <a href={gym.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-violet-400 transition-colors">
                    <Globe className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <span className="text-sm text-gray-300 truncate">{gym.website.replace(/^https?:\/\//, '')}</span>
                  </a>
                )}
                {!gym.phone && !gym.email && !gym.website && (
                  <p className="text-gray-600 text-sm">No contact info provided</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── GALLERY ── */}
        {activeTab === 'gallery' && (
          <div className="pb-10">
            {gym.media?.length === 0 && (
              <div className="text-center py-16">
                <ImageIcon className="w-10 h-10 mx-auto text-gray-700 mb-3" />
                <p className="text-gray-500 text-sm">No photos uploaded yet</p>
              </div>
            )}
            {gym.media?.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {gym.media.map((m) => (
                  <div key={m.id} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-800">
                    <img src={m.image} alt={m.caption || ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    {m.caption && (
                      <div className="absolute inset-x-0 bottom-0 bg-gray-950/80 px-2 py-1.5">
                        <p className="text-xs text-gray-300 truncate">{m.caption}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── MESSAGES ── */}
        {activeTab === 'messages' && (
          <div className="pb-10">
            <MessagesTab gymId={gymId} user={user} />
          </div>
        )}

        {/* ── CAMPAIGNS ── */}
        {activeTab === 'campaigns' && (
          <div className="pb-10">
            <CampaignsTab gymId={gymId} />
          </div>
        )}
      </div>
    </div>
  );
}
