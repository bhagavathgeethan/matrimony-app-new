// Razorpay Checkout integration for Web and React Native Web (Capacitor)
import { theme } from '../theme/tokens';

let scriptPromise = null;

export function loadRazorpayScript() {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve) => {
    const existing = document.getElementById('razorpay-checkout-js');
    if (existing) {
      if (window.Razorpay) return resolve(true);
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.id = 'razorpay-checkout-js';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = (err) => {
      console.error('Failed to load Razorpay script', err);
      scriptPromise = null;
      resolve(false);
    };
    document.body.appendChild(script);
  });

  return scriptPromise;
}

export async function openRazorpayCheckout({
  order,
  prefill = {},
  themeColor = theme.colors.accent,
  onSuccess,
  onError,
  onDismiss,
}) {
  const loaded = await loadRazorpayScript();
  if (!loaded || !window.Razorpay) {
    const err = new Error('Could not load payment gateway. Please check your internet connection and try again.');
    if (onError) onError(err);
    return;
  }

  const { checkout, product } = order;
  const description = product?.kind === 'plan'
    ? `${product.tier ? product.tier[0].toUpperCase() + product.tier.slice(1) : 'Membership'} Plan · ${product.months} month${product.months > 1 ? 's' : ''}`
    : (product?.name || '3Knot Membership');

  const options = {
    key: checkout.key,
    amount: checkout.amount,
    currency: checkout.currency || 'INR',
    name: '3Knot Matrimony',
    description,
    order_id: checkout.orderId,
    prefill: {
      name: prefill.name || '',
      contact: prefill.contact || prefill.phone || '',
      email: prefill.email || '',
    },
    theme: {
      color: themeColor,
    },
    handler: function (response) {
      if (onSuccess) {
        onSuccess({
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_signature: response.razorpay_signature,
        });
      }
    },
    modal: {
      ondismiss: function () {
        if (onDismiss) onDismiss();
      },
    },
  };

  const rzp = new window.Razorpay(options);
  rzp.on('payment.failed', function (resp) {
    if (onError) onError(resp?.error || new Error('Payment failed or cancelled'));
  });
  rzp.open();
}

