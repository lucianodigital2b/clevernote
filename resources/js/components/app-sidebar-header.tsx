import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from 'react-i18next';
import languages from '@/utils/languages.json';

export function AppSidebarHeader({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItemType[] }) {
    const { i18n } = useTranslation();

    const handleLanguageChange = (value: string) => {
        if (value) {
            i18n.changeLanguage(value);
            // Optionally save to localStorage
            localStorage.setItem('i18nextLng', value);
        }
    };

    return (
        <header className="border-sidebar-border/50 flex h-16 shrink-0 items-center justify-between gap-2 border-b px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
            <Select onValueChange={handleLanguageChange} defaultValue={i18n.language}>
                <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                    {languages
                        .filter(lang => lang.value && ['en', 'es', 'pt-BR'].includes(lang.value))
                        .map((lang) => (
                            <SelectItem key={lang.value} value={lang.value || ''}>
                                {lang.label}
                            </SelectItem>
                        ))}
                </SelectContent>
            </Select>
        </header>
    );
}
