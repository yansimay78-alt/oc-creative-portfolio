// Persist answer IDs only. Questions and inferred themes never enter browser storage.
export function createAnswerDeck(answers, storage, random = Math.random, tags = []) {
  if (!Array.isArray(answers) || answers.length < 2 || new Set(answers).size !== answers.length) throw new Error('Answer library must contain unique entries.');
  if (storage === undefined) { try { storage = globalThis.localStorage; } catch { storage = null; } }
  const fingerprint = answers.reduce((h, s) => { for (const char of s) h = Math.imul(h ^ char.charCodeAt(0), 16777619); return h >>> 0; }, 2166136261).toString(36);
  const key = 'oracle-answer-deck-v2-' + fingerprint;
  let remaining = [], last = null, cycle = 1;
  try {
    const saved = JSON.parse(storage?.getItem(key) || 'null');
    if (saved && Array.isArray(saved.remaining) && saved.remaining.every(n => Number.isInteger(n) && n >= 0 && n < answers.length) && new Set(saved.remaining).size === saved.remaining.length) {
      remaining = saved.remaining;
      last = Number.isInteger(saved.last) && saved.last >= 0 && saved.last < answers.length ? saved.last : null;
      cycle = Number.isInteger(saved.cycle) && saved.cycle > 0 ? saved.cycle : 1;
    }
  } catch {}
  function shuffle() {
    remaining = answers.map((_, i) => i);
    for (let i = remaining.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
    }
    if (remaining.at(-1) === last) [remaining[0], remaining[remaining.length - 1]] = [remaining[remaining.length - 1], remaining[0]];
  }
  return {
    draw(themes = []) {
      if (!remaining.length) { if (last !== null) cycle++; shuffle(); }
      let position = remaining.length - 1;
      if (tags.length === answers.length) {
        // Prioritize the response form, then topic, then open-ended entries.
        // Pools share remaining IDs, preserving a complete no-repeat cycle.
        const eligible = remaining.filter(index => index !== last);
        const primary = eligible.filter(index => tags[index].includes(themes[0]));
        const secondary = eligible.filter(index => themes.slice(1).some(theme => tags[index].includes(theme)));
        const general = eligible.filter(index => tags[index].includes('general'));
        const preferred = primary.length ? primary : secondary;
        const pool = preferred.length && (!general.length || random() < .8) ? preferred : general.length ? general : eligible;
        if (pool.length) position = remaining.indexOf(pool.at(-1));
      }
      const [index] = remaining.splice(position, 1);
      last = index;
      try { storage?.setItem(key, JSON.stringify({ remaining, last, cycle })); } catch {}
      return { index, text: answers[index], total: answers.length, drawn: answers.length - remaining.length, cycle };
    },
    get total() { return answers.length; }
  };
}
