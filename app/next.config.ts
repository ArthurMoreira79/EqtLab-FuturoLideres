import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // As migrações SQL são lidas em tempo de execução: garante que a pasta vá junto no deploy.
  outputFileTracingIncludes: { "/api/**/*": ["./drizzle/**/*"] },
  partialPrefetching: true,
  experimental: {
    // Enquanto os dados do usuário vivem no navegador, só valida "instant navigation"
    // nas rotas que declararem `export const instant = true`.
    instantInsights: { validationLevel: "manual-warning" },
  },
  turbopack: {
    // O app fica na subpasta site/ do repositório: fixa a raiz aqui para o build
    // (na Vercel) não subir para a raiz do repositório.
    root: __dirname,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
