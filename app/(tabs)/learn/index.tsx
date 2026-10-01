import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { Bar } from '../../../src/components/Bar';
import { Panel } from '../../../src/components/Panel';
import { Screen } from '../../../src/components/Screen';
import { chapterCover } from '../../../src/content/covers';
import { useBundle } from '../../../src/content/useBundle';
import { useProgress } from '../../../src/store/progress';
import { palette } from '../../../src/theme';

export default function LearnIndex() {
  const { t } = useTranslation(); const router = useRouter(); const theme = useTheme(); const bundle = useBundle(); const lessonsRead = useProgress((s) => s.lessonsRead); const lastRoute = useProgress((s) => s.lastRoute); const total = bundle.lessons.length; const done = bundle.lessons.filter((l) => lessonsRead[l.id]).length; const match = /\/learn\/lesson\/(\d+)/.exec(lastRoute ?? ''); const currentChapterId = match ? bundle.lessons.find((l) => l.id === Number(match[1]))?.chapterId : undefined;
  return (<Screen><Panel tone='primary'><Text variant='titleMedium' style={{ color: theme.colors.onPrimary }}>{t('learnUi.overall')}</Text><Text variant='headlineMedium' style={{ color: theme.colors.onPrimary, fontWeight: '700' }}>{t('learn.chapterProgress', { done, total })}</Text><Bar value={total > 0 ? done / total : 0} color='#FFFFFF' trackColor='rgba(255,255,255,0.3)' height={10} /></Panel><View style={styles.grid}>{bundle.chapters.map((c) => { const count = c.lessonIds.length; const read = c.lessonIds.filter((id) => lessonsRead[id]).length; const complete = count > 0 && read === count; return (<Panel key={c.id} onPress={() => router.push(`/learn/${c.id}`)} style={styles.card}><View style={[styles.spine, { backgroundColor: complete ? palette.success : theme.colors.primary }]} />{c.id === currentChapterId ? <View style={[styles.ribbon, { backgroundColor: theme.colors.secondary }]} /> : null}<Text variant='labelSmall' style={{ color: theme.colors.onSurfaceVariant, letterSpacing: 1 }}>{t('lessonUi.chapterLabel', { n: c.order })}</Text><Text variant='titleMedium' numberOfLines={3} style={styles.title}>{c.title}</Text><Text style={styles.cover}>{chapterCover(c.order)}</Text><View style={styles.barWrap}><Bar value={count > 0 ? read / count : 0} color={complete ? palette.success : undefined} /></View><Text variant='labelSmall' style={{ color: complete ? palette.success : theme.colors.onSurfaceVariant }}>{`${complete ? '✓ ' : ''}${t('lessonUi.doneCount', { done: read, total: count })}`}</Text></Panel>); })}</View></Screen>);
}

const styles = StyleSheet.create({ grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 }, card: { width: '48%', alignItems: 'center', gap: 6, paddingLeft: 22, overflow: 'hidden' }, spine: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 8 }, ribbon: { position: 'absolute', left: 16, top: 0, width: 18, height: 28, borderBottomLeftRadius: 4, borderBottomRightRadius: 4 }, title: { fontWeight: '700', textAlign: 'center', minHeight: 66 }, cover: { fontSize: 56, lineHeight: 70 }, barWrap: { alignSelf: 'stretch' } });
