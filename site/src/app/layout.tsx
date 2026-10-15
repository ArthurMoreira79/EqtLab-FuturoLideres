import type { Metadata } from "next";
import { Providers } from "@/components/Providers";
// Fontes empacotadas no projeto (sem download do Google Fonts durante o build).
import "@fontsource/figtree/400.css";
import "@fontsource/figtree/500.css";
import "@fontsource/figtree/600.css";
import "@fontsource/figtree/700.css";
import "@fontsource/saira/700-italic.css";
import "@fontsource/saira/800-italic.css";
import "./globals.css";

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
      className="h-full antialiased"
    >
      <body className="min-h-full font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
