import { ImageResponse } from "next/og";
import { site } from "@/lib/site";

export const alt = `${site.name} — Dentista em ${site.city}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Imagem exibida quando o link é compartilhado (WhatsApp, Instagram, etc.). */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 90px",
          background: "radial-gradient(circle at 78% 18%, #2a3374 0%, #0d1336 55%, #080c26 100%)",
          color: "#fefbf5",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18, color: "#d7b46f", fontSize: 26, letterSpacing: 8 }}>
          <svg width="52" height="52" viewBox="0 0 40 40" fill="none" stroke="#d7b46f" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 19C17 10 10 5 4 6C3 13 8 19 17 21" />
            <path d="M20 19C23 10 30 5 36 6C37 13 32 19 23 21" />
            <path d="M19 23C14 22 8 25 8 31C13 33 18 30 19 26" />
            <path d="M21 23C26 22 32 25 32 31C27 33 22 30 21 26" />
            <path d="M20 16V30" />
          </svg>
          CIRURGIÃ-DENTISTA · SOROCABA
        </div>
        <div style={{ marginTop: 34, fontSize: 92, lineHeight: 1.02, fontWeight: 500 }}>Dra. Stephanie</div>
        <div style={{ fontSize: 92, lineHeight: 1.02, fontWeight: 500, color: "#e5cd96", fontStyle: "italic" }}>
          de Oliveira
        </div>
        <div style={{ marginTop: 38, fontSize: 34, color: "#d9d4e8" }}>
          Odontologia que valoriza pessoas.
        </div>
        <div style={{ marginTop: 14, fontSize: 26, color: "#d7b46f", letterSpacing: 3 }}>
          Endodontia · Prótese · Implantes · Clareamento
        </div>
        <div style={{ position: "absolute", right: 90, bottom: 56, fontSize: 24, color: "#9aa0c9" }}>
          {site.cro}
        </div>
      </div>
    ),
    size,
  );
}
