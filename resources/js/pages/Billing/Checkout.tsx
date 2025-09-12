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
import { ArrowLeft, CreditCard, ShoppingCartIcon, Mail, Lock, Tag, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { t } from 'i18next';
import { type SharedData } from '@/types';

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
        '@media (max-width: 640px)': {
          fontSize: '14px',
        },
      },
      invalid: {
        color: '#ef4444', // text-red-500
      },
    },
  };


function CheckoutForm() {
    const { t } = useTranslation();
    const stripe = useStripe();
    const elements = useElements();
    const { auth } = usePage<SharedData>().props;
    const isAuthenticated = !!auth?.user;
    
    // Get billing cycle from URL parameters
    const searchParams = new URLSearchParams(window.location.search);
    const plan = searchParams.get('plan') || 'yearly';

    const [setupIntent, setSetupIntent] = useState<any>(null);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [couponCode, setCouponCode] = useState('');
    const [couponError, setCouponError] = useState('');
    const [couponApplied, setCouponApplied] = useState(false);
    const [validatingCoupon, setValidatingCoupon] = useState(false);
    const [couponData, setCouponData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [pricingData, setPricingData] = useState<any>(null);
    const [loadingPricing, setLoadingPricing] = useState(true);

    useEffect(() => {
        // Fetch setup intent
        fetch('/setup-intent', { credentials: 'include' })
            .then(res => res.json())
            .then(data => setSetupIntent(data));

        // Fetch pricing data based on billing cycle
        fetch(`/api/pricing-data?plan=${plan}`, { credentials: 'include' })
            .then(res => res.json())
            .then(data => {
                setPricingData(data);
                setLoadingPricing(false);
            })
            .catch(err => {
                setError('Failed to load pricing data');
                setLoadingPricing(false);
            });
    }, [plan]);

    const validateCoupon = async (code: string) => {
        if (!code.trim()) {
            setCouponError('');
            setCouponApplied(false);
            return;
        }

        setValidatingCoupon(true);
        setCouponError('');
        setCouponApplied(false);

        try {
            const response = await fetch('/api/validate-coupon', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ coupon: code.trim() }),
            });

            const result = await response.json();

            if (result.valid) {
                setCouponApplied(true);
                setCouponError('');
                setCouponData(result.coupon);
            } else {
                setCouponData(null);
                setCouponApplied(false);
                switch (result.error) {
                    case 'invalid':
                        setCouponError(t('billing_coupon_invalid'));
                        break;
                    case 'expired':
                        setCouponError(t('billing_coupon_expired'));
                        break;
                    case 'not_found':
                        setCouponError(t('billing_coupon_not_found'));
                        break;
                    case 'max_redemptions':
                        setCouponError(t('billing_coupon_max_redemptions'));
                        break;
                    default:
                        setCouponError(result.message || t('billing_coupon_error'));
                }
            }
        } catch (error) {
            setCouponError(t('billing_coupon_validation_error'));
            setCouponApplied(false);
            setCouponData(null);
        } finally {
            setValidatingCoupon(false);
        }
    };

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

        // Prepare subscription data
        const subscriptionData: any = {
            payment_method: paymentMethod.id,
            billing_cycle: plan,
            name,
        };

        // Add coupon if provided
        if (couponCode.trim()) {
            subscriptionData.coupon = couponCode.trim();
        }

        // If user is not authenticated, include registration data
        if (!isAuthenticated) {
            subscriptionData.email = email;
            subscriptionData.password = password;
            subscriptionData.create_account = true;
        }

        // Call backend to create subscription (and account if needed)
        const response = await fetch('/subscribe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(subscriptionData),
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
            // Handle coupon-specific errors
            if (result.coupon_error) {
                switch (result.coupon_error) {
                    case 'invalid':
                        setCouponError(t('billing_coupon_invalid'));
                        break;
                    case 'expired':
                        setCouponError(t('billing_coupon_expired'));
                        break;
                    case 'not_found':
                        setCouponError(t('billing_coupon_not_found'));
                        break;
                    case 'max_redemptions':
                        setCouponError(t('billing_coupon_max_redemptions'));
                        break;
                    case 'validation_error':
                        setCouponError(t('billing_coupon_validation_error'));
                        break;
                    default:
                        setCouponError(result.message || t('billing_coupon_error'));
                }
            } else {
                setError(result.message || t('billing_subscription_failed'));
            }
            setLoading(false);
        }
    };
    
    return (
       

<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-purple-50 px-4 py-8">
<div className="w-full max-w-4xl bg-white rounded-2xl grid grid-cols-1 lg:grid-cols-2 overflow-hidden animate-fade-in">
  {/* Left: Summary */}
  <div className="flex flex-col justify-between p-4 sm:p-6 lg:p-8 bg-white h-full">
    <div>
      <div className="mb-6 flex flex-col gap-2">
        <div className="flex items-center">
          <ShoppingCartIcon className="text-[oklch(0.511_0.262_276.966)] mr-2" size={28} />
          <span className="font-bold text-lg sm:text-xl text-[oklch(0.511_0.262_276.966)]">{t('billing_order_summary')}</span>
        </div>
      </div>
      <div className="rounded-xl border border-purple-100 bg-purple-50 p-5">
        <div className="mb-3">
          <h2 className="font-semibold text-base sm:text-lg text-gray-800">
            {t('billing_clevernote_pro')}
          </h2>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">
            {t('billing_unlock_ai_features')}
          </p>
        </div>
        <div className="flex justify-between text-gray-700 mt-4 text-sm sm:text-base">
          <span>{t('billing_price')}</span>
          <span>{loadingPricing ? '...' : pricingData ? `$${(parseFloat(pricingData.amount) || 0).toFixed(2)}` : '$0'}</span>
        </div>
        
        {/* Coupon Discount */}
        {couponApplied && couponData && (
          <div className="flex justify-between text-green-600 mt-2 text-sm sm:text-base">
            <span>{t('billing_discount')} ({couponData.name || couponCode})</span>
            <span>
              {couponData.percent_off 
                ? `-${couponData.percent_off}%`
                : couponData.amount_off 
                  ? `-$${(couponData.amount_off / 100).toFixed(2)}`
                  : t('billing_discount_applied')
              }
            </span>
          </div>
        )}
        
        <div className="border-t border-purple-200 my-3 opacity-50" />
        <div className="flex justify-between font-bold text-sm sm:text-base">
          <span>{t('billing_total')}</span>
          <span className="text-[oklch(0.511_0.262_276.966)]">
            {loadingPricing ? '...' : (() => {
              if (!pricingData) return '$0';
              let total = parseFloat(pricingData.amount) || 0;
              
              if (couponApplied && couponData) {
                if (couponData.percent_off) {
                  total = total * (1 - couponData.percent_off / 100);
                } else if (couponData.amount_off) {
                  total = Math.max(0, total - (couponData.amount_off / 100));
                }
              }
              
              return `$${total.toFixed(2)}`;
            })()}
          </span>
        </div>
      </div>
    </div>
    <Button
      variant="ghost"
      className="mt-8 w-full text-neutral-500 flex items-center justify-center gap-2 hover:bg-purple-50"
      onClick={() => router.visit(isAuthenticated ? "/dashboard" : "/")}
    >
      <ArrowLeft size={16} />
      {t('back')}
    </Button>
  </div>
  {/* Right: Payment */}
  <div className="flex flex-col justify-center bg-white p-4 sm:p-6 lg:p-8 relative">
    <h2 className="text-lg sm:text-xl font-bold mb-6 text-[oklch(0.511_0.262_276.966)] flex items-center gap-2">
      <CreditCard size={20} />
      {t('billing_payment_details')}
    </h2>
    
    {/* Account creation notice for non-authenticated users */}
    {!isAuthenticated && (
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          {t('billing_account_creation_notice')}
        </p>
      </div>
    )}
    
    <form
      className="flex flex-col gap-5"
      onSubmit={handleSubmit}
      autoComplete="off"
    >
      <div>

        <div className="block w-full rounded-lg border border-purple-100 bg-gray-50 px-3 sm:px-4 py-3 text-base sm:text-lg font-mono focus:outline-none focus:ring-2 focus:ring-[oklch(0.511_0.262_276.966)] transition">
            <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>

      </div>

      <div>
        <label htmlFor="card-name" className="block mb-1 text-gray-700 font-semibold text-sm">
          {t('billing_name_on_card')}
        </label>
        <input
          id="card-name"
          type="text"
          className="block w-full rounded-lg border border-purple-100 bg-gray-50 px-3 sm:px-4 py-3 text-base sm:text-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-[oklch(0.511_0.262_276.966)] transition"
          placeholder={t('billing_full_name_placeholder')}
          autoComplete="cc-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      {/* Coupon Code Field */}
      <div>
        <label htmlFor="coupon-code" className=" mb-1 text-gray-700 font-semibold text-sm flex items-center gap-2">
           {validatingCoupon ? <Loader2 size={16} className="animate-spin" /> : <Tag size={16} />}
           {t('billing_coupon_code')}
         </label>
        <input
          id="coupon-code"
          type="text"
          className={`block w-full rounded-lg border px-3 sm:px-4 py-3 text-base sm:text-lg text-gray-800 focus:outline-none focus:ring-2 transition ${
            couponError 
              ? 'border-red-300 bg-red-50 focus:ring-red-500' 
              : couponApplied 
                ? 'border-green-300 bg-green-50 focus:ring-green-500'
                : 'border-purple-100 bg-gray-50 focus:ring-[oklch(0.511_0.262_276.966)]'
          }`}
          placeholder={t('billing_coupon_placeholder')}
          value={couponCode}
          onChange={(e) => {
              setCouponCode(e.target.value);
              setCouponError('');
              setCouponApplied(false);
              setCouponData(null);
            }}
           onBlur={(e) => validateCoupon(e.target.value)}
        />
        {couponError && (
          <p className="text-red-600 text-sm mt-1">{couponError}</p>
        )}
        {couponApplied && (
          <p className="text-green-600 text-sm mt-1">{t('billing_coupon_applied')}</p>
        )}
      </div>

      
      {/* Account creation fields for non-authenticated users */}
      {!isAuthenticated && (
        <>
          <h1 className="text-lg sm:text-xl font-semibold mb-2">{t('auth_register_title')}</h1>
          <div>
            <label htmlFor="email" className="mb-1 text-gray-700 font-semibold text-sm flex items-center gap-2">
              <Mail size={16} />
              {t('billing_email_address')}
            </label>
            <input
              id="email"
              type="email"
              className="block w-full rounded-lg border border-purple-100 bg-gray-50 px-3 sm:px-4 py-3 text-base sm:text-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-[oklch(0.511_0.262_276.966)] transition"
              placeholder={t('billing_email_placeholder')}
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="password" className=" mb-1 text-gray-700 font-semibold text-sm flex items-center gap-2">
              <Lock size={16} />
              {t('billing_password')}
            </label>
            <input
              id="password"
              type="password"
              className="block w-full rounded-lg border border-purple-100 bg-gray-50 px-3 sm:px-4 py-3 text-base sm:text-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-[oklch(0.511_0.262_276.966)] transition"
              placeholder={t('billing_password_placeholder')}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
            <p className="text-xs text-gray-500 mt-1">{t('billing_password_requirement')}</p>
          </div>
        </>
      )}

      
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
            className="w-full mt-4 py-4 sm:py-5 text-base sm:text-lg bg-[oklch(0.511_0.262_276.966)] hover:bg-[oklch(0.461_0.262_276.966)] text-white rounded-lg shadow transition-colors flex items-center justify-center gap-2"
        >
            <CreditCard size={18} className="mr-1" />
            {loading 
              ? t('billing_processing') 
              : !isAuthenticated 
                ? t('billing_create_account_and_subscribe') 
                : t('billing_subscribe')
            }
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