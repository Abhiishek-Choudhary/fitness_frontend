import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dumbbell, Eye, EyeOff, AlertCircle, ChevronLeft, ChevronRight,
  Zap, TrendingUp, Shield, ArrowRight
} from 'lucide-react';
import api from '../services/api.js';

const LoginPage = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await api.login(formData);
      localStorage.setItem('access_token', response.access);
      localStorage.setItem('refresh_token', response.refresh);

      // Backend may return user object under 'user' key or at root level
      const userData = response.user || {
        email: formData.email,
        username: formData.email,
      };
      localStorage.setItem('user', JSON.stringify(userData));
      onLoginSuccess(userData);
      navigate('/profile', { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Zap, title: 'AI Fitness Plans', desc: 'Personalized workouts generated in seconds' },
    { icon: TrendingUp, title: 'Track Everything', desc: 'Calories, workouts, weight — all in one place' },
    { icon: Shield, title: 'Posture Analysis', desc: 'Real-time form feedback powered by AI' },
  ];

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800/50">
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate(1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">No account?</span>
          <button
            onClick={() => navigate('/signup')}
            className="px-4 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm text-white transition-all"
          >
            Sign up free
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Brand panel */}
        <div className="hidden lg:flex flex-col justify-between w-[52%] bg-gray-900 border-r border-gray-800 p-12 relative overflow-hidden">
          {/* Glow */}
          <div className="absolute top-0 left-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-violet-600/8 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />

          <div className="relative">
            <div className="flex items-center gap-3 mb-16">
              <div className="w-9 h-9 bg-violet-600 rounded-xl flex items-center justify-center">
                <Dumbbell className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-white text-lg">FitTrack AI</span>
            </div>

            <h2 className="text-4xl font-bold text-white leading-tight mb-4">
              Your fitness journey<br />
              <span className="text-violet-400">starts here.</span>
            </h2>
            <p className="text-gray-400 text-lg mb-12">
              Join 50,000+ athletes training smarter with AI-powered coaching.
            </p>

            <div className="space-y-5">
              {features.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gray-800 border border-gray-700 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{title}</p>
                    <p className="text-gray-500 text-sm mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative bg-gray-800/50 border border-gray-700 rounded-2xl p-5">
            <p className="text-gray-300 text-sm leading-relaxed italic mb-3">
              "FitTrack AI completely changed how I train. The AI plans adapt to my schedule and I've hit 3 PRs this month alone."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-violet-600/30 rounded-full flex items-center justify-center text-violet-300 text-xs font-bold">
                JM
              </div>
              <div>
                <p className="text-white text-xs font-semibold">Jordan M.</p>
                <p className="text-gray-500 text-xs">Competitive CrossFit athlete</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Form panel */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 py-12">
          <div className="w-full max-w-sm">
            {/* Mobile logo */}
            <div className="flex items-center gap-2 mb-8 lg:hidden">
              <div className="w-8 h-8 bg-violet-600 rounded-xl flex items-center justify-center">
                <Dumbbell className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white">FitTrack AI</span>
            </div>

            <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
            <p className="text-gray-400 text-sm mb-8">Sign in to continue your training</p>

            {error && (
              <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition text-white placeholder-gray-500 text-sm"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-gray-300">Password</label>
                  <button type="button" className="text-xs text-violet-400 hover:text-violet-300 transition">
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2.5 pr-10 bg-gray-900 border border-gray-700 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition text-white placeholder-gray-500 text-sm"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-violet-600 hover:bg-violet-500 text-white py-2.5 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm mt-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Sign in
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </button>
            </form>

            <p className="text-center text-gray-500 text-xs mt-6">
              Don't have an account?{' '}
              <button onClick={() => navigate('/signup')} className="text-violet-400 hover:text-violet-300 transition font-medium">
                Create one free
              </button>
            </p>

            {/* Stats row */}
            <div className="flex items-center justify-between mt-10 pt-6 border-t border-gray-800">
              {[['50K+', 'Users'], ['2M+', 'Workouts'], ['98%', 'Satisfaction']].map(([val, label]) => (
                <div key={label} className="text-center">
                  <p className="text-white font-bold text-sm">{val}</p>
                  <p className="text-gray-500 text-xs">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
