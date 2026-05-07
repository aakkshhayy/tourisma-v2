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
  description: 'AI-powered India travel planner. Build day-by-day itineraries with real routes, costs & travel options for any destination across India.',
  keywords: 'India travel planner, trip itinerary, travel planning India, AI travel, Kedarnath, Goa, Rajasthan, pilgrimage, char dham yatra',
  openGraph: {
    title: 'Tourisma — Plan Your Perfect India Trip',
    description: 'AI-powered itineraries with real routes & cost estimates. Free to use.',
    type: 'website',
    siteName: 'Tourisma',
    images: [
      {
        url: '/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'Tourisma — AI-powered India trip planner',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tourisma — Plan Your Perfect India Trip',
    description: 'AI-powered itineraries with real routes & cost estimates. Free.',
    images: ['/og-image.svg'],
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
