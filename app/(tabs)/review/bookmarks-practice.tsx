import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { QuizRunner } from '../../../src/components/QuizRunner';
import { useBundle } from '../../../src/content/useBundle';
import { bookmarkQuestions } from '../../../src/logic/bookmarks';
import { normalizeSearch } from '../../../src/logic/glossary';
import { useProgress } from '../../../src/store/progress';
import type { ContentBundle } from '../../../src/types';

export default function BookmarksPractice() {
  const bundle = useBundle();
  const { concept, search } = useLocalSearchParams<{ concept?: string; search?: string }>();
  return <Practice key={`${bundle.lang}-${concept ?? ''}-${search ?? ''}`} bundle={bundle} concept={concept} search={search} />;
}
function Practice({ bundle, concept, search }: { bundle: ContentBundle; concept?: string; search?: string }) {
  const { t } = useTranslation();
  const [ids] = useState(() => bookmarkQuestions(bundle, useProgress.getState().bookmarks).filter((item) => (!concept || item.conceptId === concept) && (!search || normalizeSearch(item.question.text).includes(normalizeSearch(search)))).map((item) => item.question.id));
  return <><Stack.Screen options={{ title: t('bookmarksUi.practice') }} /><QuizRunner questionIds={ids} /></>;
}
