import { DEMO } from "@/lib/demo";

/**
 * Marca d'água da proposta ("DEV RIBAS") em diagonal sobre todas as páginas, enquanto o
 * site estiver em modo demonstração. Fica por cima de tudo, sem interferir nos cliques,
 * e desaparece sozinha quando NEXT_PUBLIC_DEMO_MODE=false (entrega do site).
 */
const TILE_W = 330;
const TILE_H = 230;

const svg = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${TILE_W}" height="${TILE_H}">` +
    `<text x="${TILE_W / 2}" y="${TILE_H / 2}" text-anchor="middle" dominant-baseline="middle" ` +
    `transform="rotate(-24 ${TILE_W / 2} ${TILE_H / 2})" font-family="Arial, Helvetica, sans-serif" ` +
    `font-size="30" font-weight="800" letter-spacing="9" fill="#8a8a8a" fill-opacity="0.2" ` +
    `stroke="#ffffff" stroke-opacity="0.12" stroke-width="0.6">DEV RIBAS</text></svg>`,
);

export default function Watermark() {
  if (!DEMO) return null;
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[9999] select-none"
      style={{
        backgroundImage: `url("data:image/svg+xml,${svg}")`,
        backgroundSize: `${TILE_W}px ${TILE_H}px`,
      }}
    />
  );
}
