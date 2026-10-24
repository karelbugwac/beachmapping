import Link from 'next/link';
import { ArrowRight, FileCheck, FileText, Mail, MapPin, Phone } from 'lucide-react';

const requirements = [
  { icon: FileText, title: 'Applicant information', detail: 'Full legal name, working email address, and contact phone number.' },
  { icon: MapPin, title: 'Beach listing details', detail: 'Registered business/resort name, beach name, and the beach location.' },
  { icon: FileCheck, title: 'Business permit', detail: 'Current business permit as PDF, PNG, or JPEG, maximum 10 MB.' },
  { icon: FileCheck, title: 'Proof of ownership or lease', detail: 'Land title, deed, or valid lease document as PDF, PNG, or JPEG, maximum 10 MB.' },
];

export default function OwnerRequirementsPage() {
  return (
    <main className="mx-auto max-w-4xl space-y-8 px-4 py-12 sm:px-6">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase text-sky-700">Beach Owner Listings</p>
        <h1 className="text-3xl font-bold text-slate-950 dark:text-white">Application requirements</h1>
        <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-300">Prepare these details and documents before applying. Your documents are uploaded to private storage and reviewed by the administrator.</p>
      </header>

      <ol className="divide-y divide-slate-200 border-y border-slate-200 dark:divide-slate-800 dark:border-slate-800">
        {requirements.map(({ icon: Icon, title, detail }, index) => (
          <li key={title} className="flex gap-4 py-5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">{index + 1}</span>
            <div className="flex-1">
              <h2 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white"><Icon className="h-4 w-4" />{title}</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{detail}</p>
            </div>
          </li>
        ))}
      </ol>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">What happens after submission?</h2>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-600 dark:text-slate-300">
          <li>Your application is stored with a pending status.</li>
          <li>An administrator verifies your business and ownership documents.</li>
          <li>If approved, an owner account is created and a one-time six-digit PIN is emailed to the application address.</li>
          <li>Sign in at the <Link className="font-semibold text-sky-700 underline" href="/owner/login">Owner Portal</Link> using that same email and PIN.</li>
        </ol>
        <p className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300"><Mail className="mt-0.5 h-4 w-4 shrink-0" />Make sure you can receive email at the address you provide. An application is not an owner account until it is approved.</p>
        <p className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300"><Phone className="mt-0.5 h-4 w-4 shrink-0" />Use a phone number where the administrator can reach you if the documents need clarification.</p>
      </section>

      <Link href="/apply" className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-5 py-3 text-sm font-semibold text-white dark:bg-slate-100 dark:text-slate-900">
        Apply to list your beach <ArrowRight className="h-4 w-4" />
      </Link>
    </main>
  );
}