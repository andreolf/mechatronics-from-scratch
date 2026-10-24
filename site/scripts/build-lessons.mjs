// Compile lessons/<phase>/*.md into site/src/generated/<phase>.json (pre-rendered HTML + KaTeX + highlighted code + quiz data).
// Usage: node scripts/build-lessons.mjs   (run from site/)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Marked } from 'marked';
import katex from 'katex';
import * as yaml from 'js-yaml';
import hljs from 'highlight.js/lib/core';
import python from 'highlight.js/lib/languages/python';
import c from 'highlight.js/lib/languages/c';
import bash from 'highlight.js/lib/languages/bash';
import verilog from 'highlight.js/lib/languages/verilog';
import makefile from 'highlight.js/lib/languages/makefile';
hljs.registerLanguage('makefile', makefile);
hljs.registerLanguage('ld', (hl) => ({ name: 'ld', contains: [hl.C_BLOCK_COMMENT_MODE, hl.C_NUMBER_MODE, { className: 'keyword', begin: /\b(ENTRY|MEMORY|SECTIONS|ORIGIN|LENGTH|ALIGN|KEEP|PROVIDE|LOADADDR|ADDR|SIZEOF)\b/ }, { className: 'string', begin: /\.[a-z_]+\b/ }] }));
hljs.registerLanguage('python', python); hljs.registerLanguage('c', c); hljs.registerLanguage('bash', bash); hljs.registerLanguage('verilog', verilog);

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, '../..');
const LES = path.join(ROOT, 'lessons');
const OUT = path.join(ROOT, 'site/src/generated');
const FIG_SRC = path.join(LES, 'figures');
const FIG_OUT = path.join(ROOT, 'site/public/figures');
const CODE_OUT = path.join(LES, 'code');
const curriculum = JSON.parse(fs.readFileSync(path.join(ROOT, 'curriculum/curriculum.json'), 'utf8'));
const known = new Map(curriculum.phases.flatMap((p) => p.lessons.map((l) => [l.id, l])));

