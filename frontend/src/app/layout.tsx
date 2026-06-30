import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth';
import { ThemeProvider } from '@/lib/theme';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'MMIS — Material Management & Inventory System',
  description: 'Enterprise-grade Material Management & Inventory Management System',
};

const themeInitScript = `
(function() {
  try {
    var saved = localStorage.getItem('mmis_theme');
    var theme = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    if (theme === 'dark') document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <AuthProvider>
            {children}
            <Toaster richColors position="top-right" toastOptions={{ duration: 3500 }} />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
