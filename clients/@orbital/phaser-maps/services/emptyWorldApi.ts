import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const emptyWorldSplitApi = createApi({
  reducerPath: "worldApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api/world" }),
  tagTypes: ["Area"],
  endpoints: () => ({}),
});
