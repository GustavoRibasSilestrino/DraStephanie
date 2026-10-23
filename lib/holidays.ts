import { addDays } from "./datetime";

/** Domingo de Páscoa (algoritmo de Meeus/Jones/Butcher). */
function easter(year: number): string {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const FIXED: Record<string, string> = {
  "01-01": "Confraternização Universal",
  "04-21": "Tiradentes",
  "05-01": "Dia do Trabalho",
  "09-07": "Independência do Brasil",
  "10-12": "Nossa Senhora Aparecida",
  "11-02": "Finados",
  "11-15": "Proclamação da República",
  "11-20": "Consciência Negra",
  "12-25": "Natal",
};

const cache = new Map<number, Map<string, string>>();

/** Feriados nacionais (e Carnaval/Corpus Christi) de um ano: data → nome. */
export function holidaysOf(year: number): Map<string, string> {
  const hit = cache.get(year);
  if (hit) return hit;
  const map = new Map<string, string>();
  for (const [md, name] of Object.entries(FIXED)) map.set(`${year}-${md}`, name);
  const e = easter(year);
  map.set(addDays(e, -48), "Carnaval");
  map.set(addDays(e, -47), "Carnaval");
  map.set(addDays(e, -2), "Sexta-feira Santa");
  map.set(addDays(e, 60), "Corpus Christi");
  cache.set(year, map);
  return map;
}

export function holidayName(date: string): string | null {
  return holidaysOf(Number(date.slice(0, 4))).get(date) ?? null;
}
