import { useCallback } from "react";

type LocalStorageKeyApi = {
  getItem: () => string | null;
  setItem: (value: string) => void;
};

export function useLocalStorageKey(keyName: string): LocalStorageKeyApi {
  const getItem = useCallback((): string | null => {
    if (typeof window === "undefined") return null;
    try {
      return localStorage.getItem(keyName);
    } catch {
      return null;
    }
  }, [keyName]);

  const setItem = useCallback(
    (value: string): void => {
      if (typeof window === "undefined") return;
      try {
        localStorage.setItem(keyName, value);
      } catch {
        /* private mode / storage unavailable */
      }
    },
    [keyName],
  );

  return { getItem, setItem };
}
