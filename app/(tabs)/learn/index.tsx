import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { Bar } from '../../../src/components/Bar';
import { Panel } from '../../../src/components/Panel';
import { Screen } from '../../../src/components/Screen';
import { chapterCover } from '../../../src/content/covers';
import { useBundle } from '../../../src/content/useBundle';
import { useCompletionText } from '../../../src/i18n/completion';
import { chapterStatus } from '../../../src/logic/completion';
import { useProgress } from '../../../src/store/progress';
import { palette } from '../../../src/theme';

export default function LearnIndex() {
  const { t } = useTranslation(); const text = useCompletionText(); const router = useRouter(); const theme = useTheme();
  const bundle = useBundle(); const progress = useProgress(); const total = bundle.lessons.length;
  const done = bundle.lessons.filter((l) => progress.lessonsRead[l.id] !== undefined).length;
  const match = /\/learn\/lesson\/(\d+)/.exec(progress.lastRoute ?? '');
  const currentChapterId = match ? bundle.lessons.find((l) => l.id === Number(match[1]))?.chapterId : undefined;
  return <Screen>
    <Panel tone='primary'><Text variant='titleMedium' style={{ color: theme.colors.onPrimary }}>{text.completedLessons}</Text><Text variant='headlineMedium' style={{ color: theme.colors.onPrimary }}>{done}/{total}</Text><Bar value={total ? done / total : 0} color='#FFFFFF' trackColor='rgba(255,255,255,0.3)' height={10} /></Panel>
    <Panel onPress={() => router.push('/learn/glossary')} accessibilityLabel={t('glossaryUi.title')}><View style={styles.shortcut}><Text style={styles.shortcutIcon}>📖</Text><View style={styles.grow}><Text variant='titleMedium'>{t('glossaryUi.title')}</Text><Text variant='bodySmall'>{t('glossaryUi.shortcut')}</Text></View><Text style={{ fontSize: 28, color: theme.colors.secondary }}>›</Text></View></Panel>
    <View style={styles.grid}>{bundle.chapters.map((c) => {
      const count = c.lessonIds.length; const completed = c.lessonIds.filter((id) => progress.lessonsRead[id] !== undefined).length;
      const status = chapterStatus(progress, c); const complete = status === 'completed';
      return <Panel key={c.id} onPress={() => router.push(`/learn/${c.id}`)} style={styles.card}>
        <View style={[styles.spine, { backgroundColor: complete ? palette.success : theme.colors.primary }]} />
        {c.id === currentChapterId ? <View style={[styles.ribbon, { backgroundColor: theme.colors.secondary }]} /> : null}
        <Text variant='labelSmall'>{t('lessonUi.chapterLabel', { n: c.order })}</Text><Text variant='titleMedium' numberOfLines={3} style={styles.title}>{c.title}</Text><Text style={styles.cover}>{chapterCover(c.order)}</Text>
        <View style={styles.barWrap}><Bar value={count ? completed / count : 0} color={complete ? palette.success : theme.colors.secondary} /></View>
        <Text variant='labelSmall'>{completed}/{count} · {text.completedLessons}</Text><Text variant='labelSmall' style={{ color: complete ? palette.success : theme.colors.onSurfaceVariant }}>{complete ? '✓ ' : ''}{text[status]}</Text>
      </Panel>;
    })}</View>
  </Screen>;
}
const styles = StyleSheet.create({ grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 }, card: { width: '48%', alignItems: 'center', gap: 6, paddingLeft: 22, overflow: 'hidden' }, spine: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 8 }, ribbon: { position: 'absolute', left: 16, top: 0, width: 18, height: 28, borderBottomLeftRadius: 4, borderBottomRightRadius: 4 }, title: { fontWeight: '700', textAlign: 'center', minHeight: 66 }, cover: { fontSize: 56, lineHeight: 70 }, barWrap: { alignSelf: 'stretch' }, shortcut: { flexDirection: 'row', alignItems: 'center', gap: 12 }, shortcutIcon: { fontSize: 28 }, grow: { flex: 1, gap: 4 } });
