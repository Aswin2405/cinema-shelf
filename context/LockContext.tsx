import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";

const LOCK_KEY = "@watchlist/locked";

interface LockContextType {
  isLocked: boolean;
  lockApp: () => void;
  unlockApp: () => Promise<boolean>;
}

const LockContext = createContext<LockContextType | null>(null);

export function LockProvider({ children }: { children: ReactNode }) {
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(LOCK_KEY)
      .then((val) => { if (val === "1") setIsLocked(true); })
      .catch(() => {});
  }, []);

  const lockApp = useCallback(() => {
    setIsLocked(true);
    AsyncStorage.setItem(LOCK_KEY, "1").catch(() => {});
  }, []);

  const unlockApp = useCallback(async (): Promise<boolean> => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (hasHardware && isEnrolled) {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: "Unlock Watchlist",
          fallbackLabel: "Use Passcode",
          disableDeviceFallback: false,
        });
        if (!result.success) return false;
      }
      setIsLocked(false);
      AsyncStorage.setItem(LOCK_KEY, "0").catch(() => {});
      return true;
    } catch {
      return false;
    }
  }, []);

  return (
    <LockContext.Provider value={{ isLocked, lockApp, unlockApp }}>
      {children}
    </LockContext.Provider>
  );
}

export function useLock() {
  const ctx = useContext(LockContext);
  if (!ctx) throw new Error("useLock must be used within LockProvider");
  return ctx;
}
