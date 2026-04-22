import { useState, useEffect, useCallback } from 'react';
import api from '../services/api.js';
import { loadRazorpayScript, openRazorpayCheckout } from '../utils/razorpay.js';

export const usePayments = (user) => {
  const [plans, setPlans] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [plansLoading, setPlansLoading] = useState(true);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [loadingPlanId, setLoadingPlanId] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);

  const fetchSubscription = useCallback(async () => {
    try {
      const data = await api.getSubscription();
      setSubscription(data);
    } catch {
      setSubscription(null);
    } finally {
      setSubscriptionLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getPlans();
        setPlans(data);
      } catch {
        setPlans([]);
      } finally {
        setPlansLoading(false);
      }
    })();

    fetchSubscription();
  }, [fetchSubscription]);

  const clearPaymentStatus = useCallback(() => setPaymentStatus(null), []);

  const purchase = useCallback(async (planId, planName) => {
    setLoadingPlanId(planId);
    setPaymentStatus(null);

    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error('Payment gateway failed to load. Please check your connection and try again.');

      const order = await api.createRazorpayOrder(planId);

      openRazorpayCheckout({
        order,
        user,
        planName,
        onSuccess: async (response) => {
          try {
            await api.verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            await fetchSubscription();
            setPaymentStatus({
              type: 'success',
              message: `You're now on the ${planName} plan! Enjoy your upgraded features.`,
            });
          } catch (err) {
            setPaymentStatus({ type: 'error', message: err.message || 'Payment verification failed. Contact support.' });
          } finally {
            setLoadingPlanId(null);
          }
        },
        onFailure: (err) => {
          setLoadingPlanId(null);
          if (err.message !== 'Payment cancelled') {
            setPaymentStatus({ type: 'error', message: err.message || 'Payment failed. Please try again.' });
          }
        },
      });
    } catch (err) {
      setLoadingPlanId(null);
      setPaymentStatus({ type: 'error', message: err.message || 'Something went wrong. Please try again.' });
    }
  }, [user, fetchSubscription]);

  return {
    plans,
    subscription,
    plansLoading,
    subscriptionLoading,
    loadingPlanId,
    paymentStatus,
    clearPaymentStatus,
    purchase,
  };
};
