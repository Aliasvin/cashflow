import type { Category } from '../types/finance';

const RULES: Array<{ keywords: string[]; categoryId: string }> = [
  { keywords: ['albert heijn', 'ah to go', 'jumbo', 'lidl', 'aldi', 'plus supermarkt', 'coop', 'dirk', 'hoogvliet', 'poiesz'], categoryId: 'groceries' },
  { keywords: ['netflix', 'spotify', 'disney+', 'disney plus', 'videoland', 'hbo max', 'amazon prime', 'apple.com/bill'], categoryId: 'subscriptions' },
  { keywords: ['shell', 'esso', 'tango', 'bp ', 'totalenergies', 'tinQ', 'tinq', 'circle k'], categoryId: 'transport' },
  { keywords: ['ns ', 'ns.nl', 'arriva', 'qbuzz', '9292', 'ovpay', 'gvb', 'ret ', 'htm '], categoryId: 'public-transport' },
  { keywords: ['thuisbezorgd', 'uber eats', 'mcdonald', 'burger king', 'kfc', 'domino', 'new york pizza'], categoryId: 'dining' },
  { keywords: ['zalando', 'h&m', 'hennes', 'about you', 'we fashion', 'primark', 'uniqlo'], categoryId: 'clothing' },
  { keywords: ['kruidvat', 'etos', 'trekpleister', 'douglas', 'ici paris'], categoryId: 'personal-care' },
  { keywords: ['menzis', 'vgz', 'cz zorg', 'zilverenkruis', 'zilveren kruis', 'unive zorg', 'univé zorg', 'apotheek'], categoryId: 'health' },
  { keywords: ['kpn', 'odido', 'vodafone', 'ziggo', 'simyo', 'ben mobiel'], categoryId: 'phone-internet' },
  { keywords: ['basic-fit', 'basic fit', 'sportcity', 'fit for free'], categoryId: 'sport' },
  { keywords: ['bol.com', 'amazon.nl', 'amazon eu', 'coolblue', 'mediamarkt', 'hema'], categoryId: 'shopping' },
];

const PERSONAL_RULES_KEY = 'cashflow-category-rules';

export type PersonalRule = { keyword: string; categoryId: string };

function normalize(value: string) {
  return value.toLocaleLowerCase('nl-NL').trim();
}

export function getPersonalRules(): PersonalRule[] {
  try {
    const saved = localStorage.getItem(PERSONAL_RULES_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function rememberCategory(description: string, categoryId: string) {
  const keyword = normalize(description);
  if (!keyword || !categoryId) return;

  const rules = getPersonalRules().filter(rule => normalize(rule.keyword) !== keyword);
  rules.unshift({ keyword, categoryId });
  localStorage.setItem(PERSONAL_RULES_KEY, JSON.stringify(rules.slice(0, 250)));
}

export function clearPersonalCategoryRules() {
  localStorage.removeItem(PERSONAL_RULES_KEY);
}

export function deletePersonalRule(keyword: string) {
  const rules = getPersonalRules().filter(rule => normalize(rule.keyword) !== normalize(keyword));
  localStorage.setItem(PERSONAL_RULES_KEY, JSON.stringify(rules));
}

export function suggestCategory(description: string, categories: Category[]) {
  const text = normalize(description);
  if (!text) return undefined;

  const available = new Set(categories.filter(c => c.type === 'expense').map(c => c.id));

  const personal = getPersonalRules().find(rule =>
    available.has(rule.categoryId) &&
    (text.includes(normalize(rule.keyword)) || normalize(rule.keyword).includes(text))
  );
  if (personal) return personal.categoryId;

  const builtIn = RULES.find(rule =>
    available.has(rule.categoryId) &&
    rule.keywords.some(keyword => text.includes(normalize(keyword)))
  );

  return builtIn?.categoryId;
}
