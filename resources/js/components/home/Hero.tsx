
import React, { useEffect, useRef } from "react";
import { CheckCircle, ArrowRight, BookOpen, Edit3, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

const Hero = () => {
  const notesRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

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
              {t('learning_journey')}
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight text-gray-900 mb-6">
              {t('hero_title')} <span className="text-indigo-600">{t('notes')}</span> {t('hero_title_suffix')}
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed max-w-lg">
              {t('hero_description')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <div className="p-[3px] rounded-full bg-gradient-to-r from-indigo-400 to-indigo-600 hover:from-indigo-600 hover:to-indigo-800">
                <Button className="border-0 w-full h-full bg-white text-gray-900 hover:bg-gray-100 rounded-full" variant="outline" asChild>
                  <a href={route('auth.google')} className="flex items-center justify-center px-8 py-2">
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                        />
                        <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                        />
                        <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="#FBBC05"
                        />
                        <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                        />
                    </svg>
                    {'Join with Google'}
                    </a>
                </Button>
              </div>
              <Button className="h-15" variant="outline" asChild>
                  <a href="/login">{t('start_free')}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </a>
              </Button>
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
                
                <h3 className="text-lg font-medium text-gray-900 mb-3">{t('biology_notes')}</h3>
                
                <div className="space-y-3 text-gray-700">
                  <p className="flex items-start">
                    <span className="w-4 h-4 mt-1 mr-2 text-indigo-500"><CheckCircle className="w-4 h-4" /></span>
                    {t('cell_structure')}
                  </p>
                  <p className="flex items-start">
                    <span className="w-4 h-4 mt-1 mr-2 text-indigo-500"><CheckCircle className="w-4 h-4" /></span>
                    {t('photosynthesis')}
                  </p>
                  <p className="flex items-start">
                    <span className="w-4 h-4 mt-1 mr-2 text-neutral-300"><CheckCircle className="w-4 h-4" /></span>
                    {t('cellular_respiration')}
                  </p>
                </div>
                
                <div className="mt-6 text-sm text-gray-500">{t('updated_ago', { time: '2' })}</div>
              </div>
              
              {/* Floating Notes */}
              <div className="absolute -top-12 -left-16 w-36 h-20 bg-teal-50 rounded-lg shadow-soft p-3 transform rotate-[-5deg] floating-note hidden md:block z-10">
                <div className="flex items-center mb-1">
                  <Edit3 className="w-3 h-3 text-teal-700 mr-1" />
                  <span className="text-xs font-medium text-teal-700">{t('quick_note')}</span>
                </div>
                <p className="text-xs text-teal-600 line-clamp-2">{t('study_reminder')}</p>
              </div>
              
              <div className="absolute -bottom-6 -right-10 w-36 h-24 bg-indigo-50 rounded-lg shadow-soft p-3 transform rotate-[7deg] floating-note hidden md:block z-10">
                <div className="flex items-center mb-1">
                  <StickyNote className="w-3 h-3 text-indigo-700 mr-1" />
                  <span className="text-xs font-medium text-indigo-700">{t('reminder')}</span>
                </div>
                <p className="text-xs text-indigo-600 line-clamp-3">{t('study_session')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
