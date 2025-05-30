
import React, { useEffect, useRef } from "react";
import { CheckCircle, ArrowRight, BookOpen, Edit3, StickyNote, Brain, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

const Hero = () => {
  const notesRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const floatingElements = notesRef.current?.querySelectorAll('.floating-note, .floating-artifact');
    
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
    <div 
      className="pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden relative"
      style={{
        backgroundImage: 'url("/images/bg.4f5edff0.svg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="absolute inset-0 "></div>
      <div className="container mx-auto px-4 md:px-6 relative">
        <div className="flex flex-col items-center text-center gap-12 md:gap-16">
          <div className="w-full lg:w-2/3 slide-in-animation">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-700 mb-6 mx-auto">
              <CheckCircle className="w-4 h-4 mr-1" />
              {t('ai_homework_badge')}
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight text-gray-900 mb-6">
              {t('hero_title')} <span className="bg-indigo-100 text-gray-900 px-5">{t('hero_highlight')}</span>
            </h1>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight text-gray-900 mb-6">
              {t('hero_title_suffix')}
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed max-w-lg mx-auto">
              {t('hero_description')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-8 justify-center">
              <div className="p-[3px] rounded-full bg-gradient-to-r from-indigo-400 to-indigo-600 hover:from-indigo-600 hover:to-indigo-800">
                <Button className="border-0 w-full h-full bg-white text-gray-900 hover:bg-gray-100 rounded-full hover:text-dark" variant="outline" asChild>
                  <a href={route('auth.google')} className="flex items-center justify-center px-8 py-2">
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    {t('premium_cta_google')}
                  </a>
                </Button>
              </div>
              <Button className="py-4 bg-indigo-100 hover:bg-indigo-200 text-indigo-600 border-2 px-8 rounded-full font-medium transition-all duration-200 shadow-lg shadow-indigo-200/50 hover:shadow-xl hover:shadow-indigo-300/60 h-full border-indigo-600" asChild>
                <a href="/login" className="flex items-center justify-center">
                  {t('premium_cta_email')}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </a>
              </Button>
            </div>
            
          
          </div>
          
          <div className="w-full lg:w-2/3 relative mx-auto" ref={notesRef}>
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
                
                <h3 className="text-lg font-medium text-gray-900 mb-3">{t('homework_title')}</h3>
                
                <div className="space-y-3 text-gray-700">
                  <p className="flex items-start">
                    <span className="w-4 h-4 mt-1 mr-2 text-indigo-500"><CheckCircle className="w-4 h-4" /></span>
                    {t('homework_task_1')}
                  </p>
                  <p className="flex items-start">
                    <span className="w-4 h-4 mt-1 mr-2 text-indigo-500"><CheckCircle className="w-4 h-4" /></span>
                    {t('homework_task_2')}
                  </p>
                  <p className="flex items-start">
                    <span className="w-4 h-4 mt-1 mr-2 text-indigo-500"><CheckCircle className="w-4 h-4" /></span>
                    {t('homework_task_3')}
                  </p>
                </div>
                
                <div className="mt-6 text-sm text-gray-500">{t('updated_ago', { time: '2' })}</div>
              </div>
              
              {/* Floating Notes */}
              <div className="absolute -top-12 -left-16 w-36 h-20 bg-teal-50 rounded-lg shadow-soft p-3 transform rotate-[-5deg] floating-note hidden md:block z-10">
                <div className="flex items-center mb-1">
                  <Edit3 className="w-3 h-3 text-teal-700 mr-1" />
                  <span className="text-xs font-medium text-teal-700">{t('ai_assist_label')}</span>
                </div>
                <p className="text-xs text-teal-600 line-clamp-2">{t('ai_assist_message')}</p>
              </div>
              
              <div className="absolute -bottom-6 -right-10 w-36 h-24 bg-indigo-50 rounded-lg shadow-soft p-3 transform rotate-[7deg] floating-note hidden md:block z-10">
                <div className="flex items-center mb-1">
                  <StickyNote className="w-3 h-3 text-indigo-700 mr-1" />
                  <span className="text-xs font-medium text-indigo-700">{t('success_label')}</span>
                </div>
                <p className="text-xs text-indigo-600 line-clamp-3">{t('success_message')}</p>
              </div>
              
              {/* Flashcard Artifacts */}
              <div className="absolute -top-8 -right-20 w-32 h-20 bg-gradient-to-br from-pink-50 to-rose-100 rounded-xl shadow-lg p-3 transform rotate-[12deg] floating-artifact hidden lg:block z-5">
                <div className="flex items-center justify-between mb-2">
                  <BookOpen className="w-4 h-4 text-rose-600" />
                  <div className="w-2 h-2 rounded-full bg-rose-300"></div>
                </div>
                <div className="space-y-1">
                  <div className="h-1.5 bg-rose-200 rounded w-full"></div>
                  <div className="h-1.5 bg-rose-200 rounded w-3/4"></div>
                  <div className="h-1.5 bg-rose-200 rounded w-1/2"></div>
                </div>
                <div className="text-[8px] text-rose-500 mt-1 font-medium">Flashcard</div>
              </div>
              
              <div className="absolute -bottom-12 -left-24 w-28 h-18 bg-gradient-to-br from-purple-50 to-violet-100 rounded-lg shadow-lg p-2.5 transform rotate-[-8deg] floating-artifact hidden lg:block z-5">
                <div className="flex items-center justify-between mb-1.5">
                  <Brain className="w-3.5 h-3.5 text-violet-600" />
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-violet-300"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-violet-200"></div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="h-1 bg-violet-200 rounded w-full"></div>
                  <div className="h-1 bg-violet-200 rounded w-2/3"></div>
                </div>
                <div className="text-[8px] text-violet-500 mt-1 font-medium">Quiz Mode</div>
              </div>
              
              <div className="absolute top-16 -right-32 w-24 h-16 bg-gradient-to-br from-emerald-50 to-green-100 rounded-lg shadow-lg p-2 transform rotate-[18deg] floating-artifact hidden xl:block z-5">
                <div className="flex items-center justify-between mb-1">
                  <Zap className="w-3 h-3 text-emerald-600" />
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                </div>
                <div className="space-y-0.5">
                  <div className="h-1 bg-emerald-200 rounded w-full"></div>
                  <div className="h-1 bg-emerald-200 rounded w-1/2"></div>
                </div>
                <div className="text-[7px] text-emerald-500 mt-0.5 font-medium">Study Boost</div>
              </div>
              
              <div className="absolute top-20 -left-28 w-26 h-14 bg-gradient-to-br from-amber-50 to-yellow-100 rounded-lg shadow-lg p-2 transform rotate-[-12deg] floating-artifact hidden xl:block z-5">
                <div className="flex items-center justify-between mb-1">
                  <div className="w-3 h-3 rounded bg-amber-300"></div>
                  <div className="text-[6px] text-amber-600 font-bold">A+</div>
                </div>
                <div className="space-y-0.5">
                  <div className="h-0.5 bg-amber-200 rounded w-full"></div>
                  <div className="h-0.5 bg-amber-200 rounded w-3/4"></div>
                  <div className="h-0.5 bg-amber-200 rounded w-1/2"></div>
                </div>
                <div className="text-[7px] text-amber-600 mt-0.5 font-medium">Progress</div>
              </div>
              
              <div className="absolute -bottom-16 right-8 w-20 h-12 bg-gradient-to-br from-cyan-50 to-blue-100 rounded-lg shadow-lg p-1.5 transform rotate-[25deg] floating-artifact hidden lg:block z-5">
                <div className="flex items-center justify-between mb-1">
                  <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                  <div className="w-2 h-2 rounded-full bg-cyan-300"></div>
                  <div className="w-2 h-2 rounded-full bg-cyan-200"></div>
                </div>
                <div className="h-0.5 bg-cyan-200 rounded w-full mb-0.5"></div>
                <div className="h-0.5 bg-cyan-200 rounded w-2/3"></div>
                <div className="text-[6px] text-cyan-600 mt-0.5 font-medium">Memory</div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Hero;
