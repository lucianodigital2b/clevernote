import { useState } from "react";
import { router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { LoaderCircle } from "lucide-react";
import { toastConfig } from '@/lib/toast';

interface DeleteConfirmationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    endpoint: string;
    title: string;
    description: string;
    successMessage?: string;
    errorMessage?: string;
    onSuccess?: () => void;
    onError?: (error: any) => void;
}

export function DeleteConfirmationDialog({
    open,
    onOpenChange,
    endpoint,
    title,
    description,
    successMessage,
    errorMessage,
    onSuccess,
    onError,
}: DeleteConfirmationDialogProps) {
    const { t } = useTranslation(['translation']);
    const [processing, setProcessing] = useState(false);

    const handleConfirm = () => {
        setProcessing(true);
        router.delete(endpoint, {
            onSuccess: () => {
                toastConfig.success(successMessage || t('deleted_successfully'));
                onOpenChange(false);
                onSuccess?.();
            },
            onError: (error) => {
                toastConfig.error(errorMessage || t('delete_error'));
                onOpenChange(false);
                onError?.(error);
            },
            onFinish: () => {
                setProcessing(false);
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={processing}>
                        {t('cancel')}
                    </Button>
                    <Button variant="destructive" onClick={handleConfirm} disabled={processing}>
                        {processing && <LoaderCircle className="h-4 w-4 animate-spin mr-2" />}
                        {t('delete')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}