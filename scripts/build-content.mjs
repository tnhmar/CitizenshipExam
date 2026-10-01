#!/usr/bin/env node
// Builds compact, offline content bundles from the raw exports in data/source/.
// Without raw files it writes a tiny SAMPLE bundle so typecheck/tests/CI still work.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'data', 'source');
const OUT = path.join(ROOT, 'src', 'content', 'generated');
const EXAM_MINUTES = Number(process.env.EXAM_MINUTES ?? 45);
fs.mkdirSync(OUT, { recursive: true });

const STOP = new Set('the a an of to in is are was were and or for on by with as at be that this which what who it its from their his her le la les un une des de du et ou est sont en au aux pour par sur dans que qui ce'.split(' '));
const stripPrefix = (s) => s.replace(/^\s*(true or false\??|vrai ou faux\s*\??|fill in the blank\.?|compl[eé]tez[^.]*\.)\s*/i, '');
const norm = (s) => stripPrefix(s).toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
const toks = (s) => new Set(norm(s).split(' ').filter((w) => w && !STOP.has(w)));
const cleanOpt = (s) => s.replace(/^\d+\s+/, '').trim();
const jaccard = (a, b) => {
  let i = 0;
  for (const x of a) if (b.has(x)) i++;
  const u = a.size + b.size - i;
  return u ? i / u : 0;
};

function parseLesson(xml) {
  const m = /<text>([\s\S]*?)<\/text>/.exec(xml);
  let t = m ? m[1] : '';
  t = t.replace(/<image[^>]*\/>/g, '').replace(/<a [^>]*>([\s\S]*?)<\/a>/g, '$1');
  const blocks = [];
  for (const raw of t.split(/\n+/)) {
    let line = raw.trim();
    if (!line) continue;
    let k = 'p';
    let mm;
    if ((mm = /^<h>([\s\S]*?)<\/h>$/.exec(line))) { k = 'h'; line = mm[1]; }
    else if ((mm = /^<li>([\s\S]*?)<\/li>$/.exec(line))) { k = 'li'; line = mm[1]; }
    line = line.replace(/<b>([\s\S]*?)<\/b>/g, '**$1**').replace(/<[^>]+>/g, '').trim();
    if (line) blocks.push({ k, t: line });
  }
  return blocks;
}

function flatten(content, tests) {
  const byId = new Map(content.map((l) => [l.id, l]));
  const qs = [];
  for (const l of content) {
    if (l.parentId == null) continue;
    for (const q of l.questions ?? []) qs.push({ ...q, src: 'lesson', lessonId: l.id, chapterId: l.parentId });
  }
  for (const t of tests) for (const q of t.questions) qs.push({ ...q, src: 'exam', examId: t.id, lessonId: null, chapterId: null });
  return { qs, byId };
}

function clusterConcepts(qs) {
  const n = qs.length;
  const par = Array.from({ length: n }, (_, i) => i);
  const find = (x) => { while (par[x] !== x) { par[x] = par[par[x]]; x = par[x]; } return x; };
  const T = qs.map((q) => toks(q.question));
  const C = qs.map((q) => norm(cleanOpt(q.options[0])));
  const CT = qs.map((q) => toks(cleanOpt(q.options[0])));
  const isTF = qs.map((q) => q.type === 'true_false');
  const exact = new Map();
  qs.forEach((q, i) => {
    const k = norm(q.question) + '|' + C[i];
    if (exact.has(k)) par[find(i)] = find(exact.get(k)); else exact.set(k, i);
  });
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < i; j++) {
      if (find(i) === find(j) || isTF[i] !== isTF[j]) continue;
      if (isTF[i]) {
        if (C[i] !== C[j]) continue;
        if (jaccard(T[i], T[j]) >= 0.9) par[find(i)] = find(j);
      } else {
        const a = new Set([...T[i], ...CT[i]]);
        const b = new Set([...T[j], ...CT[j]]);
        if (jaccard(a, b) >= 0.8) par[find(i)] = find(j);
      }
    }
  }
  return qs.map((_, i) => find(i));
}

