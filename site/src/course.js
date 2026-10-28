// Course data helpers: the curriculum and the compiled lessons.
import data from '../../curriculum/curriculum.json';
import index from './generated/index.json';

const lessonLoaders = import.meta.glob('./generated/lessons/*.json');
const quizLoaders = import.meta.glob('./generated/quiz-p*.json');
const cache = new Map();
const load = async (loaders, key) => { if (cache.has(key)) return cache.get(key); if (!loaders[key]) return null; let m; for (let k = 1; ; k++) { try { m = await loaders[key](); break; } catch (e) { if (k >= 3) throw e; await new Promise((r) => setTimeout(r, 400 * k)); } } const v = m.default || m; cache.set(key, v); return v; };
export const course = data;
export const full = index;
export const phases = data.phases;
// optional build-along tracks (Phase 21) have their own test and certificate but do not gate the full-course certificate
export const corePhases = data.phases.filter((p) => !p.track);
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
