export default function CommunityGuidelinesPage() {
  return (
    <main className="mx-auto max-w-4xl space-y-8 px-4 py-12 sm:px-6">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase text-sky-700">Dagat Ta Bai Community</p>
        <h1 className="text-3xl font-bold text-slate-950 dark:text-white">Community guidelines</h1>
        <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-300">Help keep beach information useful, respectful, and trustworthy for visitors and local operators.</p>
      </header>

      <section className="space-y-6 border-y border-slate-200 py-6 dark:border-slate-800">
        <article className="space-y-2">
          <h2 className="font-semibold text-slate-900 dark:text-white">Reviews should reflect a real experience</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">Share truthful, specific observations. Do not post fabricated visits, personal information, threats, hate, spam, or promotional links unrelated to your experience.</p>
        </article>
        <article className="space-y-2">
          <h2 className="font-semibold text-slate-900 dark:text-white">Keep disagreements respectful</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">Critique a service or facility without targeting or harassing an individual. Do not publish private contact details or sensitive documents in a review.</p>
        </article>
        <article className="space-y-2">
          <h2 className="font-semibold text-slate-900 dark:text-white">Owners cannot edit visitor reviews</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">Beach owners can read reviews of their beach but cannot change or delete them. If a review appears abusive, fraudulent, or unsafe, report it for administrator review. The administrator decides whether it violates these guidelines.</p>
        </article>
        <article className="space-y-2">
          <h2 className="font-semibold text-slate-900 dark:text-white">Beach information and safety</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">Owners should keep listing details accurate and current. Visitors should follow posted local rules and use their own judgment; weather, tide, and route estimates may change.</p>
        </article>
      </section>
      <p className="text-sm text-slate-600 dark:text-slate-300">For an account, privacy, or safety concern, contact the <a className="font-semibold text-sky-700 underline" href="/contact">Dagat Ta Bai team</a>.</p>
    </main>
  );
}