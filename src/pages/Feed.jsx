import { useState, useEffect } from 'react';
import {
  Heart, Bookmark, MessageCircle, Play, TrendingUp, Flame, Users,
  Sparkles, Send, Trash2, UserPlus, UserCheck, Tag,
  AlertCircle, Loader2, RefreshCw, LayoutGrid, List,
} from 'lucide-react';
import AppNav from '../components/AppNav.jsx';
import { useFeed } from '../hooks/useFeed.js';
import api from '../services/api.js';

/* ── helpers ─────────────────────────────── */
const DIFFICULTY_BADGE = {
  beginner:     'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  intermediate: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  advanced:     'bg-red-500/15 text-red-400 border border-red-500/30',
};

const CATEGORY_ICON = {
  weight_loss: '🔥', hiit: '⚡', muscle_gain: '💪', yoga: '🧘',
  strength: '🏋️', nutrition: '🥗', cardio: '🏃', flexibility: '🤸',
};

const TABS = [
  { id: 'forYou',    label: 'For You',  Icon: Sparkles },
  { id: 'trending',  label: 'Trending', Icon: TrendingUp },
  { id: 'following', label: 'Following',Icon: Users },
  { id: 'saved',     label: 'Saved',    Icon: Bookmark },
];

const ytId = (url) => {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|v=|embed\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
};

const avatar = (name) => (name || 'U').charAt(0).toUpperCase();

/* ── Skeleton ────────────────────────────── */
function PostSkeleton() {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden animate-pulse">
      <div className="w-full aspect-video bg-gray-800" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-gray-800 rounded w-20" />
        <div className="h-4 bg-gray-800 rounded w-5/6" />
        <div className="h-3 bg-gray-800 rounded w-4/6" />
        <div className="flex items-center gap-2 pt-1">
          <div className="w-7 h-7 bg-gray-800 rounded-full" />
          <div className="h-3 bg-gray-800 rounded w-24" />
        </div>
      </div>
    </div>
  );
}

