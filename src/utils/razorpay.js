export const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

// key_id, amount, currency, order_id, description, prefill and theme_color all come
// directly from the backend create-order response — no client-side env vars needed.
export const openRazorpayCheckout = ({ order, user, planName, onSuccess, onFailure }) => {
  const options = {
    key: order.key_id,
    amount: order.amount,
    currency: order.currency || 'INR',
    name: 'FitTrack AI',
    description: order.description || `${planName} Plan`,
    order_id: order.order_id,
    prefill: order.prefill || {
      name: user?.username || '',
      email: user?.email || '',
    },
    theme: { color: order.theme_color || '#7c3aed' },
    handler: (response) => onSuccess(response),
    modal: {
      ondismiss: () => onFailure && onFailure(new Error('Payment cancelled')),
    },
  };

  const rzp = new window.Razorpay(options);
  rzp.on('payment.failed', (response) => {
    onFailure && onFailure(new Error(response.error?.description || 'Payment failed'));
  });
  rzp.open();
};
