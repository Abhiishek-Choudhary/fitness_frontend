import { useState, useEffect, useCallback } from 'react';
import {
  MapPin, Calendar, Users, UserCheck, UserPlus, UserMinus, Compass,
  Plus, Check, X, Clock, Globe, Lock, Loader2,
  AlertCircle, RefreshCw, Edit2, Trash2, Shield,
  Navigation, Star, MessageCircle,
} from 'lucide-react';
import AppNav from '../components/AppNav.jsx';
import api from '../services/api.js';
import { useEvents } from '../hooks/useEvents.js';
import { useGroups } from '../hooks/useGroups.js';
import { useConnections } from '../hooks/useConnections.js';
import { useAuth } from '../context/AuthContext.jsx';

/* ─── Activity images keyed by activity_type ─────── */
const ACTIVITY_IMAGES = {
  running:      'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=600&h=280&fit=crop&q=75',
  cycling:      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=280&fit=crop&q=75',
  outdoor_yoga: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&h=280&fit=crop&q=75',
  hiking:       'https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&h=280&fit=crop&q=75',
  outdoor_hiit: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=280&fit=crop&q=75',
  crossfit:     'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&h=280&fit=crop&q=75',
  swimming:     'https://images.unsplash.com/photo-1560090995-e3614ae39a89?w=600&h=280&fit=crop&q=75',
  walking:      'https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&h=280&fit=crop&q=75',
  default:      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=280&fit=crop&q=75',
};

const ACTIVITY_ICONS = {
  running: '🏃', cycling: '🚴', outdoor_yoga: '🧘', hiking: '🥾',
  outdoor_hiit: '⚡', crossfit: '🏋️', swimming: '🏊', walking: '🚶',
  sports: '⚽', gym_meetup: '💪', martial_arts: '🥋', other: '🏅',
};

const RSVP_META = {
  going:     { label: 'Going',     activeCls: 'bg-emerald-600 text-white border-emerald-600',     Icon: Check },
  maybe:     { label: 'Maybe',     activeCls: 'bg-amber-500 text-white border-amber-500',         Icon: Star },
  not_going: { label: 'Not Going', activeCls: 'bg-gray-700 text-gray-300 border-gray-600',        Icon: X },
};

/* ─── helpers ─────────────────────────────── */
const fmt     = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
const initials = (s) => (s || 'U').charAt(0).toUpperCase();
const cap     = (s) => (s || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

/* ─── Avatar ─────────────────────────────── */
function Avatar({ name, size = 'md', grad = 'violet' }) {
  const sz = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-12 h-12 text-base' }[size] ?? 'w-9 h-9 text-sm';
  const bg = { violet: 'from-violet-600 to-purple-700', emerald: 'from-emerald-600 to-teal-700', blue: 'from-blue-600 to-indigo-700' }[grad] ?? 'from-violet-600 to-purple-700';
  return <div className={`${sz} rounded-full bg-gradient-to-br ${bg} flex items-center justify-center text-white font-bold flex-shrink-0`}>{initials(name)}</div>;
}

function EmptyState({ icon: Icon, title, sub }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <Icon className="w-12 h-12 text-gray-700" />
      <p className="text-gray-500 text-sm font-medium">{title}</p>
      {sub && <p className="text-gray-700 text-xs text-center max-w-xs">{sub}</p>}
    </div>
  );
}

