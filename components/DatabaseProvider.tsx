import React, { ReactNode } from "react";

// Web: expo-sqlite is not supported — children render directly, storage uses AsyncStorage
export function DatabaseProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
