import fs from "node:fs";
import path from "node:path";
import { site } from "./site";

/**
 * Fotos da Dra. (opcionais — o site funciona sem elas):
 *
 *  - public/images/dra-stephanie.jpg          → foto de perfil (qualquer tamanho).
 *    Aparece em medalhões e cartões, onde fica nítida mesmo sendo pequena.
 *
 *  - public/images/dra-stephanie-retrato.jpg  → retrato em ALTA resolução
 *    (recomendado: vertical, ao menos 900×1100 px). Se existir, o site passa a
 *    usá-lo nas molduras grandes do herói e da seção "Quem sou eu".
 */
const exists = (rel: string) => {
  try {
    return fs.existsSync(path.join(process.cwd(), "public", rel));
  } catch {
    return false;
  }
};

export interface Photos {
  avatar: string | null;
  portrait: string | null;
}

export function getPhotos(): Photos {
  return {
    avatar: exists(site.photoPath) ? site.photoPath : null,
    portrait: exists(site.portraitPath) ? site.portraitPath : null,
  };
}
