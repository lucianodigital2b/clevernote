
import React from "react";
import { 
  BookOpen, 
  Sparkles, 
  Search, 
  Mic,
  Languages,
  Lightbulb,
  FileSearch,
  FileText
} from "lucide-react";

const featureItems = [
  {
    icon: <Mic className="w-5 h-5 text-indigo-600" />,
    title: "Voice to Text Conversion",
    description:
      "Transform your spoken content into written notes with our AI-powered transcription technology. Perfect for lectures and meetings.",
  },
  {
    icon: <Languages className="w-5 h-5 text-indigo-600" />,
    title: "Multilingual Support",
    description:
      "Access transcription and note-taking in over 100 languages, making learning accessible regardless of your native tongue.",
  },
  {
    icon: <FileSearch className="w-5 h-5 text-indigo-600" />,
    title: "Smart Content Analysis",
    description:
      "Our AI analyzes your notes to create concise summaries and identify key insights, saving you hours of review time.",
  },
  {
    icon: <FileText className="w-5 h-5 text-indigo-600" />,
    title: "Learning Materials Generator",
    description:
      "Automatically create customized study materials like quizzes and flashcards from your notes to reinforce learning.",
  },
  {
    icon: <Search className="w-5 h-5 text-indigo-600" />,
    title: "Instant Search",
    description:
      "Find any note instantly with powerful search across all your content and attachments.",
  },
  {
    icon: <Sparkles className="w-5 h-5 text-indigo-600" />,
    title: "AI Summaries",
    description:
      "Get instant AI-powered summaries of lengthy content to focus on what matters most.",
  },
  {
    icon: <BookOpen className="w-5 h-5 text-indigo-600" />,
    title: "Study Modes",
    description:
      "Switch between focused study mode, flashcard mode, and mind mapping with a click.",
  },
  {
    icon: <Lightbulb className="w-5 h-5 text-indigo-600" />,
    title: "Knowledge Connections",
    description:
      "Discover connections between notes and ideas with automated linking suggestions.",
  },
];

const Features = () => {
  return (
    <section id="features" className="py-20 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-700 mb-4">
            Powerful Features
          </div>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 tracking-tight mb-4">
            Everything you need to excel in learning
          </h2>
          <p className="text-xl text-gray-600">
            Designed for students and lifelong learners, Clevernote helps you capture, organize, and retain information more effectively.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {featureItems.map((feature, index) => (
            <div 
              key={index} 
              className="card-feature hover-scale group"
              style={{animationDelay: `${index * 0.1}s`}}
            >
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mb-5 group-hover:bg-indigo-200 transition-colors">
                {feature.icon}
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
