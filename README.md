# CitizenshipExam

Offline-first Canadian citizenship test prep (FR/EN). No backend, no analytics, no ads, no data collection: content and progress live on the device.

Stack: React Native + Expo SDK 56 (managed), TypeScript strict, Expo Router, React Native Paper, Zustand + AsyncStorage, i18next + expo-localization, expo-audio, EAS Build.

## Setup

```bash
npm install                 # postinstall builds content, audio index and icons
npx expo install --fix      # once: aligns every package to SDK 56, then commit package.json + lockfile
npm run typecheck && npm run lint && npm test
npx expo start
```

Node 20.19+ is required (CI uses 22).

## Content (not committed)

1. Put `content_en.txt` and `content_fr.txt` in `data/source/`.
2. Run `npm run build:content`. It writes `src/content/generated/content.{fr,en}.json` (lessons, questions, 45 exams, glossary).
   Without the raw files it writes a tiny SAMPLE bundle so typecheck, tests and CI still pass.
3. Each question gets a `conceptId` (near-duplicate questions share one) and exam questions get a chapter/lesson (`inferred: true` when matched by wording).

## Audio (not committed)

Copy `<lessonId>.mp3` (and the optional `<lessonId>.json` word timings) into `assets/audio_fr/` and `assets/audio_en/`, then run `npm run build:audio`. Metro needs static `require()` paths, so the index is generated.

## Decisions

- Exam: 20 questions, 45 minutes (owner decision; change `EXAM_MINUTES` in `src/config.ts`), pass mark 15/20.
- Correct answers: the source marks the first option as correct; options are shuffled at runtime.
- Android package: `com.tnhmar.citizenshipexam` (change in `app.json`).
- CI builds use SAMPLE content because raw content and audio are not in git.

## Known risks (unverified at generation time)

- Packages other than `expo`, `expo-router`, `react-native` and `eslint-config-expo` use `*` so install cannot fail on a wrong version; run `npx expo install --fix` to pin them for SDK 56.
- Typecheck, lint and tests could not be run where this scaffold was generated (no network). The first CI run is the first real check.
