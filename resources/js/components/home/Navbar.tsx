import React, { useState, useEffect } from "react";
import { Menu, X, BookText, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'pt', name: 'Português' }
];

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t, i18n } = useTranslation();
  const [currentLang, setCurrentLang] = useState(i18n.language);

  useEffect(() => {
    setCurrentLang(i18n.language);
  }, [i18n.language]);

  const handleLanguageChange = (value: string) => {
    if (value) {
      i18n.changeLanguage(value);
      setCurrentLang(value);
      localStorage.setItem('i18nextLng', value);
    }
  };


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
            <span className={`text-xl font-display font-bold tracking-tight ${
              isScrolled ? "text-gray-900" : "text-indigo-900"
            }`}>
              Clevernote
            </span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {/* <a
              href="#features"
              className="px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
            >
              {t('nav_features')}
            </a> */}
            <a
              href="#faq"
              className="px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
            >
              FAQ
            </a>
            {/* <a
              href="#pricing"
              className="px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
            >
              {t('nav_pricing')}
            </a> */}
            <div className="ml-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 border-2 bg-white text-black border-zinc-200 hover:bg-zinc-100 hover:text-black">
                    <Globe className="h-4 w-4" />
                    {languages.find(lang => lang.code === currentLang)?.name}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {languages.map((lang) => (
                    <DropdownMenuItem
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                    >
                      {lang.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="ml-4">
              <Button variant="outline" size="sm" className="mr-2 bg-white text-black border-zinc-200 hover:bg-zinc-100 hover:text-black" asChild>
                <a href="/login">{t('nav_login')}</a>
              </Button>
              <Button size="sm" className="bg-indigo-500 hover:bg-indigo-600 text-white" asChild>
                <a href="/register">{t('nav_signup')}</a>
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
            {/* <a
              href="#features"
              className="px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('nav_features')}
            </a> */}
            <a
              href="#testimonials"
              className="px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('nav_testimonials')}
            </a>
            {/* <a
              href="#pricing"
              className="px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('nav_pricing')}
            </a> */}
            <div className="flex space-x-2 pt-2">
              <Button variant="outline" size="sm" className="flex-1 bg-white text-black border-zinc-200 hover:bg-white hover:text-black" asChild>
                <a href="/login">{t('nav_login')}</a>
              </Button>
              <Button size="sm" className="flex-1 bg-indigo-500 hover:bg-indigo-600" asChild>
                <a href="/register">{t('nav_signup')}</a>
              </Button>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 w-full justify-start bg-white">
                  <Globe className="h-4 w-4" />
                  {languages.find(lang => lang.code === currentLang)?.name}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                  >
                    {lang.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
