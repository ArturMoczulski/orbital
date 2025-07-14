import React, { createContext, useContext, useMemo } from "react";
import {
  ArrayObjectIdContext,
  ArrayObjectTypeContext,
} from "./ArrayObjectProvider";

// Define a type for array item data
type ArrayItemData = Record<string, any>;

// Type for Redux selector function
type SelectorFunction<T> = () => T;

// Define the context type to support array data
type ArrayObjectDataContextType = {
  // The array items
  items: ArrayItemData[];
  // Update the entire array
  setItems: (items: ArrayItemData[]) => void;
  // Add a new item to the array
  addItem: (item?: ArrayItemData) => void;
  // Update an item at a specific index
  updateItem: (index: number, item: ArrayItemData, merge?: boolean) => void;
  // Remove an item at a specific index
  removeItem: (index: number) => void;
};

const ArrayObjectDataContext = createContext<ArrayObjectDataContextType | null>(
  null
);

export function useArrayObjectData() {
  const context = useContext(ArrayObjectDataContext);
  if (!context) {
    throw new Error(
      "useArrayObjectData must be used within an ArrayObjectDataProvider"
    );
  }
  return context;
}

type ArrayObjectDataProviderProps = {
  children: React.ReactNode;
  // Direct data props
  items?: ArrayItemData[];
  onChange: (items: ArrayItemData[]) => void;
  // Redux integration props
  itemsSelector?: SelectorFunction<ArrayItemData[]>;
  dispatch?: (action: any) => void;
  createUpdateAction?: (
    objectType: string,
    objectId: string,
    data: Record<string, any>
  ) => any;
  createRemoveAction?: (key: string, index: number) => any;
  // Optional callback for data updates (for testing)
  onUpdate?: (items: ArrayItemData[]) => void;
};

// Action types for array operations
export const UPDATE_ARRAY_ITEMS = "UPDATE_ARRAY_ITEMS";
export const ADD_ARRAY_ITEM = "ADD_ARRAY_ITEM";
export const UPDATE_ARRAY_ITEM = "UPDATE_ARRAY_ITEM";
export const REMOVE_ARRAY_ITEM = "REMOVE_ARRAY_ITEM";

// Action creators for array operations
export function createUpdateArrayItemsAction(
  objectType: string,
  objectId: string,
  items: ArrayItemData[]
) {
  return {
    type: UPDATE_ARRAY_ITEMS,
    payload: {
      objectType,
      objectId,
      items,
    },
  };
}

export function createAddArrayItemAction(
  objectType: string,
  objectId: string,
  item: ArrayItemData
) {
  return {
    type: ADD_ARRAY_ITEM,
    payload: {
      objectType,
      objectId,
      item,
    },
  };
}

export function createUpdateArrayItemAction(
  objectType: string,
  objectId: string,
  index: number,
  item: ArrayItemData,
  merge: boolean = true
) {
  return {
    type: UPDATE_ARRAY_ITEM,
    payload: {
      objectType,
      objectId,
      index,
      item,
      merge,
    },
  };
}

export function createRemoveArrayItemAction(
  objectType: string,
  objectId: string,
  index: number
) {
  return {
    type: REMOVE_ARRAY_ITEM,
    payload: {
      objectType,
      objectId,
      index,
    },
  };
}

