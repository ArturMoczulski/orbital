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
  // Array context (optional)
  arrayIndex?: number;
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
    merge?: boolean,
    arrayIndex?: number
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
  // Array context
  arrayIndex,
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
  // Use React's useState to track the latest data from Redux
  const [reduxData, setReduxData] = React.useState(
    dataSelector ? dataSelector() : undefined
  );
  const [reduxObjectId, setReduxObjectId] = React.useState(
    objectIdSelector ? objectIdSelector() : undefined
  );
  const [reduxAdditionalData, setReduxAdditionalData] = React.useState(
    additionalDataSelector ? additionalDataSelector() : undefined
  );

  // Initialize state with data from selectors
  React.useEffect(() => {
    if (dataSelector) {
      setReduxData(dataSelector());
    }

    if (objectIdSelector) {
      setReduxObjectId(objectIdSelector());
    }

    if (additionalDataSelector) {
      setReduxAdditionalData(additionalDataSelector());
    }
  }, [dataSelector, objectIdSelector, additionalDataSelector]);

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
      const action = createUpdateAction(key, newData, merge, arrayIndex);
      dispatch(action);

      // Immediately update local state to reflect the change
      if (key === "main" && dataSelector) {
        // For main data, update with the new data
        const currentData = dataSelector();
        const updatedData = merge ? { ...currentData, ...newData } : newData;
        setReduxData(updatedData);
      } else if (additionalDataSelector) {
        // For additional data, update the specific key
        const currentAdditionalData = additionalDataSelector();
        if (currentAdditionalData && currentAdditionalData[key]) {
          const updatedAdditionalData = {
            ...currentAdditionalData,
            [key]: {
              ...currentAdditionalData[key],
              data: merge
                ? { ...currentAdditionalData[key].data, ...newData }
                : newData,
            },
          };
          setReduxAdditionalData(updatedAdditionalData);
        }
      }
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
      dispatch(createUpdateAction(key, newData, false, arrayIndex));

      // Immediately update local state to reflect the registration
      if (key === "main" && dataSelector) {
        setReduxData(newData);
        if (objectIdSelector && objectId) {
          setReduxObjectId(objectId);
        }
      } else if (additionalDataSelector) {
        const currentAdditionalData = additionalDataSelector() || {};
        const updatedAdditionalData = {
          ...currentAdditionalData,
          [key]: { data: newData, objectId },
        };
        setReduxAdditionalData(updatedAdditionalData);
      }
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
  merge = true,
  arrayIndex?: number
) {
  return {
    type: UPDATE_OBJECT_DATA,
    payload: {
      key,
      data,
      merge,
      arrayIndex,
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
