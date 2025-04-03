
import React, { useEffect, useRef } from "react";
import { CheckCircle, ArrowRight, BookOpen, Edit3, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";

const Hero = () => {
  const notesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const floatingElements = notesRef.current?.querySelectorAll('.floating-note');
    
    floatingElements?.forEach((elem, index) => {
      const animation = elem.animate(
        [
          { transform: 'translateY(0px)' },
          { transform: 'translateY(-10px)' },
          { transform: 'translateY(0px)' }
        ],
        {
          duration: 3000 + index * 500,
          iterations: Infinity,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
        }
      );
      
      // Start each animation at a different point in the cycle
      animation.currentTime = index * 1000;
    });
  }, []);

  return (
    <div className="pt-24 pb-16 md:pt-32 md:pb-24 bg-white overflow-hidden">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col lg:flex-row items-center gap-12 md:gap-16">
          <div className="w-full lg:w-1/2 slide-in-animation">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-700 mb-6">
              <CheckCircle className="w-4 h-4 mr-1" />
              Your learning journey, simplified
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight text-gray-900 mb-6">
              Take beautiful <span className="text-indigo-600">notes</span> that boost learning
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed max-w-lg">
              Clevernote transforms how you capture, organize, and retain information with an intuitive digital notepad designed for modern learners.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Button className="button-secondary" variant="outline" asChild>
                  <a href="/login">Start for free
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </a>
                
              </Button>
           
            </div>
            
            <div className="flex items-center text-sm text-gray-500">
              <CheckCircle className="w-4 h-4 text-teal-500 mr-2" />
              3-day free trial
            </div>
          </div>
          
          <div className="w-full lg:w-1/2 relative" ref={notesRef}>
            <div className="relative mx-auto max-w-lg">
              <div className="absolute inset-0 bg-indigo-50/50 rounded-3xl transform -rotate-1 scale-105"></div>
              
              <div className="bg-white rounded-2xl shadow-medium border border-gray-100 p-6 relative z-10 notepad-lines">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-red-400 mr-2"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400 mr-2"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                  <div className="text-sm text-gray-400 font-medium">Clevernote</div>
                </div>
                
                <h3 className="text-lg font-medium text-gray-900 mb-3">Biology 101 Notes</h3>
                
                <div className="space-y-3 text-gray-700">
                  <p className="flex items-start">
                    <span className="w-4 h-4 mt-1 mr-2 text-indigo-500"><CheckCircle className="w-4 h-4" /></span>
                    Cell Structure and Function
                  </p>
                  <p className="flex items-start">
                    <span className="w-4 h-4 mt-1 mr-2 text-indigo-500"><CheckCircle className="w-4 h-4" /></span>
                    Photosynthesis Process
                  </p>
                  <p className="flex items-start">
                    <span className="w-4 h-4 mt-1 mr-2 text-neutral-300"><CheckCircle className="w-4 h-4" /></span>
                    Cellular Respiration
                  </p>
                </div>
                
                <div className="mt-6 text-sm text-gray-500">Updated 2 hours ago</div>
              </div>
              
              {/* Floating Notes */}
              <div className="absolute -top-12 -left-16 w-36 h-20 bg-teal-50 rounded-lg shadow-soft p-3 transform rotate-[-5deg] floating-note hidden md:block z-10">
                <div className="flex items-center mb-1">
                  <Edit3 className="w-3 h-3 text-teal-700 mr-1" />
                  <span className="text-xs font-medium text-teal-700">Quick Note</span>
                </div>
                <p className="text-xs text-teal-600 line-clamp-2">Remember to study mitochondria function!</p>
              </div>
              
              <div className="absolute -bottom-6 -right-10 w-36 h-24 bg-indigo-50 rounded-lg shadow-soft p-3 transform rotate-[7deg] floating-note hidden md:block z-10">
                <div className="flex items-center mb-1">
                  <StickyNote className="w-3 h-3 text-indigo-700 mr-1" />
                  <span className="text-xs font-medium text-indigo-700">Reminder</span>
                </div>
                <p className="text-xs text-indigo-600 line-clamp-3">Study session at library tomorrow at 3pm with study group</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
