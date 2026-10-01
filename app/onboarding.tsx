import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { Screen } from '../src/components/Screen';
import { deviceLang } from '../src/i18n';
import { isValidDay } from '../src/logic/date';
import { useSettings } from '../src/store/settings';
import type { Lang } from '../src/types';

const GOALS = [10, 20, 30, 45];

export default function Onboarding() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const complete = useSettings((s) => s.completeOnboarding);
  const [lang, setLang] = useState<Lang>(deviceLang());
  const [date, setDate] = useState('');
  const [goal, setGoal] = useState(20);
  const dateOk = date === '' || isValidDay(date);

  const pickLang = (l: Lang) => {
    setLang(l);
    void i18n.changeLanguage(l);
  };

  const start = () => {
    complete({ lang, examDate: date === '' ? null : date, dailyGoalMin: goal });
    router.replace('/');
  };

  return (
    <Screen>
      <Text variant='headlineMedium'>{t('onboarding.title')}</Text>
      <Text variant='bodyLarge'>{t('onboarding.subtitle')}</Text>

      <Text variant='titleMedium'>{t('onboarding.language')}</Text>
      <View style={styles.row}>
        <Button mode={lang === 'fr' ? 'contained' : 'outlined'} onPress={() => pickLang('fr')}>
          Français
        </Button>
        <Button mode={lang === 'en' ? 'contained' : 'outlined'} onPress={() => pickLang('en')}>
          English
        </Button>
      </View>

      <TextInput
        label={t('onboarding.examDate')}
        placeholder='YYYY-MM-DD'
        value={date}
        onChangeText={setDate}
        error={!dateOk}
        keyboardType='numbers-and-punctuation'
        autoCapitalize='none'
      />
      <Text variant='bodySmall' style={dateOk ? undefined : styles.error}>
        {dateOk ? t('onboarding.examDateHint') : t('onboarding.dateInvalid')}
      </Text>

      <Text variant='titleMedium'>{t('onboarding.dailyGoal')}</Text>
      <View style={styles.row}>
        {GOALS.map((g) => (
          <Button key={g} mode={goal === g ? 'contained' : 'outlined'} onPress={() => setGoal(g)}>
            {t('onboarding.minutes', { count: g })}
          </Button>
        ))}
      </View>

      <Button mode='contained' disabled={!dateOk} onPress={start}>
        {t('onboarding.start')}
      </Button>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  error: { color: '#C62828' },
});
