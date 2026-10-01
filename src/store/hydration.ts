import { useEffect, useState } from 'react';
import { useProgress } from './progress';
import { useSettings } from './settings';

const ready = () => useSettings.persist.hasHydrated() && useProgress.persist.hasHydrated();

export function useHydrated(): boolean {
  const [ok, setOk] = useState(ready());
  useEffect(() => {
    const check = () => setOk(ready());
    const off1 = useSettings.persist.onFinishHydration(check);
    const off2 = useProgress.persist.onFinishHydration(check);
    check();
    return () => {
      off1();
      off2();
    };
  }, []);
  return ok;
}
