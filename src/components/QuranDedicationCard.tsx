import { Platform, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { QURAN_EXCERPT, QURAN_EXCERPT_REFERENCE, QURAN_FULL_VERSE, QURAN_FULL_REFERENCE } from '../content/loveDedication';

export function QuranDedicationCard({ full = false }: { full?: boolean }) {
  const theme = useTheme();
  const ink = theme.dark ? '#F5EBDD' : '#24221F';
  return <View style={[styles.card, { backgroundColor: theme.dark ? '#24231F' : '#FFF9EF', borderColor: theme.dark ? '#A58B59' : '#B59B65' }]}>
    <Text selectable style={[styles.arabic, { color: ink }]}>{full ? QURAN_FULL_VERSE : QURAN_EXCERPT}</Text>
    <Text selectable style={[styles.reference, { color: ink }]}>{full ? QURAN_FULL_REFERENCE : QURAN_EXCERPT_REFERENCE}</Text>
  </View>;
}
const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 20, paddingVertical: 24, gap: 16 },
  arabic: { fontFamily: Platform.OS === 'ios' ? 'Geeza Pro' : 'serif', fontSize: 28, lineHeight: 52, textAlign: 'center', writingDirection: 'rtl', fontWeight: '400' },
  reference: { fontSize: 16, lineHeight: 28, textAlign: 'center', writingDirection: 'rtl' },
});
