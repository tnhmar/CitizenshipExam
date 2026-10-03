import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import { useHomeOverviewText } from '../i18n/homeOverview';
import type { DashboardSnapshot } from '../logic/dashboardStats';
import { homeOverviewLayout } from '../logic/homeLayout';
import { homeOverviewModel, miniMockChart } from '../logic/homeOverview';
import { progressScoreColour } from '../logic/progressPresentation';
import { Bar } from './Bar';
import { Panel } from './Panel';

export function HomeOverview({ data, onProgress, onExams }: { data: DashboardSnapshot; onProgress: () => void; onExams: () => void }) {
  const text = useHomeOverviewText(); const { i18n } = useTranslation(); const theme = useTheme(); const { fontScale } = useWindowDimensions();
  const [rowWidth, setRowWidth] = useState(0); const layout = homeOverviewLayout(rowWidth, fontScale);
  const model = homeOverviewModel(data); const chart = miniMockChart(model.mocks); const completion = data.completion;
  const circumference = 2 * Math.PI * 30;
  const percent = (value: number | null) => value === null ? '—' : `${Math.round(value)}%`;
  const date = (at: number) => new Date(at).toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' });
  const latest = model.mocks[model.mocks.length - 1];
  return <Panel>
    <View style={styles.heading}><Text variant='titleMedium' style={styles.headingTitle}>{text.title}</Text><Pressable accessibilityRole='button' accessibilityLabel={text.viewProgress} onPress={onProgress} style={styles.link}><Text variant='labelLarge' style={{ color: theme.colors.primary }}>{text.viewProgress}</Text></Pressable></View>
    <View style={styles.overviewRow} onLayout={(event) => { const width = event.nativeEvent.layout.width; setRowWidth((previous) => Math.abs(previous - width) > 0.5 ? width : previous); }}>
      <View style={[styles.block, { width: layout.columnWidth }]}>
        <Text variant='titleSmall'>{text.course}</Text>
        <View style={styles.courseRow}>
          <View accessible accessibilityRole='image' accessibilityLabel={`${text.course}: ${percent(model.coursePercent)}. ${text.lessons}: ${completion.lessonsCompleted}/${completion.lessonsTotal}. ${text.chapters}: ${completion.chaptersCompleted}/${completion.chaptersTotal}.`}>
            <Svg width={80} height={80} viewBox='0 0 80 80' accessible={false}>
              <Circle cx={40} cy={40} r={30} fill='none' stroke={theme.colors.surfaceVariant} strokeWidth={7} />
              {model.coursePercent !== null ? <Circle cx={40} cy={40} r={30} fill='none' stroke={theme.colors.primary} strokeWidth={7} strokeLinecap='round' strokeDasharray={`${circumference}`} strokeDashoffset={circumference * (1 - model.coursePercent / 100)} rotation={-90} origin='40,40' /> : null}
              <SvgText x={40} y={46} fontSize={19} fontWeight='700' textAnchor='middle' fill={theme.colors.onSurface}>{percent(model.coursePercent)}</SvgText>
            </Svg>
          </View>
          <View style={styles.courseText}>
            <Text variant='titleMedium'>{completion.lessonsCompleted}/{completion.lessonsTotal}</Text><Text variant='bodySmall'>{text.lessons}</Text>
            <Text variant='bodySmall'>{completion.chaptersCompleted}/{completion.chaptersTotal} · {text.chapters}</Text>
          </View>
        </View>
        {model.coursePercent === null ? <Text variant='bodySmall'>{text.noCourse}</Text> : null}
      </View>
      <View style={[styles.block, { width: layout.columnWidth }]}>
        <Text variant='titleSmall'>{text.mocks}</Text>
        {model.mocks.length ? <>
          <View style={styles.metrics}><Text variant='titleSmall'>{text.average}: {percent(model.mockAveragePercent)}</Text>{latest ? <Text variant='bodySmall'>{text.latest}: {latest.correct}/{latest.total}</Text> : null}</View>
          <View accessible accessibilityRole='image' accessibilityLabel={model.mocks.map((row) => `${date(row.at)}: ${row.correct}/${row.total}, ${text.passLine}: ${row.required}/${row.total}`).join('; ')}>
            <Svg width='100%' height={layout.plotHeight} viewBox='0 0 300 92' accessible={false}>
              <Line x1={20} x2={280} y1={8} y2={8} stroke={theme.colors.outlineVariant} /><Line x1={20} x2={280} y1={80} y2={80} stroke={theme.colors.outlineVariant} />
              <Path d={chart.targetPath} fill='none' stroke={theme.colors.onSurfaceVariant} strokeWidth={1.5} strokeDasharray='4 4' />
              <Path d={chart.scorePath} fill='none' stroke={theme.colors.secondary} strokeWidth={2.5} />
              {chart.points.map((point) => <Circle key={point.id} cx={point.x} cy={point.y} r={4} fill={progressScoreColour(point.passed, theme.dark)} />)}
            </Svg>
          </View>
          <View style={styles.metrics}><Text variant='labelSmall'>{date(model.mocks[0].at)}</Text>{model.mocks.length > 1 && latest ? <Text variant='labelSmall'>{date(latest.at)}</Text> : null}</View>
          <Text variant='labelSmall' style={{ color: theme.colors.onSurfaceVariant }}>{model.mocks.length === 1 ? text.oneMock : text.mockWindow}</Text>
          <Text variant='labelSmall' style={{ color: theme.colors.onSurfaceVariant }}>{text.passLine}</Text>
        </> : <><Text variant='bodySmall' style={{ color: theme.colors.onSurfaceVariant }}>{text.noMocks}</Text><Pressable accessibilityRole='button' accessibilityLabel={text.chooseExam} onPress={onExams} style={styles.link}><Text variant='labelLarge' style={{ color: theme.colors.primary }}>{text.chooseExam}</Text></Pressable></>}
      </View>
    </View>
    <View style={[styles.practice, { borderColor: theme.colors.outlineVariant }]}>
      <View style={styles.metrics}><Text variant='titleSmall' style={styles.grow}>{text.practice}</Text><Text variant='titleSmall'>{model.practicePercent === null ? text.notAssessed : `${model.practiceCorrect}/${model.practiceTotal} · ${percent(model.practicePercent)}`}</Text></View>
      {model.practicePercent !== null ? <><Bar value={model.practicePercent / 100} height={5} color={theme.colors.secondary} /><Text variant='labelSmall' style={{ color: theme.colors.onSurfaceVariant }}>{model.practiceTotal} {text.concepts} · {text.practiceWindow}</Text></> : <Text variant='labelSmall' style={{ color: theme.colors.onSurfaceVariant }}>{text.practiceWindow}</Text>}
    </View>
    <Text variant='labelSmall' style={{ color: theme.colors.onSurfaceVariant }}>{text.separate}</Text>
  </Panel>;
}
const styles = StyleSheet.create({ link: { minHeight: 44, justifyContent: 'center', paddingVertical: 4, paddingHorizontal: 4, flexShrink: 1 }, heading: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 }, headingTitle: { flexGrow: 1, flexShrink: 1, minWidth: 140 }, grow: { flex: 1 }, overviewRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', gap: 12 }, block: { flexGrow: 0, flexShrink: 0, gap: 5 }, courseRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 }, courseText: { flexBasis: 120, flexGrow: 1, minWidth: 120, gap: 3 }, metrics: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 6 }, practice: { borderTopWidth: 1, paddingTop: 8, gap: 5 } });
