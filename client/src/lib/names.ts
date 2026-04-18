export function normalizeName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, " ");
}

const TR_FOLD: { [k: string]: string } = {
  ğ: "g", ş: "s", ı: "i", İ: "i", ö: "o", ü: "u", ç: "c",
};

export function foldTurkish(s: string): string {
  return s.replace(/[ğşıİöüç]/g, (c) => TR_FOLD[c] ?? c);
}

export function canonicalForFuzzy(name: string): string {
  return foldTurkish(normalizeName(name));
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const prev = new Array(b.length + 1);
  const curr = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
  }
  return prev[b.length];
}

export function similarEnough(a: string, b: string): boolean {
  if (a === b) return true;
  const fa = foldTurkish(a);
  const fb = foldTurkish(b);
  if (fa === fb) return true;
  const [shorter, longer] = fa.length <= fb.length ? [fa, fb] : [fb, fa];
  if (longer.startsWith(shorter + " ") || longer.startsWith(shorter + ".")) return true;
  if (shorter.length >= 4) {
    const dist = levenshtein(fa, fb);
    const max = Math.max(fa.length, fb.length);
    if (dist <= 1) return true;
    if (max >= 8 && dist <= 2) return true;
  }
  return false;
}
