import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Saira_Condensed } from "next/font/google";
import "./globals.css";
import "./cs2-theme.css";
import { PAGES, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Police d'affichage du thème CS2 (titres en italique condensé, cf. .cs2-display).
const sairaCondensed = Saira_Condensed({
  variable: "--font-saira-condensed",
  weight: ["600", "700", "800"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // `metadataBase` rend absolues les URL relatives des balises Open Graph. Sans
  // elle, Next avertit au build et les aperçus de partage restent vides.
  metadataBase: new URL(SITE_URL),
  title: {
    default: PAGES[0].title,
    // Les pages de jeu ne fournissent que leur nom : le suffixe est ajouté ici.
    template: `%s — ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "CS2",
    "Counter-Strike 2",
    "wordle",
    "esport",
    "quiz",
    "jeu quotidien",
  ],
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: SITE_NAME,
    title: PAGES[0].title,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: PAGES[0].title,
    description: SITE_DESCRIPTION,
  },
  // Le jeu se partage par lien : on veut être indexé.
  robots: { index: true, follow: true },
};

// Barre d'adresse assortie au thème sombre sur mobile.
export const viewport: Viewport = {
  themeColor: "#0e0f12",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${sairaCondensed.variable} h-full antialiased`}
    >
      {/* theme-cs2 force le thème sombre du jeu, quel que soit le mode système. */}
      <body className="theme-cs2 bg-background text-foreground flex min-h-full flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
