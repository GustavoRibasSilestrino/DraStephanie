import "./splash-types";

/** Duração da abertura animada até a cortina começar a subir (ver Splash.tsx). */
export const SPLASH_SECONDS = 2.05;

/**
 * Quanto o herói deve esperar antes de animar a entrada: o tempo da abertura na
 * primeira visita da sessão, ou zero se ela foi pulada (visita repetida, "reduzir
 * movimento", ou já terminou).
 *
 * É só um número usado nas transições (não vai para o HTML), então não gera diferença
 * entre servidor e navegador. Calculado uma vez, na montagem — assim as animações do
 * herói não dependem de nenhuma mudança de estado depois do carregamento.
 */
export function heroBaseDelay(): number {
  if (typeof window === "undefined") return 0;
  const skip =
    document.documentElement.getAttribute("data-splash") === "skip" ||
    window.__splashDone === true ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return skip ? 0 : SPLASH_SECONDS;
}
