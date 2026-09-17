const STORAGE_KEY = 'inkwell:identity';


export const PEN_COLORS = [
  'var(--pen-1)',
  'var(--pen-2)',
  'var(--pen-3)',
  'var(--pen-4)',
  'var(--pen-5)',
  'var(--pen-6)',
];

const ADJECTIVES = ['Тихий', 'Быстрый', 'Внимательный', 'Ясный', 'Спокойный', 'Точный'];
const NOUNS = ['Автор', 'Редактор', 'Гость', 'Соавтор', 'Читатель'];

function randomName() {
  const a = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const n = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(Math.random() * 90 + 10);
  return `${a} ${n} №${num}`;
}

function resolvedColor(colorToken) {
  if (typeof window === 'undefined') return '#2f5d62';
  const varName = colorToken.match(/--[\w-]+/)?.[0];
  if (!varName) return colorToken;
  const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return value || colorToken;
}

export function getIdentity() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.name && parsed.color) return parsed;
    }
  } catch { }
  const identity = {
    id: crypto.randomUUID(),
    name: randomName(),
    color: resolvedColor(PEN_COLORS[Math.floor(Math.random() * PEN_COLORS.length)]),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
  return identity;
}

export function setIdentityName(name) {
  const identity = getIdentity();
  identity.name = name || identity.name;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
  return identity;
}
