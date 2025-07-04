import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, Download } from "lucide-react";
import { motion } from "framer-motion";
import { router } from "@inertiajs/react";
import { useTranslation } from 'react-i18next';

interface SubscriptionData {
  product_name: string;
  amount: number;
  currency: string;
  interval: string;
  features: (string | { text: string; included: boolean })[];
  subscription_id: string;
  created_at: string;
}

interface PaymentSuccessProps {
  subscription?: SubscriptionData;
}

const PaymentSuccess = ({ subscription }: PaymentSuccessProps) => {
  const { t } = useTranslation();
  
  const subtotal = subscription?.amount;
  const total = subtotal;
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: subscription?.currency?.toUpperCase() || 'USD'
    }).format(amount);
  };
  
  // Get plan display name
  const getPlanDisplayName = () => {
    if (!subscription) return t('billing_noteai_premium_annual');
    
    const interval = subscription.interval === 'month' ? t('monthly') : t('yearly');
    return `${subscription.product_name} ${interval}`;
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-tr from-purple-50 to-white">
      {/* Success card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden"
      >
        {/* Purple header section */}
        <div className="bg-[oklch(0.511_0.262_276.966)] p-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <CheckCircle size={80} className="mx-auto text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white mt-4">{t('billing_payment_successful')}</h1>
          <p className="text-purple-100 mt-2">{t('billing_premium_plan_active')}</p>
        </div>
        
        {/* Main content */}
        <div className="p-8">
          <div className="mb-8 bg-purple-50 rounded-lg p-4">
            <h2 className="font-semibold text-gray-700">{t('billing_order_summary')}</h2>
            <div className="flex justify-between mt-3 text-sm">
              <span className="text-gray-600">{getPlanDisplayName()}</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
           
            <div className="border-t border-purple-200 my-3"></div>
            <div className="flex justify-between font-bold">
              <span>{t('billing_total')}</span>
              <span className="text-[oklch(0.511_0.262_276.966)]">{formatCurrency(total)}</span>
            </div>
          </div>
          
          <div className="space-y-3 mb-8">
            <h3 className="font-medium text-gray-700">{t('billing_access_to')}</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              {subscription?.features && subscription.features.length > 0 ? (
                subscription.features.map((feature, index) => {
                  // Handle both string features and object features with text property
                  const featureText = typeof feature === 'string' ? feature : feature.text;
                  const isIncluded = typeof feature === 'string' ? true : feature.included;
                  
                  return isIncluded ? (
                    <li key={index} className="flex items-center">
                      <CheckCircle size={16} className="text-green-500 mr-2" />
                      <span>{t(featureText)}</span>
                    </li>
                  ) : null;
                })
              ) : (
                // Fallback to default features if no subscription data
                <>
                  <li className="flex items-center">
                    <CheckCircle size={16} className="text-green-500 mr-2" />
                    <span>{t('billing_unlimited_ai_organization')}</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle size={16} className="text-green-500 mr-2" />
                    <span>{t('billing_advanced_search')}</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle size={16} className="text-green-500 mr-2" />
                    <span>{t('billing_cross_platform_sync')}</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle size={16} className="text-green-500 mr-2" />
                    <span>{t('billing_priority_support')}</span>
                  </li>
                </>
              )}
            </ul>
          </div>
          
          <div className="flex flex-col space-y-3">
            <Button 
              onClick={() => router.visit("/dashboard")}
              className="bg-[oklch(0.511_0.262_276.966)] hover:bg-[oklch(0.461_0.262_276.966)] text-white"
            >
              {t('billing_go_to_dashboard')}
              <ArrowRight size={16} className="ml-2" />
            </Button>
            
            <Button 
              variant="outline" 
              className="border-[oklch(0.511_0.262_276.966)] text-[oklch(0.511_0.262_276.966)] hover:bg-purple-50"
            >
              <Download size={16} className="mr-2" />
              {t('billing_download_receipt')}
            </Button>
          </div>
        </div>
        
        {/* Footer */}
        <div className="px-8 pb-6 text-center">
          <p className="text-sm text-gray-500">
            {t('billing_confirmation_sent')}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {subscription?.subscription_id ? `${t('billing_order_id_prefix')} ${subscription.subscription_id}` : t('billing_order_id')}
          </p>
        </div>
      </motion.div>
      
      {/* Extra elements for visual appeal */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="mt-6 text-center"
      >
        <p className="text-gray-600">{t('billing_need_help')} <a href="mailto:luciano@getclevernote.app" className="text-[oklch(0.511_0.262_276.966)] hover:underline">{t('billing_contact_support')}</a></p>
      </motion.div>
    </div>
  );
};

export default PaymentSuccess;