import Link from 'next/link';
import { RequestForm } from '@/components/RequestForm';
import { ArrowLeft } from 'lucide-react';

export default function NewRequestPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:px-6">
      {/* Back button link */}
      <div className="mb-6">
        <Link
          href="/requests"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-800 hover:text-zinc-950 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to My Requests</span>
        </Link>
      </div>

      <RequestForm />
    </div>
  );
}
