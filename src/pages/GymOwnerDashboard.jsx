import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, LayoutDashboard, Images, MessageSquare, Megaphone,
  Plus, Send, Trash2, Upload, X, ChevronDown, Users, Star,
  TrendingUp, Edit2, ArrowLeft, RefreshCw, Image, Check,
  UserCheck, Shield, Save, Pencil, Globe, Phone, Mail,
  DollarSign, Clock, Loader2,
} from 'lucide-react';
import AppNav from '../components/AppNav.jsx';
import { useToast } from '../context/ToastContext.jsx';
import api from '../services/api.js';
import { GYM_TYPES, TYPE_COLORS, CAMPAIGN_TYPES, AMENITIES_LIST, DAYS } from '../utils/gymConstants.js';

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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Members"   value={gym.member_count}                         Icon={Users}      color="bg-violet-500/20 text-violet-400" />
        <StatCard label="Rating"    value={gym.rating ? `${gym.rating}★` : '—'}      Icon={Star}       color="bg-yellow-500/20 text-yellow-400" />
        <StatCard label="Reviews"   value={gym.review_count}                          Icon={TrendingUp} color="bg-emerald-500/20 text-emerald-400" />
        <StatCard label="Followers" value={gym.followers_count ?? gym.follower_count} Icon={Users}      color="bg-cyan-500/20 text-cyan-400" />
      </div>

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
   TAB: EDIT GYM
