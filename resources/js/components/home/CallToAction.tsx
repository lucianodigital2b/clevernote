
import React from "react";
import { ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const CallToAction = () => {
  return (
    <section className="py-20 bg-indigo-50/50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-medium p-8 md:p-12 border border-gray-100">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 tracking-tight mb-4">
              Start your learning journey today
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Join thousands of students who are already using Clevernote to transform how they learn and retain information.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-10">
            <Button className="button-primary px-8 py-4 text-base sm:text-lg">
              Start your free trial
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button variant="outline" className="button-secondary px-8 py-4 text-base sm:text-lg">
              Schedule a demo
            </Button>
          </div>

          <div className="flex justify-center gap-8 flex-wrap">
            <div className="flex items-center text-sm text-gray-600">
              <CheckCircle className="w-4 h-4 text-indigo-500 mr-2" />
              3-day free trial
            </div>
      
            <div className="flex items-center text-sm text-gray-600">
              <CheckCircle className="w-4 h-4 text-indigo-500 mr-2" />
              Cancel anytime
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
