#!/usr/bin/env node
// Prints (and writes to the job summary) which content and audio the APK will contain.
import fs from 'node:fs';

const b = JSON.parse(fs.readFileSync('src/content/generated/content.fr.json', 'utf8'));
const audio = (l) =>
  fs.existsSync(`assets/audio_${l}`) ? fs.readdirSync(`assets/audio_${l}`).filter((f) => f.endsWith('.mp3')).length : 0;
const label = b.sample ? 'SAMPLE content (upload content_en.txt and content_fr.txt to data/source)' : 'Real content';
const msg = `${label}: ${b.lessons.length} lessons, ${Object.keys(b.questions).length} questions, audio fr ${audio('fr')} / en ${audio('en')}`;

console.log(msg);
if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `summary=${msg}\n`);
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${msg}\n`);
