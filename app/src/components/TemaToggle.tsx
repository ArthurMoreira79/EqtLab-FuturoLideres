"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { cx } from "./ui";

const montado = () => true;

export function TemaToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const noCliente = useSyncExternalStore(() => () => {}, montado, () => false);
  const escuro = noCliente && resolvedTheme === "dark";
  return (
    <button
      type="button"
      onClick={() => setTheme(escuro ? "light" : "dark")}
      aria-label={escuro ? "Usar tema claro" : "Usar tema escuro"}
      className={cx("inline-flex size-11 items-center justify-center rounded-xl", className)}
    >
      {escuro ? <Sun className="size-5" aria-hidden /> : <Moon className="size-5" aria-hidden />}
    </button>
  );
}
