import { toast, type Toast } from "sonner";

export const toastConfig = {
    error: (message: string, options?: Partial<Toast>) => {
        return toast.error(message, {
            style: {
                background: 'rgb(220 38 38)',
                color: 'white',
            },
            ...options
        });
    },
    success: (message: string, options?: Partial<Toast>) => {
        return toast.success(message, {
            ...options
        });
    }
};