import { useState, useEffect, useCallback } from 'react';
import {
  Newspaper, Trophy, Zap, Flame, Dumbbell, Activity,
  RefreshCw, AlertCircle, ExternalLink, Globe
} from 'lucide-react';
import AppNav from '../components/AppNav.jsx';
import api from '../services/api.js';
// AppNav reads logout from AuthContext — no prop needed

/* ─── Category config ─── */
const CATEGORIES = [
  { key: 'all',          label: 'All News',    icon: Globe,     fetcher: () => api.getAllNews() },
  { key: 'hyrox',        label: 'Hyrox',       icon: Flame,     fetcher: () => api.getHyroxNews() },
  { key: 'ironman',      label: 'Ironman',      icon: Activity,  fetcher: () => api.getIronmanNews() },
  { key: 'olympia',      label: 'Mr. Olympia',  icon: Trophy,    fetcher: () => api.getOlympiaNews() },
  { key: 'crossfit',     label: 'CrossFit',     icon: Zap,       fetcher: () => api.getCrossfitNews() },
  { key: 'powerlifting', label: 'Powerlifting', icon: Dumbbell,  fetcher: () => api.getPowerliftingNews() },
  { key: 'fitness',      label: 'Fitness',      icon: Newspaper, fetcher: () => api.getFitnessNews() },
];

/* ─── Skeleton card ─── */
const Skeleton = () => (
  <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden animate-pulse">
    <div className="h-44 bg-gray-800" />
    <div className="p-5 space-y-3">
      <div className="h-3 bg-gray-800 rounded w-1/3" />
      <div className="h-4 bg-gray-800 rounded w-full" />
      <div className="h-4 bg-gray-800 rounded w-4/5" />
      <div className="h-3 bg-gray-800 rounded w-1/2 mt-4" />
    </div>
  </div>
);

