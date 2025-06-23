import { configureStore } from "@reduxjs/toolkit";
import { areaApi } from "./services/areaApi";

export const store = configureStore({
  reducer: {
    [areaApi.reducerPath]: areaApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(areaApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
