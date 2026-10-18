"use client";
import { useEffect, useState } from "react";
import { Play, Video } from "lucide-react";
import { Aviso } from "@/components/ui";
import conteudo from "@/lib/conteudo/video-modulo-feedback.json";

export function VideoFeedback() {
  const [url, setUrl] = useState<string | null>(null);
  const [erro, setErro] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/clara/modulo-feedback", { signal: controller.signal }).then((r) => r.ok ? r.json() : Promise.reject())
      .then((r) => setUrl(r.videoUrl)).catch(() => {});
    return () => controller.abort();
  }, []);
  return <section aria-labelledby="video-feedback-titulo" className="overflow-hidden rounded-3xl border border-line bg-card">
    <div className="flex items-center gap-3 p-4 sm:p-5"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-tint-cyan text-tint-cyan-ink"><Video aria-hidden className="size-5" /></span><div><p className="text-xs font-bold uppercase tracking-wider text-link">Assista com a Clara</p><h2 id="video-feedback-titulo" className="font-extrabold">Feedback sem drama, em cerca de 1 minuto</h2></div></div>
    {url ? <video controls playsInline preload="metadata" src={url} poster="/clara/boas-vindas-cenario.png" aria-label="Aula da Clara sobre feedback e o modelo SCI"
      onError={() => setErro(true)} className="aspect-video w-full bg-sunken object-contain">
      <track kind="captions" src="/clara/modulo-feedback.vtt" srcLang="pt-BR" label="Português" default />
    </video> : <p className="flex items-center gap-2 px-5 pb-5 text-sm text-muted"><Play aria-hidden className="size-4" /> A aula em vídeo está sendo preparada. Você já pode começar pelas atividades abaixo.</p>}
    {erro && <div className="p-4"><Aviso>O vídeo não carregou. Você pode acompanhar pela transcrição e seguir as atividades.</Aviso></div>}
    <details className="px-5 py-4 text-sm"><summary className="cursor-pointer font-bold text-link">Prefere ler? Ver transcrição</summary><div className="mt-3 space-y-2 leading-relaxed text-muted">{conteudo.trechos.map((t) => <p key={t}>{t}</p>)}</div></details>
  </section>;
}
