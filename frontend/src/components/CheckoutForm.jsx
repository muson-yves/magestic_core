import { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import api from '../api';

export default function CheckoutForm({ address, onSuccess, onCancel }) {
  const stripe   = useStripe();
  const elements = useElements();
  const [error,   setError]   = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError(null);

    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (stripeError) {
      setError(stripeError.message);
      setLoading(false);
      return;
    }

    try {
      await api.post('/orders', { address, paymentIntentId: paymentIntent.id });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Order failed after payment.');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>
      <PaymentElement />
      {error && <p style={{ color: 'var(--red, #e74c3c)', marginTop: '.5rem', fontSize: '.85rem' }}>{error}</p>}
      <button
        type="submit"
        className="btn-primary"
        style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}
        disabled={!stripe || loading}
      >
        {loading ? 'Processing...' : '💳 Pay Now'}
      </button>
      <button
        type="button"
        className="btn-outline"
        style={{ width: '100%', justifyContent: 'center', marginTop: '.5rem' }}
        onClick={onCancel}
        disabled={loading}
      >
        Cancel
      </button>
    </form>
  );
}
