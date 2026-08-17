import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BRICS AI Governance Platform',
  description: 'AI-powered Digital Public Infrastructure platform that transforms multilingual citizen feedback into actionable infrastructure priorities and evidence-based policy recommendations across BRICS nations.',
  keywords: ['BRICS', 'AI governance', 'citizen feedback', 'infrastructure', 'digital public infrastructure', 'policy recommendations'],
  openGraph: {
    title: 'BRICS AI Governance Platform',
    description: 'Turning Citizen Voices Into Smarter Governance.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
