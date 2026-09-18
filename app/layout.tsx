import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/AuthContext';

const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: 'Gerenciador de Turno RCC',
  description: 'Sistema de gestão de turnos, presença, histórico e acompanhamento de militares da Polícia RCC do Habbo Hotel.',
  openGraph: {
    title: 'Gerenciador de Turno RCC',
    description: 'Sistema de gestão de turnos, presença, histórico e acompanhamento de militares da Polícia RCC do Habbo Hotel.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={poppins.className}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-[#09090B] text-[#FAFAFA] min-h-screen antialiased selection:bg-[#27272A] selection:text-white" suppressHydrationWarning>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
