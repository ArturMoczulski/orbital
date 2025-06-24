import { configureStore } from "@reduxjs/toolkit";

// We'll use dynamic imports to handle the generated APIs
// This avoids TypeScript errors before the files are generated
let adminApi: any = {
  reducerPath: "adminApi",
  reducer: {},
  middleware: () => {},
};

let worldApi: any = {
  reducerPath: "worldApi",
  reducer: {},
  middleware: () => {},
};

// Try to import the generated Admin API if it exists
try {
  const generatedAdminApi = require("./services/adminApi.generated");
  adminApi = generatedAdminApi.adminApi;
} catch (error) {
  console.warn(
    "Admin API not generated yet. Run 'yarn generate:admin-api' to create it."
  );
}

// Try to import the generated World API if it exists
try {
  const generatedWorldApi = require("./services/worldApi.generated");
  worldApi = generatedWorldApi.worldApi;
} catch (error) {
  console.warn(
    "World API not generated yet. Run 'yarn generate:world-api' to create it."
  );
}

export const store = configureStore({
  reducer: {
    [adminApi.reducerPath]: adminApi.reducer,
    [worldApi.reducerPath]: worldApi.reducer,
  },
  middleware: (getDefaultMiddleware) => {
    const defaultMiddleware = getDefaultMiddleware();
    const middlewareArray = [];

    // Add API middleware if they exist
    if (adminApi.middleware) {
      middlewareArray.push(adminApi.middleware);
    }

    if (worldApi.middleware) {
      middlewareArray.push(worldApi.middleware);
    }

    return defaultMiddleware.concat(...middlewareArray);
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
