import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { Bar } from '../../../src/components/Bar';
import { Panel } from '../../../src/components/Panel';
import { Screen } from '../../../src/components/Screen';
import { useBundle } from '../../../src/content/useBundle';
import { useProgress } from '../../../src/store/progress';
import { palette } from '../../../src/theme';

export default function LearnIndex() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const bundle = useBundle();
  const lessonsRead = useProgress((s) => s.lessonsRead);
  const total = bundle.lessons.length;
  const done = bundle.lessons.filter((l) => lessonsRead[l.id]).length;

  return (
    <Screen>
      <Panel tone='primary'>
        <Text variant='titleMedium' style={{ color: theme.colors.onPrimary }}>
          {t('learnUi.overall')}
        </Text>
        <Text variant='headlineMedium' style={{ color: theme.colors.onPrimary, fontWeight: '700' }}>
          {t('learn.chapterProgress', { done, total })}
        </Text>
        <Bar value={total > 0 ? done / total : 0} color='#FFFFFF' trackColor='rgba(255,255,255,0.3)' height={10} />
      </Panel>

      {bundle.chapters.map((c) => {
        const count = c.lessonIds.length;
        const read = c.lessonIds.filter((id) => lessonsRead[id]).length;
        const complete = count > 0 && read === count;
        const started = read > 0;
        return (
          <Panel key={c.id} onPress={() => router.push(`/learn/${c.id}`)}>
            <View style={styles.row}>
              <View style={[styles.badge, { backgroundColor: complete ? palette.success : started ? theme.colors.primary : theme.colors.surfaceVariant }]}>
                <Text style={{ color: complete || started ? '#FFFFFF' : theme.colors.onSurfaceVariant, fontWeight: '700' }}>{complete ? '✓' : c.order}</Text>
              </View>
              <View style={styles.grow}>
                <Text variant='titleMedium'>{c.title}</Text>
                <Text variant='bodySmall' style={{ color: theme.colors.onSurfaceVariant }}>
                  {`${t('learnUi.lessonCount', { count })} · ${complete ? t('learn.completed') : started ? t('learn.inProgress') : t('learn.notStarted')}`}
                </Text>
                <Bar value={count > 0 ? read / count : 0} color={complete ? palette.success : undefined} />
              </View>
              <Text style={styles.chevron}>›</Text>
            </View>
          </Panel>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  badge: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  grow: { flex: 1, gap: 6 },
  chevron: { fontSize: 28 },
});
