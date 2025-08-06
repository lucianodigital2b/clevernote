import React from "react";
import { useTranslation } from "react-i18next";
import { GraduationCap, Scale, Stethoscope, Trophy, Users, Target } from "lucide-react";

const WhosItFor = () => {
  const { t } = useTranslation();

  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-slate-50 to-orange-50">
      <div className="container mx-auto px-4 md:px-6">
        {/* Top Section: Picture and Hook */}
        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
          {/* Left: Image */}
          <div className="relative">
            <img 
              src="/photo-1.jpg" 
              alt={t("whos_it_for_students_studying_alt")} 
              className="w-1/2 h-auto object-cover rounded-2xl shadow-2xl mx-auto"
            />
          </div>

          {/* Right: Hook */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-sm font-medium">
              <Users className="w-4 h-4" />
              {t("whos_it_for_trusted_by_students")}
            </div>
            
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
              {t("whos_it_for_secret_weapon")} 
              <span className="text-orange-600"> {t("whos_it_for_top_performers")}</span>
            </h2>
            
            <p className="text-xl text-gray-600 leading-relaxed">
              {t("whos_it_for_description")}
            </p>
          </div>
        </div>

        {/* Bottom Section - Two Hooks */}
        <div className="space-y-16">
          {/* Perfect for Future Lawyers */}
          <div className="grid md:grid-cols-2 gap-12 items-center">

            <div className="relative  lg:hidden">
              <img 
                src="/photo-2.jpg" 
                alt={t("whos_it_for_student_success_alt")} 
                className="w-1/2 h-auto object-cover rounded-2xl shadow-2xl mx-auto"
              />
            </div>

            {/* Left: Copy */}
            <div className="md:p-8 transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">{t("whos_it_for_perfect_for_title")}</h3>
              </div>
              <p className="text-xl text-gray-600 leading-relaxed mb-6">
                {t("whos_it_for_perfect_for_description")}
              </p>
          
            </div>

            {/* Right: Image */}
            <div className="relative hidden lg:block">
              <img 
                src="/photo-2.jpg" 
                alt={t("whos_it_for_student_success_alt")} 
                className="w-1/2 h-auto object-cover rounded-2xl shadow-2xl mx-auto"
              />
            </div>
          </div>
        </div>
  
      </div>
    </section>
  );
};

export default WhosItFor;