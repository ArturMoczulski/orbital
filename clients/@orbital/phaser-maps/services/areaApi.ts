import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { AreaMapProps } from "@orbital/core/src/types/area-map";

export interface Area {
  id: string;
  parentId?: string;
  name: string;
  areaMap?: AreaMapProps;
}

export const areaApi = createApi({
  reducerPath: "areaApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["Area"],
  endpoints: (builder) => ({
    getAreas: builder.query<Area[], void>({
      query: () => "/areas",
      providesTags: ["Area"],
    }),
    getArea: builder.query<Area, string>({
      query: (id) => `/areas/${id}`,
      providesTags: (result, error, id) => [{ type: "Area", id }],
    }),
  }),
});

export const { useGetAreasQuery, useGetAreaQuery } = areaApi;
