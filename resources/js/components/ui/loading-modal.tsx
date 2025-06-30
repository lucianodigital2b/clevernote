import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { FileText, Brain, Map } from 'lucide-react';

type LoadingType = 'flashcard' | 'quiz' | 'mindmap';

interface LoadingModalProps {
  open: boolean;
  type: LoadingType;
  onOpenChange?: (open: boolean) => void;
}

const loadingConfig = {
  flashcard: {
    icon: FileText,
    title: 'Creating Flashcards',
    description: 'AI is analyzing your note to create study cards',
    colors: {
      border: 'border-blue-200',
      borderTop: 'border-t-blue-600',
      icon: 'text-blue-600'
    }
  },
  quiz: {
    icon: Brain,
    title: 'Generating Quiz',
    description: 'Creating intelligent questions from your content',
    colors: {
      border: 'border-green-200',
      borderTop: 'border-t-green-600',
      icon: 'text-green-600'
    }
  },
  mindmap: {
    icon: Map,
    title: 'Building Mindmap',
    description: 'Mapping concepts and connections visually',
    colors: {
      border: 'border-purple-200',
      borderTop: 'border-t-purple-600',
      icon: 'text-purple-600'
    }
  }
};

export function LoadingModal({ open, type, onOpenChange }: LoadingModalProps) {
  const config = loadingConfig[type];
  const Icon = config.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col items-center gap-6 py-8">
          <div className="relative">
            <div className={`animate-spin rounded-full h-16 w-16 border-4 ${config.colors.border} ${config.colors.borderTop}`}></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Icon className={`h-6 w-6 ${config.colors.icon}`} />
            </div>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
              {config.title}
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400">
              {config.description}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}