function assignChapters(qs, concept, content) {
  const lessonTok = new Map();
  const df = new Map();
  qs.forEach((q, i) => {
    if (q.src !== 'lesson') return;
    const t = new Set([...toks(q.question), ...toks(cleanOpt(q.options[0]))]);
    lessonTok.set(i, t);
    for (const w of t) df.set(w, (df.get(w) ?? 0) + 1);
  });
  const N = lessonTok.size || 1;
  const idf = (w) => Math.log(1 + N / (1 + (df.get(w) ?? 0)));
  const conceptHome = new Map();
  qs.forEach((q, i) => { if (q.src === 'lesson' && !conceptHome.has(concept[i])) conceptHome.set(concept[i], i); });
  const out = [];
  qs.forEach((q, i) => {
    if (q.src === 'lesson') { out.push({ lessonId: q.lessonId, chapterId: q.chapterId, inferred: false }); return; }
    const home = conceptHome.get(concept[i]);
    if (home != null) { out.push({ lessonId: qs[home].lessonId, chapterId: qs[home].chapterId, inferred: false }); return; }
    const t = new Set([...toks(q.question), ...toks(cleanOpt(q.options[0]))]);
    let best = -1, bestS = 0;
    for (const [j, lt] of lessonTok) {
      let s = 0;
      for (const w of t) if (lt.has(w)) s += idf(w);
      s /= Math.sqrt(t.size * lt.size || 1);
      if (s > bestS) { bestS = s; best = j; }
    }
    out.push(best >= 0 && bestS > 0.15
      ? { lessonId: qs[best].lessonId, chapterId: qs[best].chapterId, inferred: true }
      : { lessonId: null, chapterId: null, inferred: true });
  });
  return out;
}

function buildBundle(lang, raw, ctx) {
  const { content, tests, glossary } = raw.data;
  const { qs, concept, place } = ctx;
  const sorted = [...content].sort((a, b) => a.index - b.index);
  const chapters = sorted.filter((l) => l.parentId == null).map((c, ci) => ({
    id: c.id, order: ci + 1, title: c.title,
    lessonIds: sorted.filter((l) => l.parentId === c.id).map((l) => l.id),
  }));
  const lessons = sorted.filter((l) => l.parentId != null).map((l, li) => ({
    id: l.id, chapterId: l.parentId, order: li + 1, title: l.title,
    blocks: parseLesson(l.data), hasAudio: !!l.hasAudio,
    questionIds: (l.questions ?? []).map((q) => q.id),
  }));
  const questions = {};
  qs.forEach((q, i) => {
    const clean = q.options.map(cleanOpt);
    questions[q.id] = {
      id: q.id, conceptId: 'c' + qs[concept[i]].id,
      type: q.type === 'true_false' ? 'tf' : 'mc',
      text: stripPrefix(q.question).trim() || q.question,
      options: clean, correctIndex: 0,
      explanation: (q.feedback ?? '').trim(),
      origin: q.src,
      lessonId: place[i].lessonId, chapterId: place[i].chapterId, inferred: place[i].inferred,
    };
  });
  const exams = tests.map((t, ti) => ({
    id: t.id, order: ti + 1, title: t.title,
    kind: /^mock/i.test(t.title) ? 'mock' : 'practice',
    durationMin: EXAM_MINUTES, questionIds: t.questions.map((q) => q.id),
  }));
  return {
    lang, sample: false, passMark: 15, examSize: 20, examMinutes: EXAM_MINUTES,
    chapters, lessons, questions, exams,
    glossary: (glossary ?? []).map((g) => ({ id: g.id, term: g.word, definition: g.definition })),
  };
}

