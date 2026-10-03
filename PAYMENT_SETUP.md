# Payment Integration Guide — Majestic Core

## Current State

Right now, clicking **"Place Order"** in `Cart.jsx` calls `POST /api/orders` directly — **no real money is charged**. It just saves the order to MongoDB and reduces stock. This guide explains how to wire up real payments using **Stripe** (recommended, free to test).

---

## Real Life — What You Need First

1. **Create a Stripe account** → https://stripe.com (free)
2. After signing up, go to **Developers → API Keys**
3. You will see two keys:
   - `Publishable key` → starts with `pk_test_...` (goes in the frontend)
   - `Secret key` → starts with `sk_test_...` (goes in the backend `.env`, **never expose this**)
4. Stay in **Test Mode** (toggle at the top of the Stripe dashboard) while developing

---

## Step 1 — Install Dependencies

**Backend:**
```bash
cd backend
npm install stripe
```

**Frontend:**
```bash
cd frontend
npm install @stripe/stripe-js @stripe/react-stripe-js
```

---

## Step 2 — Add Keys to `.env`

Open `backend/.env` and add:

```
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
```

---

## Step 3 — Backend: Add a Payment Intent Route

In `backend/server.js`, add this route **before** the `app.listen` line:

```js
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Creates a PaymentIntent — tells Stripe how much to charge
app.post('/api/payment/create-intent', requireBuyer, async (req, res) => {
  const cartItems = await CartItem.find({ buyer_id: req.session.buyerId })
    .populate('product_id').lean();
  if (!cartItems.length) return res.status(400).json({ error: 'Cart is empty' });

  const subtotal = cartItems.reduce((s, c) => s + c.product_id.price * c.qty, 0);
  const shipping = subtotal > 100 ? 0 : 9.99;
  const totalCents = Math.round((subtotal + shipping) * 100); // Stripe uses cents

  const intent = await stripe.paymentIntents.create({
    amount: totalCents,
    currency: 'usd',
    automatic_payment_methods: { enabled: true },
  });

  res.json({ clientSecret: intent.client_secret });
});
```

---

## Step 4 — Backend: Confirm Order After Payment

Modify the existing `POST /api/orders` route to accept a `paymentIntentId` and verify it was paid:

```js
app.post('/api/orders', requireBuyer, async (req, res) => {
  const { address, paymentIntentId } = req.body;
  if (!address) return res.status(400).json({ error: 'Delivery address required' });

  // Verify payment with Stripe before saving the order
  const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
  if (intent.status !== 'succeeded')
    return res.status(400).json({ error: 'Payment not completed' });

  // ... rest of the existing order creation code stays the same
});
```

---

## Step 5 — Frontend: Replace the Checkout Form in `Cart.jsx`

### 5a — Add your Publishable Key to the frontend

Create `frontend/.env`:
```
VITE_STRIPE_PUBLIC_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
```

### 5b — Create a new file `frontend/src/components/CheckoutForm.jsx`

```jsx
import { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import api from '../api';

export default function CheckoutForm({ address, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);

    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (stripeError) {
      setError(stripeError.message);
      setLoading(false);
      return;
    }

    // Payment succeeded — now save the order in your backend
    try {
      await api.post('/orders', { address, paymentIntentId: paymentIntent.id });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Order failed after payment.');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      {error && <p style={{ color: 'red', marginTop: '0.5rem' }}>{error}</p>}
      <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={!stripe || loading}>
        {loading ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  );
}
```

### 5c — Update `Cart.jsx` checkout section

Replace the `placeOrder` function and the checkout form section with:

```jsx
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from '../components/CheckoutForm';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// Inside the Cart component, replace placeOrder with:
const [clientSecret, setClientSecret] = useState(null);

const startCheckout = async () => {
  if (!address.trim()) { showMsg('Please enter a delivery address.', 'error'); return; }
  try {
    const r = await api.post('/payment/create-intent');
    setClientSecret(r.data.clientSecret);
    setShowCheckout(true);
  } catch (err) {
    showMsg(err.response?.data?.error || 'Could not start checkout.', 'error');
  }
};

const handleOrderSuccess = () => {
  showMsg('Order placed & payment successful! 🎉');
  setShowCheckout(false);
  fetchCart(); refreshCart();
  setTimeout(() => navigate('/orders'), 1500);
};

// Replace the checkout form JSX with:
{!showCheckout ? (
  <>
    <div className="form-group">
      <label>Delivery Address</label>
      <textarea rows={3} value={address} onChange={e => setAddress(e.target.value)} placeholder="Enter your full delivery address..." />
    </div>
    <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }} onClick={startCheckout}>
      Proceed to Payment
    </button>
  </>
) : clientSecret ? (
  <Elements stripe={stripePromise} options={{ clientSecret }}>
    <CheckoutForm address={address} onSuccess={handleOrderSuccess} />
  </Elements>
) : <div className="spinner" />}
```

---

## Step 6 — Test the Payment

Use Stripe's **test card numbers** (no real money is charged):

| Card Number          | Result              |
|----------------------|---------------------|
| `4242 4242 4242 4242` | Payment succeeds   |
| `4000 0000 0000 9995` | Payment declined   |
| `4000 0025 0000 3155` | Requires 3D Secure |

- Expiry: any future date (e.g. `12/34`)
- CVC: any 3 digits (e.g. `123`)
- ZIP: any 5 digits (e.g. `12345`)

---

## Step 7 — Go Live (When Ready)

1. In your Stripe dashboard, click **"Activate your account"** and fill in your business details
2. Switch from **Test Mode** to **Live Mode**
3. Replace your `.env` keys with the **live keys** (`pk_live_...` and `sk_live_...`)
4. Deploy your backend to a server with HTTPS (Stripe requires HTTPS in production)

---

## How the Full Flow Works

```
User clicks "Proceed to Payment"
        ↓
Frontend calls POST /api/payment/create-intent
        ↓
Backend asks Stripe to create a PaymentIntent → returns clientSecret
        ↓
Frontend shows Stripe's payment form (card input)
        ↓
User enters card → Stripe processes the charge
        ↓
Frontend calls POST /api/orders with paymentIntentId
        ↓
Backend verifies with Stripe that payment succeeded
        ↓
Order is saved to MongoDB, stock is reduced, cart is cleared
```

---

## Summary of Files Changed

| File | What Changes |
|------|-------------|
| `backend/.env` | Add `STRIPE_SECRET_KEY` |
| `backend/server.js` | Add `POST /api/payment/create-intent`, update `POST /api/orders` to verify payment |
| `frontend/.env` | Add `VITE_STRIPE_PUBLIC_KEY` |
| `frontend/src/components/CheckoutForm.jsx` | New file — Stripe payment form |
| `frontend/src/pages/Cart.jsx` | Replace checkout form with Stripe Elements |
