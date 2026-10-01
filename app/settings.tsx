import Constants from 'expo-constants';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Button, Dialog, Portal, Switch, Text, TextInput } from 'react-native-paper';
import { Panel } from '../src/components/Panel';
import { Screen } from '../src/components/Screen';
import { deviceLang } from '../src/i18n';
import { isValidDay } from '../src/logic/date';
import { useProgress } from '../src/store/progress';
import { useSettings } from '../src/store/settings';

const GOALS = [10, 20, 30, 45];

export default function SettingsScreen() {
  const { t } = useTranslation();
  const s = useSettings();
  const resetAll = useProgress((p) => p.resetAll);
  const [dateText, setDateText] = useState(s.examDate ?? '');
  const [confirm, setConfirm] = useState(false);
  const dateOk = dateText === '' || isValidDay(dateText);
  const current = s.lang ?? deviceLang();

  return (
    <Screen>
      <Panel>
        <Text variant='titleMedium'>{`🌐 ${t('settings.language')}`}</Text>
        <View style={styles.row}>
          <Button mode={current === 'fr' ? 'contained' : 'outlined'} onPress={() => s.setLang('fr')}>
            Français
          </Button>
          <Button mode={current === 'en' ? 'contained' : 'outlined'} onPress={() => s.setLang('en')}>
            English
          </Button>
        </View>
      </Panel>

      <Panel>
        <Text variant='titleMedium'>{`📅 ${t('settings.examDate')}`}</Text>
        <TextInput
          mode='outlined'
          placeholder='YYYY-MM-DD'
          value={dateText}
          error={!dateOk}
          autoCapitalize='none'
          keyboardType='numbers-and-punctuation'
          onChangeText={(v) => {
            setDateText(v);
            if (v === '' || isValidDay(v)) s.setExamDate(v === '' ? null : v);
          }}
        />
        <Text variant='titleMedium'>{`🎯 ${t('settings.dailyGoal')}`}</Text>
        <View style={styles.row}>
          {GOALS.map((g) => (
            <Button key={g} mode={s.dailyGoalMin === g ? 'contained' : 'outlined'} onPress={() => s.setDailyGoal(g)}>
              {t('onboarding.minutes', { count: g })}
            </Button>
          ))}
        </View>
      </Panel>

      <Panel>
        <View style={styles.switchRow}>
          <Text style={styles.grow}>{t('settings.reduceMotion')}</Text>
          <Switch value={s.reduceMotion} onValueChange={s.setReduceMotion} />
        </View>
      </Panel>

      <Panel>
        <Text variant='titleMedium'>{`🔒 ${t('settings.privacy')}`}</Text>
        <Text variant='bodyMedium'>{t('settings.privacyBody')}</Text>
      </Panel>

      <Button mode='outlined' textColor='#C62828' onPress={() => setConfirm(true)}>
        {t('settings.reset')}
      </Button>

      <Text variant='bodySmall'>
        {t('settings.version')} {Constants.expoConfig?.version ?? ''}
      </Text>

      <Portal>
        <Dialog visible={confirm} onDismiss={() => setConfirm(false)}>
          <Dialog.Title>{t('settings.resetTitle')}</Dialog.Title>
          <Dialog.Content>
            <Text>{t('settings.resetBody')}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirm(false)}>{t('common.cancel')}</Button>
            <Button
              onPress={() => {
                resetAll();
                setConfirm(false);
              }}
            >
              {t('common.confirm')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  grow: { flex: 1 },
});
