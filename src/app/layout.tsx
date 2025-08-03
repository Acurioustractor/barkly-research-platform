import type { Metadata } from "next";
import { Inter, Fira_Code } from "next/font/google";
import "./globals-final.css";
import { ErrorBoundary } from "@/components/error-boundary";
import { AuthProvider } from "@/components/auth/AuthProvider";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const firaCode = Fira_Code({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fira-code",
});

export const metadata: Metadata = {
  title: "Barkly Youth Research Dashboard",
  description: "Community-led research platform showcasing Indigenous youth voices and insights from the Barkly region",
  keywords: ["Indigenous research", "community voices", "youth empowerment", "Barkly region", "UMEL framework"],
  authors: [{ name: "Barkly Research Platform" }],
  metadataBase: new URL('http://localhost:3002'),
  openGraph: {
    title: "Barkly Youth Research Dashboard",
    description: "Community-led research platform showcasing Indigenous youth voices",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${firaCode.variable}`}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ErrorBoundary>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
