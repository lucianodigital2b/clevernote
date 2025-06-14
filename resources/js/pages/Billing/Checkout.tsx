import React, { useEffect, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { loadStripe } from '@stripe/stripe-js';
import {
    Elements,
    CardElement,
    useStripe,
    useElements
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, CreditCard, ShoppingCartIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { t } from 'i18next';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const CARD_ELEMENT_OPTIONS = {
    hidePostalCode: true,
    style: {
      base: {
        color: '#1f2937', // text-gray-800
        fontSize: '16px',
        fontFamily: 'Inter, sans-serif',
        '::placeholder': {
          color: '#9ca3af', // text-gray-400
        },
      },
      invalid: {
        color: '#ef4444', // text-red-500
      },
    },
  };


  // Get pricing data from URL parameters
  const searchParams = new URLSearchParams(window.location.search);
  const plan = searchParams.get('plan') || 'yearly';
  const priceId = searchParams.get('price_id');
  const amount = searchParams.get('amount');
  const productId = searchParams.get('product_id');


function CheckoutForm() {
    const { t } = useTranslation();
    const stripe = useStripe();
    const elements = useElements();
    
    // Get pricing data from URL parameters
    const searchParams = new URLSearchParams(window.location.search);
    const plan = searchParams.get('plan') || 'yearly';
    const priceId = searchParams.get('price_id');
    const rawAmount = searchParams.get('amount');
    const productId = searchParams.get('product_id');

    const [setupIntent, setSetupIntent] = useState<any>(null);
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Parse the amount from URL (remove $ and convert to number)
    const currentPrice = rawAmount ? parseFloat(rawAmount.replace('$', '')) : 0;
    const [planId, setPlanId] = useState(priceId || '');

    
    useEffect(() => {
        fetch('/setup-intent', { credentials: 'include' })
            .then(res => res.json())
            .then(data => setSetupIntent(data));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!stripe || !elements) {
            setError(t('billing_stripe_not_loaded'));
            setLoading(false);
            return;
        }

        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
            setError(t('billing_card_element_not_found'));
            setLoading(false);
            return;
        }

        // Create payment method
        const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
            type: 'card',
            card: cardElement,
            billing_details: { name }
        });

        if (stripeError) {
            setError(stripeError.message || t('billing_payment_method_creation_failed'));
            setLoading(false);
            return;
        }

        // Call backend to create subscription
        const response = await fetch('/subscribe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
            },
            credentials: 'include',
            body: JSON.stringify({
                payment_method: paymentMethod.id,
                plan_id: planId,
                name,
            }),
        });

        const result = await response.json();

        if (result.success) {
            setLoading(false);
            router.visit('/billing/success');
        } else if (result.requires_action && result.payment_intent_client_secret) {
            // Handle SCA
            const { error: confirmError } = await stripe.confirmCardPayment(result.payment_intent_client_secret);
            if (confirmError) {
                setError(confirmError.message || t('billing_payment_confirmation_failed'));
                setLoading(false);
            } else {
                setLoading(false);
                router.visit('/billing/success');
            }
        } else {
            setError(result.message || t('billing_subscription_failed'));
            setLoading(false);
        }
    };
    
    return (
       

<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-purple-50 px-4 py-8">
<div className="w-full max-w-4xl bg-white rounded-2xl grid grid-cols-1 lg:grid-cols-2 overflow-hidden animate-fade-in">
  {/* Left: Summary */}
  <div className="flex flex-col justify-between p-8 bg-white h-full">
    <div>
      <div className="mb-6 flex flex-col gap-2">
        <div className="flex items-center">
          <ShoppingCartIcon className="text-[oklch(0.511_0.262_276.966)] mr-2" size={32} />
          <span className="font-bold text-xl text-[oklch(0.511_0.262_276.966)]">{t('billing_order_summary')}</span>
        </div>
      </div>
      <div className="rounded-xl border border-purple-100 bg-purple-50 p-5">
        <div className="mb-3">
          <h2 className="font-semibold text-lg text-gray-800">
            {t('billing_clevernote_pro')}
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {t('billing_unlock_ai_features')}
          </p>
        </div>
        <div className="flex justify-between text-gray-700 mt-4">
          <span>{t('billing_price')}</span>
          <span>${currentPrice}</span>
        </div>
        <div className="border-t border-purple-200 my-3 opacity-50" />
        <div className="flex justify-between font-bold text-base">
          <span>{t('billing_total')}</span>
          <span className="text-[oklch(0.511_0.262_276.966)]">${currentPrice}</span>
        </div>
      </div>
    </div>
    <Button
      variant="ghost"
      className="mt-8 w-full text-neutral-500 flex items-center justify-center gap-2 hover:bg-purple-50"
      onClick={() => router.visit("/")}
    >
      <ArrowLeft size={16} />
      {t('billing_back_to_home')}
    </Button>
  </div>
  {/* Right: Payment */}
  <div className="flex flex-col justify-center bg-white p-8 relative">
    <h2 className="text-xl font-bold mb-6 text-[oklch(0.511_0.262_276.966)] flex items-center gap-2">
      <CreditCard size={22} />
      {t('billing_payment_details')}
    </h2>
    <form
      className="flex flex-col gap-5"
      onSubmit={handleSubmit}
      autoComplete="off"
    >
      <div>

        <div className="block w-full rounded-lg border border-purple-100 bg-gray-50 px-4 py-3 text-lg font-mono focus:outline-none focus:ring-2 focus:ring-[oklch(0.511_0.262_276.966)] transition">
            <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>


        {/* <label htmlFor="card-number" className="block mb-1 text-gray-700 font-semibold text-sm">
          Card Number
        </label>
        <input
          id="card-number"
          type="text"
          className="block w-full rounded-lg border border-purple-100 bg-gray-50 px-4 py-3 text-lg font-mono focus:outline-none focus:ring-2 focus:ring-[oklch(0.511_0.262_276.966)] transition"
          placeholder="1234 5678 9012 3456"
          maxLength={19}
          pattern="\d{4} \d{4} \d{4} \d{4}"
          autoComplete="cc-number"
          required
        />
      </div>
      <div className="flex gap-4">
        <div className="w-1/2">
          <label htmlFor="expiry" className="block mb-1 text-gray-700 font-semibold text-sm">
            Expiry
          </label>
          <input
            id="expiry"
            type="text"
            className="block w-full rounded-lg border border-purple-100 bg-gray-50 px-4 py-3 text-lg font-mono focus:outline-none focus:ring-2 focus:ring-[oklch(0.511_0.262_276.966)] transition"
            placeholder="MM/YY"
            maxLength={5}
            autoComplete="cc-exp"
            required
          />
        </div>
        <div className="w-1/2">
          <label htmlFor="cvc" className="block mb-1 text-gray-700 font-semibold text-sm">
            CVC
          </label>
          <input
            id="cvc"
            type="text"
            className="block w-full rounded-lg border border-purple-100 bg-gray-50 px-4 py-3 text-lg font-mono focus:outline-none focus:ring-2 focus:ring-[oklch(0.511_0.262_276.966)] transition"
            placeholder="CVC"
            maxLength={4}
            autoComplete="cc-csc"
            required
          />
        </div> */}
      </div>
      <div>
        <label htmlFor="card-name" className="block mb-1 text-gray-700 font-semibold text-sm">
          {t('billing_name_on_card')}
        </label>
        <input
          id="card-name"
          type="text"
          className="block w-full rounded-lg border border-purple-100 bg-gray-50 px-4 py-3 text-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-[oklch(0.511_0.262_276.966)] transition"
          placeholder={t('billing_full_name_placeholder')}
          autoComplete="cc-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      {/* <Button
        type="submit"
        className="w-full mt-4 py-5 text-lg bg-[oklch(0.511_0.262_276.966)] hover:bg-[oklch(0.461_0.262_276.966)] text-white rounded-lg shadow transition-colors flex items-center justify-center gap-2"
      >
        <CreditCard size={20} className="mr-1" />
        Pay $94.98
      </Button> */}

      {error && <div className="text-red-600 mb-2">{error}</div>}
        <Button 
            type="submit" 
            disabled={loading}
            className="w-full mt-4 py-5 text-lg bg-[oklch(0.511_0.262_276.966)] hover:bg-[oklch(0.461_0.262_276.966)] text-white rounded-lg shadow transition-colors flex items-center justify-center gap-2"
        >
            <CreditCard size={20} className="mr-1" />
            {loading ? t('billing_processing') : t('billing_subscribe')}
        </Button>
    </form>
    <p className="text-xs text-center text-gray-400 mt-6">
      {t('billing_secure_payment')}
    </p>
  </div>
</div>
</div>
    );
}

export default function CheckoutPage() {
    return (
        <>
            <Head title={t('billing_subscribe')} />
            <Elements stripe={stripePromise}>
                <CheckoutForm />
            </Elements>
        </>
    );
}