const marked = new Marked({ gfm: true, breaks: false });
const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
const slug = (s) => s.toLowerCase().replace(/<[^>]+>/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

function shuffledIdx(n, key) {
  let h = 2166136261; for (const ch of key) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  const r = () => { h = (h + 0x6d2b79f5) >>> 0; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const a = [...Array(n).keys()]; for (let i = n - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a;
}
function tex(src, display) {
  try { return katex.renderToString(src, { displayMode: display, throwOnError: true, strict: 'ignore', output: 'html' }); }
  catch (e) { throw new Error(`KaTeX error in "${src.slice(0, 80)}": ${e.message}`); }
}
// typographic quotes and ellipses in prose only (code and math are already placeholders)
const smart = (t) => t.replace(/\.\.\./g, '…').replace(/(^|[\s(\[{\-—])'/gm, '$1‘').replace(/'/g, '’').replace(/(^|[\s(\[{\-—])"/gm, '$1“').replace(/"/g, '”');
// markdown + math. Inline code and math are protected from the markdown parser.
function md(text, { inline = false } = {}) {
  const store = [];
  const keep = (html) => `@@K${store.push(html) - 1}@@`;
  let t = String(text ?? '');
  t = t.replace(/`([^`\n]+)`/g, (_, code) => keep(`<code>${esc(code)}</code>`));
  t = t.replace(/\$\$([\s\S]+?)\$\$/g, (_, m) => `\n\n@@D${store.push(tex(m.trim(), true)) - 1}@@\n\n`);
  t = t.replace(/(^|[^\\$])\$([^\s$](?:[^$\n]*?[^\s$])?)\$(?!\d)/g, (_, pre, m) => pre + keep(tex(m, false)));
  t = t.replace(/\\\$/g, '$');
  t = smart(t);
  let html = inline ? marked.parseInline(t) : marked.parse(t);
  html = html.replace(/<p>\s*@@D(\d+)@@\s*<\/p>/g, (_, i) => `<div class="math-scroll">${store[+i]}</div>`);
  html = html.replace(/@@D(\d+)@@/g, (_, i) => `<div class="math-scroll">${store[+i]}</div>`);
  html = html.replace(/@@K(\d+)@@/g, (_, i) => store[+i]);
  html = html.replace(/<table>/g, '<div class="table-scroll"><table>').replace(/<\/table>/g, '</table></div>');
  return html;
}
const attrs = (s) => { const o = {}; s.replace(/(\w+)=("([^"]*)"|(\S+))/g, (_, k, __, q, b) => (o[k] = q ?? b)); return o; };

function compile(file, phase) {
  const raw = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  const fm = raw.match(/^---\n([\s\S]*?)\n---\n/);
  if (!fm) throw new Error(`${file}: missing front matter`);
  const meta = yaml.load(fm[1]);
  if (!known.has(meta.id)) throw new Error(`${file}: unknown lesson id ${meta.id}`);
  const body = raw.slice(fm[0].length);
  const lines = body.split('\n');
  const parts = []; const quizzes = []; const codes = []; let buf = [];
  const flush = () => { if (buf.length) { parts.push(md(buf.join('\n'))); buf = []; } };
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^:::(\w+)\s*(.*)$/);
    if (!m || m[1] === 'end' || m[1] === 'solution') { buf.push(lines[i]); continue; }
    flush();
    const kind = m[1], a = attrs(m[2]); const inner = [];
    for (i++; i < lines.length && !/^:::end\s*$/.test(lines[i]); i++) inner.push(lines[i]);
    if (i >= lines.length) throw new Error(`${file}: unterminated :::${kind}`);
    const txt = inner.join('\n');
    if (kind === 'verify') continue;
    if (kind === 'figure') {
      let content = '';
      if (a.widget) content = `<div class="widget" data-widget="${esc(a.widget)}" data-args="${esc(a.args || '{}')}"></div>`;
      else if (a.svg) {
        const src = path.join(FIG_SRC, a.svg);
        if (!fs.existsSync(src)) throw new Error(`${file}: missing figure ${a.svg}`);
        fs.copyFileSync(src, path.join(FIG_OUT, a.svg));
        const svg = fs.readFileSync(src, 'utf8'); const w = svg.match(/width="([\d.]+)pt"/), h = svg.match(/height="([\d.]+)pt"/);
        content = `<img src="figures/${esc(a.svg)}" alt="${esc(a.alt || a.caption || '')}" loading="lazy" decoding="async"${w ? ` width="${Math.round(w[1] * 4 / 3)}" height="${Math.round(h[1] * 4 / 3)}"` : ''} />`;
      } else content = txt.trim();
      parts.push(`<figure class="fig"><div class="fig-body">${content}</div>${a.caption ? `<figcaption>${md(a.caption, { inline: true })}</figcaption>` : ''}</figure>`);
    } else if (kind === 'code') {
      const fence = txt.match(/```(\w+)\n([\s\S]*?)\n```/);
      if (!fence) throw new Error(`${file}: code block without fence`);
      const lang = a.lang || fence[1], src = fence[2];
      const idx = codes.push({ file: a.file, lang, src }) - 1;
      const hl = hljs.highlight(src, { language: lang }).value;
      parts.push(`<div class="code-card" data-code="${idx}"><div class="code-head"><span class="fname" translate="no">${esc(a.file)}</span><button class="btn btn-quiet btn-small" type="button" data-copy="${idx}">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="${idx}">Download</button></div><pre tabindex="0"><code class="language-${lang}">${hl}</code></pre></div>`);
      const dir = path.join(CODE_OUT, meta.id); fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, a.file), src + '\n');
    } else if (kind === 'exercise') {
      const [q, s] = txt.split(/^:::solution\s*$/m);
      if (!s) throw new Error(`${file}: exercise without :::solution`);
      parts.push(`<div class="exercise"><div class="ex-q">${md(q)}</div><details><summary>Show the solution</summary><div class="ex-s">${md(s)}</div></details></div>`);
    } else if (kind === 'quiz') {
      const items = yaml.load(txt);
      for (const it of items) {
        const qd = { id: `${meta.id}-q${quizzes.length + 1}`, type: it.type, q: md(it.q), explain: md(it.explain || '') };
        if (it.type === 'mc') { if (!(it.answer >= 0 && it.answer < it.options.length)) throw new Error(`${file}: bad mc answer`);
          // deterministic per-question shuffle so the correct option is not always in the same position
          const order = shuffledIdx(it.options.length, qd.id);
          qd.options = order.map((k) => md(String(it.options[k]), { inline: true })); qd.answer = order.indexOf(it.answer); }
        else if (it.type === 'num') { qd.answer = it.answer; qd.tol = it.tol ?? 0.01; qd.unit = it.unit || ''; if (!it.py) throw new Error(`${file}: numeric question without py check`); }
        else throw new Error(`${file}: unknown quiz type ${it.type}`);
        quizzes.push(qd);
      }
      parts.push(`<div class="quiz" data-quiz="${meta.id}"></div>`);
    } else if (kind === 'callout') {
      parts.push(`<div class="callout">${md(txt)}</div>`);
    } else throw new Error(`${file}: unknown block ${kind}`);
  }
  flush();
  let html = parts.join('\n');
  const toc = [];
  html = html.replace(/<h2>([\s\S]*?)<\/h2>/g, (_, inner) => { const id = slug(inner); toc.push({ id, title: inner.replace(/<[^>]+>/g, '') }); return `<h2 id="${id}">${inner}</h2>`; });
  if (quizzes.length < 3) throw new Error(`${file}: needs at least 3 quiz questions`);
  if (!codes.length) throw new Error(`${file}: needs a code block`);
  if (!/class="exercise"/.test(html)) throw new Error(`${file}: needs an exercise`);
  return { id: meta.id, minutes: meta.minutes || 25, summary: md(meta.summary, { inline: true }), html, toc, quiz: quizzes, code: codes };
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'lessons'), { recursive: true }); fs.mkdirSync(FIG_OUT, { recursive: true });
const index = {};
const phases = fs.existsSync(LES) ? fs.readdirSync(LES).filter((d) => /^p\d\d$/.test(d)).sort() : [];
for (const ph of phases) {
  const files = fs.readdirSync(path.join(LES, ph)).filter((f) => f.endsWith('.md')).sort();
  const bank = {};
  for (const f of files) {
    const l = compile(path.join(LES, ph, f), ph);
    if (index[l.id]) throw new Error(`duplicate lesson id ${l.id}`);
    index[l.id] = { minutes: l.minutes, q: l.quiz.length }; bank[l.id] = l.quiz;
    fs.writeFileSync(path.join(OUT, 'lessons', `${l.id}.json`), JSON.stringify(l));
  }
  fs.writeFileSync(path.join(OUT, `quiz-${ph}.json`), JSON.stringify(bank));
  console.log(`${ph}: ${files.length} full lessons`);
}
fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(index));
console.log('total full lessons:', Object.keys(index).length);
