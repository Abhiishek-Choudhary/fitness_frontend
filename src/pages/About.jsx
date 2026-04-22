import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dumbbell, Brain, TrendingUp, Shield, Zap, Star,
  ArrowRight, Check, Target, Activity, Heart, BarChart2, Sparkles
} from 'lucide-react';

/* ---- Animated number counter triggered on scroll ---- */
const Counter = ({ end, suffix = '' }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const steps = 60;
          const increment = end / steps;
          let current = 0;
          const timer = setInterval(() => {
            current += increment;
            if (current >= end) { setCount(end); clearInterval(timer); }
            else setCount(Math.floor(current));
          }, 2000 / steps);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
};

/* ---- Shared public nav (also used by Contact) ---- */
export const PublicNav = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-gray-950/95 border-b border-gray-800 backdrop-blur-xl' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <button onClick={() => navigate('/profile')} className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
            <Dumbbell className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white">FitTrack AI</span>
        </button>
        <div className="hidden md:flex items-center gap-1">
          <button onClick={() => navigate('/about')} className="px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all">About</button>
          <button onClick={() => navigate('/contact')} className="px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all">Contact</button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/login')} className="px-4 py-1.5 text-sm text-gray-400 hover:text-white transition-colors">
            Sign in
          </button>
          <button onClick={() => navigate('/signup')} className="px-4 py-1.5 text-sm bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors">
            Get started
          </button>
        </div>
      </div>
    </nav>
  );
};

