"use client";

import { useRouter } from "next/navigation";
import { AlertDialog, Button } from "@heroui/react";
import { LogOut } from "lucide-react";
import { sairDaConta } from "@/lib/auth/cliente";
import { BOTAO_3D, BOTAO_3D_CLARO } from "./jogo";
import { cx } from "./ui";

/** Botão “Sair” (azul, estilo jogo) com confirmação. `className` ajusta tamanho/largura de cada lugar. */
export function BotaoSair({ className }: { className?: string }) {
  const router = useRouter();

  return (
    <AlertDialog>
      <Button variant="primary" className={cx("gap-2", className)}>
        <LogOut aria-hidden className="size-4" />
        Sair
      </Button>
      <AlertDialog.Backdrop>
        <AlertDialog.Container>
          <AlertDialog.Dialog className="sm:max-w-md">
            <AlertDialog.CloseTrigger />
            <AlertDialog.Header>
              <AlertDialog.Icon status="warning" />
              <AlertDialog.Heading>Sair da conta?</AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body>
              <p>
                Sua conta e seu diagnóstico continuam salvos. O progresso de XP e missões que ainda fica só neste
                navegador será apagado ao sair.
              </p>
            </AlertDialog.Body>
            <AlertDialog.Footer className="flex gap-3">
              <Button slot="close" variant="secondary" className={cx(BOTAO_3D_CLARO, "h-12 min-h-12 flex-1 px-4 text-sm sm:w-auto")}>
                Ficar
              </Button>
              <Button
                slot="close"
                variant="primary"
                className={cx(BOTAO_3D, "h-12 min-h-12 flex-1 gap-2 px-4 text-sm sm:w-auto")}
                onPress={async () => {
                  await sairDaConta();
                  router.push("/");
                }}
              >
                <LogOut aria-hidden className="size-4" />
                Sair
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  );
}