function sampleBundle(lang) {
  const fr = lang === 'fr';
  const mk = (id, lessonId, chapterId, text, opts, expl, type = 'mc') => ({
    id, conceptId: 'c' + id, type, text, options: opts, correctIndex: 0, explanation: expl,
    origin: 'lesson', lessonId, chapterId, inferred: false,
  });
  const qs = [
    mk(1, 11, 1, fr ? 'Quelle est la capitale du Canada ?' : 'What is the capital of Canada?', fr ? ['Ottawa', 'Toronto', 'Montréal', 'Québec'] : ['Ottawa', 'Toronto', 'Montreal', 'Quebec City'], fr ? 'Ottawa est la capitale nationale.' : 'Ottawa is the national capital.'),
    mk(2, 11, 1, fr ? 'Le Canada est une monarchie constitutionnelle.' : 'Canada is a constitutional monarchy.', fr ? ['Vrai', 'Faux'] : ['True', 'False'], fr ? 'Le Canada a un monarque et une constitution.' : 'Canada has a monarch and a constitution.', 'tf'),
    mk(3, 11, 1, fr ? 'Combien de provinces compte le Canada ?' : 'How many provinces does Canada have?', ['10', '8', '12', '13'], fr ? 'Le Canada compte 10 provinces et 3 territoires.' : 'Canada has 10 provinces and 3 territories.'),
    mk(4, 12, 2, fr ? 'Qui est le chef d’État du Canada ?' : 'Who is Canada’s head of state?', fr ? ['Le monarque', 'Le premier ministre', 'Le juge en chef', 'Le président'] : ['The monarch', 'The prime minister', 'The chief justice', 'The president'], ''),
    mk(5, 12, 2, fr ? 'Le vote se fait par scrutin secret.' : 'Voting is done by secret ballot.', fr ? ['Vrai', 'Faux'] : ['True', 'False'], '', 'tf'),
    mk(6, 12, 2, fr ? 'Quel âge faut-il avoir pour voter ?' : 'How old must you be to vote?', fr ? ['18 ans', '16 ans', '21 ans', '25 ans'] : ['18', '16', '21', '25'], ''),
  ];
  const questions = Object.fromEntries(qs.map((q) => [q.id, q]));
  return {
    lang, sample: true, passMark: 15, examSize: 20, examMinutes: EXAM_MINUTES,
    chapters: [
      { id: 1, order: 1, title: fr ? 'Exemple : Qui nous sommes' : 'Sample: Who We Are', lessonIds: [11] },
      { id: 2, order: 2, title: fr ? 'Exemple : Élections' : 'Sample: Elections', lessonIds: [12] },
    ],
    lessons: [
      { id: 11, chapterId: 1, order: 1, title: fr ? 'Leçon exemple 1' : 'Sample lesson 1', blocks: [{ k: 'h', t: fr ? 'Contenu fictif' : 'Placeholder content' }, { k: 'p', t: fr ? 'Ceci est un **exemple**. Ajoutez vos fichiers dans data/source.' : 'This is a **sample**. Add your files in data/source.' }], hasAudio: false, questionIds: [1, 2, 3] },
      { id: 12, chapterId: 2, order: 2, title: fr ? 'Leçon exemple 2' : 'Sample lesson 2', blocks: [{ k: 'p', t: fr ? 'Deuxième leçon exemple.' : 'Second sample lesson.' }], hasAudio: false, questionIds: [4, 5, 6] },
    ],
    questions,
    exams: [{ id: 100, order: 1, title: 'Mock Test A', kind: 'mock', durationMin: EXAM_MINUTES, questionIds: [1, 2, 3, 4, 5, 6] }],
    glossary: [{ id: 1, term: fr ? 'Monarchie' : 'Monarchy', definition: fr ? 'Régime dirigé par un roi ou une reine.' : 'A system headed by a king or queen.' }],
  };
}

function main() {
  const enP = path.join(SRC, 'content_en.txt');
  const frP = path.join(SRC, 'content_fr.txt');
  let bundles;
  if (fs.existsSync(enP) && fs.existsSync(frP)) {
    const en = JSON.parse(fs.readFileSync(enP, 'utf8'));
    const fr = JSON.parse(fs.readFileSync(frP, 'utf8'));
    const { qs } = flatten(en.data.content, en.data.tests);
    const concept = clusterConcepts(qs);
    const place = assignChapters(qs, concept, en.data.content);
    const frq = flatten(fr.data.content, fr.data.tests).qs;
    if (frq.length !== qs.length || frq.some((q, i) => q.id !== qs[i].id)) {
      throw new Error('EN/FR question ids are not parallel; cannot share concept ids.');
    }
    bundles = {
      en: buildBundle('en', en, { qs, concept, place }),
      fr: buildBundle('fr', fr, { qs: frq, concept, place }),
    };
  } else {
    console.warn('[build-content] data/source/content_{en,fr}.txt not found -> writing SAMPLE bundles');
    bundles = { en: sampleBundle('en'), fr: sampleBundle('fr') };
  }
  for (const [lang, b] of Object.entries(bundles)) {
    fs.writeFileSync(path.join(OUT, `content.${lang}.json`), JSON.stringify(b));
    const nq = Object.keys(b.questions).length;
    const nc = new Set(Object.values(b.questions).map((q) => q.conceptId)).size;
    console.log(`[build-content] ${lang}: chapters=${b.chapters.length} lessons=${b.lessons.length} questions=${nq} concepts=${nc} exams=${b.exams.length} glossary=${b.glossary.length} sample=${b.sample}`);
  }
}
main();
