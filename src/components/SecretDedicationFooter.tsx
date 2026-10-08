import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AccessibilityInfo, AppState, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { dedicationCopy } from '../content/loveDedication';
import { feedbackHaptic } from '../hooks/useHaptics';
import { useSettings } from '../store/settings';
import { HeartRain } from './HeartRain';
import { QuranDedicationCard } from './QuranDedicationCard';

const STORAGE_KEY = 'jihen-dedication-v1';
export function SecretDedicationFooter() {
  const { i18n } = useTranslation();
  const copy = i18n.language.startsWith('fr') ? dedicationCopy.fr : dedicationCopy.en;
  const theme = useTheme(); const insets = useSafeAreaInsets();
  const appReduce = useSettings((s) => s.reduceMotion);
  const [deviceReduce, setDeviceReduce] = useState(true);
  const [screenReader, setScreenReader] = useState(false);
  const [enabled, setEnabled] = useState(false); const [loaded, setLoaded] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [visible, setVisible] = useState(false); const [celebrating, setCelebrating] = useState(false);
  const [rainKey, setRainKey] = useState(0);
  const mounted = useRef(false); const active = useRef(false); const visibleRef = useRef(false);
  const taps = useRef({ count: 0, started: 0 }); const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canAnimate = !appReduce && !deviceReduce && !screenReader;

  const stop = useCallback(() => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null; taps.current = { count: 0, started: 0 }; visibleRef.current = false;
    setCelebrating(false); setVisible(false);
  }, []);
  useFocusEffect(useCallback(() => {
    active.current = true;
    return () => { active.current = false; stop(); };
  }, [stop]));
  useEffect(() => {
    mounted.current = true;
    let motionVersion = 0; let readerVersion = 0;
    void AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      if (mounted.current) { setEnabled(value === 'true'); setLoaded(true); }
    }).catch(() => { if (mounted.current) { setStorageError(true); setLoaded(true); } });
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (mounted.current && motionVersion === 0) setDeviceReduce(value);
    }).catch(() => undefined);
    void AccessibilityInfo.isScreenReaderEnabled().then((value) => {
      if (mounted.current && readerVersion === 0) setScreenReader(value);
    }).catch(() => undefined);
    const motion = AccessibilityInfo.addEventListener('reduceMotionChanged', (value) => { motionVersion += 1; setDeviceReduce(value); });
    const reader = AccessibilityInfo.addEventListener('screenReaderChanged', (value) => { readerVersion += 1; setScreenReader(value); });
    const state = AppState.addEventListener('change', (value) => { if (value !== 'active') stop(); });
    return () => {
      mounted.current = false; motion.remove(); reader.remove(); state.remove();
      if (timer.current !== null) clearTimeout(timer.current);
    };
  }, [stop]);
  useEffect(() => {
    if (canAnimate) return;
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
    const finish = setTimeout(() => setCelebrating(false), 0);
    return () => clearTimeout(finish);
  }, [canAnimate]);
  const save = (value: boolean) => {
    setEnabled(value); setStorageError(false);
    void AsyncStorage.setItem(STORAGE_KEY, String(value)).catch(() => {
      if (mounted.current) setStorageError(true);
    });
  };
  const celebrate = () => {
    if (!active.current) return;
    if (timer.current !== null) clearTimeout(timer.current);
    setRainKey((value) => value + 1); setCelebrating(canAnimate);
    if (canAnimate) timer.current = setTimeout(() => { timer.current = null; if (mounted.current) setCelebrating(false); }, 6000);
  };
  const open = (first: boolean) => {
    if (!loaded || !active.current || visibleRef.current) return;
    visibleRef.current = true; setVisible(true);
    if (first) { save(true); celebrate(); void feedbackHaptic('toggle').catch(() => undefined); }
  };
  const tap = () => {
    if (!loaded || visibleRef.current) return;
    if (enabled) { open(false); return; }
    const now = Date.now();
    if (!taps.current.count || now - taps.current.started > 3000) taps.current = { count: 1, started: now };
    else taps.current.count += 1;
    if (taps.current.count >= 5) { taps.current = { count: 0, started: 0 }; open(true); }
  };
  const ink = theme.dark ? '#F3C4D0' : '#83384F';
  return <View style={styles.footer}>
    {enabled && !celebrating ? <QuranDedicationCard /> : null}
    <Pressable accessibilityRole='button' accessibilityLabel={enabled ? copy.footer : copy.clue}
      accessibilityHint={screenReader ? copy.access : undefined}
      accessibilityActions={[{ name: 'activate', label: enabled ? copy.open : copy.access }]}
      onAccessibilityAction={(event) => { if (event.nativeEvent.actionName === 'activate') open(!enabled); }}
      onPress={screenReader ? () => open(!enabled) : tap}
      disabled={!loaded} style={({ pressed }) => [styles.trigger, pressed && { opacity: 0.75 }]}>
      <Text style={[styles.footerText, { color: enabled ? ink : theme.colors.onSurfaceVariant }]}>{enabled ? copy.footer : copy.clue}</Text>
    </Pressable>
    {storageError ? <Text variant='bodySmall' accessibilityLiveRegion='polite'>{copy.storageError}</Text> : null}
    <Modal visible={visible} animationType='none' onRequestClose={stop} presentationStyle='fullScreen'>
      <View style={[styles.modal, { backgroundColor: theme.colors.background, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.top}><Button onPress={stop}>{copy.close}</Button></View>
        <ScrollView contentContainerStyle={styles.letter}>
          {celebrating ? <HeartRain key={rainKey} /> : <Text accessible={false} style={[styles.staticHeart, { color: ink }]}>♡</Text>}
          <Text accessibilityRole='header' style={[styles.title, { color: ink }]}>{copy.title}</Text>
          <Text style={[styles.message, { color: theme.colors.onSurface }]}>{copy.message}</Text>
          {!celebrating ? <QuranDedicationCard full /> : null}
          <Text style={[styles.footerText, { color: ink }]}>{copy.footer}</Text>
          <Button mode='outlined' disabled={celebrating || !canAnimate} onPress={celebrate}>{copy.replay}</Button>
          <Button onPress={() => { save(false); stop(); }}>{copy.hide}</Button>
          {storageError ? <Text variant='bodySmall' accessibilityLiveRegion='polite'>{copy.storageError}</Text> : null}
        </ScrollView>
      </View>
    </Modal>
  </View>;
}
const styles = StyleSheet.create({
  footer: { gap: 12, paddingTop: 12, paddingBottom: 8 },
  trigger: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 12 },
  footerText: { fontSize: 15, lineHeight: 24, textAlign: 'center' },
  modal: { flex: 1 }, top: { alignItems: 'flex-end', paddingHorizontal: 12 },
  letter: { width: '100%', maxWidth: 640, alignSelf: 'center', padding: 24, gap: 24, paddingBottom: 32 },
  title: { fontSize: 28, lineHeight: 40, textAlign: 'center', fontWeight: '600' },
  message: { fontSize: 20, lineHeight: 34, textAlign: 'center' },
  staticHeart: { fontSize: 48, lineHeight: 64, textAlign: 'center' },
});
