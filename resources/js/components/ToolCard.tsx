import React from 'react';
import { Link } from '@inertiajs/react';

interface ToolCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    href: string;
    featured?: boolean;
}

const ToolCard: React.FC<ToolCardProps> = ({ title, description, icon, href, featured = false }) => {
    return (
        <Link
            href={href}
            className={`block group transition-all duration-300 hover:scale-105 ${
                featured ? 'transform scale-105' : ''
            }`}
        >
            <div className={`bg-white rounded-xl shadow-lg p-6 h-full border-2 transition-all duration-300 group-hover:shadow-xl ${
                featured 
                    ? 'border-orange-200 bg-gradient-to-br from-orange-50 to-white' 
                    : 'border-transparent group-hover:border-orange-200'
            }`}>
                <div className="flex items-center mb-4">
                    <div className={`p-3 rounded-lg mr-4 ${
                        featured 
                            ? 'bg-orange-100 text-orange-600' 
                            : 'bg-gray-100 text-gray-600 group-hover:bg-orange-100 group-hover:text-orange-600'
                    } transition-colors duration-300`}>
                        {icon}
                    </div>
                    {featured && (
                        <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                            Featured
                        </span>
                    )}
                </div>
                
                <h3 className={`text-xl font-bold mb-3 ${
                    featured ? 'text-orange-900' : 'text-gray-900 group-hover:text-orange-900'
                } transition-colors duration-300`}>
                    {title}
                </h3>
                
                <p className="text-gray-600 mb-4 leading-relaxed">
                    {description}
                </p>
                
                <div className="flex items-center text-orange-600 font-medium group-hover:text-orange-700 transition-colors duration-300">
                    <span className="mr-2">Try it now</span>
                    <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </div>
            </div>
        </Link>
    );
};

export default ToolCard;