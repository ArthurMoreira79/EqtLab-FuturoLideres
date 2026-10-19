"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Crown, Hourglass } from "lucide-react";
import { LobbySala } from "@/components/salas/LobbySala";
import { PerguntaSala } from "@/components/salas/PerguntaSala";
import { PodioSala } from "@/components/salas/PodioSala";
import { Aviso, Carregando, botao } from "@/components/ui";
import { useEstado } from "@/lib/estado";
import { salasApi, useSalaAoVivo } from "@/lib/salas-cliente";

function Preparando({ texto }: { texto: string }) {
  return (
    <div role="status" className="mx-auto flex max-w-md animate-pop flex-col items-center gap-3 py-16 text-center">
      <Hourglass aria-hidden className="size-12 animate-girar text-primary" />
      <p className="text-xl font-extrabold">{texto}</p>
    </div>
  );
}

export default function Sala() {
  const { codigo } = useParams<{ codigo: string }>();
  const estado = useEstado();
  const valido = /^\d{6}$/.test(codigo);
  const euId = estado?.usuarioId;

  const [entrou, setEntrou] = useState(false);
  const [erroEntrada, setErroEntrada] = useState<string | null>(null);
  const [escolhas, setEscolhas] = useState<Record<number, number>>({});
  const [enviando, setEnviando] = useState(false);
  const [erroResposta, setErroResposta] = useState<string | null>(null);
  const [iniciando, setIniciando] = useState(false);

  useEffect(() => {
    if (!valido || !euId) return;
    let ativo = true;
    salasApi
      .entrar(codigo)
      .then(() => ativo && setEntrou(true))
      .catch((e: Error) => ativo && setErroEntrada(e.message));
    return () => {
      ativo = false;
    };
  }, [codigo, valido, euId]);

  const { dados, erro, agora, etapa, desatualizado, atualizar } = useSalaAoVivo(codigo, entrou);

  async function responder(alternativa: number) {
    if (!etapa) return;
    const indice = etapa.indice;
    setEscolhas((e) => ({ ...e, [indice]: alternativa }));
    setEnviando(true);
    setErroResposta(null);
    try {
      await salasApi.responder(codigo, alternativa);
      void atualizar();
    } catch (e) {
      setEscolhas((antes) => {
        const resto = { ...antes };
        delete resto[indice];
        return resto;
      });
      setErroResposta((e as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  async function iniciar() {
    setIniciando(true);
    try {
      await salasApi.iniciar(codigo);
      await atualizar();
    } finally {
      setIniciando(false);
    }
  }

  const voltar = (
    <Link href="/comunidade" className="inline-flex items-center gap-1.5 self-start text-sm font-semibold text-link hover:underline">
      <ArrowLeft aria-hidden className="size-4" /> Comunidade
    </Link>
  );

  if (!estado) return null;

  if (!valido || !euId || erroEntrada || erro?.fatal) {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-5">
        {voltar}
        <Aviso>
          {!valido
            ? "Esse código não é válido: ele tem 6 dígitos."
            : !euId
              ? "Entre na sua conta para participar das salas."
              : (erroEntrada ?? erro?.mensagem)}
        </Aviso>
        <Link href="/comunidade" className={`${botao.primario} self-start`}>
          Voltar para a comunidade
        </Link>
      </div>
    );
  }

  if (!dados || !etapa) {
    return (
      <div className="mx-auto max-w-xl">
        <Carregando mensagem="Entrando na sala…" />
      </div>
    );
  }

  const escolhida = (!desatualizado ? dados.minhaResposta?.alternativa : undefined) ?? escolhas[etapa.indice] ?? null;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        {voltar}
        <div className="flex items-center gap-2.5">
          {dados.ehAnfitriao && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fff8dc] px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-[#8a6100] dark:bg-tint-purple dark:text-ciano">
              <Crown aria-hidden className="size-3.5" /> Anfitrião
            </span>
          )}
          <span className="rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-white" style={{ background: dados.area.cor }}>
            {dados.area.nome}
          </span>
          <h1 className="text-lg font-extrabold">{dados.titulo}</h1>
        </div>
      </header>

      {erro && !erro.fatal && <Aviso tipo="info">Reconectando à sala… {erro.mensagem}</Aviso>}

      {etapa.fase === "lobby" && <LobbySala dados={dados} agora={agora} euId={euId} iniciando={iniciando} aoIniciar={iniciar} />}

      {(etapa.fase === "pergunta" || etapa.fase === "revelacao") &&
        (desatualizado || !dados.pergunta ? (
          <Preparando texto={etapa.fase === "pergunta" ? "Preparando a pergunta…" : "Conferindo as respostas…"} />
        ) : (
          <PerguntaSala
            dados={dados}
            etapa={etapa}
            agora={agora}
            escolhida={escolhida}
            enviando={enviando}
            erro={erroResposta}
            aoResponder={responder}
            euId={euId}
          />
        ))}

      {etapa.fase === "encerrada" &&
        (dados.fase === "encerrada" && dados.ranking ? <PodioSala dados={dados} euId={euId} /> : <Preparando texto="Calculando o resultado…" />)}
    </div>
  );
}
