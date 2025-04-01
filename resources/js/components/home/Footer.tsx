
import React from "react";
import { BookText, Twitter, Facebook, Instagram, Linkedin, Mail } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="container mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          <div className="col-span-1 lg:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="relative">
                <BookText className="w-7 h-7 text-brand-600" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-sage-400 rounded-full border-2 border-gray-50"></span>
              </div>
              <span className="text-xl font-display font-bold tracking-tight text-gray-900">
                LearnPad
              </span>
            </div>
            <p className="text-gray-600 mb-6 max-w-sm">
              The intuitive digital notepad designed to transform how you learn, organize, and retain information.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-brand-600 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-brand-600 transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-brand-600 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-brand-600 transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-medium text-gray-900 mb-4">Product</h3>
            <ul className="space-y-3">
              <li>
                <a href="#features" className="text-gray-600 hover:text-brand-600 transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#pricing" className="text-gray-600 hover:text-brand-600 transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-brand-600 transition-colors">
                  Templates
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-brand-600 transition-colors">
                  Integrations
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-brand-600 transition-colors">
                  Updates
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium text-gray-900 mb-4">Company</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-gray-600 hover:text-brand-600 transition-colors">
                  About
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-brand-600 transition-colors">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-brand-600 transition-colors">
                  Careers
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-brand-600 transition-colors">
                  Press
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium text-gray-900 mb-4">Resources</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-gray-600 hover:text-brand-600 transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-brand-600 transition-colors">
                  Community
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-brand-600 transition-colors">
                  Tutorials
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-brand-600 transition-colors">
                  API Docs
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-brand-600 transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0 text-gray-500 text-sm">
            © {new Date().getFullYear()} LearnPad. All rights reserved.
          </div>
          <div className="flex space-x-6">
            <a href="#" className="text-gray-500 hover:text-brand-600 text-sm">
              Terms of Service
            </a>
            <a href="#" className="text-gray-500 hover:text-brand-600 text-sm">
              Privacy Policy
            </a>
            <a href="#" className="text-gray-500 hover:text-brand-600 text-sm">
              Cookie Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
