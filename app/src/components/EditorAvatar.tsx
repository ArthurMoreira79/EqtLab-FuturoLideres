"use client";

import { useMemo, useState } from "react";
import { Button, Modal, ToggleButton } from "@heroui/react";
import { Check, Save } from "lucide-react";
import { AvatarEmblema } from "@/components/AvatarEmblema";
import { BOTAO_3D, BOTAO_3D_CLARO } from "@/components/jogo";
import { Aviso, cx } from "@/components/ui";
import {
  BARBAS,
  BOCAS,
  CABELOS,
  CORES_CABELO,
  CORES_FUNDO,
  CORES_PELE,
  CORES_ROUPA,
  GENEROS,
  OCULOS,
  OLHOS,
  ROUPAS,
  SOBRANCELHAS,
  trocarGenero,
  type AvatarConfig,
} from "@/lib/avatar";
import { avatarDataUri } from "@/lib/avatar-svg";

type Chave = Exclude<keyof AvatarConfig, "genero">;

interface Categoria {
  chave: Chave;
  rotulo: string;
  /** "peca" mostra miniaturas do avatar; "cor" mostra bolinhas de cor. */
  tipo: "peca" | "cor";
  opcoes: (a: AvatarConfig) => readonly string[];
  visivel?: (a: AvatarConfig) => boolean;
}

const CATEGORIAS: Categoria[] = [
  { chave: "cabelo", rotulo: "Cabelo", tipo: "peca", opcoes: (a) => CABELOS[a.genero] },
  { chave: "corDoCabelo", rotulo: "Cor do cabelo", tipo: "cor", opcoes: () => CORES_CABELO },
  { chave: "pele", rotulo: "Pele", tipo: "cor", opcoes: () => CORES_PELE },
  { chave: "olhos", rotulo: "Olhos", tipo: "peca", opcoes: () => OLHOS },
  { chave: "sobrancelhas", rotulo: "Sobrancelhas", tipo: "peca", opcoes: () => SOBRANCELHAS },
  { chave: "boca", rotulo: "Boca", tipo: "peca", opcoes: () => BOCAS },
  { chave: "oculos", rotulo: "Óculos", tipo: "peca", opcoes: () => OCULOS },
  { chave: "barba", rotulo: "Barba", tipo: "peca", opcoes: () => BARBAS, visivel: (a) => a.genero === "masculino" },
  { chave: "roupa", rotulo: "Roupa", tipo: "peca", opcoes: (a) => ROUPAS[a.genero] },
  { chave: "corDaRoupa", rotulo: "Cor da roupa", tipo: "cor", opcoes: () => CORES_ROUPA },
  { chave: "fundo", rotulo: "Fundo", tipo: "cor", opcoes: () => CORES_FUNDO },
];

const ROTULO_GENERO = { feminino: "Feminino", masculino: "Masculino" } as const;

