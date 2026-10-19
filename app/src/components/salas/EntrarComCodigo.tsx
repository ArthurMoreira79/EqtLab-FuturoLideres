"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Modal } from "@heroui/react";
import { KeyRound } from "lucide-react";
import { BOTAO_3D } from "@/components/jogo";
import { Aviso } from "@/components/ui";
import { salasApi } from "@/lib/salas-cliente";
import { CampoCodigo } from "./CampoCodigo";

function Conteudo({ fechar }: { fechar: () => void }) {
  const router = useRouter();
  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [entrando, setEntrando] = useState(false);

  async function entrar(valor = codigo) {
    if (valor.length !== 6 || entrando) return;
    setEntrando(true);
    setErro(null);
    try {
      await salasApi.entrar(valor);
      fechar();
      router.push(`/comunidade/sala/${valor}`);
    } catch (e) {
      setErro((e as Error).message);
      setEntrando(false);
    }
  }

  return (
    <>
      <Modal.Header className="items-center text-center">
        <span aria-hidden className="mb-2 grid size-16 animate-pop place-items-center rounded-3xl bg-tint-cyan text-tint-cyan-ink">
          <KeyRound className="size-8" />
        </span>
        <Modal.Heading className="text-2xl font-extrabold">Entrar em uma sala</Modal.Heading>
      </Modal.Header>
      <Modal.Body className="flex flex-col gap-5 pb-2">
        <p className="text-center text-muted">Digite o código de 6 dígitos que aparece na tela do anfitrião, ou aponte a câmera do celular para o QR code.</p>
        <CampoCodigo
          valor={codigo}
          aoMudar={(v) => {
            setCodigo(v);
            setErro(null);
          }}
          aoCompletar={entrar}
          invalido={!!erro}
        />
        {erro && <Aviso>{erro}</Aviso>}
      </Modal.Body>
      <Modal.Footer className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button variant="ghost" onPress={fechar}>
          Cancelar
        </Button>
        <button type="button" onClick={() => entrar()} disabled={codigo.length !== 6 || entrando} className={`${BOTAO_3D} disabled:opacity-50 sm:w-auto`}>
          {entrando ? "Entrando…" : "Entrar na sala"}
        </button>
      </Modal.Footer>
    </>
  );
}

export function EntrarComCodigo({ aberto, aoMudar }: { aberto: boolean; aoMudar: (aberto: boolean) => void }) {
  return (
    <Modal isOpen={aberto} onOpenChange={aoMudar}>
      <Modal.Backdrop>
        <Modal.Container size="md">
          <Modal.Dialog>{({ close }) => <Conteudo fechar={close} />}</Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
