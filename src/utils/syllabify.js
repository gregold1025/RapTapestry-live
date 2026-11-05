// src/utils/syllabify.js
// Syllables as phone clusters (ported from the Line Staff prototype).
// Greg's rule (2026-10-19): consonants before a vowel belong to that vowel's
// syllable; the last syllable also takes what follows. Between two vowels the
// consonants handed to the next syllable must form a cluster English can start
// a word with (the maximal onset principle); the rest stays as the coda of the
// syllable before. So "inspiration" is ihn-sper-ey-shahn and "after" is aef-ter.
const VOWEL_RE = /^(AA|AE|AH|AO|AW|AY|EH|ER|EY|IH|IY|OW|OY|UH|UW)/;
const ONSETS = new Set(["P","B","T","D","K","G","CH","JH","F","V","TH","DH","S","Z","SH","ZH","HH","M","N","L","R","W","Y",
  "P R","P L","P Y","B R","B L","B Y","T R","T W","T Y","D R","D W","D Y","K R","K L","K W","K Y","G R","G L","G W","G Y",
  "F R","F L","F Y","V Y","TH R","TH W","TH Y","S P","S T","S K","S M","S N","S L","S W","S F","S Y","SH R","SH M","SH N","SH L","SH W",
  "HH Y","HH W","M Y","N Y","L Y","S P R","S P L","S P Y","S T R","S T Y","S K R","S K L","S K W","S K Y"]);

export const bare = (p) => String(p).replace(/\d/g, "");

/** ph: [{ p, start?, end? }] -> [{ phones, v }] with v = index of the vowel inside the syllable (-1: none). */
export function syllabify(ph) {
  const vi = ph.map((x, i) => (VOWEL_RE.test(x.p) ? i : -1)).filter((i) => i >= 0);
  if (!vi.length) return [{ phones: ph, v: -1 }];
  const out = [];
  let start = 0;
  for (let n = 0; n < vi.length; n++) {
    let end = ph.length;
    if (n < vi.length - 1) {
      const cons = ph.slice(vi[n] + 1, vi[n + 1]).map((x) => bare(x.p));
      let k = cons.length;
      while (k > 0 && !ONSETS.has(cons.slice(cons.length - k).join(" "))) k--;
      end = vi[n + 1] - k;
    }
    out.push({ phones: ph.slice(start, end), v: vi[n] - start });
    start = end;
  }
  return out;
}
