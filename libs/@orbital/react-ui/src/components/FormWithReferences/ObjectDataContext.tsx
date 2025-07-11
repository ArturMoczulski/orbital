import React, { createContext, useContext, useMemo } from "react";

// Define a type for object data entries
type ObjectDataEntry = {
  data: Record<string, any>;
  objectId?: string;
};

// Type for Redux selector function
type SelectorFunction<T> = () => T;

// Define the context type to support multiple objects' data
type ObjectDataContextType = {
  // The main object data for the form
  mainObjectData: ObjectDataEntry;
  // Get object data by key
  getObjectData: (key: string) => ObjectDataEntry | undefined;
  // Update object data by key
  updateObjectData: (
    key: string,
    data: Record<string, any>,
    merge?: boolean
  ) => void;
  // Register new object data
  registerObjectData: (
    key: string,
    data: Record<string, any>,
    objectId?: string
  ) => void;
  // Object data registry (for backward compatibility)
  objectDataRegistry: Record<string, ObjectDataEntry>;
};

const ObjectDataContext = createContext<ObjectDataContextType | null>(null);

export function useObjectData() {
  const context = useContext(ObjectDataContext);
  if (!context) {
    throw new Error("useObjectData must be used within an ObjectDataProvider");
  }
  return context;
}

type ObjectDataProviderProps = {
  children: React.ReactNode;
  // Direct data props
  data: Record<string, any>;
  objectId?: string;
  additionalData?: Record<
    string,
    {
      data: Record<string, any>;
      objectId?: string;
    }
  >;
  // Redux integration props
  dataSelector?: SelectorFunction<Record<string, any>>;
  objectIdSelector?: SelectorFunction<string | undefined>;
  additionalDataSelector?: SelectorFunction<
    Record<
      string,
      {
        data: Record<string, any>;
        objectId?: string;
      }
    >
  >;
  // Optional dispatch function for Redux updates
  dispatch?: (action: any) => void;
  // Optional action creator for Redux updates
  createUpdateAction?: (
    key: string,
    data: Record<string, any>,
    merge?: boolean
  ) => any;
  // Optional callback for data updates (for testing)
  onUpdate?: (key: string, data: Record<string, any>, merge?: boolean) => void;
  // Optional callback for data registration (for testing)
  onRegister?: (
    key: string,
    data: Record<string, any>,
    objectId?: string
  ) => void;
};

export function ObjectDataProvider({
  children,
  // Direct data props
  data,
  objectId,
  additionalData = {},
  // Redux integration props
  dataSelector,
  objectIdSelector,
  additionalDataSelector,
  dispatch,
  createUpdateAction,
  // Callbacks for testing
  onUpdate,
  onRegister,
}: ObjectDataProviderProps) {
  // Use Redux data if selectors are provided, otherwise use props
  const reduxData = dataSelector ? dataSelector() : undefined;
  const reduxObjectId = objectIdSelector ? objectIdSelector() : undefined;
  const reduxAdditionalData = additionalDataSelector
    ? additionalDataSelector()
    : undefined;

  // Combine data from props and Redux
  const finalData = reduxData || data;
  const finalObjectId = reduxObjectId || objectId;
  const finalAdditionalData = reduxAdditionalData || additionalData;

  // Create a memoized object data registry from props/Redux
  const objectDataRegistry = useMemo(() => {
    const registry: Record<string, ObjectDataEntry> = {
      main: { data: finalData, objectId: finalObjectId },
    };

    // Add all additional object data to the registry
    Object.entries(finalAdditionalData).forEach(
      ([key, { data: dataEntry, objectId }]) => {
        registry[key] = {
          data: dataEntry,
          objectId,
        };
      }
    );

    return registry;
  }, [finalData, finalObjectId, finalAdditionalData]);

  // Function to get object data by key
  const getObjectData = (key: string) => {
    return objectDataRegistry[key];
  };

  // Function to update object data
  const updateObjectData = (
    key: string,
    newData: Record<string, any>,
    merge = true
  ) => {
    // If Redux integration is enabled, dispatch an action
    if (dispatch && createUpdateAction) {
      dispatch(createUpdateAction(key, newData, merge));
    }

    // If testing callback is provided, call it
    if (onUpdate) {
      onUpdate(key, newData, merge);
    }
  };

  // Function to register new object data
  const registerObjectData = (
    key: string,
    newData: Record<string, any>,
    objectId?: string
  ) => {
    // If Redux integration is enabled, dispatch an action
    if (dispatch && createUpdateAction) {
      dispatch(createUpdateAction(key, newData, false));
    }

    // If testing callback is provided, call it
    if (onRegister) {
      onRegister(key, newData, objectId);
    }
  };

  // Create the context value
  const contextValue = useMemo(
    () => ({
      mainObjectData: objectDataRegistry.main,
      objectDataRegistry,
      getObjectData,
      updateObjectData,
      registerObjectData,
    }),
    [objectDataRegistry]
  );

  return (
    <ObjectDataContext.Provider value={contextValue}>
      {children}
    </ObjectDataContext.Provider>
  );
}

// Helper types and functions for Redux integration

// Example Redux action types
export const UPDATE_OBJECT_DATA = "UPDATE_OBJECT_DATA";
export const REGISTER_OBJECT_DATA = "REGISTER_OBJECT_DATA";

// Example action creators
export function createUpdateObjectDataAction(
  key: string,
  data: Record<string, any>,
  merge = true
) {
  return {
    type: UPDATE_OBJECT_DATA,
    payload: {
      key,
      data,
      merge,
    },
  };
}

export function createRegisterObjectDataAction(
  key: string,
  data: Record<string, any>,
  objectId?: string
) {
  return {
    type: REGISTER_OBJECT_DATA,
    payload: {
      key,
      data,
      objectId,
    },
  };
}

// Example reducer function
export function objectDataReducer(
  state: Record<string, ObjectDataEntry> = {
    main: { data: {}, objectId: undefined },
  },
  action: any
) {
  switch (action.type) {
    case UPDATE_OBJECT_DATA: {
      const { key, data, merge } = action.payload;
      const existingEntry = state[key];

      if (!existingEntry) {
        return {
          ...state,
          [key]: { data },
        };
      }

      return {
        ...state,
        [key]: {
          ...existingEntry,
          data: merge ? { ...existingEntry.data, ...data } : data,
        },
      };
    }
    case REGISTER_OBJECT_DATA: {
      const { key, data, objectId } = action.payload;
      return {
        ...state,
        [key]: { data, objectId },
      };
    }
    default:
      return state;
  }
}
