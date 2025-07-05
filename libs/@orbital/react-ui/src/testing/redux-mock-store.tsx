import { configureStore } from "@reduxjs/toolkit";
import React from "react";
import { Provider } from "react-redux";

/**
 * Creates a mock Redux store for testing components that use Redux
 * @param reducers An object mapping reducer paths to reducer functions
 * @param middleware Optional middleware to include in the store
 * @returns A configured Redux store
 */
export const createMockStore = (
  reducers: Record<string, any>,
  middleware?: any[]
) => {
  return configureStore({
    reducer: reducers,
    middleware: (getDefaultMiddleware) =>
      middleware
        ? getDefaultMiddleware().concat(middleware)
        : getDefaultMiddleware(),
  });
};

/**
 * A wrapper component that provides a Redux store for testing
 */
export const ReduxProvider: React.FC<{
  children: React.ReactNode;
  reducers: Record<string, any>;
  middleware?: any[];
}> = ({ children, reducers, middleware }) => {
  const store = createMockStore(reducers, middleware);

  // Expose the store on the window object for Cypress tests
  if (typeof window !== "undefined" && window.Cypress) {
    // @ts-ignore
    window.__REDUX_STORE__ = store;
  }

  return <Provider store={store}>{children}</Provider>;
};
