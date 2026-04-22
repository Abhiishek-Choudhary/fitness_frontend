import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api.js';

export const useFeed = (user) => {
  const [activeTab, setActiveTab]           = useState('forYou');
  const [activeCategory, setActiveCategory] = useState('');
  const [posts, setPosts]                   = useState([]);
  const [categories, setCategories]         = useState([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState('');
  const [followedCreators, setFollowedCreators] = useState(new Set());

  /* stable ref to avoid stale-closure re-fetches */
  const activeTabRef      = useRef(activeTab);
  const activeCategoryRef = useRef(activeCategory);
  activeTabRef.current      = activeTab;
  activeCategoryRef.current = activeCategory;

  /* ── fetch categories once ── */
  useEffect(() => {
    api.getFeedCategories()
      .then((d) => setCategories(Array.isArray(d) ? d : d.results ?? []))
      .catch(() => {});
  }, []);

  /* ── fetch followed creators for auth users ── */
  useEffect(() => {
    if (!user) return;
    api.getFollowedCreators()
      .then((d) => {
        const list = Array.isArray(d) ? d : d.results ?? [];
        setFollowedCreators(new Set(list.map((c) => c.username)));
      })
      .catch(() => {});
  }, [user?.username]);       // only re-run if user identity changes

  /* ── main feed fetch ── */
  const loadFeed = useCallback((tab, category) => {
    setLoading(true);
    setError('');

    const fetchers = {
      forYou:    () => api.getFeed(category ? { category } : {}),
      trending:  () => api.getTrendingFeed(category ? { category } : {}),
      following: () => api.getFollowingFeed(category ? { category } : {}),
      saved:     () => api.getSavedFeed(category ? { category } : {}),
    };

    const fetch = fetchers[tab] ?? fetchers.forYou;
    fetch()
      .then((d) => {
        const list = Array.isArray(d) ? d : d.results ?? [];
        setPosts(list);
      })
      .catch((err) => {
        setError(err?.message || 'Failed to load feed');
        setPosts([]);
      })
      .finally(() => setLoading(false));
  }, []);

  /* re-fetch when tab or category changes */
  useEffect(() => {
    loadFeed(activeTab, activeCategory);
  }, [activeTab, activeCategory, loadFeed]);

  const changeTab = useCallback((tab) => {
    setActiveTab(tab);
    setActiveCategory('');
  }, []);

  /* optimistic like */
  const toggleLike = useCallback(async (postId) => {
    if (!user) return;
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, is_liked: !p.is_liked, likes_count: (p.likes_count ?? 0) + (p.is_liked ? -1 : 1) }
          : p
      )
    );
    try { await api.likePost(postId); }
    catch { setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, is_liked: !p.is_liked, likes_count: (p.likes_count ?? 0) + (p.is_liked ? -1 : 1) }
          : p
      )
    ); }
  }, [user]);

  /* optimistic save */
  const toggleSave = useCallback(async (postId) => {
    if (!user) return;
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, is_saved: !p.is_saved } : p));
    try { await api.savePost(postId); }
    catch { setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, is_saved: !p.is_saved } : p)); }
  }, [user]);

  /* follow / unfollow */
  const toggleFollow = useCallback(async (username) => {
    if (!user) return;
    setFollowedCreators((prev) => {
      const next = new Set(prev);
      prev.has(username) ? next.delete(username) : next.add(username);
      return next;
    });
    try { await api.followCreator(username); }
    catch { setFollowedCreators((prev) => {
      const next = new Set(prev);
      prev.has(username) ? next.add(username) : next.delete(username);
      return next;
    }); }
  }, [user]);

  return {
    activeTab, changeTab,
    activeCategory, setActiveCategory,
    posts, categories, loading, error,
    followedCreators, toggleLike, toggleSave, toggleFollow,
    refresh: () => loadFeed(activeTab, activeCategory),
  };
};
