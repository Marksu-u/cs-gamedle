import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Saira_Condensed } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import "../globals.css";
import "../cs2-theme.css";
import { locales, routing } from "@/i18n/routing";
import { buildMetadata } from "@/lib/seo";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Display face of the CS2 theme (condensed italic headings, see .cs2-display).
const sairaCondensed = Saira_Condensed({
  variable: "--font-saira-condensed",
  weight: ["600", "700", "800"],
  subsets: ["latin"],
});

// Pre-renders one static tree per locale instead of rendering on demand.
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata("/", locale);
}

// Matches the mobile address bar to the dark theme.
export const viewport: Viewport = {
  themeColor: "#0e0f12",
  colorScheme: "dark",
};

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  // A bogus segment such as /de/wordle reaches here as a locale. Without this
  // guard it would render the default locale under a wrong URL, which search
  // engines would then index as a duplicate.
  if (!hasLocale(routing.locales, locale)) notFound();

  // Required for static rendering: tells next-intl which locale this tree is
  // being generated for, since there is no request to infer it from.
  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${sairaCondensed.variable} h-full antialiased`}
    >
      {/* theme-cs2 forces the game's dark theme regardless of the system setting. */}
      <body className="theme-cs2 bg-background text-foreground flex min-h-full flex-col font-sans">
        <NextIntlClientProvider>
          {children}
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
