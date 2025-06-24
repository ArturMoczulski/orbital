import { configureStore } from "@reduxjs/toolkit";

// We'll use dynamic imports to handle the generated APIs
// This avoids TypeScript errors before the files are generated
let adminApi: any = {
  reducerPath: "adminApi",
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

export const store = configureStore({
  reducer: {
    [adminApi.reducerPath]: adminApi.reducer,
  },
  middleware: (getDefaultMiddleware) => {
    const defaultMiddleware = getDefaultMiddleware();
    const middlewareArray = [];

    // Add API middleware if they exist
    if (adminApi.middleware) {
      middlewareArray.push(adminApi.middleware);
    }

    return defaultMiddleware.concat(...middlewareArray);
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
