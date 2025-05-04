import { usePage } from '@inertiajs/react';

export function useTranslation() {
  const { translations } = usePage().props;

  const t = (key: string, replacements: Record<string, string> = {}) => {
    let translation = translations?.[key] || key;

    Object.keys(replacements).forEach(placeholder => {
      translation = translation.replace(`:${placeholder}`, replacements[placeholder]);
    });

    return translation;
  };

  return t;
}