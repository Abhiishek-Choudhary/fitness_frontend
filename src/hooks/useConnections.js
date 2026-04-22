import { useState, useEffect, useCallback } from 'react';
import api from '../services/api.js';

export const useConnections = () => {
  const [connections, setConnections]     = useState([]);
  const [requests, setRequests]           = useState({ received: [], sent: [] });
  const [nearby, setNearby]               = useState([]);
  const [loading, setLoading]             = useState(true);
  const [reqLoading, setReqLoading]       = useState(false);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [error, setError]                 = useState('');

  const fetchConnections = useCallback(() => {
    setLoading(true);
    api.getConnections()
      .then((d) => setConnections(Array.isArray(d) ? d : d.results ?? []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchConnections(); }, [fetchConnections]);

  const fetchRequests = useCallback(() => {
    setReqLoading(true);
    api.getConnectionRequests()
      .then((d) => {
        // Backend returns { received: [...], sent: [...] }
        setRequests({
          received: d.received ?? [],
          sent:     d.sent     ?? [],
        });
      })
      .catch(() => {})
      .finally(() => setReqLoading(false));
  }, []);

  const fetchNearby = useCallback((radius = 50) => {
    setNearbyLoading(true);
    api.getNearbyPeople({ radius_km: radius })
      .then((d) => setNearby(Array.isArray(d) ? d : d.results ?? []))
      .catch(() => setNearby([]))
      .finally(() => setNearbyLoading(false));
  }, []);

  /* Accept received request */
  const accept = useCallback(async (reqId) => {
    try {
      await api.respondToConnectionRequest(reqId, true);
      setRequests((prev) => ({ ...prev, received: prev.received.filter((r) => r.id !== reqId) }));
      fetchConnections();
    } catch {/* */}
  }, [fetchConnections]);

  /* Reject received request */
  const reject = useCallback(async (reqId) => {
    try {
      await api.respondToConnectionRequest(reqId, false);
      setRequests((prev) => ({ ...prev, received: prev.received.filter((r) => r.id !== reqId) }));
    } catch {/* */}
  }, []);

  /* Withdraw sent request */
  const withdraw = useCallback(async (reqId) => {
    try {
      await api.withdrawConnectionRequest(reqId);
      setRequests((prev) => ({ ...prev, sent: prev.sent.filter((r) => r.id !== reqId) }));
    } catch {/* */}
  }, []);

  /* Remove a connection */
  const remove = useCallback(async (userId) => {
    try {
      await api.removeConnection(userId);
      setConnections((prev) => prev.filter((c) => (c.user?.id ?? c.id) !== userId));
    } catch {/* */}
  }, []);

  /* Send a connection request (from Nearby tab) */
  const sendRequest = useCallback(async (userId, message = '') => {
    try {
      const req = await api.requestConnection(userId, message);
      setRequests((prev) => ({ ...prev, sent: [...prev.sent, req] }));
      // Update nearby person's connection_status
      setNearby((prev) =>
        prev.map((p) => (p.user?.id ?? p.id) === userId ? { ...p, connection_status: 'request_sent' } : p)
      );
      return req;
    } catch (e) { throw e; }
  }, []);

  const totalPending = requests.received.length;

  return {
    connections, requests, nearby, loading, reqLoading, nearbyLoading, error, totalPending,
    fetchRequests, fetchNearby, accept, reject, withdraw, remove, sendRequest,
    refresh: fetchConnections,
  };
};
