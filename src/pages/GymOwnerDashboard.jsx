import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, LayoutDashboard, Images, MessageSquare, Megaphone,
  Plus, Send, Trash2, Upload, X, ChevronDown, Users, Star,
  TrendingUp, Edit2, ArrowLeft, RefreshCw, Image, Check,
} from 'lucide-react';
import AppNav from '../components/AppNav.jsx';
import { useToast } from '../context/ToastContext.jsx';
import api from '../services/api.js';
import { GYM_TYPES, TYPE_COLORS, CAMPAIGN_TYPES } from '../utils/gymConstants.js';

const BASE_URL = import.meta.env.VITE_BASE_URL ?? 'http://127.0.0.1:8000';

/* ── Helpers ──────────────────────────────────────────── */
const mediaUrl = (p) => (p?.startsWith('http') ? p : `${BASE_URL}${p}`);

const tabCls = (active) =>
  `flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all whitespace-nowrap ${
    active
      ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
      : 'text-gray-400 hover:text-white hover:bg-gray-800'
  }`;

const inputCls =
  'w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-all text-sm';

/* ── Skeleton ─────────────────────────────────────────── */
function Skel({ h = 'h-4', w = 'w-full', extra = '' }) {
  return <div className={`${h} ${w} bg-gray-800 rounded-lg animate-pulse ${extra}`} />;
}

