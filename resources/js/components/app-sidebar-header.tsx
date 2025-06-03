import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslation } from 'react-i18next';
import { useAppearance } from '@/hooks/use-appearance';
import { Moon, Sun } from 'lucide-react';
import languages from '@/utils/languages.json';

export function AppSidebarHeader({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItemType[] }) {
    const { i18n } = useTranslation();
    const { appearance, updateAppearance } = useAppearance();

    const handleLanguageChange = (value: string) => {
        if (value) {
            i18n.changeLanguage(value);
            // Optionally save to localStorage
            localStorage.setItem('i18nextLng', value);
        }
    };

    const toggleDarkMode = () => {
        const newMode = appearance === 'dark' ? 'light' : 'dark';
        updateAppearance(newMode);
    };

    return (
        <header className="border-sidebar-border/50 flex h-16 shrink-0 items-center justify-between gap-2 border-b px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
            <div className="flex items-center gap-2">
                <TooltipProvider delayDuration={0}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="group h-9 w-9 cursor-pointer"
                                onClick={toggleDarkMode}
                            >
                                {appearance === 'dark' ? (
                                    <Sun className="h-4 w-4 opacity-80 group-hover:opacity-100" />
                                ) : (
                                    <Moon className="h-4 w-4 opacity-80 group-hover:opacity-100" />
                                )}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{appearance === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                <Select onValueChange={handleLanguageChange} defaultValue={i18n.language}>
                    <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Language" />
                    </SelectTrigger>
                    <SelectContent>
                        {languages
                            .filter(lang => lang.value && ['en', 'es', 'pt'].includes(lang.value))
                            .map((lang) => (
                                <SelectItem key={lang.value} value={lang.value || ''}>
                                    {lang.label}
                                </SelectItem>
                            ))}
                    </SelectContent>
                </Select>
            </div>
        </header>
    );
}
