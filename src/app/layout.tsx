import type { Metadata, Viewport } from 'next';
import { Big_Shoulders_Display, Inter, JetBrains_Mono } from 'next/font/google';
import { NavBar } from '@/components/NavBar';
import { GarminAutoSync } from '@/components/GarminAutoSync';
import './globals.css';

const display = Big_Shoulders_Display({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-display',
});
const body = Inter({ subsets: ['latin'], variable: '--font-body' });
const stat = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '600'], variable: '--font-stat' });

export const metadata: Metadata = {
  title: 'Ripartenza — Coach di corsa guidato dalla scienza',
  description:
    'Piani di corsa personalizzati che uniscono allenamento e principi di riabilitazione evidence-based, con assistente AI e sincronizzazione Garmin.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Ripartenza',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className={`${display.variable} ${body.variable} ${stat.variable} h-full`}>
      <body className="font-body min-h-full bg-bg text-ink antialiased">
        <GarminAutoSync />
        <div className="flex min-h-screen flex-col md:mx-auto md:max-w-6xl md:flex-row">
          <NavBar />
          <main className="flex-1 px-4 pb-28 pt-safe sm:px-6 md:px-10 md:py-8 md:pb-12">
            <div className="mx-auto w-full max-w-4xl">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}