/* ─── Article card ─── */
const ArticleCard = ({ article }) => {
  const { title, summary, url, image_url, published_at, source, category, sport } = article;
  const badge = category || sport;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-violet-500/40 hover:shadow-lg hover:shadow-violet-500/10 transition-all flex flex-col"
    >
      <div className="relative h-44 bg-gray-800 overflow-hidden flex-shrink-0">
        {image_url ? (
          <img
            src={image_url}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Newspaper className="w-8 h-8 text-gray-700" />
          </div>
        )}
        {badge && (
          <span className="absolute top-3 left-3 px-2 py-0.5 bg-violet-600/90 text-white text-xs font-medium rounded-full capitalize">
            {badge}
          </span>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-white font-semibold text-sm leading-snug mb-2 group-hover:text-violet-300 transition-colors line-clamp-2">
          {title}
        </h3>
        {summary && (
          <p className="text-gray-400 text-xs leading-relaxed line-clamp-3 mb-4 flex-1">{summary}</p>
        )}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-800">
          <div className="flex items-center gap-2 min-w-0">
            {source && <span className="text-gray-500 text-xs truncate">{source}</span>}
            {published_at && (
              <>
                <span className="text-gray-700 text-xs">·</span>
                <span className="text-gray-600 text-xs flex-shrink-0">
                  {new Date(published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </>
            )}
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-gray-600 group-hover:text-violet-400 transition-colors flex-shrink-0 ml-2" />
        </div>
      </div>
    </a>
  );
};

/* ─── Section block (for "All" view with grouped data) ─── */
const CategorySection = ({ title, icon: Icon, articles }) => {
  if (!articles?.length) return null;
  return (
    <div className="mb-12">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 bg-gray-800 border border-gray-700 rounded-xl flex items-center justify-center">
          <Icon className="w-4 h-4 text-violet-400" />
        </div>
        <h2 className="text-white font-bold text-lg">{title}</h2>
        <span className="text-gray-600 text-sm">{articles.length} articles</span>
        <div className="flex-1 h-px bg-gray-800 ml-2" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {articles.map((a, i) => <ArticleCard key={a.id ?? i} article={a} />)}
      </div>
    </div>
  );
};

const EmptyState = ({ category }) => (
  <div className="text-center py-20">
    <div className="w-16 h-16 bg-gray-900 border border-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
      <Newspaper className="w-7 h-7 text-gray-600" />
    </div>
    <p className="text-white font-semibold mb-1">No articles yet</p>
    <p className="text-gray-500 text-sm">
      {category === 'all'
        ? 'Check back soon for the latest fitness news.'
        : `No ${category} articles available right now.`}
    </p>
  </div>
);

const ErrorBanner = ({ message, onRetry }) => (
  <div className="flex items-center gap-4 bg-red-500/10 border border-red-500/30 rounded-2xl px-5 py-4 mb-8">
    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
    <p className="text-red-300 text-sm flex-1">{message}</p>
    <button
      onClick={onRetry}
      className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 transition-colors"
    >
      <RefreshCw className="w-3.5 h-3.5" /> Retry
    </button>
  </div>
);

/* ─── Main page ─── */
const FitnessNews = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [cache, setCache] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchCategory = useCallback(async (catKey, force = false) => {
    if (cache[catKey] && !force) return;
    const cat = CATEGORIES.find(c => c.key === catKey);
    if (!cat) return;

    setLoading(true);
    setError('');
    try {
      const result = await cat.fetcher();
      setCache(prev => ({ ...prev, [catKey]: result }));
    } catch (err) {
      setError(err.message || 'Failed to load articles. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [cache]);

  useEffect(() => {
    fetchCategory(activeCategory);
  }, [activeCategory]);

  const handleRetry = () => {
    setCache(prev => { const next = { ...prev }; delete next[activeCategory]; return next; });
    fetchCategory(activeCategory, true);
  };

  const currentData = cache[activeCategory];

  /* Normalise API response → articles array */
  const toArticles = (raw) => {
    if (!raw) return null;
    if (Array.isArray(raw)) return raw;
    if (raw.results) return raw.results;
    if (raw.articles) return raw.articles;
    return null; // grouped object — handled separately
  };

  /* Render "all" view — supports grouped obj OR flat array */
  const renderAll = () => {
    if (loading && !currentData) {
      return (
        <div className="space-y-10">
          {[1, 2].map(s => (
            <div key={s}>
              <div className="h-5 bg-gray-800 rounded w-32 mb-5 animate-pulse" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} />)}
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (!currentData) return null;

    const articles = toArticles(currentData);

    // Flat array response
    if (articles !== null) {
      if (!articles.length) return <EmptyState category="all" />;
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {articles.map((a, i) => <ArticleCard key={a.id ?? i} article={a} />)}
        </div>
      );
    }

    // Grouped object: { hyrox: [...], ironman: [...], ... }
    const sectionKeys = Object.keys(currentData).filter(k => Array.isArray(currentData[k]));
    if (!sectionKeys.length) return <EmptyState category="all" />;

    return sectionKeys.map(key => {
      const cat = CATEGORIES.find(c => c.key === key);
      return (
        <CategorySection
          key={key}
          title={cat?.label ?? (key.charAt(0).toUpperCase() + key.slice(1))}
          icon={cat?.icon ?? Newspaper}
          articles={currentData[key]}
        />
      );
    });
  };

  /* Render single-category view */
  const renderSingle = () => {
    if (loading && !currentData) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} />)}
        </div>
      );
    }

    if (!currentData) return null;

    const articles = toArticles(currentData) ?? [];
    if (!articles.length) return <EmptyState category={activeCategory} />;

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {articles.map((a, i) => <ArticleCard key={a.id ?? i} article={a} />)}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <AppNav />

      <div className="max-w-7xl mx-auto px-4 py-5 md:py-8">
        {/* Header */}
        <div className="mb-5 md:mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 bg-gray-900 border border-gray-800 rounded-xl flex items-center justify-center">
              <Newspaper className="w-5 h-5 text-violet-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">Fitness News</h1>
          </div>
          <p className="text-gray-500 text-sm ml-12">
            Stay updated with the latest events, competitions, and training insights
          </p>
        </div>

        {/* Category tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 mb-8 scrollbar-hide">
          {CATEGORIES.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                activeCategory === key
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20'
                  : 'bg-gray-900 text-gray-400 border border-gray-800 hover:text-white hover:border-gray-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && <ErrorBanner message={error} onRetry={handleRetry} />}

        {/* Content */}
        {activeCategory === 'all' ? renderAll() : renderSingle()}
      </div>
    </div>
  );
};

export default FitnessNews;
