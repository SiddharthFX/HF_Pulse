import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { ORG, ORG_DISPLAY_NAME } from '@/lib/constants';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jakarta',
  weight: ['400', '500', '600', '700'],
});

const themeInitScript = `(function(){try{var raw=localStorage.getItem('pluto.theme');var saved=null;if(raw){try{saved=JSON.parse(raw)}catch(e){saved=raw==='dark'?'dark':'light'}}var theme=saved==='dark'||saved==='light'?saved:(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');var root=document.documentElement;root.classList.toggle('dark',theme==='dark');root.style.colorScheme=theme}catch(e){}})();`;

export const metadata: Metadata = {
  metadataBase: new URL('https://huggingface.co'),
  title: `${ORG_DISPLAY_NAME} — Hugging Face Analytics`,
  description: `Live download, like and storage statistics for the ${ORG_DISPLAY_NAME} (${ORG}) organization on the Hugging Face Hub.`,
  robots: { index: false, follow: false, nocache: true },
  icons: {
    icon: [
      { url: '/pluto-logo.webp', type: 'image/webp' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/icon.svg' }],
  },
  openGraph: {
    title: `${ORG_DISPLAY_NAME} — Hugging Face Analytics`,
    description: `Live Hub statistics for ${ORG}.`,
    images: ['/og.svg'],
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f4f7f4' },
    { media: '(prefers-color-scheme: dark)', color: '#0b120f' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={jakarta.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="h-dvh overflow-hidden bg-page antialiased">{children}</body>
    </html>
  );
}