/** Conteúdo do editor. Vive dentro do modal, então cada vez que abre começa do avatar salvo. */
function Conteudo({
  inicial,
  aoSalvar,
  fechar,
}: {
  inicial: AvatarConfig;
  aoSalvar: (a: AvatarConfig) => Promise<void>;
  fechar: () => void;
}) {
  const [cfg, setCfg] = useState<AvatarConfig>(inicial);
  const [chave, setChave] = useState<Chave>("cabelo");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const categorias = CATEGORIAS.filter((c) => c.visivel?.(cfg) ?? true);
  const categoria = categorias.find((c) => c.chave === chave) ?? categorias[0];
  const opcoes = categoria.opcoes(cfg);

  // Miniaturas: o avatar atual com cada opção da categoria aplicada.
  const miniaturas = useMemo(
    () =>
      categoria.tipo === "peca"
        ? Object.fromEntries(opcoes.map((o) => [o, avatarDataUri({ ...cfg, [categoria.chave]: o } as AvatarConfig, 112)]))
        : {},
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [categoria.chave, cfg],
  );

  async function salvar() {
    setSalvando(true);
    setErro(null);
    try {
      await aoSalvar(cfg);
      fechar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível salvar. Tente de novo.");
      setSalvando(false);
    }
  }

  return (
    <>
      <Modal.Header>
        <Modal.Heading className="text-xl font-extrabold">Editar avatar</Modal.Heading>
      </Modal.Header>
      <Modal.Body className="grid gap-5 md:grid-cols-[220px_1fr]">
        {/* Prévia + gênero */}
        <div className="flex flex-col items-center gap-4">
          <AvatarEmblema avatar={cfg} tamanho={190} className="rounded-3xl border-2 border-line" />
          <div className="flex w-full gap-2" role="group" aria-label="Gênero do avatar">
            {GENEROS.map((g) => (
              <ToggleButton
                key={g}
                isSelected={cfg.genero === g}
                onChange={() => setCfg((a) => trocarGenero(a, g))}
                className="h-11 min-h-11 flex-1 rounded-xl border-2 border-line bg-card text-sm font-extrabold uppercase tracking-wide data-[selected=true]:border-[#1b8fe6] data-[selected=true]:bg-[#ddf1ff] data-[selected=true]:text-[#1470b8] dark:data-[selected=true]:border-ciano dark:data-[selected=true]:bg-selected dark:data-[selected=true]:text-ciano"
              >
                {ROTULO_GENERO[g]}
              </ToggleButton>
            ))}
          </div>
        </div>

        {/* Categorias e opções */}
        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Partes do avatar">
            {categorias.map((c) => (
              <button
                key={c.chave}
                type="button"
                role="tab"
                aria-selected={c.chave === categoria.chave}
                onClick={() => setChave(c.chave)}
                className={cx(
                  "shrink-0 rounded-full border-2 px-3.5 py-1.5 text-sm font-extrabold transition-colors",
                  c.chave === categoria.chave
                    ? "border-[#1b8fe6] bg-[#ddf1ff] text-[#1470b8] dark:border-ciano dark:bg-selected dark:text-ciano"
                    : "border-line text-muted hover:bg-sunken",
                )}
              >
                {c.rotulo}
              </button>
            ))}
          </div>

          <ul
            className={cx(
              "grid max-h-[320px] gap-2.5 overflow-y-auto p-1",
              categoria.tipo === "peca" ? "grid-cols-3 sm:grid-cols-4" : "grid-cols-5 sm:grid-cols-7",
            )}
            aria-label={categoria.rotulo}
          >
            {opcoes.map((o) => {
              const marcado = cfg[categoria.chave] === o;
              return (
                <li key={o}>
                  <button
                    type="button"
                    aria-pressed={marcado}
                    aria-label={`${categoria.rotulo}: opção ${opcoes.indexOf(o) + 1}`}
                    onClick={() => setCfg((a) => ({ ...a, [categoria.chave]: o }) as AvatarConfig)}
                    className={cx(
                      "relative block w-full overflow-hidden border-2 transition-transform hover:scale-105",
                      categoria.tipo === "peca" ? "aspect-square rounded-2xl" : "aspect-square rounded-full",
                      marcado ? "border-[#1b8fe6] ring-2 ring-[#1b8fe6]/40 dark:border-ciano dark:ring-ciano/40" : "border-line",
                    )}
                    style={categoria.tipo === "cor" ? { background: `#${o}` } : undefined}
                  >
                    {categoria.tipo === "peca" && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={miniaturas[o]} alt="" className="size-full" draggable={false} />
                    )}
                    {marcado && (
                      <span className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-[#1b8fe6] text-white">
                        <Check aria-hidden className="size-3.5" strokeWidth={4} />
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </Modal.Body>
      <Modal.Footer className="flex flex-col gap-3">
        {erro && <Aviso>{erro}</Aviso>}
        <div className="flex gap-3">
          <Button slot="close" variant="secondary" isDisabled={salvando} className={cx(BOTAO_3D_CLARO, "h-12 min-h-12 flex-1 px-4 text-sm sm:w-auto")}>
            Cancelar
          </Button>
          <Button variant="primary" isDisabled={salvando} onPress={salvar} className={cx(BOTAO_3D, "h-12 min-h-12 flex-1 gap-2 px-4 text-sm sm:w-auto")}>
            <Save aria-hidden className="size-4" /> {salvando ? "Salvando…" : "Salvar avatar"}
          </Button>
        </div>
      </Modal.Footer>
    </>
  );
}

export function EditorAvatar({
  aberto,
  aoMudar,
  avatar,
  aoSalvar,
}: {
  aberto: boolean;
  aoMudar: (aberto: boolean) => void;
  avatar: AvatarConfig;
  aoSalvar: (a: AvatarConfig) => Promise<void>;
}) {
  return (
    <Modal isOpen={aberto} onOpenChange={aoMudar}>
      <Modal.Backdrop>
        <Modal.Container size="lg" scroll="inside">
          <Modal.Dialog className="sm:max-w-3xl">
            {({ close }) => <Conteudo inicial={avatar} aoSalvar={aoSalvar} fechar={close} />}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