function GridSkeleton({ n = 6 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden animate-pulse">
          <div className="h-40 bg-gray-800" />
          <div className="p-4 space-y-2">
            <div className="h-4 bg-gray-800 rounded w-3/4" />
            <div className="h-3 bg-gray-800 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Location Setup ─────────────────────── */
function LocationSetup({ location, onSaved }) {
  const [open, setOpen]           = useState(!location);
  const [city, setCity]           = useState(location?.city ?? '');
  const [state, setState]         = useState(location?.state ?? '');
  const [country, setCountry]     = useState(location?.country ?? 'India');
  const [lat, setLat]             = useState(location?.latitude ?? '');
  const [lon, setLon]             = useState(location?.longitude ?? '');
  const [vis, setVis]             = useState(location?.visibility ?? 'public');
  const [saving, setSaving]       = useState(false);
  const [detecting, setDetecting] = useState(false);

  const detect = () => {
    if (!navigator.geolocation) return;
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => { setLat(coords.latitude.toFixed(6)); setLon(coords.longitude.toFixed(6)); setDetecting(false); },
      () => setDetecting(false), { timeout: 8000 }
    );
  };

  const save = async () => {
    if (!city.trim()) return;
    setSaving(true);
    try {
      const payload = { city: city.trim(), state: state.trim(), country: country.trim(), latitude: lat || null, longitude: lon || null, visibility: vis };
      const d = await api.updateCommunityLocation(payload);
      onSaved(d);
      setOpen(false);
    } catch {/* */} finally { setSaving(false); }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-sm text-gray-400 hover:text-white hover:border-gray-700 transition-all">
        <MapPin className="w-4 h-4 text-violet-400" />
        {location ? `📍 ${location.city}${location.state ? `, ${location.state}` : ''}` : 'Set your location'}
        <Edit2 className="w-3.5 h-3.5" />
      </button>
    );
  }

  return (
    <div className="bg-gray-900 border border-violet-500/30 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl bg-violet-500/15 flex items-center justify-center"><Navigation className="w-4 h-4 text-violet-400" /></div>
        <div><p className="text-sm font-semibold text-white">Set your location</p><p className="text-xs text-gray-500">Discover nearby events, groups and people</p></div>
        <button onClick={() => setOpen(false)} className="ml-auto text-gray-600 hover:text-gray-400"><X className="w-4 h-4" /></button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City *"
          className="bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors" />
        <input value={state} onChange={(e) => setState(e.target.value)} placeholder="State"
          className="bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors" />
        <input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Country"
          className="bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors" />
        <input value={lat} onChange={(e) => setLat(e.target.value)} placeholder="Latitude (optional)"
          className="bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors" />
        <input value={lon} onChange={(e) => setLon(e.target.value)} placeholder="Longitude (optional)"
          className="bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors" />
        <div className="flex gap-2">
          <button onClick={detect} disabled={detecting}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-xs text-gray-300 transition-all disabled:opacity-50">
            {detecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Compass className="w-3.5 h-3.5" />} Auto-detect
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-3">
        <span className="text-xs text-gray-500">Who can discover you:</span>
        {[['public','🌍 Public'],['connections','🔗 Connections'],['hidden','👻 Hidden']].map(([v, label]) => (
          <button key={v} onClick={() => setVis(v)}
            className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${vis === v ? 'bg-violet-600 text-white border-violet-600' : 'text-gray-400 border-gray-700 hover:border-gray-600 hover:text-white'}`}>
            {label}
          </button>
        ))}
        <button onClick={save} disabled={saving || !city.trim()}
          className="ml-auto flex items-center gap-1.5 px-5 py-2 bg-violet-600 hover:bg-violet-500 rounded-xl text-sm text-white font-semibold transition-all disabled:opacity-50">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Save
        </button>
      </div>
    </div>
  );
}

/* ─── Create Event Modal ─────────────────── */
function CreateEventModal({ onClose, onCreated, activityTypes }) {
  const [form, setForm] = useState({
    title: '', description: '', activity_type: 'running', difficulty: 'all',
    venue_name: '', address: '', city: '', state: '', country: 'India',
    latitude: '', longitude: '',
    event_date: '', start_time: '', end_time: '',
    max_participants: '', privacy: 'public',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState('');
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    if (!form.title.trim() || !form.event_date || !form.city.trim()) {
      setErr('Title, city and date are required.'); return;
    }
    setSaving(true); setErr('');
    try {
      const payload = {
        ...form,
        max_participants: form.max_participants ? Number(form.max_participants) : null,
        latitude:  form.latitude  ? Number(form.latitude)  : null,
        longitude: form.longitude ? Number(form.longitude) : null,
      };
      const ev = await api.createCommunityEvent(payload);
      onCreated(ev);
      onClose();
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  };

  const diffOpts = [['all','All Levels'],['beginner','Beginner'],['intermediate','Intermediate'],['advanced','Advanced']];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
          <h3 className="text-base font-semibold text-white flex items-center gap-2"><Calendar className="w-4 h-4 text-violet-400" />Create Event</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-500 hover:text-white" /></button>
        </div>
        <div className="p-5 space-y-3">
          <input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Event title *"
            className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors" />
          <textarea value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Description (optional)" rows={2}
            className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors resize-none" />

          <div className="grid grid-cols-2 gap-3">
            <select value={form.activity_type} onChange={(e) => set('activity_type', e.target.value)}
              className="bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors">
              {activityTypes.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
            </select>
            <select value={form.difficulty} onChange={(e) => set('difficulty', e.target.value)}
              className="bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors">
              {diffOpts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>

          <input value={form.venue_name} onChange={(e) => set('venue_name', e.target.value)} placeholder="Venue / landmark name"
            className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors" />
          <input value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Street address"
            className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors" />

          <div className="grid grid-cols-3 gap-3">
            <input value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="City *"
              className="bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors" />
            <input value={form.state} onChange={(e) => set('state', e.target.value)} placeholder="State"
              className="bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors" />
            <input value={form.country} onChange={(e) => set('country', e.target.value)} placeholder="Country"
              className="bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input value={form.latitude} onChange={(e) => set('latitude', e.target.value)} placeholder="Latitude (optional)"
              className="bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors" />
            <input value={form.longitude} onChange={(e) => set('longitude', e.target.value)} placeholder="Longitude (optional)"
              className="bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <input type="date" value={form.event_date} onChange={(e) => set('event_date', e.target.value)}
              className="bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors" />
            <input type="time" value={form.start_time} onChange={(e) => set('start_time', e.target.value)}
              className="bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors" />
            <input type="time" value={form.end_time} onChange={(e) => set('end_time', e.target.value)}
              className="bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input type="number" value={form.max_participants} onChange={(e) => set('max_participants', e.target.value)} placeholder="Max participants (optional)"
              className="bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors" />
            <select value={form.privacy} onChange={(e) => set('privacy', e.target.value)}
              className="bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors">
              <option value="public">🌍 Public</option>
              <option value="invite_only">🔒 Invite only</option>
            </select>
          </div>

          {err && <p className="text-xs text-red-400 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" />{err}</p>}
          <button onClick={submit} disabled={saving}
            className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
            {saving ? 'Creating…' : 'Create Event'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Create Group Modal ─────────────────── */
function CreateGroupModal({ onClose, onCreated, activityTypes }) {
  const [form, setForm] = useState({
    name: '', description: '', activity_focus: 'running', difficulty: 'all',
    city: '', state: '', country: 'India', privacy: 'public',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState('');
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    if (!form.name.trim() || !form.city.trim()) { setErr('Name and city are required.'); return; }
    setSaving(true); setErr('');
    try {
      const grp = await api.createCommunityGroup(form);
      onCreated(grp);
      onClose();
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  };

  const diffOpts = [['all','All Levels'],['beginner','Beginner'],['intermediate','Intermediate'],['advanced','Advanced']];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h3 className="text-base font-semibold text-white flex items-center gap-2"><Users className="w-4 h-4 text-violet-400" />Create Group</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-500 hover:text-white" /></button>
        </div>
        <div className="p-5 space-y-3">
          <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Group name *"
            className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors" />
          <textarea value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="What is this group about?" rows={3}
            className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors resize-none" />
          <div className="grid grid-cols-2 gap-3">
            <select value={form.activity_focus} onChange={(e) => set('activity_focus', e.target.value)}
              className="bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors">
              {activityTypes.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
            </select>
            <select value={form.difficulty} onChange={(e) => set('difficulty', e.target.value)}
              className="bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors">
              {diffOpts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <input value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="City *"
              className="bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors" />
            <input value={form.state} onChange={(e) => set('state', e.target.value)} placeholder="State"
              className="bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors" />
            <input value={form.country} onChange={(e) => set('country', e.target.value)} placeholder="Country"
              className="bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors" />
          </div>
          <label className="flex items-center gap-3 cursor-pointer p-3 bg-gray-950 border border-gray-800 rounded-xl">
            <input type="checkbox" checked={form.privacy === 'private'} onChange={(e) => set('privacy', e.target.checked ? 'private' : 'public')} className="accent-violet-500" />
            <div>
              <p className="text-sm text-white font-medium">Private group</p>
              <p className="text-xs text-gray-500">Members need admin approval to join</p>
            </div>
            {form.privacy === 'private' ? <Lock className="ml-auto w-4 h-4 text-amber-400" /> : <Globe className="ml-auto w-4 h-4 text-emerald-400" />}
          </label>
          {err && <p className="text-xs text-red-400 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" />{err}</p>}
          <button onClick={submit} disabled={saving}
            className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
            {saving ? 'Creating…' : 'Create Group'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Event Card ─────────────────────────── */
function EventCard({ event, onRsvp, onDelete, isOrganizer }) {
  const img      = ACTIVITY_IMAGES[event.activity_type] ?? ACTIVITY_IMAGES.default;
  const icon     = ACTIVITY_ICONS[event.activity_type] ?? '🏅';
  const myRsvp   = event.my_rsvp ?? event.rsvp_status ?? null;
  const isFull   = event.max_participants && (event.attendees_count ?? 0) >= event.max_participants;

  return (
    <article className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-500/8 transition-all duration-300 flex flex-col group">
      <div className="relative h-40 overflow-hidden">
        <img src={img} alt={event.activity_type} loading="lazy"
          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-transparent to-transparent" />
        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
          <span className="bg-gray-950/80 backdrop-blur-sm text-xs rounded-lg px-2 py-1 text-gray-300 border border-gray-700/50">{icon} {cap(event.activity_type)}</span>
          {event.difficulty && event.difficulty !== 'all' && (
            <span className="bg-gray-950/80 backdrop-blur-sm text-xs rounded-lg px-2 py-1 text-violet-300 border border-violet-700/40">{cap(event.difficulty)}</span>
          )}
          {isFull && <span className="bg-red-500/80 text-xs rounded-lg px-2 py-1 text-white">Full</span>}
        </div>
        {isOrganizer && (
          <button onClick={() => onDelete(event.id)}
            className="absolute top-3 right-3 w-7 h-7 bg-gray-950/80 hover:bg-red-600 rounded-lg flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100">
            <Trash2 className="w-3.5 h-3.5 text-white" />
          </button>
        )}
        <div className="absolute bottom-3 left-3">
          <div className="bg-gray-950/80 backdrop-blur-sm rounded-xl px-3 py-1.5">
            <p className="text-white text-xs font-semibold">{fmt(event.event_date)}</p>
            {event.start_time && <p className="text-gray-400 text-[10px]">{event.start_time.slice(0,5)}{event.end_time ? ` – ${event.end_time.slice(0,5)}` : ''}</p>}
          </div>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-white leading-snug line-clamp-2">{event.title}</h3>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{[event.venue_name, event.city].filter(Boolean).join(' · ')}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-600">
          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{event.attendees_count ?? 0}{event.max_participants ? `/${event.max_participants}` : ''}</span>
          {event.distance_km != null && <span className="ml-auto text-violet-400 font-medium">{Number(event.distance_km).toFixed(1)} km</span>}
        </div>
        {event.organizer && (
          <div className="flex items-center gap-2 mt-auto pt-1">
            <Avatar name={event.organizer.username ?? event.organizer.name} size="sm" grad="emerald" />
            <span className="text-xs text-gray-500">by <span className="text-gray-300">{event.organizer.username ?? event.organizer.name}</span></span>
          </div>
        )}
      </div>

      {!isOrganizer && (
        <div className="flex gap-1.5 px-4 pb-4">
          {Object.entries(RSVP_META).map(([status, { label, activeCls, Icon }]) => {
            const isActive = myRsvp === status;
            return (
              <button key={status} onClick={() => onRsvp(event.id, status)}
                disabled={isFull && status === 'going' && !isActive}
                className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-medium border transition-all ${
                  isActive ? activeCls : 'bg-transparent border-gray-700 text-gray-500 hover:border-gray-600 hover:text-gray-300'
                }`}>
                <Icon className="w-3.5 h-3.5" />{label}
              </button>
            );
          })}
        </div>
      )}
    </article>
  );
}

