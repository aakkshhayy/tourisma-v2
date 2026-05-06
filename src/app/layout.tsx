import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import { Toaster } from '@/components/ui/sonner';

const font = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Tourisma — Plan India Trips',
  description: 'AI-powered India travel planner. Build day-by-day itineraries for any destination.',
  keywords: 'India travel planner, trip itinerary, travel planning India',
  openGraph: {
    title: 'Tourisma — Plan India Trips',
    description: 'AI-powered India travel planner',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={font.variable}>
      <body className="min-h-screen bg-[#0A0A0B] font-sans antialiased">
        <AuthProvider>
          <Navbar />
          {children}
          <Toaster position="bottom-right" theme="dark" />
        </AuthProvider>
      </body>
    </html>
  );
}
