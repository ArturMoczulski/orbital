import React from "react";
import { ZodBridge } from "uniforms-bridge-zod";
import { z } from "zod";
import {
  createUpdateObjectDataAction,
  ObjectDataProvider,
  useObjectData,
} from "./ObjectDataContext";
import { ObjectSchemaProvider, useObjectSchema } from "./ObjectSchemaContext";
import { ZodReferencesBridge } from "./ZodReferencesBridge";

// Type for Redux selector function
type SelectorFunction<T> = () => T;

type ObjectProviderProps = {
  children: React.ReactNode;
  // Schema props
  schema: z.ZodType<any> | ZodBridge<any> | ZodReferencesBridge<any>;
  objectType?: string;
  // Data props
  data: Record<string, any>;
  objectId?: string;
  additionalData?: Record<
    string,
    {
      data: Record<string, any>;
      objectId?: string;
    }
  >;
  // Redux integration props (optional)
  dataSelector?: SelectorFunction<Record<string, any>>;
  objectIdSelector?: SelectorFunction<string | undefined>;
  additionalDataSelector?: SelectorFunction<
    Record<
      string,
      {
        data: Record<string, any>;
        objectId?: string;
      }
    >
  >;
  dispatch?: (action: any) => void;
  createUpdateAction?: (
    key: string,
    data: Record<string, any>,
    merge?: boolean
  ) => any;
  // Optional callback for data updates (for testing)
  onUpdate?: (key: string, data: Record<string, any>, merge?: boolean) => void;
};

/**
 * ObjectProvider combines ObjectSchemaProvider and ObjectDataProvider
 * to provide both schema and data context to form components.
 *
 * This allows form fieldsets for different objects of the same or different schemas.
 *
 * It supports both direct props and Redux integration for data management.
 */
export function ObjectProvider({
  children,
  // Schema props
  schema,
  objectType,
  // Data props
  data,
  objectId,
  additionalData = {},
  // Redux integration props
  dataSelector,
  objectIdSelector,
  additionalDataSelector,
  dispatch,
  createUpdateAction = createUpdateObjectDataAction,
  // Testing callback
  onUpdate,
}: ObjectProviderProps) {
  return (
    <ObjectSchemaProvider schema={schema} objectType={objectType}>
      <ObjectDataProvider
        // Direct data props
        data={data}
        objectId={objectId}
        additionalData={additionalData}
        // Redux integration props
        dataSelector={dataSelector}
        objectIdSelector={objectIdSelector}
        additionalDataSelector={additionalDataSelector}
        dispatch={dispatch}
        createUpdateAction={createUpdateAction}
        // Testing callback
        onUpdate={onUpdate}
      >
        {children}
      </ObjectDataProvider>
    </ObjectSchemaProvider>
  );
}

/**
 * Hook to get both schema and data from context
 */
export function useObject(key: string = "main") {
  try {
    // Use the existing hooks to access the contexts
    const schemaContext = useObjectSchema();
    const dataContext = useObjectData();

    // Get schema and objectType from context
    const { schema, objectType } = schemaContext;

    // Get data and objectId from context
    const { getObjectData, updateObjectData } = dataContext;
    const dataEntry = getObjectData(key);

    return {
      schema,
      objectType,
      data: dataEntry?.data || {},
      objectId: dataEntry?.objectId,
      updateData: (newData: Record<string, any>, merge = true) => {
        updateObjectData(key, newData, merge);
      },
    };
  } catch (error) {
    throw new Error("useObject must be used within an ObjectProvider");
  }
}
