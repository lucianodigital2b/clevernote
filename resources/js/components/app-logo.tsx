import AppLogoIcon from './app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                <AppLogoIcon className="size-5 fill-current text-white dark:text-black" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="mb-0.5 truncate font-semibold leading-none">Laravel</span>
                <span className="truncate text-[11px] leading-none tracking-tight opacity-80">Starter Kit</span>
            </div>
        </>
    );
}
