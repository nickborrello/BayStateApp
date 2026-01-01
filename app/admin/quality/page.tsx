import { CheckCircle } from 'lucide-react';

export default function QualityPage() {
    return (
        <div className="p-8">
            <div className="mb-8 flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <h1 className="text-3xl font-bold">Quality Assurance</h1>
            </div>

            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
                <p className="text-lg text-gray-600">
                    Quality review coming soon.
                </p>
                <p className="mt-2 text-sm text-gray-500">
                    Review products with missing or incomplete data before publishing.
                </p>
            </div>
        </div>
    );
}
