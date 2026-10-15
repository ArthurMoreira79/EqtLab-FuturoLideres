import type { Metadata } from "next";
import { Figtree, Saira } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const saira = Saira({
  variable: "--font-saira",
  subsets: ["latin"],
  style: ["italic"],
  weight: ["700", "800"],
});

export const metadata: Metadata = {
  title: "Futuro Líderes · EQT Lab",
  description:
    "Plataforma de desenvolvimento para líderes recém-promovidos: missões diárias, trilha de aprendizado e feedback com IA.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${figtree.variable} ${saira.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