══════════════════════════════════════════════════════════ */
function EditGymTab({ gym, onSaved }) {
  const showToast = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name:        gym.name        ?? '',
    description: gym.description ?? '',
    gym_type:    gym.gym_type    ?? 'general',
    address:     gym.address     ?? '',
    city:        gym.city        ?? '',
    state:       gym.state       ?? '',
    country:     gym.country     ?? 'India',
    phone:       gym.phone       ?? '',
    email:       gym.email       ?? '',
    website:     gym.website     ?? '',
    monthly_fee: gym.monthly_fee ?? '',
    amenities:   gym.amenities   ?? [],
    opening_hours: gym.opening_hours
      ? Object.fromEntries(
          DAYS.map(({ key }) => {
            const h = gym.opening_hours[key];
            return [key, h ? { open: true, from: h.open ?? h.from ?? '06:00', to: h.close ?? h.to ?? '22:00' } : { open: false, from: '06:00', to: '22:00' }];
          })
        )
      : Object.fromEntries(DAYS.map(({ key }) => [key, { open: true, from: '06:00', to: '22:00' }])),
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const toggleAmenity = (a) =>
    set('amenities', form.amenities.includes(a)
      ? form.amenities.filter(x => x !== a)
      : [...form.amenities, a]);

  const setHours = (day, field, val) =>
    set('opening_hours', { ...form.opening_hours, [day]: { ...form.opening_hours[day], [field]: val } });

  const save = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { showToast('Gym name is required.', 'error'); return; }
    setSaving(true);
    try {
      const payload = {
        name:        form.name.trim(),
        description: form.description.trim(),
        gym_type:    form.gym_type,
        address:     form.address.trim(),
        city:        form.city.trim(),
        state:       form.state.trim(),
        country:     form.country.trim(),
        phone:       form.phone.trim(),
        email:       form.email.trim(),
        website:     form.website.trim(),
        monthly_fee: form.monthly_fee || null,
        amenities:   form.amenities,
        opening_hours: Object.fromEntries(
          Object.entries(form.opening_hours).map(([day, val]) =>
            [day, val.open ? { open: val.from, close: val.to } : null]
          )
        ),
      };
      const updated = await api.updateGym(gym.id, payload);
      showToast('Gym updated!', 'success');
      onSaved(updated);
    } catch (err) {
      showToast(err.message || 'Update failed.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="space-y-6">
      {/* Basic info */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Basic Info</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Gym Name *</label>
            <input className={inputCls} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Iron Temple Gym" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Gym Type</label>
            <select className={inputCls} value={form.gym_type} onChange={e => set('gym_type', e.target.value)}>
              {Object.entries(GYM_TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Description</label>
          <textarea className={`${inputCls} resize-none`} rows={3} value={form.description}
            onChange={e => set('description', e.target.value)} placeholder="What makes your gym special…" />
        </div>
      </div>

      {/* Location */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Location</h3>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Street Address</label>
          <input className={inputCls} value={form.address} onChange={e => set('address', e.target.value)} placeholder="123 Fitness Street" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">City</label>
            <input className={inputCls} value={form.city} onChange={e => set('city', e.target.value)} placeholder="Mumbai" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">State</label>
            <input className={inputCls} value={form.state} onChange={e => set('state', e.target.value)} placeholder="Maharashtra" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Country</label>
            <input className={inputCls} value={form.country} onChange={e => set('country', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Contact & Fee */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Contact & Pricing</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5"><Phone className="inline w-3 h-3 mr-1" />Phone</label>
            <input className={inputCls} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 98765 43210" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5"><Mail className="inline w-3 h-3 mr-1" />Email</label>
            <input className={inputCls} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="gym@example.com" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5"><Globe className="inline w-3 h-3 mr-1" />Website</label>
            <input className={inputCls} value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://yourgym.com" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5"><DollarSign className="inline w-3 h-3 mr-1" />Monthly Fee (₹)</label>
            <input className={inputCls} type="number" min="0" value={form.monthly_fee} onChange={e => set('monthly_fee', e.target.value)} placeholder="1500" />
          </div>
        </div>
      </div>

      {/* Amenities */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Amenities</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {AMENITIES_LIST.map(a => {
            const checked = form.amenities.includes(a);
            return (
              <button key={a} type="button" onClick={() => toggleAmenity(a)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all text-left ${
                  checked ? 'bg-violet-600/20 border-violet-500/50 text-violet-300' : 'bg-gray-800/60 border-gray-700 text-gray-400 hover:border-gray-600'
                }`}>
                <div className={`w-4 h-4 rounded-md border flex items-center justify-center flex-shrink-0 transition-all ${checked ? 'bg-violet-600 border-violet-600' : 'border-gray-600'}`}>
                  {checked && <Check className="w-2.5 h-2.5 text-white" />}
                </div>
                {a}
              </button>
            );
          })}
        </div>
      </div>

      {/* Opening hours */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-2">
          <Clock className="w-4 h-4" /> Opening Hours
        </h3>
        <div className="space-y-2">
          {DAYS.map(({ key, short }) => {
            const h = form.opening_hours[key];
            return (
              <div key={key} className="flex items-center gap-3 bg-gray-800/50 rounded-xl px-4 py-2.5 border border-gray-700/50">
                <span className="w-8 text-sm font-medium text-gray-400">{short}</span>
                <button type="button" onClick={() => setHours(key, 'open', !h.open)}
                  className={`relative inline-flex w-9 h-5 rounded-full transition-colors flex-shrink-0 ${h.open ? 'bg-violet-600' : 'bg-gray-700'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${h.open ? 'translate-x-4' : ''}`} />
                </button>
                {h.open ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input type="time" value={h.from} onChange={e => setHours(key, 'from', e.target.value)}
                      className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:border-violet-500" />
                    <span className="text-gray-600 text-sm">to</span>
                    <input type="time" value={h.to} onChange={e => setHours(key, 'to', e.target.value)}
                      className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:border-violet-500" />
                  </div>
                ) : (
                  <span className="text-sm text-gray-600 flex-1">Closed</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button type="submit" disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 rounded-xl text-sm font-medium text-white transition-all">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}

/* ════════════════════════════════════════════════════════
   TAB: GALLERY
══════════════════════════════════════════════════════════ */
function GalleryTab({ gym }) {
  const showToast = useToast();
  const [media, setMedia] = useState(gym.media ?? []);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => { setMedia(gym.media ?? []); }, [gym.id]);

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
      if (fileRef.current) fileRef.current.value = '';
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
   TAB: MEMBERS
══════════════════════════════════════════════════════════ */
function MembersTab({ gym }) {
  const showToast = useToast();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getGymMembers(gym.id);
      setMembers(Array.isArray(data) ? data : data.results ?? []);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [gym.id]);

  useEffect(() => { load(); }, [load]);

  const upgrade = async (userId) => {
    setUpgrading(userId);
    try {
      await api.upgradeGymMember(gym.id, userId);
      setMembers(m => m.map(u => u.id === userId ? { ...u, membership_status: 'member' } : u));
      showToast('Promoted to member!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setUpgrading(null);
    }
  };

  const followers  = members.filter(m => m.membership_status === 'following');
  const fullMembers = members.filter(m => m.membership_status === 'member');

  if (loading) return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => <Skel key={i} h="h-14" />)}
    </div>
  );

  if (members.length === 0) return (
    <div className="text-center py-16 border-2 border-dashed border-gray-700 rounded-2xl">
      <Users className="w-10 h-10 text-gray-700 mx-auto mb-3" />
      <p className="text-sm text-gray-500">No followers or members yet.</p>
    </div>
  );

  const UserRow = ({ u, canUpgrade }) => (
    <div className="flex items-center gap-3 px-4 py-3 bg-gray-800/40 border border-gray-700/50 rounded-xl">
      <div className="w-9 h-9 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
        {u.avatar
          ? <img src={u.avatar} alt="" className="w-full h-full rounded-full object-cover" />
          : <span className="text-sm font-semibold text-violet-300">{(u.username || u.name || 'U')[0].toUpperCase()}</span>
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{u.username || u.name || `User ${u.id}`}</p>
        {u.email && <p className="text-xs text-gray-500 truncate">{u.email}</p>}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {u.membership_status === 'member'
          ? <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
              <Shield className="w-3 h-3" /> Member
            </span>
          : <span className="flex items-center gap-1 text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-full">
              <UserCheck className="w-3 h-3" /> Following
            </span>
        }
        {canUpgrade && (
          <button onClick={() => upgrade(u.id)} disabled={upgrading === u.id}
            className="flex items-center gap-1 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 rounded-lg text-xs font-medium text-white transition-all">
            {upgrading === u.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Shield className="w-3 h-3" />}
            Upgrade
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">{members.length} total · {fullMembers.length} members · {followers.length} followers</p>
        <button onClick={load} className="text-gray-500 hover:text-gray-300 transition-colors">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {fullMembers.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Members ({fullMembers.length})</h3>
          {fullMembers.map(u => <UserRow key={u.id} u={u} canUpgrade={false} />)}
        </div>
      )}

      {followers.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Followers ({followers.length})</h3>
          <p className="text-xs text-gray-600 mb-2">Upgrade followers to full members to grant access.</p>
          {followers.map(u => <UserRow key={u.id} u={u} canUpgrade={true} />)}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   TAB: CONVERSATIONS
══════════════════════════════════════════════════════════ */
function ConversationsTab({ gym }) {
  const showToast = useToast();
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
                <p className="text-center text-sm text-gray-600 mt-8">No messages yet.</p>
              ) : (
                messages.map((m, i) => {
                  const isOwner = m.sender_type === 'gym' || m.is_owner || m.is_from_owner;
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
  const showToast = useToast();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({
    campaign_type: 'announcement',
    subject: '',
    body: '',
    target_radius_km: 10,
  });

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
    if (!form.subject.trim() || !form.body.trim()) {
      showToast('Subject and message are required.', 'error'); return;
    }
    if (!form.target_radius_km || form.target_radius_km < 1 || form.target_radius_km > 200) {
      showToast('Radius must be between 1 and 200 km.', 'error'); return;
    }
    setSending(true);
    try {
      const data = await api.sendGymCampaign(gym.id, form);
      setCampaigns(c => [data, ...c]);
      setComposing(false);
      setForm({ campaign_type: 'announcement', subject: '', body: '', target_radius_km: 10 });
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

      {composing && (
        <form onSubmit={send} className="bg-gray-800/60 border border-violet-500/30 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-violet-300 flex items-center gap-2">
            <Megaphone className="w-4 h-4" /> New Campaign
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Campaign Type</label>
              <select className={inputCls} value={form.campaign_type}
                onChange={e => setForm(f => ({ ...f, campaign_type: e.target.value }))}>
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
              value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} />
          </div>

          <div className="sm:w-48">
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Target Radius (km)</label>
            <input className={inputCls} type="number" min="1" max="200"
              value={form.target_radius_km}
              onChange={e => setForm(f => ({ ...f, target_radius_km: parseInt(e.target.value, 10) || 10 }))} />
            <p className="text-xs text-gray-600 mt-1">Send to members within this radius</p>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={sending}
              className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 rounded-xl text-sm font-medium text-white transition-all">
              {sending
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Send className="w-4 h-4" />}
              {sending ? 'Sending…' : 'Send to Members'}
            </button>
          </div>
        </form>
      )}

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
                  {c.sent_at || c.created_at ? new Date(c.sent_at || c.created_at).toLocaleDateString() : ''}
                </span>
              </div>
              <p className="text-sm text-gray-400 line-clamp-2">{c.body || c.message}</p>
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
  { key: 'edit',           label: 'Edit Gym',        Icon: Pencil },
  { key: 'gallery',        label: 'Gallery',         Icon: Images },
  { key: 'members',        label: 'Members',         Icon: Users },
  { key: 'conversations',  label: 'Conversations',   Icon: MessageSquare },
  { key: 'campaigns',      label: 'Campaigns',       Icon: Megaphone },
];

export default function GymOwnerDashboard() {
  const navigate = useNavigate();
  const showToast = useToast();
  const [gyms, setGyms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeGym, setActiveGym] = useState(null);
  const [tab, setTab] = useState('overview');
  const [gymPickerOpen, setGymPickerOpen] = useState(false);

  const loadFullDetail = useCallback(async (gym) => {
    try {
      const detail = await api.getGymDetail(gym.id);
      setActiveGym(detail);
      setGyms(prev => prev.map(g => g.id === detail.id ? { ...g, ...detail } : g));
    } catch { /* silent, use list data */ }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getMyGyms();
        const list = Array.isArray(data) ? data : data.results ?? [];
        setGyms(list);
        if (list.length > 0) {
          setActiveGym(list[0]);
          loadFullDetail(list[0]);
        }
      } catch (err) {
        showToast(err.message || 'Failed to load gyms.', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const selectGym = (g) => {
    setActiveGym(g);
    setTab('overview');
    setGymPickerOpen(false);
    loadFullDetail(g);
  };

  const gym = activeGym;

  return (
    <div className="min-h-screen bg-gray-950">
      <AppNav />

      <div className="max-w-6xl mx-auto px-4 py-8">
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
                      <button key={g.id} onClick={() => selectGym(g)}
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
                {tab === 'edit'          && <EditGymTab       gym={gym} onSaved={(updated) => { setActiveGym(prev => ({ ...prev, ...updated })); setTab('overview'); }} />}
                {tab === 'gallery'       && <GalleryTab       gym={gym} />}
                {tab === 'members'       && <MembersTab       gym={gym} />}
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
