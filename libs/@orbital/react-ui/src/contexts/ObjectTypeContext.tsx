import { createContext, ReactNode, useContext, useState } from "react";

// Define the object type
export type ObjectType = string;

// Define the context value type
export interface ObjectTypeContextValue {
  objectType: ObjectType;
  setObjectType: (type: ObjectType) => void;
}

// Create the context with a default value
const ObjectTypeContext = createContext<ObjectTypeContextValue | undefined>(
  undefined
);

// Provider props
export interface ObjectTypeProviderProps {
  children: ReactNode;
  defaultObjectType?: ObjectType;
  availableTypes?: ObjectType[];
}

// Provider component
export function ObjectTypeProvider({
  children,
  defaultObjectType = "",
  availableTypes = [],
}: ObjectTypeProviderProps) {
  const [objectType, setObjectType] = useState<ObjectType>(defaultObjectType);

  const value: ObjectTypeContextValue = {
    objectType,
    setObjectType,
  };

  return (
    <ObjectTypeContext.Provider value={value}>
      {children}
    </ObjectTypeContext.Provider>
  );
}

// Hook to use the object type context
export function useObjectType(): ObjectTypeContextValue {
  const context = useContext(ObjectTypeContext);
  if (context === undefined) {
    throw new Error("useObjectType must be used within an ObjectTypeProvider");
  }
  return context;
}
