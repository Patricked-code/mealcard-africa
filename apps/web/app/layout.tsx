import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'MealCard Africa', description: 'Plateforme B2B de gestion digitale des avantages repas en Afrique.' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="fr"><body>{children}</body></html>;
}
