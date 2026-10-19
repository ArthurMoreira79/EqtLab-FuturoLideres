"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { BOTAO_3D } from "@/components/jogo";
import { Aviso, Carregando, TituloPagina, botao, cx } from "@/components/ui";
import { mensagemDoErro } from "@/lib/cadastro";
import { AREA_INICIAL } from "@/lib/areas";
import { useAreas } from "@/lib/areas-cliente";
import { useEstado } from "@/lib/estado";
import { CONTAGENS_S, MAX_PERGUNTAS, perguntaNovaSchema, salaNovaSchema, TEMPOS_PERGUNTA_S } from "@/lib/salas/contratos";
import { salasApi, usePapel } from "@/lib/salas-cliente";

interface PerguntaForm {
  enunciado: string;
  alternativas: string[];
  correta: number;
  tempo: number;
}
const novaPergunta = (): PerguntaForm => ({ enunciado: "", alternativas: ["", "", "", ""], correta: 0, tempo: 20 });

const campo = "w-full rounded-xl border-2 border-line bg-card px-4 focus:border-primary";
const LETRAS = ["A", "B", "C", "D"];

export default function Pagina() {
  return (
    <Suspense fallback={<Carregando />}>
      <NovaSala />
    </Suspense>
  );
}

function NovaSala() {
  const estado = useEstado();
  const router = useRouter();
  const papel = usePapel();
  const areas = useAreas();
  const areaDaUrl = useSearchParams().get("area");
  const [areaEscolhida, setAreaEscolhida] = useState<string | null>(null);
  const area = areaEscolhida ?? (areas.some((a) => a.slug === areaDaUrl) ? areaDaUrl! : AREA_INICIAL);

  const [titulo, setTitulo] = useState("");
  const [contagem, setContagem] = useState<number>(60);
  const [perguntas, setPerguntas] = useState<PerguntaForm[]>([novaPergunta()]);
  const [erro, setErro] = useState<string | null>(null);
  const [criando, setCriando] = useState(false);

  if (!estado) return null;

  const voltar = (
    <Link href="/comunidade" className="inline-flex items-center gap-1.5 self-start text-sm font-semibold text-link hover:underline">
      <ArrowLeft aria-hidden className="size-4" /> Comunidade
    </Link>
  );

  if (papel === null) {
    return (
      <div className="mx-auto max-w-xl">
        <Carregando />
      </div>
    );
  }
  if (papel !== "admin") {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-5">
        {voltar}
        <Aviso>Só administradores podem criar salas. Se você tem o código de uma sala, use “Entrar com código” na Comunidade.</Aviso>
      </div>
    );
  }

  const mudar = (i: number, parte: Partial<PerguntaForm>) => setPerguntas((ps) => ps.map((p, j) => (j === i ? { ...p, ...parte } : p)));

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    const dados = {
      titulo,
      area,
      contagemSegundos: contagem,
      perguntas: perguntas.map((p) => ({ enunciado: p.enunciado, alternativas: p.alternativas, correta: p.correta, tempoSegundos: p.tempo })),
    };
    for (const [i, p] of dados.perguntas.entries()) {
      const r = perguntaNovaSchema.safeParse(p);
      if (!r.success) return setErro(`Pergunta ${i + 1}: ${mensagemDoErro(r.error)}`);
    }
    const r = salaNovaSchema.safeParse(dados);
    if (!r.success) return setErro(mensagemDoErro(r.error));

    setCriando(true);
    try {
      const { codigo } = await salasApi.criar(r.data);
      router.push(`/comunidade/sala/${codigo}`);
    } catch (err) {
      setErro((err as Error).message);
      setCriando(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      {voltar}
      <TituloPagina descricao="Monte as perguntas e abra a sala. As pessoas entram com o código de 6 dígitos ou pelo QR code, e o ranking sai no final.">
        Criar sala de jogo
      </TituloPagina>

      <form onSubmit={criar} noValidate className="flex flex-col gap-6">
        <section className="flex flex-col gap-4 rounded-3xl border-2 border-line bg-card p-5 shadow-[0_4px_0_var(--line)]">
          <label className="flex flex-col gap-1.5">
            <span className="font-semibold">Nome da sala</span>
            <input value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={80} placeholder="Ex.: Quiz de feedback" className={cx(campo, "min-h-12")} />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="font-semibold">Área da empresa</span>
              <select value={area} onChange={(e) => setAreaEscolhida(e.target.value)} className={cx(campo, "min-h-12")}>
                {areas.map((a) => (
                  <option key={a.slug} value={a.slug}>
                    {a.nome}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="font-semibold">Contagem regressiva para começar</span>
              <select value={contagem} onChange={(e) => setContagem(Number(e.target.value))} className={cx(campo, "min-h-12")}>
                {CONTAGENS_S.map((c) => (
                  <option key={c.valor} value={c.valor}>
                    {c.rotulo}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="text-sm text-muted">A contagem começa assim que você criar a sala. Dá para começar antes, com “Começar agora”.</p>
        </section>

        {perguntas.map((p, i) => (
          <fieldset key={i} className="flex flex-col gap-4 rounded-3xl border-2 border-line bg-card p-5 shadow-[0_4px_0_var(--line)]">
            <legend className="sr-only">Pergunta {i + 1}</legend>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-extrabold">Pergunta {i + 1}</h2>
              {perguntas.length > 1 && (
                <button
                  type="button"
                  onClick={() => setPerguntas((ps) => ps.filter((_, j) => j !== i))}
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-bold text-[#d92d20] hover:bg-[#fee4e2]"
                >
                  <Trash2 aria-hidden className="size-4" /> Remover
                </button>
              )}
            </div>
            <label className="flex flex-col gap-1.5">
              <span className="font-semibold">Enunciado</span>
              <textarea value={p.enunciado} onChange={(e) => mudar(i, { enunciado: e.target.value })} rows={2} maxLength={240} className={cx(campo, "py-3")} />
            </label>

            <div className="flex flex-col gap-2.5">
              <span className="font-semibold">Alternativas — marque a certa</span>
              {p.alternativas.map((alt, a) => (
                <div key={a} className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name={`correta-${i}`}
                    checked={p.correta === a}
                    onChange={() => mudar(i, { correta: a })}
                    aria-label={`Alternativa ${LETRAS[a]} é a certa`}
                    className="size-5 shrink-0 accent-[#22c55e]"
                  />
                  <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-lg bg-sunken text-sm font-extrabold">
                    {LETRAS[a]}
                  </span>
                  <input
                    value={alt}
                    onChange={(e) => mudar(i, { alternativas: p.alternativas.map((x, k) => (k === a ? e.target.value : x)) })}
                    maxLength={120}
                    aria-label={`Texto da alternativa ${LETRAS[a]}`}
                    className={cx(campo, "min-h-11", p.correta === a && "border-[#22c55e]")}
                  />
                  {p.alternativas.length > 2 && (
                    <button
                      type="button"
                      aria-label={`Remover alternativa ${LETRAS[a]}`}
                      onClick={() =>
                        mudar(i, {
                          alternativas: p.alternativas.filter((_, k) => k !== a),
                          correta: p.correta === a ? 0 : p.correta > a ? p.correta - 1 : p.correta,
                        })
                      }
                      className="grid size-10 shrink-0 place-items-center rounded-xl text-muted hover:bg-sunken"
                    >
                      <Trash2 aria-hidden className="size-4" />
                    </button>
                  )}
                </div>
              ))}
              {p.alternativas.length < 4 && (
                <button type="button" onClick={() => mudar(i, { alternativas: [...p.alternativas, ""] })} className="inline-flex min-h-10 items-center gap-1.5 self-start text-sm font-bold text-link hover:underline">
                  <Plus aria-hidden className="size-4" /> Adicionar alternativa
                </button>
              )}
            </div>

            <label className="flex flex-col gap-1.5 sm:max-w-xs">
              <span className="font-semibold">Tempo para responder</span>
              <select value={p.tempo} onChange={(e) => mudar(i, { tempo: Number(e.target.value) })} className={cx(campo, "min-h-12")}>
                {TEMPOS_PERGUNTA_S.map((t) => (
                  <option key={t} value={t}>
                    {t} segundos
                  </option>
                ))}
              </select>
            </label>
          </fieldset>
        ))}

        {perguntas.length < MAX_PERGUNTAS && (
          <button type="button" onClick={() => setPerguntas((ps) => [...ps, novaPergunta()])} className={cx(botao.secundario, "self-start")}>
            <Plus aria-hidden className="size-5" /> Adicionar pergunta
          </button>
        )}

        {erro && <Aviso>{erro}</Aviso>}
        <button type="submit" disabled={criando} className={`${BOTAO_3D} disabled:opacity-60 sm:self-end`}>
          {criando ? "Criando…" : "Criar sala e abrir o lobby"}
        </button>
      </form>
    </div>
  );
}
