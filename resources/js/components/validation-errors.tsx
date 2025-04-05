interface ValidationErrorsProps {
    errors: Record<string, string>;
}

export function ValidationErrors({ errors }: ValidationErrorsProps) {
    if (Object.keys(errors).length === 0) return null;

    return (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <div className="text-red-600 dark:text-red-400 font-medium mb-2">
                Please fix the following errors:
            </div>
            <ul className="list-disc list-inside text-sm text-red-600 dark:text-red-400">
                {Object.entries(errors).map(([key, value]) => (
                    <li key={key}>{value}</li>
                ))}
            </ul>
        </div>
    );
}