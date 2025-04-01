
import React, { useRef, useEffect } from "react";
import { QuoteIcon } from "lucide-react";

const testimonials = [
  {
    quote:
      "Clevernote completely transformed how I study for medical school. The smart organization and AI summaries save me hours every week.",
    name: "Dr. Sarah Johnson",
    title: "Medical Resident",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80",
  },
  {
    quote:
      "As a professor, I recommend Clevernote to all my students. The way it organizes information makes complex topics much more approachable.",
    name: "Prof. Michael Chen",
    title: "Computer Science Professor",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80",
  },
  {
    quote:
      "The spaced repetition feature alone is worth the subscription. I've never retained information this well before using Clevernote.",
    name: "Alex Rivera",
    title: "Law Student",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80",
  },
  {
    quote:
      "I use Clevernote daily for my continuing education. It's beautifully designed and makes taking notes feel like a joy rather than a chore.",
    name: "Emma Thompson",
    title: "Software Engineer",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80",
  },
];

const Testimonials = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  // Subtle floating animation for the cards
  useEffect(() => {
    const cards = containerRef.current?.querySelectorAll('.testimonial-card');
    
    cards?.forEach((card, index) => {
      const animation = card.animate(
        [
          { transform: 'translateY(0px)' },
          { transform: 'translateY(-8px)' },
          { transform: 'translateY(0px)' }
        ],
        {
          duration: 4000 + index * 500,
          iterations: Infinity,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
          delay: index * 1000
        }
      );
    });
  }, []);

  return (
    <section id="testimonials" className="py-20 bg-gray-50 paper-texture">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-700 mb-4">
            Loved by Learners
          </div>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 tracking-tight mb-4">
            What our users are saying
          </h2>
          <p className="text-xl text-gray-600">
            Join thousands of students and educators who have transformed their learning experience with Clevernote.
          </p>
        </div>

        <div className="relative overflow-hidden" ref={containerRef}>
          <div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            ref={innerRef}
          >
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-2xl shadow-card border border-gray-100 testimonial-card"
              >
                <QuoteIcon className="w-8 h-8 text-indigo-100 mb-4" />
                <p className="text-gray-700 mb-6">{testimonial.quote}</p>
                <div className="flex items-center">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-10 h-10 rounded-full object-cover mr-3"
                    loading="lazy"
                  />
                  <div>
                    <h4 className="font-medium text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-500">{testimonial.title}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
