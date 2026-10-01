import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { activeBlocks, alignSentences, layoutBlocks, sentencesFromTiming } from '../../../../src/audio/alignment';
import { AudioBar } from '../../../../src/components/AudioBar';
import { DefinitionSheet } from '../../../../src/components/DefinitionSheet';
import { RichText } from '../../../../src/components/RichText';
import { LESSON_QUIZ_MIN_QUESTIONS } from '../../../../src/config';
import { getAudio } from '../../../../src/content/audio';
import { useBundle } from '../../../../src/content/useBundle';
import { makeGlossaryMatcher } from '../../../../src/logic/glossary';
import { lessonQuizIds } from '../../../../src/logic/quiz';
import { useProgress } from '../../../../src/store/progress';
import { useSettings } from '../../../../src/store/settings';
import { palette } from '../../../../src/theme';
import type { ContentBundle, GlossaryTerm } from '../../../../src/types';

const stamp = (): number => Date.now();

export default function LessonScreen() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const bundle = useBundle();
  return <LessonReader key={`${bundle.lang}-${lessonId}`} lessonId={Number(lessonId)} bundle={bundle} />;
}

function LessonReader({ lessonId, bundle }: { lessonId: number; bundle: ContentBundle }) {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const textScale = useSettings((s) => s.textScale);
  const setTextScale = useSettings((s) => s.setTextScale);
  const setThemeMode = useSettings((s) => s.setThemeMode);
  const reduce = useSettings((s) => s.reduceMotion);
  const markRead = useProgress((s) => s.markLessonRead);
  const setLastRoute = useProgress((s) => s.setLastRoute);
  const addStudyTime = useProgress((s) => s.addStudyTime);
  const [ms, setMs] = useState(0);
  const [follow, setFollow] = useState(true);
  const [definition, setDefinition] = useState<GlossaryTerm | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const blockY = useRef<Record<number, number>>({});
  const viewHeight = useRef(0);
  const contentHeight = useRef(0);
  const marked = useRef(false);
  const lesson = bundle.lessons.find((l) => l.id === lessonId);
  const audio = lesson ? getAudio(bundle.lang, lesson.id) : undefined;
  const matcher = useMemo(() => makeGlossaryMatcher(bundle.glossary), [bundle]);
  const layout = useMemo(() => layoutBlocks(lesson?.blocks ?? []), [lesson]);
  const spans = useMemo(() => audio?.timing ? alignSentences(layout.text, sentencesFromTiming(audio.timing), lesson?.title ?? '') : [], [audio, layout, lesson]);
  const active = useMemo(() => activeBlocks(layout.ranges, spans, ms), [layout, spans, ms]);
  const focus = active[0] ?? -1;
  const markOnce = useCallback(() => {
    if (!lesson || marked.current) return;
    marked.current = true;
    markRead(lesson.id);
  }, [lesson, markRead]);
  const openTerm = useCallback((term: GlossaryTerm) => { setFollow(false); setDefinition(term); }, []);
  useFocusEffect(useCallback(() => {
    if (!lesson) return;
    setLastRoute(`/learn/lesson/${lesson.id}`);
    const start = stamp();
    return () => addStudyTime(Math.min(Math.max(0, stamp() - start), 1800000));
  }, [lesson, setLastRoute, addStudyTime]));
  useEffect(() => {
    if (!follow || focus < 0) return;
    const y = blockY.current[focus];
    if (y !== undefined) scrollRef.current?.scrollTo({ y: Math.max(0, y - 120), animated: !reduce });
  }, [focus, follow, reduce]);
  if (!lesson) return null;

  const chapter = bundle.chapters.find((c) => c.id === lesson.chapterId);
  const siblings = chapter?.lessonIds ?? [];
  const position = siblings.indexOf(lesson.id) + 1;
  const nextId = siblings[position];
  const quizIds = lessonQuizIds(lesson, LESSON_QUIZ_MIN_QUESTIONS);
  const body = 17 * textScale;
  const checkShort = () => { if (viewHeight.current > 0 && contentHeight.current > 0 && contentHeight.current <= viewHeight.current + 40) markOnce(); };
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
    if (contentOffset.y + layoutMeasurement.height >= contentSize.height - 60) markOnce();
  };
  const jump = () => {
    const y = blockY.current[focus];
    if (y !== undefined) scrollRef.current?.scrollTo({ y: Math.max(0, y - 120), animated: !reduce });
    setFollow(true);
  };
  const goNext = () => { markOnce(); if (nextId !== undefined) router.replace(`/learn/lesson/${nextId}`); else router.back(); };
  const cycleSize = () => setTextScale(textScale >= 1.3 ? 1 : textScale >= 1.15 ? 1.3 : 1.15);

  return <View style={styles.root}>
    <Stack.Screen options={{ title: chapter?.title ?? '', headerRight: () => <View style={styles.headerButtons}>
      <Pressable accessibilityRole='button' accessibilityLabel={t('glossaryUi.title')} onPress={() => router.push('/learn/glossary')} style={styles.headerButton}><Text style={styles.headerText}>▤</Text></Pressable>
      <Pressable accessibilityRole='button' accessibilityLabel={t('lessonUi.textSize')} onPress={cycleSize} style={styles.headerButton}><Text style={styles.headerText}>Aa</Text></Pressable>
      <Pressable accessibilityRole='button' accessibilityLabel={t('lessonUi.theme')} onPress={() => setThemeMode(theme.dark ? 'light' : 'dark')} style={styles.headerButton}><Text style={styles.headerText}>{theme.dark ? '☀️' : '🌙'}</Text></Pressable>
    </View> }} />
    <ScrollView ref={scrollRef} style={{ backgroundColor: theme.colors.background }} contentContainerStyle={styles.content} onScroll={onScroll} scrollEventThrottle={200} onLayout={(e) => { viewHeight.current = e.nativeEvent.layout.height; checkShort(); }} onContentSizeChange={(_w, h) => { contentHeight.current = h; checkShort(); }} onScrollBeginDrag={() => setFollow(false)}>
      <View style={styles.titleBlock}><Text variant='headlineMedium' style={{ color: theme.colors.secondary, fontWeight: '700' }}>{lesson.title}</Text><Text variant='labelLarge' style={{ color: theme.colors.secondary, letterSpacing: 1 }}>{t('lessonUi.lessonLabel', { n: position })}</Text></View>
      <Text variant='bodySmall' style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}>{t('glossaryUi.lessonHint')}</Text>
      {lesson.blocks.map((b, i) => <View key={i} onLayout={(e) => { blockY.current[i] = e.nativeEvent.layout.y; }} style={[styles.block, active.includes(i) && { backgroundColor: theme.colors.primaryContainer }]}>
        {b.k === 'li' ? <View style={styles.li}><Text style={{ fontSize: body, lineHeight: body * 1.65 }}>•</Text><RichText text={b.t} size={body} style={styles.grow} matcher={matcher} onTerm={openTerm} /></View> : <RichText text={b.t} variant={b.k === 'h' ? 'titleMedium' : 'bodyLarge'} size={b.k === 'h' ? 20 * textScale : body} style={b.k === 'h' ? styles.heading : undefined} matcher={matcher} onTerm={openTerm} />}
      </View>)}
      <View style={styles.actions}>
        {quizIds.length > 0 ? <Pressable accessibilityRole='button' onPress={() => { markOnce(); router.push(`/learn/quiz?kind=lesson&id=${lesson.id}`); }} style={({ pressed }) => [styles.quizCta, { backgroundColor: theme.colors.secondary }, pressed && styles.pressed]}><View style={styles.grow}><Text variant='bodyMedium' style={{ color: theme.colors.onSecondary }}>{t('learnUi.quizCount', { count: quizIds.length })}</Text><Text variant='titleMedium' style={{ color: theme.colors.onSecondary, fontWeight: '700' }}>{t('lessonUi.startQuiz')}</Text></View><View style={styles.chevBox}><Text style={{ color: theme.colors.onSecondary, fontSize: 26 }}>›</Text></View></Pressable> : null}
        <Button mode='contained' buttonColor={palette.success} textColor='#FFFFFF' contentStyle={styles.nextButton} onPress={goNext}>{nextId !== undefined ? t('learn.nextLesson') : t('learn.backToChapter')}</Button>
      </View>
    </ScrollView>
    {audio ? <View style={[styles.footer, { backgroundColor: theme.colors.background }]}><AudioBar source={audio.audio} onTime={setMs} follow={follow} onToggleFollow={() => setFollow(!follow)} onJump={jump} /></View> : null}
    <DefinitionSheet term={definition} onClose={() => setDefinition(null)} onOpen={(term) => { setDefinition(null); router.push(`/learn/glossary?termId=${term.id}`); }} />
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 16, paddingBottom: 24, gap: 6 },
  titleBlock: { gap: 2, marginBottom: 10 },
  block: { borderRadius: 10, paddingVertical: 6, paddingHorizontal: 6 },
  heading: { fontWeight: '700' },
  li: { flexDirection: 'row', gap: 10 },
  grow: { flex: 1 },
  actions: { gap: 12, marginTop: 16 },
  quizCta: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18, borderRadius: 22 },
  pressed: { opacity: 0.9 },
  chevBox: { width: 46, height: 46, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  nextButton: { paddingVertical: 8 },
  footer: { paddingHorizontal: 12, paddingTop: 6, paddingBottom: 6 },
  headerButtons: { flexDirection: 'row', gap: 4 },
  headerButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
});
