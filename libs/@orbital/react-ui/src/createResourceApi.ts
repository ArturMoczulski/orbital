import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { capitalize } from "lodash";

type CrudMethod = "getList" | "getById" | "create" | "update" | "patch";

interface CreateResourceApiOptions {
  baseUrl?: string;
  include?: CrudMethod[];
}

/**
 * Factory to generate RTK Query CRUD endpoints for a given resource.
 * @param resourceClass The resource class constructor (e.g. Area). The class name will be used as the resource name.
 * @param options       Configuration options (baseUrl and include list).
 * @param extendEndpoints Optional hook to add more endpoints.
 */
export function createResourceApi<T, IDType extends string | number = string>(
  resourceClass: new (...args: any[]) => T,
  options: CreateResourceApiOptions = {},
  extendEndpoints?: (builder: any, endpoints: Record<string, any>) => void
) {
  const resourceName = resourceClass.name.toLowerCase();

  const {
    baseUrl = "/api",
    include = ["getList", "getById", "create", "update", "patch"],
  } = options;

  const reducerPath = `${resourceName}Api`;
  const tagType = capitalize(resourceName);

  const api = createApi({
    reducerPath,
    baseQuery: fetchBaseQuery({ baseUrl }),
    tagTypes: [tagType],
    endpoints: (builder) => {
      const endpoints: Record<string, any> = {};

      if (include.includes("getList")) {
        endpoints[`get${tagType}s`] = builder.query<T[], void>({
          query: () => `/${resourceName}s`,
          providesTags: (result) =>
            result
              ? [
                  ...result.map((item: any) => ({
                    type: tagType,
                    id: item.id,
                  })),
                  { type: tagType, id: "LIST" },
                ]
              : [{ type: tagType, id: "LIST" }],
        });
      }

      if (include.includes("getById")) {
        endpoints[`get${tagType}`] = builder.query<T, IDType>({
          query: (id) => `/${resourceName}s/${id}`,
          providesTags: (result, error, id) => [{ type: tagType, id }],
        });
      }

      if (include.includes("create")) {
        endpoints[`create${tagType}`] = builder.mutation<T, Partial<T>>({
          query: (body) => ({ url: `/${resourceName}s`, method: "POST", body }),
          invalidatesTags: [{ type: tagType, id: "LIST" }],
        });
      }

      if (include.includes("update")) {
        endpoints[`update${tagType}`] = builder.mutation<T, T & { id: IDType }>(
          {
            query: ({ id, ...body }) => ({
              url: `/${resourceName}s/${id}`,
              method: "PUT",
              body,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: tagType, id }],
          }
        );
      }

      if (include.includes("patch")) {
        endpoints[`patch${tagType}`] = builder.mutation<
          T,
          Partial<T> & { id: IDType }
        >({
          query: ({ id, ...patch }) => ({
            url: `/${resourceName}s/${id}`,
            method: "PATCH",
            body: patch,
          }),
          invalidatesTags: (result, error, { id }) => [{ type: tagType, id }],
        });
      }

      if (extendEndpoints) {
        extendEndpoints(builder, endpoints);
      }

      return endpoints as any;
    },
  });

  // expose tagTypes on returned api for testing and caching
  (api as any).tagTypes = [tagType];
  return api;
}
