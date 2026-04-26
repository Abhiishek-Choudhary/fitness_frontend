import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Dumbbell, Activity, Zap, TrendingUp, Sparkles, Brain,
  X, Check, ArrowRight, Star, Heart, Lock, UserCircle, AlertCircle,
  Loader2, Crown, CreditCard, ChevronDown, ChevronUp, Calendar, Shield
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import AIPlanCard from './AIPlanCard.jsx';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import AppNav from '../components/AppNav.jsx';
import { usePayments } from '../hooks/usePayments.js';
import { useAuth } from '../context/AuthContext.jsx';

/* ─────────────────────────────────────────────
   Animated counter for welcome card stats
───────────────────────────────────────────── */
const StatsCard = ({ icon: Icon, title, value, subtitle, delay }) => {
  const [mounted, setMounted] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  useEffect(() => {
    if (!mounted) return;
    const target = parseInt(String(value).replace(/,/g, ''), 10);
    if (isNaN(target)) return;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(current));
    }, 2000 / steps);
    return () => clearInterval(timer);
  }, [mounted, value]);

  const displayValue = String(value).includes('%') ? `${count}%` : count.toLocaleString();

  return (
    <div className={`bg-gray-950 border border-gray-800 rounded-xl p-5 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <Icon className="w-7 h-7 text-violet-400 mb-3 animate-float" />
      <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">{title}</p>
      <p className="text-2xl font-bold text-white mb-0.5">{displayValue}</p>
      <p className="text-xs text-gray-600">{subtitle}</p>
    </div>
  );
};

/* ─────────────────────────────────────────────
   Profile form field helpers
───────────────────────────────────────────── */
const Field = ({ label, error, children }) => (
  <div>
    <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">{label}</label>
    {children}
    {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
  </div>
);

const inputCls = (err) =>
  `w-full bg-gray-950 border rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none transition-colors ${
    err ? 'border-red-500/50 focus:border-red-400' : 'border-gray-800 focus:border-violet-500'
  }`;

/* ─────────────────────────────────────────────
   Activity Charts (Bar + Radar)
───────────────────────────────────────────── */
const WEEK_CALORIES = [
  { day: 'Mon', cal: 420 },
  { day: 'Tue', cal: 680 },
  { day: 'Wed', cal: 510 },
  { day: 'Thu', cal: 750 },
  { day: 'Fri', cal: 390 },
  { day: 'Sat', cal: 860 },
  { day: 'Sun', cal: 290 },
];

const BAR_COLORS = ['#7c3aed', '#8b5cf6', '#7c3aed', '#a78bfa', '#7c3aed', '#8b5cf6', '#6d28d9'];

const CustomBarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs">
      <p className="text-gray-400 mb-0.5">{label}</p>
      <p className="text-violet-300 font-semibold">{payload[0].value} kcal</p>
    </div>
  );
};

const getRadarData = (profile) => {
  const level = { beginner: 30, intermediate: 60, advanced: 90 }[profile?.fitness_level] ?? 50;
  const activity = { sedentary: 20, lightly_active: 40, moderately_active: 60, very_active: 80, extra_active: 95 }[profile?.activity_level] ?? 50;
  const goalBoost = { weight_loss: { Endurance: 15 }, muscle_gain: { Strength: 15 }, maintain: {}, improve_fitness: { Flexibility: 10 } }[profile?.fitness_goal] ?? {};
  const base = { Strength: level, Endurance: activity, Flexibility: 40, Speed: Math.round((level + activity) / 2.5), Recovery: 55 };
  return Object.entries(base).map(([attr, val]) => ({
    attr,
    score: Math.min(100, val + (goalBoost[attr] ?? 0)),
    fullMark: 100,
  }));
};

const ActivityCharts = ({ profile }) => {
  const radarData = useMemo(() => getRadarData(profile), [profile]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      {/* Weekly Calorie Bar Chart */}
      <div className="lg:col-span-3 bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Zap className="w-4 h-4 text-violet-400" />
          <h3 className="text-sm font-semibold text-white">Weekly Calorie Burn</h3>
          <span className="ml-auto text-xs text-gray-600">kcal / day</span>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={WEEK_CALORIES} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
            <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
            <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(124,58,237,0.08)' }} />
            <Bar dataKey="cal" radius={[6, 6, 0, 0]}>
              {WEEK_CALORIES.map((_, i) => (
                <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Fitness Attribute Radar Chart */}
      <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-violet-400" />
          <h3 className="text-sm font-semibold text-white">Fitness Profile</h3>
        </div>
        {profile ? (
          <ResponsiveContainer width="100%" height={180}>
            <RadarChart data={radarData} margin={{ top: 0, right: 20, bottom: 0, left: 20 }}>
              <PolarGrid stroke="#1f2937" />
              <PolarAngleAxis dataKey="attr" tick={{ fill: '#9ca3af', fontSize: 10 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar dataKey="score" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.25} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[180px] flex flex-col items-center justify-center gap-2">
            <Activity className="w-8 h-8 text-gray-700" />
            <p className="text-xs text-gray-600 text-center">Set up your profile<br/>to see fitness attributes</p>
          </div>
        )}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   Profile Form Modal
───────────────────────────────────────────── */
const ProfileFormModal = ({ onClose, onSaved, initialData }) => {
  const [form, setForm] = useState({
    age: initialData?.age ?? '',
    gender: initialData?.gender ?? '',
    height_cm: initialData?.height_cm ?? '',
    weight_kg: initialData?.weight_kg ?? '',
    fitness_goal: initialData?.fitness_goal ?? '',
    fitness_level: initialData?.fitness_level ?? '',
    activity_level: initialData?.activity_level ?? '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  const set = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.age) e.age = 'Required';
    else if (form.age < 10 || form.age > 100) e.age = 'Enter a valid age';
    if (!form.gender) e.gender = 'Required';
    if (!form.height_cm) e.height_cm = 'Required';
    if (!form.weight_kg) e.weight_kg = 'Required';
    if (!form.fitness_goal) e.fitness_goal = 'Required';
    if (!form.fitness_level) e.fitness_level = 'Required';
    if (!form.activity_level) e.activity_level = 'Required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setApiError(null);
    try {
      const saved = await api.updateFitnessProfile({
        age: Number(form.age),
        gender: form.gender,
        height_cm: Number(form.height_cm),
        weight_kg: Number(form.weight_kg),
        fitness_goal: form.fitness_goal,
        fitness_level: form.fitness_level,
        activity_level: form.activity_level,
      });
      onSaved(saved);
    } catch (err) {
      setApiError(err.message || 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <button
            className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
            onClick={onClose}
            type="button"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 bg-violet-500/10 rounded-xl flex items-center justify-center">
              <UserCircle className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Fitness Profile</h2>
              <p className="text-xs text-gray-500">Required before generating an AI plan</p>
            </div>
          </div>

          {apiError && (
            <div className="mb-4 flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{apiError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Age" error={errors.age}>
                <input type="number" placeholder="25" value={form.age} onChange={set('age')}
                  className={inputCls(errors.age)} />
              </Field>
              <Field label="Gender" error={errors.gender}>
                <select value={form.gender} onChange={set('gender')} className={inputCls(errors.gender)}>
                  <option value="">Select…</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Height (cm)" error={errors.height_cm}>
                <input type="number" placeholder="175" value={form.height_cm} onChange={set('height_cm')}
                  className={inputCls(errors.height_cm)} />
              </Field>
              <Field label="Weight (kg)" error={errors.weight_kg}>
                <input type="number" placeholder="70" value={form.weight_kg} onChange={set('weight_kg')}
                  className={inputCls(errors.weight_kg)} />
              </Field>
            </div>

            <Field label="Fitness Goal" error={errors.fitness_goal}>
              <select value={form.fitness_goal} onChange={set('fitness_goal')} className={inputCls(errors.fitness_goal)}>
                <option value="">Select…</option>
                <option value="WEIGHT_LOSS">Weight Loss</option>
                <option value="MUSCLE_GAIN">Muscle Gain</option>
                <option value="ENDURANCE">Endurance</option>
              </select>
            </Field>

            <Field label="Fitness Level" error={errors.fitness_level}>
              <select value={form.fitness_level} onChange={set('fitness_level')} className={inputCls(errors.fitness_level)}>
                <option value="">Select…</option>
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
              </select>
            </Field>

            <Field label="Activity Level" error={errors.activity_level}>
              <select value={form.activity_level} onChange={set('activity_level')} className={inputCls(errors.activity_level)}>
                <option value="">Select…</option>
                <option value="sedentary">Sedentary (little or no exercise)</option>
                <option value="light">Light (1–3 days/week)</option>
                <option value="moderate">Moderate (3–5 days/week)</option>
                <option value="active">Active (6–7 days/week)</option>
                <option value="very_active">Very Active (twice/day or physical job)</option>
              </select>
            </Field>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
              ) : (
                <><Check className="w-4 h-4" /> Save Profile</>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   Main Profile Page
───────────────────────────────────────────── */
const ProfilePage = () => {
  const navigate = useNavigate();
  const { user: userProp } = useAuth();
  const [mounted, setMounted] = useState(false);

  // Payment / subscription state (from hook)
  const {
    plans, plansError, subscription, plansLoading, subscriptionLoading,
    loadingPlanId, paymentStatus, clearPaymentStatus, purchase,
  } = usePayments(userProp);

  // Fitness profile state
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [showProfileForm, setShowProfileForm] = useState(false);

  // AI plan state
  const [prompt, setPrompt] = useState('');
  const [aiStep, setAiStep] = useState(null); // null | 'parsing' | 'generating' | 'done'
  const [aiResult, setAiResult] = useState(null);
  const [aiError, setAiError] = useState(null);

  // Derive username from stored user data
  const storedUser = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } })();
  const displayName = storedUser?.username
    ? storedUser.username.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : 'Athlete';

  /* ── On mount: fetch existing fitness profile + existing AI plan ── */
  useEffect(() => {
    setMounted(true);
    (async () => {
      try {
        const data = await api.getFitnessProfile();
        setProfile(data);
      } catch {
        setProfile(null);
      } finally {
        setProfileLoading(false);
      }

      try {
        const plan = await api.getAIPlanView();
        if (plan && (plan.weekly_workout_plan || plan.daily_calories || plan.parsed_data)) {
          setAiResult(plan);
          setAiStep('done');
        }
      } catch {
        // No existing plan yet — that's fine
      }
    })();
  }, []);


  /* ── Profile saved callback ── */
  const handleProfileSaved = (saved) => {
    setProfile(saved);
    setShowProfileForm(false);
  };

  /* ── AI Plan Generation: 3-step flow ── */
  const handleGeneratePlan = async () => {
    if (!prompt.trim()) {
      setAiError('Please describe your fitness goal first.');
      return;
    }
    if (!profile) {
      setAiError('Please set up your fitness profile before generating a plan.');
      setShowProfileForm(true);
      return;
    }

    try {
      setAiStep('parsing');
      setAiError(null);
      setAiResult(null);

      // Step 1 (prerequisite): profile already exists — checked above

      // Step 2: POST /api/fitness/prompt/
      const parsed = await api.parseFitnessPrompt(prompt);

      // Step 3: POST /api/fitness/ai-plan/
      setAiStep('generating');
      const generated = await api.generateAIPlan({
        prompt: parsed.prompt,
        parsed_data: parsed.parsed_data,
      });

      setAiResult(generated.ai_plan ?? generated);
      setAiStep('done');

    } catch (err) {
      console.error('AI Generation Error:', err);
      setAiError(err.message || 'Failed to generate plan. Please try again.');
      setAiStep(null);
    }
  };

  const aiLoading = aiStep === 'parsing' || aiStep === 'generating';

  const stepLabels = [
    { step: 'parsing',    label: 'Parsing your fitness goals…' },
    { step: 'generating', label: 'Generating your personalised plan with AI…' },
  ];

  /* ─── JSX ─── */
  return (
    <div className="min-h-screen bg-gray-950 text-white relative overflow-x-hidden">

      {/* Subtle background glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      {/* ── Navbar ── */}
      <AppNav />

      {/* ── Hero Banner ── */}
      <div className="relative h-36 md:h-52 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1400&h=500&fit=crop&q=80"
          alt="Fitness hero"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-950/90 via-gray-950/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-center px-4 md:px-10 max-w-7xl mx-auto">
          <p className="text-violet-400 text-xs font-semibold uppercase tracking-widest mb-1">Your Journey</p>
          <h1 className="text-xl md:text-4xl font-bold text-white">Fitness Dashboard</h1>
          <p className="text-gray-300 text-xs md:text-sm mt-1">AI-powered plans tailored to your goals</p>
        </div>
      </div>

      {/* ── Profile Form Modal ── */}
      {showProfileForm && (
        <ProfileFormModal
          onClose={() => setShowProfileForm(false)}
          onSaved={handleProfileSaved}
          initialData={profile}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10 relative z-10 space-y-5 md:space-y-6">

        {/* ── Welcome Card ── */}
        <div className={`bg-gray-900 border border-gray-800 rounded-2xl p-6 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-violet-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
              {displayName.charAt(0)}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white">Welcome back, {displayName}</h2>
              <p className="text-gray-500 text-sm flex items-center gap-1.5 mt-0.5">
                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                Your AI-powered fitness journey
              </p>
            </div>
            <button
              onClick={() => setShowProfileForm(true)}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-sm text-gray-300 hover:text-white transition-all flex items-center gap-2 self-start sm:self-auto"
            >
              <UserCircle className="w-4 h-4" />
              {profileLoading ? 'Loading…' : profile ? 'Edit Profile' : 'Set up Profile'}
            </button>
          </div>

          {/* Profile summary row — shown once profile exists */}
          {profile && (
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-6">
              {[
                { label: 'Age', value: `${profile.age} yrs` },
                { label: 'Gender', value: profile.gender },
                { label: 'Height', value: `${profile.height_cm} cm` },
                { label: 'Weight', value: `${profile.weight_kg} kg` },
                { label: 'Goal', value: profile.fitness_goal?.replace('_', ' ') },
                { label: 'Level', value: profile.fitness_level },
              ].map(({ label, value }) => (
                <div key={label} className="bg-gray-950 border border-gray-800 rounded-xl px-3 py-2.5 text-center">
                  <p className="text-xs text-gray-600 uppercase tracking-wide mb-0.5">{label}</p>
                  <p className="text-sm font-semibold text-white capitalize">{value}</p>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatsCard icon={Activity} title="Workouts" value="24" subtitle="This month" delay={100} />
            <StatsCard icon={Zap} title="Calories" value="12450" subtitle="Burned this week" delay={200} />
            <StatsCard icon={TrendingUp} title="Progress" value="78" subtitle="Goal achieved %" delay={300} />
          </div>
        </div>

        {/* ── Activity Charts ── */}
        <ActivityCharts profile={profile} />

        {/* ── Motivational image strip ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=400&fit=crop&q=80', label: 'Strength' },
            { url: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&h=400&fit=crop&q=80', label: 'Nutrition' },
            { url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&h=400&fit=crop&q=80', label: 'Flexibility' },
            { url: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=600&h=400&fit=crop&q=80', label: 'Cardio' },
          ].map(({ url, label }) => (
            <div key={label} className="relative h-28 rounded-2xl overflow-hidden group cursor-default">
              <img
                src={url}
                alt={label}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 to-transparent" />
              <span className="absolute bottom-2.5 left-3 text-sm font-semibold text-white">{label}</span>
            </div>
          ))}
        </div>

        {/* ── Setup required banner ── */}
        {!profileLoading && !profile && (
          <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-300">Profile required</p>
              <p className="text-xs text-amber-400/70 mt-0.5">
                You need to create a fitness profile before the AI can generate a personalised plan.
              </p>
            </div>
            <button
              onClick={() => setShowProfileForm(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold rounded-xl transition-colors flex-shrink-0"
            >
              Set up now
            </button>
          </div>
        )}

        {/* ── AI Plan Generator ── */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-violet-500/10 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">AI Fitness Plan Generator</h3>
              {!profile && !profileLoading && (
                <p className="text-xs text-amber-400 mt-0.5">Set up your profile first to unlock this</p>
              )}
            </div>
          </div>

          <p className="text-gray-500 text-sm mb-5 leading-relaxed">
            Describe your goal in plain English. FitTrack AI calls the prompt parser, then the plan generator, and displays your personalised week-by-week schedule.
          </p>

          {/* Step indicators */}
          <div className="flex items-center gap-2 mb-5">
            {[
              { n: 1, label: 'Profile', done: !!profile },
              { n: 2, label: 'Parse goal', done: aiStep === 'generating' || aiStep === 'done' },
              { n: 3, label: 'Generate plan', done: aiStep === 'done' },
            ].map((s, i) => (
              <div key={s.n} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  s.done ? 'bg-emerald-500 text-white' : 'bg-gray-800 border border-gray-700 text-gray-500'
                }`}>
                  {s.done ? <Check className="w-3.5 h-3.5" /> : s.n}
                </div>
                <span className={`text-xs hidden sm:block ${s.done ? 'text-emerald-400' : 'text-gray-600'}`}>{s.label}</span>
                {i < 2 && <div className="w-6 h-px bg-gray-800" />}
              </div>
            ))}
          </div>

          <textarea
            value={prompt}
            onChange={(e) => { setPrompt(e.target.value); if (aiError) setAiError(null); }}
            placeholder="Example: I want to lose belly fat and improve stamina in 3 months"
            disabled={aiLoading || (!profile && !profileLoading)}
            className="w-full h-24 bg-gray-950 border border-gray-800 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors placeholder-gray-600 resize-none disabled:opacity-40 disabled:cursor-not-allowed"
          />

          <div className="flex items-center gap-3 mt-3">
            <button
              onClick={handleGeneratePlan}
              disabled={aiLoading || !prompt.trim() || (!profile && !profileLoading)}
              className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 rounded-xl text-white text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {aiLoading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating…</>
              ) : (
                <><Brain className="w-4 h-4" /> Generate My Plan <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
            {aiStep === 'done' && (
              <button
                onClick={() => { setAiResult(null); setAiStep(null); setPrompt(''); }}
                className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-sm text-gray-400 hover:text-white transition-all"
              >
                Start over
              </button>
            )}
          </div>

          {/* Live step progress */}
          {aiLoading && (
            <div className="mt-4 bg-gray-950 border border-gray-800 rounded-xl p-4 space-y-2.5">
              {stepLabels.map(({ step, label }) => {
                const isActive = aiStep === step;
                const isDone =
                  (step === 'parsing' && (aiStep === 'generating' || aiStep === 'done')) ||
                  (step === 'generating' && aiStep === 'done');
                return (
                  <div key={step} className="flex items-center gap-3 text-sm">
                    {isDone ? (
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    ) : isActive ? (
                      <div className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-gray-700 flex-shrink-0" />
                    )}
                    <span className={isDone ? 'text-emerald-400' : isActive ? 'text-white' : 'text-gray-600'}>
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Result */}
          {aiResult && (
            <div className="mt-5 bg-gray-950 border border-gray-800 rounded-xl p-5 animate-fade-in">
              <div className="flex items-center gap-2 mb-4">
                <Check className="w-4 h-4 text-emerald-400" />
                <h4 className="text-base font-semibold text-white">Your Personalised AI Plan</h4>
              </div>
              <AIPlanCard plan={aiResult} />
            </div>
          )}

          {/* Error */}
          {aiError && (
            <div className="mt-4 flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{aiError}</p>
            </div>
          )}
        </div>

        {/* ── Current Plan ── */}
        <CurrentPlanSection
          subscription={subscription}
          loading={subscriptionLoading}
        />

        {/* ── Pricing Plans ── */}
        <div id="pricing-section">
          <PricingSection
            plans={plans}
            plansError={plansError}
            plansLoading={plansLoading}
            subscription={subscription}
            loadingPlanId={loadingPlanId}
            paymentStatus={paymentStatus}
            onClearStatus={clearPaymentStatus}
            onPurchase={purchase}
          />
        </div>

      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-800 mt-10 relative z-10">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-center gap-2 text-gray-700 text-sm">
          <Heart className="w-4 h-4" />
          <span>FitTrack AI — Smarter Fitness. Better Results.</span>
        </div>
      </footer>
    </div>
  );
};

/* ─────────────────────────────────────────────
   Tier helpers
───────────────────────────────────────────── */
const TIER_ORDER = { free: 0, pro: 1, elite: 2 };

const tierMeta = (tier) => ({
  free:  { label: 'Free',  Icon: Shield,  color: 'text-gray-400',  bg: 'bg-gray-800',        ring: 'border-gray-700' },
  pro:   { label: 'Pro',   Icon: Zap,     color: 'text-violet-400', bg: 'bg-violet-500/10',  ring: 'border-violet-500/30' },
  elite: { label: 'Elite', Icon: Crown,   color: 'text-amber-400',  bg: 'bg-amber-500/10',   ring: 'border-amber-500/30' },
}[tier] ?? { label: tier, Icon: Shield, color: 'text-gray-400', bg: 'bg-gray-800', ring: 'border-gray-700' });

const formatExpiry = (expiresAt) => {
  if (!expiresAt) return 'Lifetime';
  return new Date(expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

/* ─────────────────────────────────────────────
   Current Plan Section
───────────────────────────────────────────── */
const CurrentPlanSection = ({ subscription, loading }) => {
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFetched, setHistoryFetched] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (historyFetched) return;
    setHistoryLoading(true);
    try {
      const data = await api.getPaymentHistory();
      setHistory(data);
      setHistoryFetched(true);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [historyFetched]);

  const handleToggleHistory = () => {
    const next = !showHistory;
    setShowHistory(next);
    if (next && !historyFetched) fetchHistory();
  };

  const scrollToPricing = () =>
    document.getElementById('pricing-section')?.scrollIntoView({ behavior: 'smooth' });

  if (loading) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 animate-pulse">
        <div className="h-4 w-24 bg-gray-800 rounded mb-4" />
        <div className="h-8 w-40 bg-gray-800 rounded mb-2" />
        <div className="h-3 w-32 bg-gray-800 rounded" />
      </div>
    );
  }

  const tier = subscription?.plan?.tier ?? 'free';
  const plan = subscription?.plan ?? null;
  const sub  = subscription?.subscription ?? null;
  const { label, Icon, color, bg, ring } = tierMeta(tier);

  return (
    <div className={`bg-gray-900 border ${ring} rounded-2xl p-6`}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Your current plan</p>
            <h3 className="text-lg font-bold text-white">{plan?.name ?? 'Free Plan'}</h3>
          </div>
        </div>
        <span className={`flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full border ${bg} ${color} ${ring}`}>
          Active
        </span>
      </div>

      {/* Plan details */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="bg-gray-950 border border-gray-800 rounded-xl px-4 py-3">
          <p className="text-xs text-gray-600 mb-0.5">Price</p>
          <p className="text-sm font-semibold text-white">
            {plan?.price_paise === 0 ? 'Free forever' : `₹${(plan?.price_paise ?? 0) / 100}/${plan?.billing_cycle === 'yearly' ? 'yr' : 'mo'}`}
          </p>
        </div>
        <div className="bg-gray-950 border border-gray-800 rounded-xl px-4 py-3">
          <p className="text-xs text-gray-600 mb-0.5">Billing</p>
          <p className="text-sm font-semibold text-white capitalize">
            {plan?.billing_cycle ?? 'N/A'}
          </p>
        </div>
        <div className="bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-600 mb-0.5">
              {sub?.expires_at ? 'Renews' : 'Valid'}
            </p>
            <p className="text-sm font-semibold text-white">
              {formatExpiry(sub?.expires_at)}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={handleToggleHistory}
          className="flex items-center gap-1.5 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-sm text-gray-300 hover:text-white transition-all"
        >
          <CreditCard className="w-3.5 h-3.5" />
          Billing history
          {showHistory
            ? <ChevronUp className="w-3.5 h-3.5 ml-0.5" />
            : <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
          }
        </button>
        {tier !== 'elite' && (
          <button
            onClick={scrollToPricing}
            className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-xl text-sm text-white font-medium transition-all"
          >
            <Crown className="w-3.5 h-3.5" />
            Upgrade plan
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Payment history panel */}
      {showHistory && (
        <div className="mt-4 border-t border-gray-800 pt-4">
          {historyLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading history…
            </div>
          ) : history.length === 0 ? (
            <p className="text-sm text-gray-600 py-2">No payment history yet.</p>
          ) : (
            <div className="space-y-2">
              {history.map((item) => (
                <div key={item.razorpay_payment_id} className="flex items-center justify-between gap-3 text-sm py-2 border-b border-gray-800/50 last:border-0">
                  <div>
                    <p className="text-white font-medium">{item.plan_name}</p>
                    <p className="text-xs text-gray-600 mt-0.5 capitalize">
                      {item.billing_cycle} · {new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-white font-semibold">₹{item.amount_inr ?? (item.amount_paise != null ? item.amount_paise / 100 : item.amount ?? '—')}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      item.status === 'captured'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-gray-800 text-gray-500 border border-gray-700'
                    }`}>
                      {item.status === 'captured' ? 'Paid' : item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────
   Plan Card (single plan display)
───────────────────────────────────────────── */
const PlanCard = ({ plan, isCurrent, isHigherTier, isLoading, anyLoading, onPurchase }) => {
  const isPopular = plan.is_popular;
  const isFree    = plan.tier === 'free';
  const { color: tierColor } = tierMeta(plan.tier);

  const buttonLabel = () => {
    if (isCurrent)     return 'Current plan';
    if (isFree)        return 'Free forever';
    if (isLoading)     return 'Processing…';
    if (!isHigherTier) return 'Downgrade';
    return `Upgrade to ${plan.name}`;
  };

  const buttonStyle = () => {
    if (isCurrent || isFree) return 'border border-gray-700 text-gray-500 cursor-default';
    if (!isHigherTier)       return 'border border-gray-700 text-gray-600 cursor-not-allowed opacity-50';
    if (plan.tier === 'elite') return 'bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300';
    return 'bg-violet-600 hover:bg-violet-700 text-white';
  };

  return (
    <div className={`relative bg-gray-900 border rounded-2xl p-6 flex flex-col transition-all duration-300 ${
      isCurrent  ? `border-emerald-500/40 shadow-lg shadow-emerald-500/5` :
      isPopular  ? 'border-violet-500/40 shadow-lg shadow-violet-500/5' :
                   'border-gray-800 hover:border-gray-700'
    }`}>
      {isCurrent && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="flex items-center gap-1 bg-emerald-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg">
            <Check className="w-3 h-3" />
            Current plan
          </span>
        </div>
      )}
      {!isCurrent && isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="flex items-center gap-1 bg-violet-600 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg">
            <Star className="w-3 h-3 fill-white" />
            Most popular
          </span>
        </div>
      )}

      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-base font-semibold text-white">{plan.name}</h3>
          {plan.tier !== 'free' && (
            <span className={`text-xs font-medium ${tierColor} uppercase tracking-wide`}>{plan.tier}</span>
          )}
        </div>
        <p className="text-xs text-gray-500 mb-4">{plan.description}</p>
        <div className="flex items-baseline gap-1">
          {plan.price_paise === 0 ? (
            <span className="text-4xl font-bold text-white">Free</span>
          ) : (
            <>
              <span className="text-4xl font-bold text-white">₹{plan.price_paise / 100}</span>
              <span className="text-gray-500 text-sm">/{plan.billing_cycle === 'yearly' ? 'yr' : 'mo'}</span>
            </>
          )}
        </div>
        {plan.billing_cycle === 'yearly' && plan.price_paise > 0 && (
          <p className="text-xs text-emerald-400 mt-1 font-medium">Save 25% vs monthly</p>
        )}
      </div>

      <ul className="space-y-2.5 mb-6 flex-1">
        {(plan.features || []).map((feature, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm">
            <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <span className="text-gray-300">{feature}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={() => !isCurrent && !isFree && isHigherTier && onPurchase(plan.id, plan.name)}
        disabled={isCurrent || isFree || !isHigherTier || isLoading || anyLoading}
        className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
          isLoading ? 'opacity-70 cursor-wait' : ''
        } ${buttonStyle()}`}
      >
        {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        {buttonLabel()}
      </button>
    </div>
  );
};

/* ─────────────────────────────────────────────
   Pricing Section
───────────────────────────────────────────── */
const PricingSection = ({ plans, plansError, plansLoading, subscription, loadingPlanId, paymentStatus, onClearStatus, onPurchase }) => {
  const [cycle, setCycle] = useState('monthly');

  const currentTier  = subscription?.plan?.tier ?? 'free';
  const currentPlanId = subscription?.plan?.id ?? null;

  const filtered = plans.filter(p =>
    p.tier === 'free' || p.billing_cycle === cycle
  );
  const displayed = filtered.length > 0 ? filtered : plans;

  return (
    <div className="pt-4">
      <div className="text-center mb-8">
        <p className="text-xs uppercase tracking-widest text-violet-400 font-semibold mb-2">Simple pricing</p>
        <h2 className="text-3xl font-bold text-white mb-2">Choose your plan</h2>
        <p className="text-gray-500 text-sm mb-5">Invest in your health. Cancel anytime.</p>

        <div className="inline-flex items-center bg-gray-900 border border-gray-800 rounded-xl p-1 gap-1">
          <button
            onClick={() => setCycle('monthly')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${cycle === 'monthly' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setCycle('yearly')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${cycle === 'yearly' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Yearly
            <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">Save 25%</span>
          </button>
        </div>
      </div>

      {paymentStatus && (
        <div className={`mb-6 p-4 rounded-xl border text-sm flex items-start gap-3 ${
          paymentStatus.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
            : 'bg-red-500/10 border-red-500/20 text-red-300'
        }`}>
          {paymentStatus.type === 'success'
            ? <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
            : <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          }
          <span>{paymentStatus.message}</span>
          <button onClick={onClearStatus} className="ml-auto opacity-60 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {plansLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 animate-pulse">
              <div className="h-5 w-20 bg-gray-800 rounded mb-3" />
              <div className="h-10 w-28 bg-gray-800 rounded mb-4" />
              <div className="space-y-2">
                {[1,2,3,4].map(j => <div key={j} className="h-3 w-full bg-gray-800 rounded" />)}
              </div>
            </div>
          ))}
        </div>
      ) : plansError ? (
        <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-2xl p-5">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-300">Could not load plans</p>
            <p className="text-xs text-red-400/70 mt-0.5">{plansError}</p>
          </div>
        </div>
      ) : plans.length === 0 ? (
        <div className="text-center py-10 text-gray-600 border border-dashed border-gray-800 rounded-2xl">
          <p className="text-sm">No plans available at the moment. Add plans via the admin panel.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {displayed.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isCurrent={plan.id === currentPlanId || (plan.tier === 'free' && currentTier === 'free')}
              isHigherTier={(TIER_ORDER[plan.tier] ?? 0) > (TIER_ORDER[currentTier] ?? 0)}
              isLoading={loadingPlanId === plan.id}
              anyLoading={!!loadingPlanId}
              onPurchase={onPurchase}
            />
          ))}
        </div>
      )}

      <p className="text-center text-xs text-gray-700 mt-5">
        All paid plans include a 7-day free trial. No credit card required to start.
      </p>
    </div>
  );
};

export default ProfilePage;
