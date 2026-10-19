import Image from "next/image";

export function LogoEQT({ largura = 132 }: { largura?: number }) {
  return (
    <Image
      src="/eqt-lab-logo.png"
      alt="EQT Lab by Equatorial"
      width={364}
      height={90}
      style={{ width: largura, height: "auto" }}
      priority
    />
  );
}

export function NomeProduto({ className = "text-2xl" }: { className?: string }) {
  return <span className={`font-display font-extrabold italic leading-none ${className}`}>Conecta Líderes</span>;
}
