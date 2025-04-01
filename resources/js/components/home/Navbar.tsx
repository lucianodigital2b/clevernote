import React, { useState, useEffect } from "react";
import { Menu, X, BookText } from "lucide-react";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "py-3 bg-white/80 backdrop-blur-md shadow-sm"
          : "py-5 bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between">
          <a href="#" className="flex items-center space-x-2">
            <div className="relative">
              <BookText
                className={`w-8 h-8 ${
                  isScrolled ? "text-indigo-600" : "text-indigo-700"
                }`}
              />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-teal-400 rounded-full border-2 border-white"></span>
            </div>
            <span className={`text-xl font-display font-bold tracking-tight ${
              isScrolled ? "text-gray-900" : "text-indigo-900"
            }`}>
              Clevernote
            </span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <a
              href="#features"
              className="px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
            >
              Features
            </a>
            <a
              href="#testimonials"
              className="px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
            >
              Testimonials
            </a>
            <a
              href="#pricing"
              className="px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
            >
              Pricing
            </a>
            <div className="ml-4">
              <Button variant="outline" size="sm" className="mr-2" asChild>
                <a href="/login">Log In</a>
              </Button>
              <Button size="sm" className="bg-indigo-500 hover:bg-indigo-600" asChild>
                <a href="/register">Sign Up</a>
              </Button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-gray-700" />
            ) : (
              <Menu className="w-6 h-6 text-gray-700" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white shadow-md p-4 border-t border-gray-100 animate-fade-in-fast">
          <div className="flex flex-col space-y-3">
            <a
              href="#features"
              className="px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </a>
            <a
              href="#testimonials"
              className="px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Testimonials
            </a>
            <a
              href="#pricing"
              className="px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
            </a>
            <div className="flex space-x-2 pt-2">
              <Button variant="outline" size="sm" className="flex-1" asChild>
                <a href="/login">Log In</a>
              </Button>
              <Button size="sm" className="flex-1 bg-indigo-500 hover:bg-indigo-600" asChild>
                <a href="/register">Sign Up</a>
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
