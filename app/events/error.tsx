'use client';

import Link from 'next/link';

export default function CommunityEventError({ reset }: { reset: () => void }) {
    return <section className="rounded-xl border border-dark-200 p-8"><h1 className="text-3xl">Community event unavailable</h1><p className="mt-5 text-light-200">The community database could not be reached. Please try again, or browse the live developer event feed.</p><div className="mt-6 flex flex-wrap gap-5"><button type="button" onClick={reset} className="font-semibold text-primary">Try again</button><Link href="/" className="text-primary">Discover events</Link></div></section>;
}
