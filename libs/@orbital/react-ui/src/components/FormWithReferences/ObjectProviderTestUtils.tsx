import { useEffect, useState } from "react";
import { useObject } from "./ObjectProvider";

// Mock Redux store
export class MockReduxStore {
  private state: Record<string, any> = {
    objectData: {
      main: { data: {}, objectId: undefined },
    },
  };

  // Add a callback for state changes
  private listeners: (() => void)[] = [];

  getState() {
    return this.state;
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  dispatch(action: any) {
    // Simple reducer logic
    if (action.type === "UPDATE_OBJECT_DATA") {
      const { key, data, merge } = action.payload;
      const existingEntry = this.state.objectData[key];

      if (!existingEntry) {
        this.state.objectData[key] = { data };
      } else {
        this.state.objectData[key] = {
          ...existingEntry,
          data: merge ? { ...existingEntry.data, ...data } : data,
        };
      }
    } else if (action.type === "REGISTER_OBJECT_DATA") {
      const { key, data, objectId } = action.payload;
      this.state.objectData[key] = { data, objectId };
    }

    // Notify listeners
    this.listeners.forEach((listener) => listener());

    // Trigger a re-render by updating a timestamp
    this.state.lastUpdate = Date.now();
    return action;
  }

  // Create selectors
  createDataSelector(key: string) {
    return () => this.state.objectData[key]?.data || {};
  }

  createObjectIdSelector(key: string) {
    return () => this.state.objectData[key]?.objectId;
  }

  createAdditionalDataSelector() {
    const additionalData: Record<
      string,
      { data: Record<string, any>; objectId?: string }
    > = {};

    Object.entries(this.state.objectData).forEach(([key, value]) => {
      if (key !== "main") {
        additionalData[key] = value as any;
      }
    });

    return () => additionalData;
  }
}

// Create action creators
export const createUpdateAction = (
  key: string,
  data: Record<string, any>,
  merge = true
) => ({
  type: "UPDATE_OBJECT_DATA",
  payload: { key, data, merge },
});

// Test component that uses the useObject hook with Redux store subscription
export const ObjectConsumer = ({
  objectKey = "main",
  store,
}: {
  objectKey?: string;
  store?: MockReduxStore;
}) => {
  const { schema, objectType, data, objectId, updateData } =
    useObject(objectKey);

  // Force re-render when Redux store changes
  const [, forceUpdate] = useState({});

  useEffect(() => {
    if (store) {
      const unsubscribe = store.subscribe(() => {
        forceUpdate({});
      });
      return unsubscribe;
    }
  }, [store]);

  return (
    <div>
      <div data-testid="object-type">{objectType || "No Type"}</div>
      <div data-testid="object-data">{JSON.stringify(data)}</div>
      <div data-testid="object-id">{objectId || "No ID"}</div>
      <div data-testid="has-schema">{schema ? "Has Schema" : "No Schema"}</div>
      <button
        data-testid="update-data-button"
        onClick={() => {
          updateData({ updated: true, timestamp: Date.now() });
        }}
      >
        Update Data
      </button>
      <button
        data-testid="replace-data-button"
        onClick={() => {
          updateData({ completely: "new", data: "structure" }, false);
        }}
      >
        Replace Data
      </button>
    </div>
  );
};

// Test component that will throw an error when used outside provider
export const ErrorComponent = () => {
  try {
    useObject();
    return <div>This should not render</div>;
  } catch (error) {
    return <div data-testid="error-message">{(error as Error).message}</div>;
  }
};
