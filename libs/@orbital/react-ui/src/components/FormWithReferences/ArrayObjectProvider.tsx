import React, { createContext } from "react";
import { ZodBridge } from "uniforms-bridge-zod";
import { z } from "zod";
import { ArrayObjectDataProvider } from "./ArrayObjectDataContext";
import { ArrayObjectFieldset } from "./ArrayObjectFieldset";
import { ObjectSchemaProvider } from "./ObjectSchemaContext";
import {
  ZodReferencesBridge,
  inferObjectTypeFromSchema,
} from "./ZodReferencesBridge";

// Create contexts for objectType and arrayId
export const ArrayObjectTypeContext = createContext<string | null>(null);
export const ArrayObjectIdContext = createContext<string | null>(null);

// Type for Redux selector function
type SelectorFunction<T> = () => T;

export type ArrayObjectProviderProps = {
  children: React.ReactNode;
  // Schema props
  schema: z.ZodType<any> | ZodBridge<any> | ZodReferencesBridge<any>;
  objectType?: string;
  // Data props
  items?: Record<string, any>[];
  onChange: (items: Record<string, any>[]) => void;
  // Array identification
  arrayId?: string;
  // Redux integration props for array operations (optional)
  itemsSelector?: SelectorFunction<Record<string, any>[]>;
  dispatch?: (action: any) => void;
  createUpdateAction?: (
    objectType: string,
    objectId: string,
    data: Record<string, any>
  ) => any;
  createRemoveAction?: (key: string, index: number) => any;
  // Redux integration props for individual objects (optional)
  objectDispatch?: (action: any) => void;
  objectCreateUpdateAction?: (
    key: string,
    data: Record<string, any>,
    merge?: boolean,
    arrayIndex?: number
  ) => any;
  objectDataSelector?: (
    objectType: string,
    objectId?: string
  ) => Record<string, any>;
  // Optional callback for data updates (for testing)
  onUpdate?: (items: Record<string, any>[]) => void;
};

/**
 * ArrayObjectProvider combines ObjectSchemaProvider and ArrayObjectDataProvider
 * to provide both schema and array data context to form components.
 *
 * This allows form fieldsets for arrays of objects with the same schema.
 *
 * It supports both direct props and Redux integration for data management.
 */
export function ArrayObjectProvider({
  children,
  // Schema props
  schema,
  objectType,
  // Data props
  items,
  onChange,
  // Array identification
  arrayId,
  // Redux integration props for array operations
  itemsSelector,
  dispatch,
  createUpdateAction,
  createRemoveAction,
  // Redux integration props for individual objects
  objectDispatch,
  objectCreateUpdateAction,
  objectDataSelector,
  // Testing callback
  onUpdate,
}: ArrayObjectProviderProps) {
  // Generate a default arrayId if not provided
  const finalArrayId =
    arrayId || `array-${Math.random().toString(36).substring(2, 9)}`;

  // Ensure we have an objectType by inferring it from the schema using zod registry
  const finalObjectType =
    objectType ||
    (schema instanceof ZodBridge || schema instanceof ZodReferencesBridge
      ? inferObjectTypeFromSchema(schema)
      : "Unknown");

  return (
    <ObjectSchemaProvider schema={schema} objectType={finalObjectType}>
      <ArrayObjectTypeContext.Provider value={finalObjectType}>
        <ArrayObjectIdContext.Provider value={finalArrayId}>
          <ArrayObjectDataProvider
            // Direct data props
            items={items}
            onChange={onChange}
            // Redux integration props
            itemsSelector={itemsSelector}
            dispatch={dispatch}
            createUpdateAction={createUpdateAction}
            createRemoveAction={createRemoveAction}
            // Testing callback
            onUpdate={onUpdate}
          >
            {React.Children.map(children, (child) => {
              // Pass object-level Redux props to ArrayObjectFieldset
              if (
                React.isValidElement(child) &&
                child.type === ArrayObjectFieldset
              ) {
                return React.cloneElement(child as React.ReactElement<any>, {
                  objectDispatch,
                  objectCreateUpdateAction,
                  objectDataSelector,
                });
              }
              return child;
            })}
          </ArrayObjectDataProvider>
        </ArrayObjectIdContext.Provider>
      </ArrayObjectTypeContext.Provider>
    </ObjectSchemaProvider>
  );
}

export default ArrayObjectProvider;
