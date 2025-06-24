import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const baseSplitApi = createApi({
  reducerPath: "adminApi",
  // Wrap baseQuery to add request/response logging
  baseQuery: async (args, api, extraOptions) => {
    const rawQuery = fetchBaseQuery({ baseUrl: "/api/admin" });
    console.log(`[RTK Query] [${api.endpoint}] Request:`, args);
    const result = await rawQuery(args, api, extraOptions);
    if (result.error) {
      console.error(`[RTK Query] [${api.endpoint}] Error:`, result.error);
    } else {
      console.log(`[RTK Query] [${api.endpoint}] Data:`, result.data);
    }
    return result;
  },
  tagTypes: ["Area"] as const,
  endpoints: () => ({}),
});
