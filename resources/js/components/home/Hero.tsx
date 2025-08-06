
import React, { useEffect, useRef, useState } from "react";
import { CheckCircle, ArrowRight, BookOpen, Edit3, StickyNote, Brain, Zap, Users, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

const Hero = () => {
  const notesRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  // Removed typewriter effect states and words array

  // Removed floating elements animation useEffect

  // Removed typewriter effect useEffect

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
        {/* Mobile layout - stacked vertically */}
        <div className="flex flex-col items-center text-center gap-12 md:hidden">
          <div className="w-full slide-in-animation relative" ref={notesRef}>
            <h1 className="mb-8 text-3xl sm:text-4xl font-display font-bold tracking-tight text-gray-900 px-2 sm:px-0">
              {t('hero_make_learning')}
            </h1>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8 justify-center px-4 sm:px-0 mt-7">
              <div className="p-[3px] rounded-full bg-gradient-to-r from-indigo-400 to-indigo-600 hover:from-indigo-600 hover:to-indigo-800">
                <Button className="border-0 w-full h-full bg-white text-gray-900 hover:bg-gray-100 rounded-full hover:text-dark" variant="outline" asChild>
                  <a href={route('auth.google')} className="flex items-center justify-center px-6 sm:px-8 py-2 text-sm sm:text-base">
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
              <Button className="py-3 sm:py-4 bg-indigo-100 hover:bg-indigo-200 text-indigo-600 border-2 px-6 sm:px-8 rounded-full font-medium transition-all duration-200 shadow-lg shadow-indigo-200/50 hover:shadow-xl hover:shadow-indigo-300/60 h-full border-indigo-600 dark:text-indigo-600 text-sm sm:text-base" asChild>
                <a href="/login" className="flex items-center justify-center">
                  {t('premium_cta_email')}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </a>
              </Button>
            </div>

            <div className="flex flex-row items-center justify-center gap-4 sm:gap-8 mb-8">
              <div className="flex flex-col items-center gap-3 sm:gap-4 align-center">
                <div className="flex -space-x-2">
                  <img 
                    src="/avatars/300-1.jpg" 
                    alt="Student avatar" 
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white shadow-sm object-cover"
                  />
                  <img 
                    src="/avatars/300-12.jpg" 
                    alt="Student avatar" 
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white shadow-sm object-cover"
                  />
                  <img 
                    src="/avatars/300-20.jpg" 
                    alt="Student avatar" 
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white shadow-sm object-cover"
                  />
                  <img 
                    src="/avatars/300-5.jpg" 
                    alt="Student avatar" 
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white shadow-sm object-cover"
                  />
                </div>
                <div className="text-left sm:text-left ">
                  <div className="text-indigo-600 font-semibold text-center sm:text-lg">{t('hero_social_proof_loved_by')}</div>
                  <div className="text-indigo-600 font-semibold text-center sm:text-lg">{t('hero_million_students')}</div>
                </div>
              </div>
              
              {/* Aesthetic line separator */}
              <div className="w-0.5 h-12 sm:h-16 bg-zinc-200 rounded-2xl"></div>
              
              <div className="flex items-center justify-center">
                <img 
                  src="/4_9.png" 
                  alt="4.9 rating with laurel wreaths and stars" 
                  className="h-16 sm:h-20 w-auto"
                />
              </div>
            </div>
          </div>
          
          <div className="w-full">
            <video src="/home-video.mp4" autoPlay loop muted className="rounded-2xl w-full h-full object-cover"></video>
          </div>
        </div>

        {/* Desktop layout - 50/50 split */}
        <div className="hidden md:grid md:grid-cols-2 md:gap-8 lg:gap-12 xl:gap-16 items-center min-h-[600px]">
          {/* Left side - Content */}
          <div className="slide-in-animation relative text-left">
            <h1 className="mb-8 text-4xl lg:text-5xl xl:text-6xl font-display font-bold tracking-tight text-gray-900">
              {t('hero_make_learning')}
            </h1>
            
            <div className="flex flex-col lg:flex-row gap-4 mb-8 mt-7">
              <div className="p-[3px] rounded-full bg-gradient-to-r from-indigo-400 to-indigo-600 hover:from-indigo-600 hover:to-indigo-800">
                <Button className="border-0 w-full h-full bg-white text-gray-900 hover:bg-gray-100 rounded-full hover:text-dark" variant="outline" asChild>
                  <a href={route('auth.google')} className="flex items-center justify-center px-6 lg:px-8 py-2 text-base">
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
              <Button className="py-3 lg:py-4 bg-indigo-100 hover:bg-indigo-200 text-indigo-600 border-2 px-6 lg:px-8 rounded-full font-medium transition-all duration-200 shadow-lg shadow-indigo-200/50 hover:shadow-xl hover:shadow-indigo-300/60 h-full border-indigo-600 dark:text-indigo-600 text-base" asChild>
                <a href="/login" className="flex items-center justify-center">
                  {t('premium_cta_email')}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </a>
              </Button>
            </div>

            <div className="flex flex-row items-center gap-8 mb-8">
              <div className="flex flex-col items-start gap-4">
                <div className="flex -space-x-2">
                  <img 
                    src="/avatars/300-1.jpg" 
                    alt="Student avatar" 
                    className="w-10 h-10 lg:w-12 lg:h-12 rounded-full border-2 border-white shadow-sm object-cover"
                  />
                  <img 
                    src="/avatars/300-12.jpg" 
                    alt="Student avatar" 
                    className="w-10 h-10 lg:w-12 lg:h-12 rounded-full border-2 border-white shadow-sm object-cover"
                  />
                  <img 
                    src="/avatars/300-20.jpg" 
                    alt="Student avatar" 
                    className="w-10 h-10 lg:w-12 lg:h-12 rounded-full border-2 border-white shadow-sm object-cover"
                  />
                  <img 
                    src="/avatars/300-5.jpg" 
                    alt="Student avatar" 
                    className="w-10 h-10 lg:w-12 lg:h-12 rounded-full border-2 border-white shadow-sm object-cover"
                  />
                </div>
                <div className="text-left">
                  <div className="text-indigo-600 font-semibold text-lg">{t('hero_social_proof_loved_by')}</div>
                  <div className="text-indigo-600 font-semibold text-lg">{t('hero_million_students')}</div>
                </div>
              </div>
              
              {/* Aesthetic line separator */}
              <div className="w-0.5 h-16 bg-zinc-200 rounded-2xl"></div>
              
              <div className="flex items-center justify-center">
                <img 
                  src="/4_9.png" 
                  alt="4.9 rating with laurel wreaths and stars" 
                  className="h-20 lg:h-24 w-auto"
                />
              </div>
            </div>
          </div>

          {/* Right side - Video */}
          <div className="flex items-center justify-center">
            <video src="/home-video.mp4" autoPlay loop muted className="rounded-2xl w-full h-full object-cover max-h-[500px]"></video>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Hero;
