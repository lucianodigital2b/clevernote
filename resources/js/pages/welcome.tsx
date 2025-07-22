
import React, { useEffect } from "react";
import Navbar from "../components/home/Navbar";
import Hero from "../components/home/Hero";
import HowItWorks from "../components/home/HowItWorks";
import Features from "../components/home/Features";
import Reliability from "../components/home/Reliability";
import FAQ from "../components/home/FAQ";
import Testimonials from "../components/home/Testimonials";
import Pricing from "../components/home/Pricing";
import CallToAction from "../components/home/CallToAction";
import Footer from "../components/home/Footer";

interface WelcomeProps {
  pricingPlans: any[];
}

const Welcome = ({ pricingPlans }: WelcomeProps) => {
  // Smooth scroll for anchor links with improved easing
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      
      if (link && link.getAttribute('href')?.startsWith('#')) {
        e.preventDefault();
        const id = link.getAttribute('href')?.substring(1);
        const element = document.getElementById(id || '');
        
        if (element) {
          window.scrollTo({
            top: element.offsetTop - 80,
            behavior: 'smooth'
          });
        }
      }
    };

    document.addEventListener('click', handleLinkClick);
    
    return () => {
      document.removeEventListener('click', handleLinkClick);
    };
  }, []);

  // Reveal animations on scroll with improved threshold and timing
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '50px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.remove('opacity-0');
          entry.target.classList.add('animate-fade-in');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    const sections = document.querySelectorAll('#how-it-works, #features, #reliability, #testimonials, #pricing, #cta');
    sections.forEach(section => {
      section.classList.add('opacity-0');
      observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      {/* <section id="how-it-works"><HowItWorks /></section> */}
      <section id="features"><Features /></section>
      {/* <section id="testimonials"><Testimonials /></section> */}
      <section id="pricing"><Pricing pricingPlans={pricingPlans} /></section>
      <section id="faq"><FAQ /></section>
      <section id="reliability"><Reliability /></section>
      {/* <section id="cta"><CallToAction /></section> */}
      <Footer />
    </div>
  );

};

export default Welcome;
