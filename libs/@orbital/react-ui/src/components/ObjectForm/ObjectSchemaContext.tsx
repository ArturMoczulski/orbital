import React, { createContext, useContext } from "react";
import { ZodBridge } from "uniforms-bridge-zod";
import { z } from "zod";
import {
  inferObjectTypeFromSchema,
  ZodReferencesBridge,
} from "./ZodReferencesBridge";

// Define the context type to provide schema and object type
type ObjectSchemaContextType = {
  // The schema for the form
  schema: z.ZodType<any> | ZodBridge<any> | ZodReferencesBridge<any>;
  // The object type for the form
  objectType: string;
};

const ObjectSchemaContext = createContext<ObjectSchemaContextType | null>(null);

export function useObjectSchema() {
  const context = useContext(ObjectSchemaContext);
  if (!context) {
    throw new Error(
      "useObjectSchema must be used within an ObjectSchemaProvider"
    );
  }
  return context;
}

// Helper function to infer object type from schema
function inferObjectTypeFromSchemaOrThrow(
  schema: z.ZodType<any> | ZodBridge<any> | ZodReferencesBridge<any>,
  errorMessage?: string
): string {
  if (schema instanceof ZodReferencesBridge || schema instanceof ZodBridge) {
    const inferredType = inferObjectTypeFromSchema(schema);
    if (inferredType === "Unknown") {
      throw new Error(
        errorMessage ||
          "Could not infer object type from schema. Please provide an objectType prop."
      );
    }
    return inferredType;
  }
  throw new Error(
    "Schema must be a ZodReferencesBridge or ZodBridge to infer object type. Please provide an objectType prop."
  );
}

type ObjectSchemaProviderProps = {
  children: React.ReactNode;
  schema: z.ZodType<any> | ZodBridge<any> | ZodReferencesBridge<any>;
  objectType?: string;
};

export function ObjectSchemaProvider({
  children,
  schema,
  objectType: providedObjectType,
}: ObjectSchemaProviderProps) {
  // Infer the object type if not provided
  const objectType = React.useMemo(() => {
    if (providedObjectType) return providedObjectType;

    try {
      return inferObjectTypeFromSchemaOrThrow(
        schema,
        "Could not infer object type from schema. Please provide an objectType prop."
      );
    } catch (error) {
      console.error("Error inferring object type:", error);
      return "Unknown";
    }
  }, [providedObjectType, schema]);

  // Create the context value
  const contextValue = React.useMemo(
    () => ({
      schema,
      objectType,
    }),
    [schema, objectType]
  );

  return (
    <ObjectSchemaContext.Provider value={contextValue}>
      {children}
    </ObjectSchemaContext.Provider>
  );
}
