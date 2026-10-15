import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";
import { Carregando } from "@/components/ui";

// As telas internas dependem dos dados do usuário no navegador (localStorage) até o back-end existir,
// então a navegação para elas pode esperar o carregamento.
export const instant = false;

export default function LayoutApp({ children }: LayoutProps<"/">) {
  // O shell lê a URL atual (menu ativo, rotas dinâmicas), que só existe em tempo de execução.
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-xl p-8">
          <Carregando />
        </div>
      }
    >
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}