export function ArrayObjectDataProvider({
  children,
  // Direct data props
  items,
  onChange,
  // Redux integration props
  itemsSelector,
  dispatch,
  createUpdateAction,
  createRemoveAction,
  // Callbacks for testing
  onUpdate,
}: ArrayObjectDataProviderProps) {
  // Get the latest data directly from the selector on each render
  // This ensures we always have the most up-to-date data from Redux
  const reduxItems = itemsSelector ? itemsSelector() : undefined;

  // Combine data from props and Redux
  const finalItems = reduxItems || items || [];

  // Get the object type and array ID from context
  const objectType = React.useContext(ArrayObjectTypeContext);
  const arrayId = React.useContext(ArrayObjectIdContext);

  // Function to update the entire array
  const setItems = (newItems: ArrayItemData[]) => {
    // If Redux integration is enabled, dispatch an action
    if (dispatch && objectType && arrayId) {
      // Dispatch a specific array update action
      dispatch(createUpdateArrayItemsAction(objectType, arrayId, newItems));
    } else {
      // Otherwise just call the onChange callback
      onChange(newItems);
    }

    // If testing callback is provided, call it
    if (onUpdate) {
      onUpdate(newItems);
    }
  };

  // Function to add a new item to the array
  const addItem = (item?: ArrayItemData) => {
    const newItem = item || {};
    const newItems = [...finalItems, newItem];

    // If Redux integration is enabled, dispatch an action
    if (dispatch && objectType && arrayId) {
      // Dispatch a specific add item action
      dispatch(createAddArrayItemAction(objectType, arrayId, newItem));
    } else {
      // Otherwise just call the onChange callback
      onChange(newItems);
    }

    // If testing callback is provided, call it
    if (onUpdate) {
      onUpdate(newItems);
    }
  };

  // Function to update an item at a specific index
  const updateItem = (
    index: number,
    item: ArrayItemData,
    merge: boolean = true
  ) => {
    if (index < 0 || index >= finalItems.length) {
      console.error(
        `Invalid index ${index} for array of length ${finalItems.length}`
      );
      return;
    }

    const newItems = [...finalItems];
    newItems[index] = merge ? { ...newItems[index], ...item } : item;

    // If Redux integration is enabled, dispatch an action
    if (dispatch && objectType && arrayId) {
      // Dispatch a specific update item action
      dispatch(
        createUpdateArrayItemAction(objectType, arrayId, index, item, merge)
      );
    } else {
      // Otherwise just call the onChange callback
      onChange(newItems);
    }

    // If testing callback is provided, call it
    if (onUpdate) {
      onUpdate(newItems);
    }
  };

  // Function to remove an item at a specific index
  const removeItem = (index: number) => {
    console.log("ArrayObjectDataContext.removeItem called with index:", index);
    console.log("finalItems:", finalItems);

    if (index < 0 || index >= finalItems.length) {
      console.error(
        `Invalid index ${index} for array of length ${finalItems.length}`
      );
      return;
    }

    const newItems = [...finalItems];
    newItems.splice(index, 1);
    console.log("newItems after splice:", newItems);

    // If Redux integration is enabled, dispatch an action
    if (dispatch && objectType && arrayId) {
      console.log("Using Redux integration");
      console.log("dispatch:", dispatch);
      console.log("objectType:", objectType);
      console.log("arrayId:", arrayId);
      console.log("createRemoveAction:", createRemoveAction);

      // Use custom remove action if provided, otherwise use default
      if (createRemoveAction) {
        console.log("Using custom remove action");
        const action = createRemoveAction(arrayId, index);
        console.log("Action created:", action);
        dispatch(action);
        console.log("Action dispatched");
      } else {
        // Dispatch a specific remove item action
        console.log("Using default remove action");
        const action = createRemoveArrayItemAction(objectType, arrayId, index);
        console.log("Action created:", action);
        dispatch(action);
        console.log("Action dispatched");
      }
    } else {
      // Otherwise just call the onChange callback
      console.log("Using onChange callback");
      onChange(newItems);
    }

    // If testing callback is provided, call it
    if (onUpdate) {
      console.log("Calling onUpdate callback");
      onUpdate(newItems);
    }
  };

  // Create the context value
  // Include all dependencies that might change to ensure the context updates
  const contextValue = useMemo(
    () => ({
      items: finalItems,
      setItems,
      addItem,
      updateItem,
      removeItem,
    }),
    [finalItems, dispatch, objectType, arrayId, onChange, onUpdate]
  );

  return (
    <ArrayObjectDataContext.Provider value={contextValue}>
      {children}
    </ArrayObjectDataContext.Provider>
  );
}
