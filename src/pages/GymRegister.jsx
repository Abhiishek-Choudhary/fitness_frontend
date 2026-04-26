import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, MapPin, Phone, Clock, ChevronRight, ChevronLeft,
  Upload, X, Check, Locate, Globe, DollarSign, Image, ArrowLeft,
} from 'lucide-react';
import AppNav from '../components/AppNav.jsx';
import { useToast } from '../context/ToastContext.jsx';
import api from '../services/api.js';
import { GYM_TYPES, AMENITIES_LIST, DAYS } from '../utils/gymConstants.js';

const STEPS = [
  { label: 'Basics',   Icon: Building2 },
  { label: 'Location', Icon: MapPin },
  { label: 'Contact',  Icon: Phone },
  { label: 'Hours & Media', Icon: Clock },
];

const inputCls =
  'w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-all text-sm';

const labelCls = 'block text-sm font-medium text-gray-300 mb-1.5';

/* ── Step indicators ──────────────────────────────────── */
function StepBar({ current }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map(({ label, Icon }, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                done   ? 'bg-violet-600 border-violet-600' :
                active ? 'bg-gray-900 border-violet-500' :
                         'bg-gray-900 border-gray-700'
              }`}>
                {done
                  ? <Check className="w-4 h-4 text-white" />
                  : <Icon className={`w-4 h-4 ${active ? 'text-violet-400' : 'text-gray-600'}`} />}
              </div>
              <span className={`text-xs mt-1.5 font-medium hidden sm:block ${
                active ? 'text-violet-300' : done ? 'text-gray-400' : 'text-gray-600'
              }`}>{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-12 sm:w-20 h-0.5 mb-5 mx-1 transition-all ${done ? 'bg-violet-600' : 'bg-gray-800'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Image preview with remove ───────────────────────── */
function ImagePreview({ src, onRemove, label }) {
  return (
    <div className="relative group">
      <img src={src} alt={label} className="w-full h-36 object-cover rounded-xl border border-gray-700" />
      <button
        type="button" onClick={onRemove}
        className="absolute top-2 right-2 w-7 h-7 bg-gray-900/80 rounded-full flex items-center justify-center text-gray-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
      >
        <X className="w-3.5 h-3.5" />
      </button>
      <span className="absolute bottom-2 left-2 text-xs text-gray-300 bg-gray-900/70 px-2 py-0.5 rounded-lg">{label}</span>
    </div>
  );
}

/* ── Upload drop zone ────────────────────────────────── */
function UploadZone({ label, hint, onChange, inputRef }) {
  return (
    <label className="block cursor-pointer">
      <div className="border-2 border-dashed border-gray-700 hover:border-violet-500/60 rounded-xl p-6 text-center transition-all group">
        <Upload className="w-6 h-6 text-gray-600 group-hover:text-violet-400 mx-auto mb-2 transition-colors" />
        <p className="text-sm text-gray-400 group-hover:text-gray-300">{label}</p>
        <p className="text-xs text-gray-600 mt-1">{hint}</p>
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onChange} />
    </label>
  );
}

export default function GymRegister() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const logoRef = useRef(null);
  const coverRef = useRef(null);

  /* ── Form state ─────────────────────────────────────── */
  const [form, setForm] = useState({
    // Step 1
    name: '', gym_type: 'general', description: '',
    // Step 2
    address: '', city: '', state: '', country: 'India',
    latitude: '', longitude: '',
    // Step 3
    phone: '', email: '', website: '',
    monthly_fee: '', amenities: [],
    // Step 4 — opening hours default all open 06:00–22:00
    opening_hours: Object.fromEntries(
      DAYS.map(({ key }) => [key, { open: true, from: '06:00', to: '22:00' }])
    ),
    logo: null, logoPreview: '',
    cover_image: null, coverPreview: '',
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  /* ── Geolocation ────────────────────────────────────── */
  const [locating, setLocating] = useState(false);
  const detectLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation not supported by your browser.', 'error');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        set('latitude', coords.latitude.toFixed(6));
        set('longitude', coords.longitude.toFixed(6));
        setLocating(false);
        showToast('Location detected!', 'success');
      },
      () => {
        showToast('Could not detect location. Please enter manually.', 'error');
        setLocating(false);
      }
    );
  };

  /* ── Amenities toggle ───────────────────────────────── */
  const toggleAmenity = (a) =>
    set('amenities', form.amenities.includes(a)
      ? form.amenities.filter(x => x !== a)
      : [...form.amenities, a]);

  /* ── Hours toggle/edit ──────────────────────────────── */
  const setHours = (day, field, val) =>
    set('opening_hours', {
      ...form.opening_hours,
      [day]: { ...form.opening_hours[day], [field]: val },
    });

  /* ── Image handlers ─────────────────────────────────── */
  const handleLogo = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    set('logo', file);
    set('logoPreview', URL.createObjectURL(file));
  };
  const handleCover = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    set('cover_image', file);
    set('coverPreview', URL.createObjectURL(file));
  };

  /* ── Per-step validation ────────────────────────────── */
  const validate = () => {
    if (step === 0) {
      if (!form.name.trim()) { showToast('Gym name is required.', 'error'); return false; }
    }
    if (step === 1) {
      if (!form.address.trim() || !form.city.trim()) {
        showToast('Address and city are required.', 'error'); return false;
      }
    }
    if (step === 2) {
      if (!form.phone.trim()) { showToast('Phone number is required.', 'error'); return false; }
    }
    return true;
  };

  const next = () => { if (validate()) setStep(s => s + 1); };
  const back = () => setStep(s => s - 1);

  /* ── Submit ─────────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name.trim());
      fd.append('gym_type', form.gym_type);
      fd.append('description', form.description.trim());
      fd.append('address', form.address.trim());
      fd.append('city', form.city.trim());
      fd.append('state', form.state.trim());
      fd.append('country', form.country.trim());
      if (form.latitude)  fd.append('latitude', form.latitude);
      if (form.longitude) fd.append('longitude', form.longitude);
      fd.append('phone', form.phone.trim());
      if (form.email)      fd.append('email', form.email.trim());
      if (form.website)    fd.append('website', form.website.trim());
      if (form.monthly_fee) fd.append('monthly_fee', form.monthly_fee);
      fd.append('amenities', JSON.stringify(form.amenities));
      fd.append('opening_hours', JSON.stringify(
        Object.fromEntries(
          Object.entries(form.opening_hours).map(([day, val]) =>
            [day, val.open ? { open: val.from, close: val.to } : null]
          )
        )
      ));
      if (form.logo)        fd.append('logo', form.logo);
      if (form.cover_image) fd.append('cover_image', form.cover_image);

      await api.registerGym(fd);
      showToast('Gym registered successfully!', 'success');
      navigate('/gyms/dashboard');
    } catch (err) {
      showToast(err.message || 'Registration failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Steps content ──────────────────────────────────── */
  const renderStep = () => {
    /* Step 0 — Basics */
    if (step === 0) return (
      <div className="space-y-5">
        <div>
          <label className={labelCls}>Gym Name <span className="text-red-400">*</span></label>
          <input className={inputCls} placeholder="e.g. Iron Temple Gym"
            value={form.name} onChange={e => set('name', e.target.value)} />
        </div>

        <div>
          <label className={labelCls}>Gym Type</label>
          <select className={inputCls} value={form.gym_type} onChange={e => set('gym_type', e.target.value)}>
            {Object.entries(GYM_TYPES).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelCls}>Description</label>
          <textarea className={`${inputCls} resize-none`} rows={4}
            placeholder="Tell people what makes your gym special…"
            value={form.description} onChange={e => set('description', e.target.value)} />
        </div>
      </div>
    );

    /* Step 1 — Location */
    if (step === 1) return (
      <div className="space-y-5">
        <div>
          <label className={labelCls}>Street Address <span className="text-red-400">*</span></label>
          <input className={inputCls} placeholder="123 Fitness Street"
            value={form.address} onChange={e => set('address', e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>City <span className="text-red-400">*</span></label>
            <input className={inputCls} placeholder="Mumbai"
              value={form.city} onChange={e => set('city', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>State</label>
            <input className={inputCls} placeholder="Maharashtra"
              value={form.state} onChange={e => set('state', e.target.value)} />
          </div>
        </div>

        <div>
          <label className={labelCls}>Country</label>
          <input className={inputCls} placeholder="India"
            value={form.country} onChange={e => set('country', e.target.value)} />
        </div>

        <div>
          <label className={labelCls}>Coordinates</label>
          <div className="grid grid-cols-2 gap-3">
            <input className={inputCls} placeholder="Latitude" type="number" step="any"
              value={form.latitude} onChange={e => set('latitude', e.target.value)} />
            <input className={inputCls} placeholder="Longitude" type="number" step="any"
              value={form.longitude} onChange={e => set('longitude', e.target.value)} />
          </div>
          <button type="button" onClick={detectLocation} disabled={locating}
            className="mt-2.5 flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 transition-colors disabled:opacity-50">
            <Locate className={`w-4 h-4 ${locating ? 'animate-spin' : ''}`} />
            {locating ? 'Detecting…' : 'Auto-detect my location'}
          </button>
        </div>
      </div>
    );

    /* Step 2 — Contact & Amenities */
    if (step === 2) return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Phone <span className="text-red-400">*</span></label>
            <input className={inputCls} placeholder="+91 98765 43210"
              value={form.phone} onChange={e => set('phone', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input className={inputCls} type="email" placeholder="gym@example.com"
              value={form.email} onChange={e => set('email', e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}><Globe className="inline w-3.5 h-3.5 mr-1" />Website</label>
            <input className={inputCls} placeholder="https://yourgym.com"
              value={form.website} onChange={e => set('website', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}><DollarSign className="inline w-3.5 h-3.5 mr-1" />Monthly Fee (₹)</label>
            <input className={inputCls} type="number" min="0" placeholder="1500"
              value={form.monthly_fee} onChange={e => set('monthly_fee', e.target.value)} />
          </div>
        </div>

        <div>
          <label className={labelCls}>Amenities</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {AMENITIES_LIST.map(a => {
              const checked = form.amenities.includes(a);
              return (
                <button key={a} type="button" onClick={() => toggleAmenity(a)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all text-left ${
                    checked
                      ? 'bg-violet-600/20 border-violet-500/50 text-violet-300'
                      : 'bg-gray-800/60 border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-300'
                  }`}>
                  <div className={`w-4 h-4 rounded-md border flex items-center justify-center flex-shrink-0 transition-all ${
                    checked ? 'bg-violet-600 border-violet-600' : 'border-gray-600'
                  }`}>
                    {checked && <Check className="w-2.5 h-2.5 text-white" />}
                  </div>
                  {a}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );

    /* Step 3 — Hours & Media */
    if (step === 3) return (
      <div className="space-y-6">
        {/* Opening hours */}
        <div>
          <label className={labelCls}>Opening Hours</label>
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
                      <input type="time" value={h.from}
                        onChange={e => setHours(key, 'from', e.target.value)}
                        className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:border-violet-500" />
                      <span className="text-gray-600 text-sm">to</span>
                      <input type="time" value={h.to}
                        onChange={e => setHours(key, 'to', e.target.value)}
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

        {/* Media uploads */}
        <div>
          <label className={labelCls}><Image className="inline w-3.5 h-3.5 mr-1" />Logo & Cover Photo</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {form.logoPreview
              ? <ImagePreview src={form.logoPreview} label="Logo"
                  onRemove={() => { set('logo', null); set('logoPreview', ''); logoRef.current.value = ''; }} />
              : <UploadZone label="Upload Logo" hint="PNG, JPG up to 5 MB"
                  inputRef={logoRef} onChange={handleLogo} />}

            {form.coverPreview
              ? <ImagePreview src={form.coverPreview} label="Cover Photo"
                  onRemove={() => { set('cover_image', null); set('coverPreview', ''); coverRef.current.value = ''; }} />
              : <UploadZone label="Upload Cover Photo" hint="PNG, JPG up to 10 MB"
                  inputRef={coverRef} onChange={handleCover} />}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <AppNav />

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button onClick={() => navigate('/gyms')}
            className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Gyms
          </button>
          <h1 className="text-2xl font-bold text-white">Register Your Gym</h1>
          <p className="text-gray-400 text-sm mt-1">Fill in your gym's details to get listed on FitTrack AI.</p>
        </div>

        {/* Step bar */}
        <StepBar current={step} />

        {/* Card */}
        <form onSubmit={step === 3 ? handleSubmit : e => { e.preventDefault(); next(); }}
          className="bg-gray-900 border border-gray-800 rounded-2xl p-6 sm:p-8 shadow-xl">

          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            {(() => { const { Icon, label } = STEPS[step]; return <><Icon className="w-5 h-5 text-violet-400" />{label}</> ; })()}
          </h2>

          {renderStep()}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-800">
            <button type="button" onClick={back} disabled={step === 0}
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>

            <div className="flex items-center gap-1.5">
              {STEPS.map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === step ? 'bg-violet-500 w-4' : i < step ? 'bg-violet-700' : 'bg-gray-700'}`} />
              ))}
            </div>

            {step < 3 ? (
              <button type="submit"
                className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 rounded-xl text-sm font-medium text-white transition-all">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button type="submit" disabled={submitting}
                className="flex items-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-medium text-white transition-all">
                {submitting ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Registering…</>
                ) : (
                  <><Check className="w-4 h-4" /> Register Gym</>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
