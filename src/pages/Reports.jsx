import { useState, useEffect, useCallback } from 'react';
import {
  FileText, Download, Mail, Trash2, Plus, X, Check, AlertCircle,
  Calendar, ChevronDown, ChevronUp, Loader2, BarChart2, Utensils,
  TrendingUp, Clock, RefreshCw, Zap, Info
} from 'lucide-react';
import AppNav from '../components/AppNav.jsx';
import api from '../services/api.js';

/* ── Constants ── */
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const todayStr = () => new Date().toISOString().split('T')[0];

const getCurrentWeek = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  return Math.ceil(((now - start) / 86400000 + start.getDay() + 1) / 7);
};

const formatPeriodLabel = (report) =>
  report.period === 'weekly'
    ? `Week ${report.week}, ${report.year}`
    : `${MONTHS[(report.month ?? 1) - 1]} ${report.year}`;

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

/* ─────────────────────────────────────────────
   Report Generator Card
───────────────────────────────────────────── */
const ReportGeneratorCard = ({ onGenerated }) => {
  const [period, setPeriod]       = useState('weekly');
  const [year, setYear]           = useState(new Date().getFullYear());
  const [week, setWeek]           = useState(getCurrentWeek());
  const [month, setMonth]         = useState(new Date().getMonth() + 1);
  const [generating, setGenerating] = useState(false);
  const [status, setStatus]       = useState(null);

  const handleGenerate = async () => {
    setGenerating(true);
    setStatus(null);
    try {
      const params = period === 'weekly'
        ? { period, year: Number(year), week: Number(week) }
        : { period, year: Number(year), month: Number(month) };
      const result = await api.generateReport(params);
      setStatus({ type: 'success', message: 'Report generated! Check "My Reports" below.' });
      onGenerated(result);
    } catch (err) {
      setStatus({ type: 'error', message: err.message || 'Failed to generate report.' });
    } finally {
      setGenerating(false);
    }
  };

  const label = period === 'weekly'
    ? `Week ${week}, ${year}`
    : `${MONTHS[month - 1]} ${year}`;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 bg-violet-500/10 rounded-xl flex items-center justify-center">
          <FileText className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-white">Generate New Report</h3>
          <p className="text-xs text-gray-500 mt-0.5">PDF with AI insights, workout analysis &amp; nutrition data</p>
        </div>
      </div>

      {/* Period toggle */}
      <div className="flex bg-gray-950 border border-gray-800 rounded-xl p-1 gap-1 mb-5">
        {['weekly', 'monthly'].map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all capitalize ${
              period === p ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Date inputs */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div>
          <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">Year</label>
          <input
            type="number"
            value={year}
            min={2020}
            max={new Date().getFullYear()}
            onChange={(e) => setYear(e.target.value)}
            className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors"
          />
        </div>
        {period === 'weekly' ? (
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">Week (1–52)</label>
            <input
              type="number"
              value={week}
              min={1}
              max={52}
              onChange={(e) => setWeek(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>
        ) : (
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">Month</label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors"
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {status && (
        <div className={`mb-4 p-3 rounded-xl border text-sm flex items-start gap-2 ${
          status.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
            : 'bg-red-500/10 border-red-500/20 text-red-300'
        }`}>
          {status.type === 'success'
            ? <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
            : <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          }
          {status.message}
        </div>
      )}

      <button
        onClick={handleGenerate}
        disabled={generating}
        className="w-full py-3 bg-violet-600 hover:bg-violet-700 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {generating
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating PDF…</>
          : <><FileText className="w-4 h-4" /> Generate {label} Report</>
        }
      </button>
    </div>
  );
};

/* ─────────────────────────────────────────────
   Food Log — Add Form
───────────────────────────────────────────── */
const FoodLogAddForm = ({ onSaved, onCancel }) => {
  const [form, setForm]   = useState({ food_name: '', calories: '', protein: '', carbs: '', fat: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.food_name.trim() || !form.calories) {
      setError('Food name and calories are required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.createFoodLogEntry({
        food_name: form.food_name.trim(),
        calories:  Number(form.calories),
        protein:   Number(form.protein)  || 0,
        carbs:     Number(form.carbs)    || 0,
        fat:       Number(form.fat)      || 0,
        date:      todayStr(),
      });
      onSaved();
    } catch (err) {
      setError(err.message || 'Failed to save entry.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="bg-gray-950 border border-gray-800 rounded-xl p-4 mb-3">
      <div className="grid grid-cols-2 gap-2.5 mb-3">
        <input
          type="text"
          placeholder="Food name (e.g. Chicken Biryani)"
          value={form.food_name}
          onChange={set('food_name')}
          className="col-span-2 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors"
        />
        {[['calories','Calories (kcal)'],['protein','Protein (g)'],['carbs','Carbs (g)'],['fat','Fat (g)']].map(([field, placeholder]) => (
          <input
            key={field}
            type="number"
            min="0"
            placeholder={placeholder}
            value={form[field]}
            onChange={set(field)}
            className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors"
          />
        ))}
      </div>
      {error && <p className="text-xs text-red-400 mb-3">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg text-sm text-white font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          Save entry
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm text-gray-400 hover:text-white transition-all"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

/* ─────────────────────────────────────────────
   Food Log Card
───────────────────────────────────────────── */
const DAILY_CALORIE_GOAL = 2000;

const FoodLogCard = () => {
  const [entries, setEntries]       = useState([]);
  const [totalCalories, setTotal]   = useState(0);
  const [loading, setLoading]       = useState(true);
  const [showAddForm, setShowAdd]   = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const today = todayStr();

  const fetchLog = useCallback(async () => {
    try {
      const data = await api.getFoodLog(today);
      const items = Array.isArray(data) ? data : (data.entries ?? data.logs ?? []);
      const total = data.total_calories ?? items.reduce((s, e) => s + (Number(e.calories) || 0), 0);
      setEntries(items);
      setTotal(total);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => { fetchLog(); }, [fetchLog]);

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await api.deleteFoodLogEntry(id);
      fetchLog();
    } catch {
      setDeletingId(null);
    }
  };

  const pct = Math.min(100, Math.round((totalCalories / DAILY_CALORIE_GOAL) * 100));

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-500/10 rounded-xl flex items-center justify-center">
            <Utensils className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Today's Food Log</h3>
            <p className="text-xs text-gray-500">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAdd((prev) => !prev)}
          className="w-8 h-8 bg-violet-600 hover:bg-violet-700 rounded-lg flex items-center justify-center transition-colors"
          title={showAddForm ? 'Cancel' : 'Log a meal'}
        >
          {showAddForm ? <X className="w-4 h-4 text-white" /> : <Plus className="w-4 h-4 text-white" />}
        </button>
      </div>

      {/* Calorie progress bar */}
      <div className="mb-5">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-gray-500">Consumed today</span>
          <span className={`font-semibold ${totalCalories > DAILY_CALORIE_GOAL ? 'text-red-400' : 'text-white'}`}>
            {totalCalories} / {DAILY_CALORIE_GOAL} kcal
          </span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              pct > 100 ? 'bg-red-500' : pct > 80 ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-gray-600 mt-1">{pct}% of daily goal</p>
      </div>

      {showAddForm && (
        <FoodLogAddForm
          onSaved={() => { setShowAdd(false); fetchLog(); }}
          onCancel={() => setShowAdd(false)}
        />
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-8">
          <Utensils className="w-8 h-8 text-gray-700 mx-auto mb-2" />
          <p className="text-sm text-gray-600">No meals logged today</p>
          <p className="text-xs text-gray-700 mt-1">Click + to add your first meal</p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <div key={entry.id} className="flex items-center gap-3 bg-gray-950 border border-gray-800 rounded-xl px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{entry.food_name}</p>
                <p className="text-xs text-gray-600 mt-0.5">
                  P: {entry.protein ?? 0}g &middot; C: {entry.carbs ?? 0}g &middot; F: {entry.fat ?? 0}g
                </p>
              </div>
              <span className="text-sm font-semibold text-amber-400 flex-shrink-0">{entry.calories} kcal</span>
              <button
                onClick={() => handleDelete(entry.id)}
                disabled={deletingId === entry.id}
                className="w-7 h-7 flex items-center justify-center text-gray-700 hover:text-red-400 transition-colors flex-shrink-0 disabled:opacity-50"
              >
                {deletingId === entry.id
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Trash2 className="w-3.5 h-3.5" />
                }
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────
   Report List Item
───────────────────────────────────────────── */
const STATUS_STYLES = {
  completed:  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  generating: 'bg-amber-500/10  text-amber-400  border-amber-500/20',
  failed:     'bg-red-500/10    text-red-400    border-red-500/20',
};

const ReportListItem = ({ report, onDeleted }) => {
  const [downloading, setDownloading]   = useState(false);
  const [showEmail, setShowEmail]       = useState(false);
  const [emailInput, setEmailInput]     = useState(() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}').email || ''; } catch { return ''; }
  });
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus]   = useState(null);
  const [deleting, setDeleting]         = useState(false);
  const [showSummary, setShowSummary]   = useState(false);
  const [summary, setSummary]           = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const blob = await api.downloadReport(report.id);
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `fittrack-${report.period}-${formatPeriodLabel(report).replace(/[\s,]/g, '-').toLowerCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  const handleSendEmail = async () => {
    setSendingEmail(true);
    setEmailStatus(null);
    try {
      await api.sendReportEmail(report.id, emailInput || undefined);
      setEmailStatus({ type: 'success', message: `Report sent to ${emailInput || 'your email'}` });
      setTimeout(() => { setShowEmail(false); setEmailStatus(null); }, 3000);
    } catch (err) {
      setEmailStatus({ type: 'error', message: err.message || 'Failed to send email.' });
    } finally {
      setSendingEmail(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete the ${formatPeriodLabel(report)} report? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await api.deleteReport(report.id);
      onDeleted(report.id);
    } catch {
      setDeleting(false);
    }
  };

  const handleToggleSummary = async () => {
    const next = !showSummary;
    setShowSummary(next);
    if (next && summary === null) {
      setSummaryLoading(true);
      try {
        const data = await api.getReport(report.id);
        setSummary(data.ai_summary || data.summary || 'No AI summary available for this report.');
      } catch {
        setSummary('Could not load AI summary.');
      } finally {
        setSummaryLoading(false);
      }
    }
  };

  const statusStyle = STATUS_STYLES[report.status] ?? 'bg-gray-800 text-gray-500 border-gray-700';
  const isPeriodWeekly = report.period === 'weekly';

  return (
    <div className="bg-gray-950 border border-gray-800 rounded-xl p-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isPeriodWeekly ? 'bg-violet-500/10' : 'bg-blue-500/10'
        }`}>
          {isPeriodWeekly
            ? <Zap className="w-4 h-4 text-violet-400" />
            : <BarChart2 className="w-4 h-4 text-blue-400" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <p className="text-sm font-semibold text-white capitalize">{report.period} Report</p>
            <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${statusStyle}`}>
              {report.status}
            </span>
          </div>
          <p className="text-xs text-gray-400">{formatPeriodLabel(report)}</p>
          <p className="text-xs text-gray-700 mt-0.5 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Generated {formatDate(report.created_at)}
          </p>
        </div>
      </div>

      {/* Actions — only for completed reports */}
      {report.status === 'completed' && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-xs text-gray-300 hover:text-white transition-all disabled:opacity-50"
          >
            {downloading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
            Download PDF
          </button>

          <button
            onClick={() => setShowEmail((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all border ${
              showEmail
                ? 'bg-violet-600/20 border-violet-500/40 text-violet-300'
                : 'bg-gray-800 hover:bg-gray-700 border-gray-700 text-gray-300 hover:text-white'
            }`}
          >
            <Mail className="w-3 h-3" />
            Send via Email
          </button>

          <button
            onClick={handleToggleSummary}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-xs text-gray-300 hover:text-white transition-all"
          >
            <TrendingUp className="w-3 h-3" />
            AI Summary
            {showSummary ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-red-500/10 border border-gray-700 hover:border-red-500/30 rounded-lg text-xs text-gray-500 hover:text-red-400 transition-all disabled:opacity-50 ml-auto"
          >
            {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
          </button>
        </div>
      )}

      {/* Email form */}
      {showEmail && (
        <div className="mt-3 p-3 bg-gray-900 border border-gray-800 rounded-xl">
          <p className="text-xs text-gray-500 mb-2">Send report PDF to:</p>
          <div className="flex gap-2">
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="email@example.com"
              className="flex-1 bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors"
            />
            <button
              onClick={handleSendEmail}
              disabled={sendingEmail || !emailInput.trim()}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg text-sm text-white font-medium transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              {sendingEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
              Send
            </button>
          </div>
          {emailStatus && (
            <p className={`text-xs mt-2 ${emailStatus.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
              {emailStatus.message}
            </p>
          )}
        </div>
      )}

      {/* AI Summary */}
      {showSummary && (
        <div className="mt-3 p-4 bg-gray-900 border border-gray-800 rounded-xl">
          {summaryLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading AI summary…
            </div>
          ) : (
            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{summary}</p>
          )}
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────
   Report List Card
───────────────────────────────────────────── */
const ReportListCard = ({ reports, loading, onRefresh }) => {
  const [localReports, setLocalReports] = useState(reports);

  useEffect(() => { setLocalReports(reports); }, [reports]);

  const handleDeleted = useCallback((id) => {
    setLocalReports((prev) => prev.filter((r) => r.id !== id));
  }, []);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-500/10 rounded-xl flex items-center justify-center">
            <BarChart2 className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">My Reports</h3>
            <p className="text-xs text-gray-500">
              {localReports.length} report{localReports.length !== 1 ? 's' : ''} generated
            </p>
          </div>
        </div>
        <button
          onClick={onRefresh}
          title="Refresh"
          className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : localReports.length === 0 ? (
        <div className="text-center py-10">
          <FileText className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No reports yet</p>
          <p className="text-xs text-gray-700 mt-1">
            Generate your first weekly or monthly report using the form above
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {localReports.map((report) => (
            <ReportListItem
              key={report.id}
              report={report}
              onDeleted={handleDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────
   Main Reports Page
───────────────────────────────────────────── */
export default function ReportsPage({ onLogout }) {
  const [reports, setReports]             = useState([]);
  const [reportsLoading, setReportsLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    setReportsLoading(true);
    try {
      const data = await api.getReports();
      setReports(Array.isArray(data) ? data : (data.results ?? []));
    } catch {
      setReports([]);
    } finally {
      setReportsLoading(false);
    }
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <AppNav onLogout={onLogout} />

      {/* Background glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 relative z-10">

        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">Reports &amp; Analytics</h1>
          <p className="text-sm text-gray-500">
            AI-powered PDF reports with workout analysis, nutrition data, body progress, and personalised coaching insights.
          </p>
        </div>

        {/* Automated emails info banner */}
        <div className="flex items-start gap-3 bg-blue-500/5 border border-blue-500/15 rounded-2xl px-5 py-4 mb-6">
          <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-300/80 space-y-0.5">
            <p><span className="font-medium text-blue-300">Automated emails:</span> Welcome email on signup &middot; Monthly progress digest on the 1st of each month — handled automatically.</p>
            <p>Use the form below to generate and email reports on-demand at any time.</p>
          </div>
        </div>

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: Generator + Reports list */}
          <div className="lg:col-span-2 space-y-6">
            <ReportGeneratorCard onGenerated={fetchReports} />
            <ReportListCard
              reports={reports}
              loading={reportsLoading}
              onRefresh={fetchReports}
            />
          </div>

          {/* Right: Food log */}
          <div className="lg:col-span-1">
            <FoodLogCard />
          </div>
        </div>
      </div>
    </div>
  );
}
