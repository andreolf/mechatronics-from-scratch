// Course data helpers: curriculum outline + which lessons are fully written.
import data from '../../curriculum/curriculum.json';
import index from './generated/index.json';

const lessonLoaders = import.meta.glob('./generated/lessons/*.json');
const quizLoaders = import.meta.glob('./generated/quiz-p*.json');
const cache = new Map();
const load = async (loaders, key) => { if (cache.has(key)) return cache.get(key); if (!loaders[key]) return null; const m = await loaders[key](); const v = m.default || m; cache.set(key, v); return v; };
export const course = data;
export const full = index;
export const phases = data.phases;
export const allLessons = data.phases.flatMap((p) => p.lessons.map((l) => ({ ...l, phase: p })));
export const byId = new Map(allLessons.map((l) => [l.id, l]));
export const phaseById = new Map(data.phases.map((p) => [p.id, p]));
export const isFull = (id) => Object.prototype.hasOwnProperty.call(index, id);
export const phaseFullCount = (p) => p.lessons.filter((l) => isFull(l.id)).length;
export const phaseComplete = (p) => phaseFullCount(p) === p.lessons.length;
export const loadQuizBank = async (pid) => (await load(quizLoaders, `./generated/quiz-${pid}.json`)) || {};
export async function loadLesson(id) { return isFull(id) ? load(lessonLoaders, `./generated/lessons/${id}.json`) : null; }
export function neighbours(id) {
  const i = allLessons.findIndex((l) => l.id === id);
  return { prev: allLessons[i - 1] || null, next: allLessons[i + 1] || null, index: i };
}
