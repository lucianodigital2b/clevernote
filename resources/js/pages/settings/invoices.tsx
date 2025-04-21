import { Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { type BreadcrumbItem } from '@/types';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Invoices',
        href: '/settings/invoices',
    },
];

type Invoice = {
    id: number;
    date: string;
    total: string;
    download_url: string;
    status: string;
};

export default function Invoices({invoices = []}: {invoices: Invoice[]}) {

    console.log(invoices);
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Invoices" />
            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall title="Invoices" description="View and download your invoices" />

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
                            <thead>
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase">Date</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase">Total</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase">PDF</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.map((invoice) => (
                                    <tr key={invoice.id} className="bg-white dark:bg-neutral-800">
                                        <td className="px-4 py-2">{invoice.date}</td>
                                        <td className="px-4 py-2">{invoice.total}</td>
                                        <td className="px-4 py-2">
                                            <a
                                                href={invoice.download_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:underline"
                                            >
                                                Download PDF
                                            </a>
                                        </td>
                                        <td className="px-4 py-2">{invoice.status}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}