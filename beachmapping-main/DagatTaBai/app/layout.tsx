import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import 'leaflet/dist/leaflet.css';
import './globals.css';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { AiChatWidget } from '@/components/ai-chat-widget';
import { ThemeProvider } from '@/components/theme-provider';
import { CookieConsent } from '@/components/cookie-consent';
import { FeedbackToasts } from '@/components/ui/feedback-toasts';
import { VisitorTracker } from '@/components/visitor-tracker';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Dagat Ta Bai',
  description:
    'Find beaches, not filters. Discover local beach resorts and coastlines in Barangay Binongkalan, Catmon, Cebu with verified rates, 360° tours, and an interactive map.',
  icons: {
    icon: [
      { url: '/images/logo.png', type: 'image/png' },
    ],
    shortcut: '/images/logo.png',
    apple: '/images/logo.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable}`}
      suppressHydrationWarning
    >
      <body className="flex flex-col min-h-screen bg-slate-50 dark:bg-[#09090b] text-slate-900 dark:text-zinc-100 transition-colors duration-200">
        <ThemeProvider>
          <FeedbackToasts />
          <VisitorTracker />
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <AiChatWidget />
          <CookieConsent />
        </ThemeProvider>
      </body>
    </html>
  );
}