/* ── Comments panel ──────────────────────── */
function CommentsPanel({ postId, user }) {
  const [comments, setComments] = useState(null);
  const [busy, setBusy]         = useState(true);
  const [text, setText]         = useState('');
  const [sending, setSending]   = useState(false);

  useEffect(() => {
    let live = true;
    api.getPostComments(postId)
      .then((d) => live && setComments(Array.isArray(d) ? d : d.results ?? []))
      .catch(() => live && setComments([]))
      .finally(() => live && setBusy(false));
    return () => { live = false; };
  }, [postId]);

  const send = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const c = await api.addComment(postId, text.trim());
      setComments((p) => [c, ...(p ?? [])]);
      setText('');
    } catch {/* */}
    finally { setSending(false); }
  };

  const remove = async (id) => {
    try { await api.deleteComment(id); setComments((p) => p.filter((c) => c.id !== id)); }
    catch {/* */}
  };

  return (
    <div className="border-t border-gray-800 bg-gray-950/60 px-4 py-3 space-y-3">
      {user && (
        <div className="flex gap-2 items-center">
          <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {avatar(user.username)}
          </div>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Add a comment…"
            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors"
          />
          <button
            onClick={send}
            disabled={!text.trim() || sending}
            className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-violet-600 hover:bg-violet-500 disabled:opacity-40 rounded-xl transition-colors"
          >
            {sending
              ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
              : <Send className="w-3.5 h-3.5 text-white" />}
          </button>
        </div>
      )}

      {busy && <div className="flex justify-center py-2"><Loader2 className="w-4 h-4 text-gray-600 animate-spin" /></div>}

      {!busy && comments?.length === 0 && (
        <p className="text-xs text-gray-600 text-center py-1">No comments yet.</p>
      )}

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {(comments ?? []).map((c) => {
          const uname = c.author?.username ?? c.user?.username ?? 'User';
          const body  = c.body ?? c.text ?? c.content ?? '';
          const mine  = user && uname === user.username;
          return (
            <div key={c.id} className="flex gap-2 group/c">
              <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {avatar(uname)}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-semibold text-gray-300 mr-1.5">{uname}</span>
                <span className="text-xs text-gray-400">{body}</span>
              </div>
              {mine && (
                <button onClick={() => remove(c.id)} className="opacity-0 group-hover/c:opacity-100 transition-opacity flex-shrink-0">
                  <Trash2 className="w-3 h-3 text-gray-600 hover:text-red-400" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Post card ───────────────────────────── */
function PostCard({ post, user, onLike, onSave, onFollow, followedCreators }) {
  const [showComments, setShowComments] = useState(false);
  const [showVideo, setShowVideo]       = useState(false);

  const vid      = ytId(post.youtube_url ?? post.video_url);
  const creator  = post.creator ?? post.author ?? {};
  const cname    = creator.username ?? '';
  const isFollow = followedCreators instanceof Set && followedCreators.has(cname);
  const diffCls  = DIFFICULTY_BADGE[post.difficulty] ?? '';
  const catIcon  = CATEGORY_ICON[post.category] ?? '📌';
  const catLabel = (post.category ?? '').replace(/_/g, ' ');

  return (
    <article className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-500/8 transition-all duration-300 flex flex-col group">

      {/* Thumbnail / embed */}
      <div
        className="relative overflow-hidden cursor-pointer bg-gray-800"
        onClick={() => vid && setShowVideo((v) => !v)}
      >
        {showVideo && vid ? (
          <iframe
            src={`https://www.youtube.com/embed/${vid}?autoplay=1`}
            className="w-full aspect-video"
            allow="autoplay; encrypted-media"
            allowFullScreen
            title={post.title ?? ''}
          />
        ) : (
          <div className="w-full aspect-video relative overflow-hidden">
            {vid ? (
              <img
                src={`https://img.youtube.com/vi/${vid}/hqdefault.jpg`}
                alt={post.title ?? ''}
                className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Play className="w-10 h-10 text-gray-600" />
              </div>
            )}
            {vid && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-12 h-12 rounded-full bg-red-600/90 flex items-center justify-center shadow-xl">
                  <Play className="w-5 h-5 text-white ml-0.5" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex gap-1.5 flex-wrap">
          {catLabel && (
            <span className="bg-gray-950/80 backdrop-blur-sm text-xs text-gray-300 rounded-lg px-2 py-0.5 border border-gray-700/50 capitalize">
              {catIcon} {catLabel}
            </span>
          )}
          {diffCls && (
            <span className={`text-xs rounded-lg px-2 py-0.5 backdrop-blur-sm ${diffCls}`}>
              {post.difficulty}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex-1 flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-white leading-snug line-clamp-2">
          {post.title ?? 'Untitled'}
        </h3>

        {post.description && (
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{post.description}</p>
        )}

        {/* Creator */}
        <div className="flex items-center gap-2 mt-auto pt-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {avatar(creator.display_name ?? cname)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-300 truncate">
              {creator.display_name ?? cname ?? 'Creator'}
            </p>
            {creator.followers_count != null && (
              <p className="text-[10px] text-gray-600">{Number(creator.followers_count).toLocaleString()} followers</p>
            )}
          </div>
          {user && cname && (
            <button
              onClick={() => onFollow(cname)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-all flex-shrink-0 ${
                isFollow
                  ? 'bg-violet-500/10 text-violet-300 border-violet-500/25 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/25'
                  : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-violet-600 hover:text-white hover:border-violet-600'
              }`}
            >
              {isFollow ? <UserCheck className="w-3 h-3" /> : <UserPlus className="w-3 h-3" />}
              {isFollow ? 'Following' : 'Follow'}
            </button>
          )}
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-1 px-4 py-2.5 border-t border-gray-800">
        <button
          onClick={() => onLike(post.id)}
          disabled={!user}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all disabled:cursor-default ${
            post.is_liked ? 'text-rose-400 bg-rose-500/10' : 'text-gray-500 hover:text-rose-400 hover:bg-rose-500/10'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${post.is_liked ? 'fill-rose-400' : ''}`} />
          {post.likes_count ?? 0}
        </button>

        <button
          onClick={() => setShowComments((v) => !v)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
            showComments ? 'text-violet-300 bg-violet-500/10' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
          }`}
        >
          <MessageCircle className="w-3.5 h-3.5" />
          {post.comments_count ?? 0}
        </button>

        <button
          onClick={() => onSave(post.id)}
          disabled={!user}
          className={`ml-auto flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all disabled:cursor-default ${
            post.is_saved ? 'text-amber-400 bg-amber-500/10' : 'text-gray-500 hover:text-amber-400 hover:bg-amber-500/10'
          }`}
        >
          <Bookmark className={`w-3.5 h-3.5 ${post.is_saved ? 'fill-amber-400' : ''}`} />
          Save
        </button>
      </div>

      {showComments && <CommentsPanel postId={post.id} user={user} />}
    </article>
  );
}

/* ── Category accent colours ─────────────── */
const CAT_COLOR = {
  weight_loss:  { bg: 'bg-orange-500/15', text: 'text-orange-400', ring: 'ring-orange-500/30' },
  hiit:         { bg: 'bg-yellow-500/15', text: 'text-yellow-400', ring: 'ring-yellow-500/30' },
  muscle_gain:  { bg: 'bg-blue-500/15',   text: 'text-blue-400',   ring: 'ring-blue-500/30' },
  yoga:         { bg: 'bg-emerald-500/15',text: 'text-emerald-400',ring: 'ring-emerald-500/30' },
  strength:     { bg: 'bg-red-500/15',    text: 'text-red-400',    ring: 'ring-red-500/30' },
  nutrition:    { bg: 'bg-green-500/15',  text: 'text-green-400',  ring: 'ring-green-500/30' },
  cardio:       { bg: 'bg-pink-500/15',   text: 'text-pink-400',   ring: 'ring-pink-500/30' },
  flexibility:  { bg: 'bg-purple-500/15', text: 'text-purple-400', ring: 'ring-purple-500/30' },
};

/* ── Category sidebar (desktop) ──────────── */
function CategorySidebar({ categories, active, onChange }) {
  if (!categories.length) return null;
  return (
    <aside className="hidden lg:block w-60 flex-shrink-0">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden sticky top-20">
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-gray-800 flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-violet-500/20 flex items-center justify-center">
            <Tag className="w-3.5 h-3.5 text-violet-400" />
          </div>
          <span className="text-sm font-semibold text-white">Browse by Topic</span>
        </div>

        <div className="p-2 space-y-0.5">
          {/* All */}
          <button
            onClick={() => onChange('')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
              active === ''
                ? 'bg-violet-600 text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0 transition-colors ${
              active === '' ? 'bg-white/20' : 'bg-gray-800 group-hover:bg-gray-700'
            }`}>
              ✨
            </span>
            <span className="text-sm font-medium flex-1 text-left">All Content</span>
            <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${
              active === '' ? 'bg-white/20 text-white' : 'bg-gray-800 text-gray-500'
            }`}>
              {categories.reduce((s, c) => s + (c.post_count ?? 0), 0) || '—'}
            </span>
          </button>

          {/* Divider */}
          <div className="border-t border-gray-800/50 my-1.5" />

          {categories.map((cat) => {
            const slug   = cat.slug ?? (cat.name ?? '').toLowerCase().replace(/\s+/g, '_');
            const label  = (cat.name ?? slug).replace(/_/g, ' ');
            const icon   = CATEGORY_ICON[slug] ?? '📌';
            const color  = CAT_COLOR[slug] ?? { bg: 'bg-gray-700/30', text: 'text-gray-400', ring: '' };
            const isActive = active === slug;

            return (
              <button
                key={slug}
                onClick={() => onChange(slug)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
                  isActive ? 'bg-violet-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0 ring-1 transition-all ${
                  isActive ? 'bg-white/20 ring-white/20' : `${color.bg} ${color.ring}`
                }`}>
                  {icon}
                </span>
                <span className="text-sm font-medium flex-1 text-left capitalize truncate">{label}</span>
                {cat.post_count != null && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium flex-shrink-0 ${
                    isActive ? 'bg-white/20 text-white' : 'bg-gray-800 text-gray-600'
                  }`}>
                    {cat.post_count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

/* ── Mobile category chips ───────────────── */
function CategoryChips({ categories, active, onChange }) {
  if (!categories.length) return null;
  const all  = [{ slug: '', label: 'All ✨', icon: '' }, ...categories.map((c) => {
    const slug = c.slug ?? (c.name ?? '').toLowerCase().replace(/\s+/g, '_');
    return { slug, label: (c.name ?? slug).replace(/_/g, ' '), icon: CATEGORY_ICON[slug] ?? '📌' };
  })];

  return (
    <div className="lg:hidden flex gap-2 overflow-x-auto pb-2 mb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      {all.map(({ slug, label, icon }) => {
        const color   = CAT_COLOR[slug];
        const isActive = active === slug;
        return (
          <button
            key={slug}
            onClick={() => onChange(slug)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold border transition-all ${
              isActive
                ? 'bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-500/25'
                : `bg-gray-900 text-gray-400 border-gray-700 hover:border-gray-500 hover:text-white`
            }`}
          >
            {icon && <span className="text-sm leading-none">{icon}</span>}
            <span className="capitalize">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ── Feed page ───────────────────────────── */
export default function FeedPage({ user, onLogout }) {
  const {
    activeTab, changeTab,
    activeCategory, setActiveCategory,
    posts, categories, loading, error,
    followedCreators, toggleLike, toggleSave, toggleFollow,
    refresh,
  } = useFeed(user);

  const [gridView, setGridView] = useState(true);

  const isGuestRestrictedTab = !user && (activeTab === 'following' || activeTab === 'saved');

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <AppNav onLogout={onLogout} />

      {/* Hero */}
      <div className="relative h-44 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1400&h=400&fit=crop&q=80"
          alt="Content feed"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-gray-950/60 via-gray-950/50 to-gray-950" />
        <div className="absolute inset-0 flex flex-col justify-center px-6 max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-white">Content Feed</h1>
          <p className="text-gray-300 text-sm mt-1">Personalised workouts, nutrition tips &amp; inspiration from top coaches</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-4">

        {/* Tabs + grid toggle */}
        <div className="flex items-center gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 overflow-x-auto">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => changeTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                activeTab === id
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
          <button
            onClick={() => setGridView((v) => !v)}
            title={gridView ? 'List view' : 'Grid view'}
            className="ml-auto p-2 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-all flex-shrink-0"
          >
            {gridView ? <List className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
          </button>
        </div>

        {/* Category chips (mobile) */}
        <CategoryChips categories={categories} active={activeCategory} onChange={setActiveCategory} />

        {/* Guest restricted */}
        {isGuestRestrictedTab && (
          <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-300">Sign in required</p>
              <p className="text-xs text-amber-400/70 mt-0.5">
                Log in to view your {activeTab === 'following' ? 'following' : 'saved'} feed.
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-300 flex-1">{error}</p>
            <button onClick={refresh} className="text-red-400 hover:text-red-300 transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Main layout */}
        <div className="flex gap-6">
          <CategorySidebar categories={categories} active={activeCategory} onChange={setActiveCategory} />

          <div className="flex-1 min-w-0">
            {/* Skeletons */}
            {loading && (
              <div className={gridView ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4' : 'space-y-4'}>
                {Array.from({ length: 6 }).map((_, i) => <PostSkeleton key={i} />)}
              </div>
            )}

            {/* Empty */}
            {!loading && !isGuestRestrictedTab && posts.length === 0 && !error && (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <Flame className="w-12 h-12 text-gray-700" />
                <p className="text-gray-500 text-sm">No posts found</p>
                <p className="text-gray-700 text-xs text-center">
                  {activeTab === 'following'
                    ? 'Follow some creators to see their content here.'
                    : activeTab === 'saved'
                    ? 'Save posts to find them here later.'
                    : 'Try a different category or check back later.'}
                </p>
              </div>
            )}

            {/* Posts */}
            {!loading && !isGuestRestrictedTab && posts.length > 0 && (
              <div className={gridView ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4' : 'space-y-4'}>
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    user={user}
                    onLike={toggleLike}
                    onSave={toggleSave}
                    onFollow={toggleFollow}
                    followedCreators={followedCreators}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
