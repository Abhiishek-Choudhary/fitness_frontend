import { useState, useEffect, useCallback } from 'react';
import api from '../services/api.js';

export const useEvents = (location) => {
  const [events, setEvents]       = useState([]);
  // myEvents shape: { organised: [], attending: [] } | null
  const [myEvents, setMyEvents]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [myLoading, setMyLoading] = useState(false);
  const [error, setError]         = useState('');

  const fetchEvents = useCallback(() => {
    setLoading(true);
    setError('');
    const params = { radius_km: 100 };
    if (location?.latitude)  params.lat = location.latitude;
    if (location?.longitude) params.lon = location.longitude;
    else if (location?.city) params.city = location.city;
    api.getCommunityEvents(params)
      .then((d) => setEvents(Array.isArray(d) ? d : d.results ?? []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [location?.latitude, location?.longitude, location?.city]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const fetchMyEvents = useCallback(() => {
    if (myEvents !== null) return;
    setMyLoading(true);
    api.getMyEvents()
      .then((d) => {
        // Backend returns { organised: [...], attending: [...] }
        if (d && (d.organised !== undefined || d.attending !== undefined)) {
          setMyEvents({ organised: d.organised ?? [], attending: d.attending ?? [] });
        } else {
          setMyEvents({ organised: [], attending: Array.isArray(d) ? d : d.results ?? [] });
        }
      })
      .catch(() => setMyEvents({ organised: [], attending: [] }))
      .finally(() => setMyLoading(false));
  }, [myEvents]);

  /* optimistic RSVP — field is rsvp_status from backend */
  const rsvp = useCallback(async (eventId, rsvpStatus) => {
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id !== eventId) return e;
        const current = e.my_rsvp ?? e.rsvp_status;
        const next    = current === rsvpStatus ? null : rsvpStatus;
        return { ...e, my_rsvp: next, rsvp_status: next };
      })
    );
    try {
      await api.rsvpCommunityEvent(eventId, rsvpStatus);
    } catch { fetchEvents(); }
  }, [fetchEvents]);

  const addEvent = useCallback((event) => {
    setEvents((prev) => [event, ...prev]);
    setMyEvents((prev) =>
      prev ? { ...prev, organised: [event, ...(prev.organised ?? [])] }
           : { organised: [event], attending: [] }
    );
  }, []);

  const removeEvent = useCallback(async (eventId) => {
    await api.deleteCommunityEvent(eventId);
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
    setMyEvents((prev) =>
      prev ? { organised: prev.organised.filter((e) => e.id !== eventId), attending: prev.attending.filter((e) => e.id !== eventId) }
           : null
    );
  }, []);

  return { events, myEvents, loading, myLoading, error, fetchMyEvents, rsvp, addEvent, removeEvent, refresh: fetchEvents };
};
