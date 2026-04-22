import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, MessageSquare, Clock, ChevronDown, ChevronUp, Send, CheckCircle, Dumbbell } from 'lucide-react';
import { PublicNav } from './About.jsx';

const FAQ_ITEMS = [
  { q: 'Is FitTrack AI free to use?', a: 'We offer a free Basic plan that includes AI workout planning, progress tracking, and calorie logging. Paid plans unlock advanced features like daily plan adjustments, 1-on-1 consultations, and priority support.' },
  { q: 'How does the AI plan generation work?', a: 'You describe your goal in plain English — for example, "I want to lose belly fat in 3 months." Our AI parses your intent, fitness level, and timeline, then generates a personalized week-by-week workout and nutrition plan.' },
  { q: 'Do I need gym equipment?', a: 'No. When generating your plan, the AI takes your available equipment into account. You can get a full plan for home bodyweight workouts, gym training, or anything in between.' },
  { q: 'How accurate is the calorie analyzer?', a: 'The AI calorie analyzer uses computer vision to estimate portion sizes and identify foods. It provides a reasonable estimate for logging purposes. For medical-grade accuracy, consult a registered dietitian.' },
  { q: 'Can I change my plan after it is generated?', a: 'Yes. You can regenerate your plan at any time by submitting a new prompt. Your history and progress photos are preserved across plan changes.' },
  { q: 'How is my data stored?', a: 'Your data is encrypted at rest and in transit. We never sell your personal data to third parties. You can request deletion of your account and all associated data at any time by contacting us.' },
];

const FaqItem = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className={`border rounded-xl overflow-hidden transition-colors duration-200 ${open ? 'border-violet-500/30 bg-violet-500/5' : 'border-gray-800 bg-gray-900'}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left"
      >
        <span className="text-sm font-medium text-white pr-4">{q}</span>
        {open
          ? <ChevronUp className="w-4 h-4 text-violet-400 flex-shrink-0" />
          : <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
        }
      </button>
      {open && (
        <div className="px-5 pb-5 text-sm text-gray-400 leading-relaxed border-t border-gray-800 pt-4">
          {a}
        </div>
      )}
    </div>
  );
};

export default function ContactPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.subject.trim()) e.subject = 'Subject is required';
    if (!form.message.trim()) e.message = 'Message is required';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length) { setErrors(e2); return; }
    setSubmitting(true);
    // Simulate submission
    setTimeout(() => { setSubmitting(false); setSubmitted(true); }, 1500);
  };

  const handleChange = (field) => (ev) => {
    setForm(prev => ({ ...prev, [field]: ev.target.value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <PublicNav />

      {/* Hero */}
      <section className="pt-36 pb-16 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 left-1/3 w-96 h-96 bg-violet-500/6 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 max-w-xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 mb-6">
            <MessageSquare className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-sm text-violet-300 font-medium">We're here to help</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">Get in touch</h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            Have a question, feedback, or need help getting started? We read every message and reply within 24 hours.
          </p>
        </div>
      </section>

      {/* Info cards */}
      <section className="pb-12 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: Mail, title: 'Email', body: 'support@fittrack.ai', sub: 'For general enquiries' },
            { icon: Clock, title: 'Response time', body: '< 24 hours', sub: 'Mon–Fri, 9am–6pm' },
            { icon: MessageSquare, title: 'Live chat', body: 'Coming soon', sub: 'Available on paid plans' },
          ].map(({ icon: Icon, title, body, sub }) => (
            <div key={title} className="bg-gray-900 border border-gray-800 rounded-xl p-5 text-center">
              <div className="w-10 h-10 bg-violet-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Icon className="w-5 h-5 text-violet-400" />
              </div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{title}</p>
              <p className="text-base font-semibold text-white mb-0.5">{body}</p>
              <p className="text-xs text-gray-600">{sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact form + FAQ */}
      <section className="pb-24 px-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">

          {/* Form */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-5">Send a message</h2>

            {submitted ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-7 h-7 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Message sent!</h3>
                <p className="text-sm text-gray-500 mb-6">We'll get back to you within 24 hours.</p>
                <button
                  onClick={() => { setSubmitted(false); setForm({ name: '', email: '', subject: '', message: '' }); }}
                  className="px-5 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 rounded-xl text-sm transition-all"
                >
                  Send another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">Name</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={handleChange('name')}
                      placeholder="Your name"
                      className={`w-full bg-gray-950 border rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none transition-colors ${errors.name ? 'border-red-500/50 focus:border-red-500' : 'border-gray-800 focus:border-violet-500'}`}
                    />
                    {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">Email</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={handleChange('email')}
                      placeholder="you@example.com"
                      className={`w-full bg-gray-950 border rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none transition-colors ${errors.email ? 'border-red-500/50 focus:border-red-500' : 'border-gray-800 focus:border-violet-500'}`}
                    />
                    {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">Subject</label>
                  <select
                    value={form.subject}
                    onChange={handleChange('subject')}
                    className={`w-full bg-gray-950 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-colors ${errors.subject ? 'border-red-500/50 focus:border-red-500' : 'border-gray-800 focus:border-violet-500'}`}
                  >
                    <option value="">Select a topic</option>
                    <option>General question</option>
                    <option>Bug report</option>
                    <option>Feature request</option>
                    <option>Billing & plans</option>
                    <option>AI plan help</option>
                    <option>Account issue</option>
                  </select>
                  {errors.subject && <p className="text-xs text-red-400 mt-1">{errors.subject}</p>}
                </div>

                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">Message</label>
                  <textarea
                    value={form.message}
                    onChange={handleChange('message')}
                    placeholder="Describe your question or issue in detail..."
                    rows={5}
                    className={`w-full bg-gray-950 border rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none transition-colors resize-none ${errors.message ? 'border-red-500/50 focus:border-red-500' : 'border-gray-800 focus:border-violet-500'}`}
                  />
                  {errors.message && <p className="text-xs text-red-400 mt-1">{errors.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending...</>
                  ) : (
                    <><Send className="w-4 h-4" /> Send message</>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* FAQ */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-5">Frequently asked questions</h2>
            <div className="space-y-2">
              {FAQ_ITEMS.map((item) => <FaqItem key={item.q} {...item} />)}
            </div>
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
