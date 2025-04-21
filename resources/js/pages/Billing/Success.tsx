import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, Download } from "lucide-react";
import { motion } from "framer-motion";
import { router } from "@inertiajs/react";

const PaymentSuccess = () => {
  
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
          <h1 className="text-2xl font-bold text-white mt-4">Payment Successful!</h1>
          <p className="text-purple-100 mt-2">Your premium plan is now active</p>
        </div>
        
        {/* Main content */}
        <div className="p-8">
          <div className="mb-8 bg-purple-50 rounded-lg p-4">
            <h2 className="font-semibold text-gray-700">Order Summary</h2>
            <div className="flex justify-between mt-3 text-sm">
              <span className="text-gray-600">NoteAI Premium (Annual)</span>
              <span className="font-medium">$89.99</span>
            </div>
            <div className="flex justify-between mt-1 text-sm">
              <span className="text-gray-600">Tax</span>
              <span className="font-medium">$4.99</span>
            </div>
            <div className="border-t border-purple-200 my-3"></div>
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span className="text-[oklch(0.511_0.262_276.966)]">$94.98</span>
            </div>
          </div>
          
          <div className="space-y-3 mb-8">
            <h3 className="font-medium text-gray-700">You now have access to:</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center">
                <CheckCircle size={16} className="text-green-500 mr-2" />
                <span>Unlimited AI-powered note organization</span>
              </li>
              <li className="flex items-center">
                <CheckCircle size={16} className="text-green-500 mr-2" />
                <span>Advanced search capabilities</span>
              </li>
              <li className="flex items-center">
                <CheckCircle size={16} className="text-green-500 mr-2" />
                <span>Cross-platform sync</span>
              </li>
              <li className="flex items-center">
                <CheckCircle size={16} className="text-green-500 mr-2" />
                <span>Priority customer support</span>
              </li>
            </ul>
          </div>
          
          <div className="flex flex-col space-y-3">
            <Button 
              onClick={() => router.visit("/dashboard")}
              className="bg-[oklch(0.511_0.262_276.966)] hover:bg-[oklch(0.461_0.262_276.966)] text-white"
            >
              Go to my dashboard
              <ArrowRight size={16} className="ml-2" />
            </Button>
            
            <Button 
              variant="outline" 
              className="border-[oklch(0.511_0.262_276.966)] text-[oklch(0.511_0.262_276.966)] hover:bg-purple-50"
            >
              <Download size={16} className="mr-2" />
              Download receipt
            </Button>
          </div>
        </div>
        
        {/* Footer */}
        <div className="px-8 pb-6 text-center">
          <p className="text-sm text-gray-500">
            Payment confirmation has been sent to your email
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Order ID: #AI-29384756
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
        <p className="text-gray-600">Need help? <a href="#" className="text-[oklch(0.511_0.262_276.966)] hover:underline">Contact our support team</a></p>
      </motion.div>
    </div>
  );
};

export default PaymentSuccess;