const FeatureCard = ({ icon: Icon, title, description, accent }) => (
  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-all duration-300 group">
    <div className={`w-10 h-10 ${accent} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
    <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
  </div>
);

const TestimonialCard = ({ name, role, quote, rating }) => (
  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
    <div className="flex gap-0.5 mb-4">
      {Array.from({ length: rating }).map((_, i) => (
        <Star key={i} className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
      ))}
    </div>
    <p className="text-gray-400 text-sm leading-relaxed mb-5">"{quote}"</p>
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 bg-violet-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
        {name.charAt(0)}
      </div>
      <div>
        <p className="text-sm font-semibold text-white">{name}</p>
        <p className="text-xs text-gray-600">{role}</p>
      </div>
    </div>
  </div>
);

export default function AboutPage() {
  const navigate = useNavigate();

  const features = [
    { icon: Brain, title: 'AI-Powered Plans', accent: 'bg-violet-600', description: 'Our Gemini AI reads your goals in plain English and generates a fully personalized workout and nutrition plan — not a generic template.' },
    { icon: TrendingUp, title: 'Real-Time Progress', accent: 'bg-emerald-600', description: 'Track weight, workouts, streaks, and calories in one dashboard. Visual charts make your journey clear at a glance.' },
    { icon: Activity, title: 'Posture Analysis', accent: 'bg-blue-600', description: 'Upload a workout video and our AI scores your form, flags issues, and gives actionable tips to prevent injury and maximize gains.' },
    { icon: Zap, title: 'Calorie Intelligence', accent: 'bg-orange-600', description: 'Snap a photo of your meal and get instant calorie and macro breakdowns. No manual logging, no spreadsheets.' },
    { icon: BarChart2, title: 'Adaptive Workouts', accent: 'bg-pink-600', description: 'Workouts evolve as you do. As your fitness improves, your plan automatically adjusts to keep you challenged and progressing.' },
    { icon: Shield, title: 'Science-Backed', accent: 'bg-teal-600', description: 'Every plan is grounded in exercise science — progressive overload, periodization, and evidence-based nutrition principles.' },
  ];

  const testimonials = [
    { name: 'Sarah K.', role: 'Lost 18 kg in 6 months', rating: 5, quote: "FitTrack AI gave me a plan that actually fit my schedule. The AI suggestions felt like having a personal trainer in my pocket. Never been this consistent." },
    { name: 'Marcus R.', role: 'Gained 8 kg of muscle', rating: 5, quote: "The posture analysis feature alone is worth it. My squat form was terrible and I didn't even know. Fixed it in two weeks with the AI feedback." },
    { name: 'Priya M.', role: 'Completed first marathon', rating: 5, quote: "I went from barely running 5k to finishing my first marathon. The adaptive plan kept me on track every week without burning me out." },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <PublicNav />

      {/* Hero */}
      <section className="relative pt-36 pb-24 px-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/3 w-[500px] h-[500px] bg-violet-500/6 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl" />
        </div>
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-sm text-violet-300 font-medium">AI-Powered Fitness Platform</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight tracking-tight">
            Built for real results.<br />
            <span className="bg-gradient-to-r from-violet-400 to-purple-300 bg-clip-text text-transparent">Backed by AI.</span>
          </h1>
          <p className="text-lg text-gray-400 max-w-xl mx-auto leading-relaxed mb-10">
            FitTrack AI combines artificial intelligence with proven exercise science to deliver a fitness experience that's genuinely personal — not one-size-fits-all.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => navigate('/signup')} className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2">
              Start for free <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={() => navigate('/contact')} className="px-6 py-3 bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 rounded-xl font-medium text-sm transition-all">
              Get in touch
            </button>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-gray-800 bg-gray-900/40">
        <div className="max-w-4xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { end: 50000, suffix: '+', label: 'Active users' },
            { end: 2000000, suffix: '+', label: 'Workouts logged' },
            { end: 98, suffix: '%', label: 'Satisfaction rate' },
            { end: 12, suffix: '+', label: 'AI features' },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-bold text-white mb-1"><Counter end={s.end} suffix={s.suffix} /></p>
              <p className="text-xs text-gray-500 uppercase tracking-wide">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs uppercase tracking-widest text-violet-400 font-semibold mb-3">Our Mission</p>
            <h2 className="text-3xl font-bold text-white mb-5 leading-snug">
              Fitness advice that's actually personal
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              Most fitness apps give you the same plan regardless of who you are. FitTrack AI is different. We use large language models to understand your goals in natural language, then generate plans that fit your exact body, schedule, and lifestyle.
            </p>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              We believe the best workout is one you'll actually do. That means plans you can stick to, progress you can see, and tools that help you understand your body — not just count calories.
            </p>
            <div className="space-y-2">
              {['No cookie-cutter plans', 'No equipment assumptions', 'Adapts as you improve', 'Works for any goal'].map((item) => (
                <div key={item} className="flex items-center gap-2.5 text-sm text-gray-300">
                  <div className="w-5 h-5 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-emerald-400" />
                  </div>
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Target, label: 'Goal tracking', value: 'Daily check-ins' },
              { icon: Brain, label: 'AI coaching', value: 'Gemini-powered' },
              { icon: Activity, label: 'Form analysis', value: 'Video AI' },
              { icon: Heart, label: 'Health focus', value: 'Holistic approach' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors">
                <Icon className="w-5 h-5 text-violet-400 mb-3" />
                <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                <p className="text-sm font-semibold text-white">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 border-y border-gray-800 bg-gray-900/20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-widest text-violet-400 font-semibold mb-3">Everything you need</p>
            <h2 className="text-3xl font-bold text-white mb-3">Why FitTrack AI?</h2>
            <p className="text-gray-500 text-sm max-w-xl mx-auto">One platform for AI planning, progress tracking, posture analysis, and nutrition — no juggling 5 different apps.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f) => <FeatureCard key={f.title} {...f} />)}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-widest text-violet-400 font-semibold mb-3">Simple by design</p>
            <h2 className="text-3xl font-bold text-white mb-3">How it works</h2>
            <p className="text-gray-500 text-sm">From goal to plan in under 30 seconds.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { n: '01', title: 'Set Your Goal', desc: "Tell the AI what you want — lose fat, build muscle, run faster. In plain English. No lengthy forms to fill out." },
              { n: '02', title: 'Get Your Plan', desc: "Within seconds, you have a full workout schedule, nutrition targets, and weekly structure tailored exactly to you." },
              { n: '03', title: 'Track & Adapt', desc: "Log progress, upload photos, and check in weekly. The AI refines your plan as your fitness level improves." },
            ].map((step) => (
              <div key={step.n} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center hover:border-gray-700 transition-colors">
                <div className="w-12 h-12 bg-violet-500/10 border border-violet-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-lg font-bold text-violet-400">{step.n}</span>
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6 border-y border-gray-800 bg-gray-900/20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-widest text-violet-400 font-semibold mb-3">Real people, real results</p>
            <h2 className="text-3xl font-bold text-white mb-3">What our users say</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {testimonials.map((t) => <TestimonialCard key={t.name} {...t} />)}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to start?</h2>
          <p className="text-gray-500 text-sm mb-8">Join thousands of people who took their fitness seriously with FitTrack AI.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => navigate('/signup')} className="px-8 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2">
              Create free account <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={() => navigate('/contact')} className="px-8 py-3 bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 rounded-xl font-medium text-sm transition-all">
              Have questions? Contact us
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center">
              <Dumbbell className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-white">FitTrack AI</span>
          </div>
          <div className="flex gap-6 text-sm">
            <button onClick={() => navigate('/about')} className="text-gray-600 hover:text-gray-400 transition-colors">About</button>
            <button onClick={() => navigate('/contact')} className="text-gray-600 hover:text-gray-400 transition-colors">Contact</button>
            <button onClick={() => navigate('/login')} className="text-gray-600 hover:text-gray-400 transition-colors">Sign in</button>
          </div>
          <p className="text-xs text-gray-700">© 2026 FitTrack AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
