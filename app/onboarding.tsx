import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { NativePickerRow } from '../src/components/NativePickerRow';
import { Screen } from '../src/components/Screen';
import { deviceLang } from '../src/i18n';
import { useSettings } from '../src/store/settings';
import type { Lang } from '../src/types';

const GOALS = [10, 20, 30, 45];
export default function Onboarding() {
  const { t, i18n } = useTranslation(); const router = useRouter(); const complete = useSettings((s) => s.completeOnboarding);
  const [lang, setLang] = useState<Lang>(deviceLang()); const [date, setDate] = useState<string | null>(null); const [goal, setGoal] = useState(20);
  const pickLang = (value: Lang) => { setLang(value); void i18n.changeLanguage(value); };
  const start = () => { complete({ lang, examDate: date, dailyGoalMin: goal }); router.replace('/'); };
  return <Screen>
    <Text variant='headlineMedium'>{t('onboarding.title')}</Text><Text variant='bodyLarge'>{t('onboarding.subtitle')}</Text>
    <Text variant='titleMedium'>{t('onboarding.language')}</Text>
    <View style={styles.row}><Button mode={lang === 'fr' ? 'contained' : 'outlined'} onPress={() => pickLang('fr')}>Français</Button><Button mode={lang === 'en' ? 'contained' : 'outlined'} onPress={() => pickLang('en')}>English</Button></View>
    <NativePickerRow mode='date' value={date} label={t('onboarding.examDate')} onValueChange={setDate} />
    <Text variant='bodySmall'>{t('settingsUx.dateHint')}</Text>
    {date ? <Button mode='text' onPress={() => setDate(null)}>{t('settingsUx.clearDate')}</Button> : null}
    <Text variant='titleMedium'>{t('onboarding.dailyGoal')}</Text>
    <View style={styles.row}>{GOALS.map((minutes) => <Button key={minutes} mode={goal === minutes ? 'contained' : 'outlined'} onPress={() => setGoal(minutes)}>{t('onboarding.minutes', { count: minutes })}</Button>)}</View>
    <Button mode='contained' onPress={start}>{t('onboarding.start')}</Button>
  </Screen>;
}
const styles = StyleSheet.create({ row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 } });
