import { useState, useEffect, useCallback } from 'react';
import api from '../services/api.js';

export const useGroups = () => {
  const [groups, setGroups]       = useState([]);
  const [myGroups, setMyGroups]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [myLoading, setMyLoading] = useState(false);
  const [error, setError]         = useState('');
  const [filters, setFilters]     = useState({ city: '', activity_focus: '', search: '' });

  const fetchGroups = useCallback(() => {
    setLoading(true);
    setError('');
    const params = {};
    if (filters.city)           params.city           = filters.city;
    if (filters.activity_focus) params.activity_focus = filters.activity_focus;
    if (filters.search)         params.search         = filters.search;
    api.getCommunityGroups(params)
      .then((d) => setGroups(Array.isArray(d) ? d : d.results ?? []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [filters.city, filters.activity_focus, filters.search]);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  const fetchMyGroups = useCallback(() => {
    if (myGroups !== null) return;
    setMyLoading(true);
    api.getMyGroups()
      .then((d) => setMyGroups(Array.isArray(d) ? d : d.results ?? []))
      .catch(() => setMyGroups([]))
      .finally(() => setMyLoading(false));
  }, [myGroups]);

  /* Handle join/leave/request/withdraw toggle */
  const joinGroup = useCallback(async (groupId) => {
    try {
      const result = await api.joinCommunityGroup(groupId);
      const { action, status } = result;
      setGroups((prev) =>
        prev.map((g) => {
          if (g.id !== groupId) return g;
          const memberDelta = action === 'joined' ? 1 : action === 'left' ? -1 : 0;
          return { ...g, my_membership: status, members_count: Math.max(0, (g.members_count ?? 0) + memberDelta) };
        })
      );
      if (action === 'joined') {
        const group = groups.find((g) => g.id === groupId);
        if (group) setMyGroups((prev) => prev ? [{ ...group, my_membership: 'active' }, ...prev] : null);
      } else if (action === 'left') {
        setMyGroups((prev) => prev ? prev.filter((g) => g.id !== groupId) : null);
      }
      return result;
    } catch (e) { throw e; }
  }, [groups]);

  const addGroup = useCallback((group) => {
    setGroups((prev) => [group, ...prev]);
    setMyGroups((prev) => prev ? [group, ...prev] : [group]);
  }, []);

  return { groups, myGroups, loading, myLoading, error, filters, setFilters, fetchMyGroups, joinGroup, addGroup, refresh: fetchGroups };
};