/* ─── Group Card ─────────────────────────── */
function GroupCard({ group, isMember, isPending, onJoin }) {
  const [joining, setJoining] = useState(false);
  const icon = ACTIVITY_ICONS[group.activity_focus] ?? '🏅';
  const isPrivate = group.privacy === 'private' || group.is_private === true;

  const handleJoin = async () => {
    setJoining(true);
    try { await onJoin(group.id); }
    catch {/* */}
    finally { setJoining(false); }
  };

  return (
    <article className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-violet-500/30 hover:shadow-md hover:shadow-violet-500/8 transition-all duration-300 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-2xl bg-violet-500/15 flex items-center justify-center text-2xl flex-shrink-0">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <h3 className="text-sm font-semibold text-white truncate">{group.name}</h3>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md border flex items-center gap-0.5 flex-shrink-0 ${
              isPrivate ? 'bg-amber-500/10 text-amber-400 border-amber-500/25' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
            }`}>
              {isPrivate ? <Lock className="w-2.5 h-2.5" /> : <Globe className="w-2.5 h-2.5" />}
              {isPrivate ? 'Private' : 'Public'}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{group.city}</span>
            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{group.members_count ?? 0}</span>
          </div>
        </div>
      </div>
      {group.description && <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{group.description}</p>}
      <div className="mt-auto">
        {isMember ? (
          <div className="flex items-center gap-2 px-4 py-2 bg-violet-500/10 border border-violet-500/25 rounded-xl">
            <Shield className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-xs text-violet-300 font-medium">Member</span>
          </div>
        ) : isPending ? (
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/25 rounded-xl">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs text-amber-300 font-medium">Pending approval</span>
          </div>
        ) : (
          <button onClick={handleJoin} disabled={joining}
            className="w-full py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 rounded-xl text-xs font-semibold text-white transition-all flex items-center justify-center gap-1.5">
            {joining ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
            {isPrivate ? 'Request to Join' : 'Join Group'}
          </button>
        )}
      </div>
    </article>
  );
}

/* ─── Connection Card ─────────────────────── */
function ConnectionCard({ conn, onRemove }) {
  const u = conn.user ?? conn;
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex items-center gap-3 hover:border-gray-700 transition-all group">
      <Avatar name={u.username ?? u.name} size="md" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{u.username ?? u.name ?? 'User'}</p>
        {(u.fitness_goal || u.activity_focus) && <p className="text-xs text-gray-500 capitalize">{cap(u.fitness_goal ?? u.activity_focus)}</p>}
        {u.city && <p className="text-xs text-gray-600 flex items-center gap-1"><MapPin className="w-3 h-3" />{u.city}</p>}
      </div>
      <button onClick={() => onRemove(u.id)}
        className="opacity-0 group-hover:opacity-100 p-2 rounded-xl text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all" title="Remove connection">
        <UserMinus className="w-4 h-4" />
      </button>
    </div>
  );
}

/* ─── Request Card ────────────────────────── */
function RequestCard({ req, type, onAccept, onReject, onWithdraw }) {
  const u = type === 'received'
    ? (req.sender ?? req.from_user ?? req.requester ?? {})
    : (req.receiver ?? req.to_user ?? {});
  const name = u.username ?? u.name ?? 'User';
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex gap-3">
      <Avatar name={name} size="md" grad="blue" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white">{name}</p>
        {req.message && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 italic">"{req.message}"</p>}
        <p className="text-[10px] text-gray-700 mt-1">{fmt(req.created_at)}</p>
      </div>
      <div className="flex flex-col gap-1.5 flex-shrink-0 justify-center">
        {type === 'received' ? (
          <>
            <button onClick={() => onAccept(req.id)}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs font-medium text-white transition-all">
              <Check className="w-3.5 h-3.5" /> Accept
            </button>
            <button onClick={() => onReject(req.id)}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-xs font-medium text-gray-400 hover:text-white transition-all">
              <X className="w-3.5 h-3.5" /> Reject
            </button>
          </>
        ) : (
          <button onClick={() => onWithdraw(req.id)}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-xs font-medium text-gray-400 hover:text-red-400 transition-all">
            <X className="w-3.5 h-3.5" /> Withdraw
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Nearby Person Card ─────────────────── */
function PersonCard({ person, onConnect }) {
  const [connecting, setConnecting] = useState(false);
  const u = person.user ?? person;
  // connection_status: "none" | "connected" | "request_sent" | "request_received"
  const [status, setStatus] = useState(person.connection_status ?? 'none');

  const handleConnect = async () => {
    setConnecting(true);
    try { await onConnect(u.id); setStatus('request_sent'); }
    catch {/* */} finally { setConnecting(false); }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 hover:border-violet-500/30 transition-all">
      <div className="flex items-start gap-3 mb-3">
        <Avatar name={u.username ?? u.name} size="lg" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">{u.username ?? u.name ?? 'User'}</p>
          {(u.fitness_goal || u.fitness_level) && (
            <p className="text-xs text-violet-400 capitalize mt-0.5">{cap(u.fitness_goal ?? '')} {u.fitness_level ? `· ${cap(u.fitness_level)}` : ''}</p>
          )}
          <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-600">
            <MapPin className="w-3 h-3" />
            <span>{person.city ?? u.city ?? '—'}</span>
            {person.distance_km != null && (
              <span className="ml-auto text-violet-400 font-medium">{Number(person.distance_km).toFixed(1)} km</span>
            )}
          </div>
        </div>
      </div>

      {status === 'connected' ? (
        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/25 rounded-xl">
          <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs text-emerald-300 font-medium">Connected</span>
        </div>
      ) : status === 'request_sent' ? (
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl">
          <Clock className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-xs text-gray-400">Request sent</span>
        </div>
      ) : status === 'request_received' ? (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/25 rounded-xl">
          <MessageCircle className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs text-amber-300">Wants to connect</span>
        </div>
      ) : (
        <button onClick={handleConnect} disabled={connecting}
          className="w-full flex items-center justify-center gap-1.5 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 rounded-xl text-xs font-semibold text-white transition-all">
          {connecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />} Connect
        </button>
      )}
    </div>
  );
}

/* ─── Tabs config ─────────────────────────── */
const TABS = [
  { id: 'events',      label: 'Events',      Icon: Calendar },
  { id: 'my-events',   label: 'My Events',   Icon: Star },
  { id: 'groups',      label: 'Groups',      Icon: Users },
  { id: 'connections', label: 'Connections', Icon: UserCheck },
  { id: 'requests',    label: 'Requests',    Icon: MessageCircle },
  { id: 'nearby',      label: 'Nearby',      Icon: Navigation },
];

/* ─── Community Page ─────────────────────── */
export default function CommunityPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab]         = useState('events');
  const [location, setLocation]           = useState(null);
  const [locLoading, setLocLoading]       = useState(true);
  const [activityTypes, setActivityTypes] = useState([]);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  const events      = useEvents(location);
  const groups      = useGroups();
  const connections = useConnections();

  /* Load location and reference data on mount */
  useEffect(() => {
    api.getCommunityLocation()
      .then((d) => setLocation(d))
      .catch(() => {})
      .finally(() => setLocLoading(false));
    api.getActivityTypes()
      .then((d) => setActivityTypes(d.activity_types ?? []))
      .catch(() => setActivityTypes([
        { value: 'running', label: 'Running' }, { value: 'cycling', label: 'Cycling' },
        { value: 'hiking', label: 'Hiking' },  { value: 'outdoor_yoga', label: 'Outdoor Yoga' },
        { value: 'outdoor_hiit', label: 'Outdoor HIIT' }, { value: 'swimming', label: 'Swimming' },
        { value: 'crossfit', label: 'CrossFit' }, { value: 'other', label: 'Other' },
      ]));
  }, []);

  /* Lazy-load per tab */
  useEffect(() => {
    if (activeTab === 'my-events')   events.fetchMyEvents();
    if (activeTab === 'groups')      groups.fetchMyGroups();
    if (activeTab === 'requests')    connections.fetchRequests();
    if (activeTab === 'nearby')      connections.fetchNearby();
  }, [activeTab]);

  /* Membership state derived from myGroups */
  const myGroupMap = new Map((groups.myGroups ?? []).map((g) => [g.id, g.my_membership ?? 'active']));

  const requestBadge = connections.totalPending > 0 ? connections.totalPending : null;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <AppNav />

      {/* Hero */}
      <div className="relative h-52 overflow-hidden">
        <img src="https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=1400&h=500&fit=crop&q=80" alt="Community" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-950/85 via-gray-950/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-center px-6 max-w-7xl mx-auto">
          <p className="text-violet-400 text-xs font-semibold uppercase tracking-widest mb-1">Together We Grow</p>
          <h1 className="text-xl md:text-4xl font-bold text-white">Community</h1>
          <p className="text-gray-300 text-xs md:text-sm mt-1">Find events, join groups and connect with fitness people near you</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-5">

        {/* Location setup */}
        {!locLoading && <LocationSetup location={location} onSaved={setLocation} />}

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 overflow-x-auto">
          {TABS.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                activeTab === id ? 'bg-violet-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
              }`}>
              <Icon className="w-4 h-4" />{label}
              {id === 'requests' && requestBadge && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold">
                  {requestBadge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── EVENTS TAB ── */}
        {activeTab === 'events' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p className="text-sm text-gray-500">{events.events.length} event{events.events.length !== 1 ? 's' : ''}</p>
              <div className="flex gap-2">
                <button onClick={events.refresh} className="p-2 rounded-xl text-gray-500 hover:text-white hover:bg-gray-800 transition-all"><RefreshCw className="w-4 h-4" /></button>
                <button onClick={() => setShowCreateEvent(true)} className="flex items-center gap-2 px-3 py-2 bg-violet-600 hover:bg-violet-500 rounded-xl text-sm font-medium text-white transition-all">
                  <Plus className="w-4 h-4" /><span className="hidden sm:inline">Create Event</span><span className="sm:hidden">New</span>
                </button>
              </div>
            </div>
            {events.error && <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-sm text-red-300"><AlertCircle className="w-4 h-4 flex-shrink-0" />{events.error}</div>}
            {events.loading
              ? <GridSkeleton />
              : events.events.length === 0
                ? <EmptyState icon={Calendar} title="No events found" sub="Be the first to create a fitness event in your area." />
                : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {events.events.map((e) => (
                      <EventCard key={e.id} event={e} onRsvp={events.rsvp} onDelete={events.removeEvent} isOrganizer={e.organizer?.username === user?.username} />
                    ))}
                  </div>
            }
          </div>
        )}

        {/* ── MY EVENTS TAB ── */}
        {activeTab === 'my-events' && (
          <div className="space-y-6">
            {events.myLoading
              ? <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-gray-600 animate-spin" /></div>
              : !events.myEvents
                ? null
                : (events.myEvents.organised?.length === 0 && events.myEvents.attending?.length === 0)
                  ? <EmptyState icon={Calendar} title="No events yet" sub="Create an event or RSVP to events to see them here." />
                  : <>
                      {events.myEvents.organised?.length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Organising ({events.myEvents.organised.length})</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {events.myEvents.organised.map((e) => <EventCard key={e.id} event={e} onRsvp={events.rsvp} onDelete={events.removeEvent} isOrganizer />)}
                          </div>
                        </div>
                      )}
                      {events.myEvents.attending?.length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Attending ({events.myEvents.attending.length})</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {events.myEvents.attending.map((e) => <EventCard key={e.id} event={e} onRsvp={events.rsvp} onDelete={events.removeEvent} isOrganizer={false} />)}
                          </div>
                        </div>
                      )}
                    </>
            }
          </div>
        )}

        {/* ── GROUPS TAB ── */}
        {activeTab === 'groups' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex gap-2 flex-wrap">
                <input value={groups.filters.city} onChange={(e) => groups.setFilters((p) => ({ ...p, city: e.target.value }))}
                  placeholder="Filter by city…"
                  className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors w-full sm:w-40" />
                <select value={groups.filters.activity_focus} onChange={(e) => groups.setFilters((p) => ({ ...p, activity_focus: e.target.value }))}
                  className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors w-full sm:w-auto">
                  <option value="">All activities</option>
                  {activityTypes.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                </select>
                <input value={groups.filters.search} onChange={(e) => groups.setFilters((p) => ({ ...p, search: e.target.value }))}
                  placeholder="Search groups…"
                  className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors w-full sm:w-40 flex-1" />
              </div>
              <div className="flex justify-end">
                <button onClick={() => setShowCreateGroup(true)} className="flex items-center gap-2 px-3 py-2 bg-violet-600 hover:bg-violet-500 rounded-xl text-sm font-medium text-white transition-all">
                  <Plus className="w-4 h-4" /><span className="hidden sm:inline">Create Group</span><span className="sm:hidden">New</span>
                </button>
              </div>
            </div>
            {groups.loading
              ? <GridSkeleton />
              : groups.groups.length === 0
                ? <EmptyState icon={Users} title="No groups found" sub="Create a group to bring your local fitness community together." />
                : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groups.groups.map((g) => {
                      const memStatus = myGroupMap.get(g.id) ?? g.my_membership ?? null;
                      return (
                        <GroupCard key={g.id} group={g}
                          isMember={memStatus === 'active'}
                          isPending={memStatus === 'pending'}
                          onJoin={groups.joinGroup}
                        />
                      );
                    })}
                  </div>
            }
          </div>
        )}

        {/* ── CONNECTIONS TAB ── */}
        {activeTab === 'connections' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">{connections.connections.length} connection{connections.connections.length !== 1 ? 's' : ''}</p>
            {connections.loading
              ? <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-gray-600 animate-spin" /></div>
              : connections.connections.length === 0
                ? <EmptyState icon={UserCheck} title="No connections yet" sub="Discover people nearby and send connection requests." />
                : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {connections.connections.map((c, i) => <ConnectionCard key={c.id ?? i} conn={c} onRemove={connections.remove} />)}
                  </div>
            }
          </div>
        )}

        {/* ── REQUESTS TAB ── */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            {connections.reqLoading
              ? <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-gray-600 animate-spin" /></div>
              : <>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
                      Received <span className="text-white">({connections.requests.received.length})</span>
                    </h3>
                    {connections.requests.received.length === 0
                      ? <p className="text-xs text-gray-600">No pending requests</p>
                      : <div className="space-y-2 max-w-2xl">
                          {connections.requests.received.map((r) => (
                            <RequestCard key={r.id} req={r} type="received" onAccept={connections.accept} onReject={connections.reject} onWithdraw={null} />
                          ))}
                        </div>
                    }
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
                      Sent <span className="text-white">({connections.requests.sent.length})</span>
                    </h3>
                    {connections.requests.sent.length === 0
                      ? <p className="text-xs text-gray-600">No sent requests</p>
                      : <div className="space-y-2 max-w-2xl">
                          {connections.requests.sent.map((r) => (
                            <RequestCard key={r.id} req={r} type="sent" onAccept={null} onReject={null} onWithdraw={connections.withdraw} />
                          ))}
                        </div>
                    }
                  </div>
                </>
            }
          </div>
        )}

        {/* ── NEARBY TAB ── */}
        {activeTab === 'nearby' && (
          <div className="space-y-4">
            {!location ? (
              <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5">
                <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-300">Location required</p>
                  <p className="text-xs text-amber-400/70 mt-0.5">Set your city and coordinates above to discover people near you.</p>
                </div>
              </div>
            ) : connections.nearbyLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-gray-600 animate-spin" /></div>
            ) : connections.nearby.length === 0 ? (
              <EmptyState icon={Navigation} title="No one nearby" sub="Try increasing the search radius or check back later." />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {connections.nearby.map((p, i) => (
                  <PersonCard key={p.user?.id ?? i} person={p} onConnect={connections.sendRequest} />
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Modals */}
      {showCreateEvent && (
        <CreateEventModal onClose={() => setShowCreateEvent(false)} onCreated={events.addEvent} activityTypes={activityTypes} />
      )}
      {showCreateGroup && (
        <CreateGroupModal onClose={() => setShowCreateGroup(false)} onCreated={groups.addGroup} activityTypes={activityTypes} />
      )}
    </div>
  );
}