/* ── Stat card ────────────────────────────────────────── */
function StatCard({ label, value, Icon, color }) {
  return (
    <div className="bg-gray-800/60 border border-gray-700/50 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-bold text-white">{value ?? '—'}</p>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   TAB: OVERVIEW
══════════════════════════════════════════════════════════ */
function OverviewTab({ gym }) {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Members" value={gym.member_count}     Icon={Users}      color="bg-violet-500/20 text-violet-400" />
        <StatCard label="Rating"  value={gym.rating ? `${gym.rating}★` : '—'} Icon={Star} color="bg-yellow-500/20 text-yellow-400" />
        <StatCard label="Reviews" value={gym.review_count}     Icon={TrendingUp} color="bg-emerald-500/20 text-emerald-400" />
        <StatCard label="Followers" value={gym.follower_count} Icon={Users}      color="bg-cyan-500/20 text-cyan-400" />
      </div>

      {/* Gym info summary */}
      <div className="bg-gray-800/40 border border-gray-700/50 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-white">Gym Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {[
            ['Type',    GYM_TYPES[gym.gym_type] || gym.gym_type],
            ['City',    gym.city],
            ['Phone',   gym.phone],
            ['Email',   gym.email],
            ['Website', gym.website],
            ['Monthly Fee', gym.monthly_fee ? `₹${gym.monthly_fee}` : '—'],
          ].map(([k, v]) => v && (
            <div key={k} className="flex gap-2">
              <span className="text-gray-500 w-24 flex-shrink-0">{k}</span>
              <span className="text-gray-300 truncate">{v}</span>
            </div>
          ))}
        </div>
        {gym.description && (
          <p className="text-sm text-gray-400 border-t border-gray-700/50 pt-4">{gym.description}</p>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   TAB: GALLERY
══════════════════════════════════════════════════════════ */
function GalleryTab({ gym }) {
  const { showToast } = useToast();
  const [media, setMedia] = useState(gym.gallery ?? []);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const upload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        const data = await api.uploadGymMedia(gym.id, file);
        setMedia(m => [...m, data]);
      }
      showToast('Media uploaded!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setUploading(false);
      fileRef.current.value = '';
    }
  };

  const remove = async (mediaId) => {
    try {
      await api.deleteGymMedia(mediaId);
      setMedia(m => m.filter(x => x.id !== mediaId));
      showToast('Removed.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">{media.length} photo{media.length !== 1 ? 's' : ''}</p>
        <label className="cursor-pointer">
          <div className={`flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-xl text-sm font-medium text-white transition-all ${uploading ? 'opacity-60 cursor-wait' : ''}`}>
            <Upload className="w-4 h-4" />
            {uploading ? 'Uploading…' : 'Upload Photos'}
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={upload} disabled={uploading} />
        </label>
      </div>

      {media.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-700 rounded-2xl">
          <Image className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No photos yet. Upload some to attract members!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {media.map((m) => (
            <div key={m.id} className="relative group aspect-square">
              <img src={mediaUrl(m.image)} alt="" className="w-full h-full object-cover rounded-xl border border-gray-700" />
              <button onClick={() => remove(m.id)}
                className="absolute top-2 right-2 w-7 h-7 bg-gray-900/80 rounded-full flex items-center justify-center text-gray-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   TAB: CONVERSATIONS
══════════════════════════════════════════════════════════ */
function ConversationsTab({ gym }) {
  const { showToast } = useToast();
  const [convs, setConvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const loadConvs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getGymInbox();
      setConvs(Array.isArray(data) ? data : data.results ?? []);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [gym.id]);

  useEffect(() => { loadConvs(); }, [loadConvs]);

  const openConv = async (userId) => {
    setActive(userId);
    setMsgLoading(true);
    try {
      const data = await api.getGymMessages(gym.id, userId);
      setMessages(Array.isArray(data) ? data : data.results ?? []);
    } catch { /* silent */ } finally {
      setMsgLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  const sendReply = async () => {
    if (!reply.trim() || sending) return;
    setSending(true);
    try {
      const data = await api.sendGymMessage(gym.id, { receiver: active, message: reply.trim() });
      setMessages(m => [...m, data]);
      setReply('');
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex gap-4 h-[500px]">
      {/* Inbox list */}
      <div className="w-64 flex-shrink-0 flex flex-col bg-gray-800/40 border border-gray-700/50 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-700/50 flex items-center justify-between">
          <span className="text-sm font-medium text-white">Inbox</span>
          <button onClick={loadConvs} className="text-gray-500 hover:text-gray-300 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-3 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => <Skel key={i} h="h-12" />)}
            </div>
          ) : convs.length === 0 ? (
            <p className="text-xs text-gray-600 text-center py-8 px-4">No conversations yet.</p>
          ) : (
            convs.map((c) => (
              <button key={c.user_id || c.id} onClick={() => openConv(c.user_id || c.id)}
                className={`w-full text-left px-4 py-3 border-b border-gray-700/30 transition-colors ${
                  active === (c.user_id || c.id) ? 'bg-violet-600/20' : 'hover:bg-gray-700/30'
                }`}>
                <p className="text-sm font-medium text-white truncate">{c.username || c.user_name || `User ${c.user_id}`}</p>
                <p className="text-xs text-gray-500 truncate mt-0.5">{c.last_message || 'No messages yet'}</p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Thread */}
      <div className="flex-1 flex flex-col bg-gray-800/40 border border-gray-700/50 rounded-2xl overflow-hidden min-w-0">
        {!active ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-10 h-10 text-gray-700 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Select a conversation</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {msgLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className={`flex ${i % 2 === 0 ? '' : 'justify-end'}`}>
                      <Skel h="h-10" w="w-48" />
                    </div>
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <p className="text-center text-sm text-gray-600 mt-8">No messages yet. Start the conversation!</p>
              ) : (
                messages.map((m, i) => {
                  const isOwner = m.sender_type === 'gym' || m.is_owner;
                  return (
                    <div key={m.id || i} className={`flex ${isOwner ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-sm px-4 py-2.5 rounded-2xl text-sm ${
                        isOwner ? 'bg-violet-600 text-white' : 'bg-gray-700 text-gray-200'
                      }`}>
                        <p>{m.message || m.content}</p>
                        <p className={`text-xs mt-1 ${isOwner ? 'text-violet-200' : 'text-gray-500'}`}>
                          {m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            <div className="p-3 border-t border-gray-700/50">
              <div className="flex gap-2">
                <input value={reply} onChange={e => setReply(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                  className={`${inputCls} py-2`} placeholder="Type a reply…" />
                <button onClick={sendReply} disabled={!reply.trim() || sending}
                  className="flex-shrink-0 w-10 h-10 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 rounded-xl flex items-center justify-center transition-all">
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   TAB: CAMPAIGNS
══════════════════════════════════════════════════════════ */
function CampaignsTab({ gym }) {
  const { showToast } = useToast();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ type: 'announcement', subject: '', message: '' });

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getGymCampaigns(gym.id);
        setCampaigns(Array.isArray(data) ? data : data.results ?? []);
      } catch { /* silent */ } finally {
        setLoading(false);
      }
    })();
  }, [gym.id]);

  const send = async (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) {
      showToast('Subject and message are required.', 'error'); return;
    }
    setSending(true);
    try {
      const data = await api.sendGymCampaign(gym.id, form);
      setCampaigns(c => [data, ...c]);
      setComposing(false);
      setForm({ type: 'announcement', subject: '', message: '' });
      showToast('Campaign sent!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSending(false);
    }
  };

  const typeLabel = (t) => CAMPAIGN_TYPES.find(x => x.value === t)?.label ?? t;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">{campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''} sent</p>
        <button onClick={() => setComposing(v => !v)}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-xl text-sm font-medium text-white transition-all">
          {composing ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {composing ? 'Cancel' : 'New Campaign'}
        </button>
      </div>

      {/* Compose form */}
      {composing && (
        <form onSubmit={send} className="bg-gray-800/60 border border-violet-500/30 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-violet-300 flex items-center gap-2">
            <Megaphone className="w-4 h-4" /> New Campaign
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Campaign Type</label>
              <select className={inputCls} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {CAMPAIGN_TYPES.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Subject</label>
              <input className={inputCls} placeholder="e.g. 20% off this month!"
                value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Message</label>
            <textarea className={`${inputCls} resize-none`} rows={4}
              placeholder="Write your campaign message…"
              value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} />
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={sending}
              className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 rounded-xl text-sm font-medium text-white transition-all">
              {sending ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : <Send className="w-4 h-4" />}
              {sending ? 'Sending…' : 'Send to All Members'}
            </button>
          </div>
        </form>
      )}

      {/* History */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skel key={i} h="h-20" />)}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-700 rounded-2xl">
          <Megaphone className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No campaigns yet. Engage your members!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c, i) => (
            <div key={c.id || i} className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-violet-500/20 text-violet-300 border border-violet-500/30 px-2 py-0.5 rounded-full">
                    {typeLabel(c.campaign_type || c.type)}
                  </span>
                  <h4 className="text-sm font-medium text-white">{c.subject}</h4>
                </div>
                <span className="text-xs text-gray-600">
                  {c.created_at ? new Date(c.created_at).toLocaleDateString() : ''}
                </span>
              </div>
              <p className="text-sm text-gray-400 line-clamp-2">{c.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   MAIN DASHBOARD
══════════════════════════════════════════════════════════ */
const GYM_TABS = [
  { key: 'overview',       label: 'Overview',       Icon: LayoutDashboard },
  { key: 'gallery',        label: 'Gallery',        Icon: Images },
  { key: 'conversations',  label: 'Conversations',  Icon: MessageSquare },
  { key: 'campaigns',      label: 'Campaigns',      Icon: Megaphone },
];

export default function GymOwnerDashboard() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [gyms, setGyms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeGym, setActiveGym] = useState(null);
  const [tab, setTab] = useState('overview');
  const [gymPickerOpen, setGymPickerOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getMyGyms();
        const list = Array.isArray(data) ? data : data.results ?? [];
        setGyms(list);
        if (list.length > 0) setActiveGym(list[0]);
      } catch (err) {
        showToast(err.message || 'Failed to load gyms.', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const gym = activeGym;

  return (
    <div className="min-h-screen bg-gray-950">
      <AppNav />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <button onClick={() => navigate('/gyms')}
              className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm mb-2 transition-colors">
              <ArrowLeft className="w-4 h-4" /> All Gyms
            </button>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Building2 className="w-6 h-6 text-violet-400" /> Owner Dashboard
            </h1>
          </div>

          <button onClick={() => navigate('/gyms/register')}
            className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 rounded-xl text-sm font-medium text-white transition-all self-start sm:self-auto">
            <Plus className="w-4 h-4" /> Register New Gym
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skel h="h-14" />
            <Skel h="h-64" />
          </div>
        ) : gyms.length === 0 ? (
          <div className="text-center py-24 bg-gray-900 border border-gray-800 rounded-2xl">
            <Building2 className="w-14 h-14 text-gray-700 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">No gyms yet</h2>
            <p className="text-gray-500 mb-6 text-sm">Register your first gym to start managing it here.</p>
            <button onClick={() => navigate('/gyms/register')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-500 rounded-xl text-sm font-semibold text-white transition-all">
              <Plus className="w-4 h-4" /> Register a Gym
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Gym selector */}
            {gyms.length > 1 && (
              <div className="relative">
                <button onClick={() => setGymPickerOpen(v => !v)}
                  className="flex items-center gap-3 w-full sm:w-auto bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white hover:border-gray-600 transition-all">
                  {gym?.logo && (
                    <img src={mediaUrl(gym.logo)} alt="" className="w-7 h-7 rounded-lg object-cover flex-shrink-0" />
                  )}
                  <span className="font-medium truncate">{gym?.name}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 ml-auto flex-shrink-0 transition-transform ${gymPickerOpen ? 'rotate-180' : ''}`} />
                </button>

                {gymPickerOpen && (
                  <div className="absolute top-full left-0 mt-1 w-72 bg-gray-900 border border-gray-700 rounded-xl shadow-xl z-10 overflow-hidden">
                    {gyms.map(g => (
                      <button key={g.id} onClick={() => { setActiveGym(g); setTab('overview'); setGymPickerOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                          g.id === gym?.id ? 'bg-violet-600/20 text-violet-300' : 'text-gray-300 hover:bg-gray-800'
                        }`}>
                        {g.logo
                          ? <img src={mediaUrl(g.logo)} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                          : <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0"><Building2 className="w-4 h-4 text-gray-600" /></div>}
                        <div className="text-left min-w-0">
                          <p className="font-medium truncate">{g.name}</p>
                          <p className="text-xs text-gray-500">{g.city}</p>
                        </div>
                        {g.id === gym?.id && <Check className="w-4 h-4 ml-auto flex-shrink-0" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Single gym header card */}
            {gym && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                {/* Cover */}
                <div className="h-32 sm:h-40 bg-gray-800 relative">
                  {gym.cover_image
                    ? <img src={mediaUrl(gym.cover_image)} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-gradient-to-br from-violet-900/40 to-gray-800" />}
                </div>

                <div className="px-5 pb-5 -mt-8 flex items-end gap-4">
                  <div className="w-16 h-16 rounded-2xl border-4 border-gray-900 overflow-hidden bg-gray-800 flex-shrink-0">
                    {gym.logo
                      ? <img src={mediaUrl(gym.logo)} alt="" className="w-full h-full object-cover" />
                      : <Building2 className="w-8 h-8 text-gray-600 m-auto mt-3" />}
                  </div>
                  <div className="pb-1 min-w-0 flex-1">
                    <h2 className="text-lg font-bold text-white truncate">{gym.name}</h2>
                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${TYPE_COLORS[gym.gym_type] || 'bg-gray-700 text-gray-300 border-gray-600'}`}>
                        {GYM_TYPES[gym.gym_type] || gym.gym_type}
                      </span>
                      <span className="text-xs text-gray-500">{gym.city}</span>
                    </div>
                  </div>
                  <button onClick={() => navigate(`/gyms/${gym.id}`)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-xs text-gray-300 transition-all flex-shrink-0">
                    <Edit2 className="w-3.5 h-3.5" /> View Page
                  </button>
                </div>

                {/* Tabs */}
                <div className="border-t border-gray-800 px-4 py-2 flex gap-1 overflow-x-auto scrollbar-hide">
                  {GYM_TABS.map(({ key, label, Icon }) => (
                    <button key={key} onClick={() => setTab(key)} className={tabCls(tab === key)}>
                      <Icon className="w-3.5 h-3.5" /> {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tab content */}
            {gym && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 sm:p-6">
                {tab === 'overview'      && <OverviewTab      gym={gym} />}
                {tab === 'gallery'       && <GalleryTab       gym={gym} />}
                {tab === 'conversations' && <ConversationsTab gym={gym} />}
                {tab === 'campaigns'     && <CampaignsTab     gym={gym} />}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
