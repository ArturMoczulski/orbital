import { createContext, ReactNode, useContext, useState } from "react";

// Define the context value type
export interface WorldContextValue {
  worldId: string | null;
  setWorldId: (id: string | null) => void;
  worldName: string | null;
  setWorldName: (name: string | null) => void;
}

// Create the context with a default value
const WorldContext = createContext<WorldContextValue | undefined>(undefined);

// Provider props
export interface WorldProviderProps {
  children: ReactNode;
  defaultWorldId?: string | null;
  defaultWorldName?: string | null;
}

// Provider component
export function WorldProvider({
  children,
  defaultWorldId = null,
  defaultWorldName = null,
}: WorldProviderProps) {
  const [worldId, setWorldId] = useState<string | null>(defaultWorldId);
  const [worldName, setWorldName] = useState<string | null>(defaultWorldName);

  const value: WorldContextValue = {
    worldId,
    setWorldId,
    worldName,
    setWorldName,
  };

  return (
    <WorldContext.Provider value={value}>{children}</WorldContext.Provider>
  );
}

// Hook to use the world context
export function useWorld(): WorldContextValue {
  const context = useContext(WorldContext);
  if (context === undefined) {
    throw new Error("useWorld must be used within a WorldProvider");
  }
  return context;
}
