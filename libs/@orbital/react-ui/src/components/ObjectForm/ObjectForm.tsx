import React from "react";
import { ZodBridge } from "uniforms-bridge-zod";
import { AutoForm as UniformsAutoForm } from "uniforms-mui";
import BelongsToField from "../FormWithReferences/BelongsToField";
import HasManyField from "../FormWithReferences/HasManyField";
import { ObjectFieldset } from "../FormWithReferences/ObjectFieldset";
import { ObjectProvider } from "../FormWithReferences/ObjectProvider";
import {
  BELONGS_TO_FIELD,
  HAS_MANY_FIELD,
} from "../FormWithReferences/ReferenceField";
import {
  inferObjectTypeFromSchema,
  ZodReferencesBridge,
} from "../FormWithReferences/ZodReferencesBridge";

// Register custom field types with Uniforms
const fieldTypes = {
  [BELONGS_TO_FIELD]: BelongsToField,
  [HAS_MANY_FIELD]: HasManyField,
};

/**
 * Interface for a schema and its associated objects
 */
export interface SchemaWithObjects {
  /**
   * The schema for the objects
   */
  schema: ZodBridge<any> | ZodReferencesBridge<any>;

  /**
   * Array of objects that conform to the schema
   */
  items: any[];
}

/**
 * Props for the ObjectForm component
 */
export interface ObjectFormProps {
  /**
   * Array of schema and objects pairs
   */
  data: SchemaWithObjects[];

  /**
   * Function to handle form submission
   */
  onSubmit?: (data: any) => void | Promise<void>;

  /**
   * Additional props to pass to the form
   */
  [key: string]: any;
}

/**
 * ObjectForm component that displays multiple objects of different types in a single form
 */
export function ObjectForm({ data, onSubmit, ...props }: ObjectFormProps) {
  // Create a context for the form
  const context = React.useMemo(() => {
    return {
      ...props.context,
      uniforms: {
        ...(props.context?.uniforms || {}),
        // Add our custom field types to the context
        fieldTypes: {
          ...(props.context?.uniforms?.fieldTypes || {}),
          ...fieldTypes,
        },
      },
    };
  }, [props.context]);

  // Create a custom props object for the form
  const formProps = { ...props };

  // Function to handle form submission
  const handleSubmit = (formData: any) => {
    if (onSubmit) {
      onSubmit(formData);
    }
  };

  // Use the first schema as the main form schema
  const mainSchema = data[0]?.schema || {};

  // Get the object type from the first schema
  let mainObjectType = "Unknown";
  if (data[0]) {
    const schema = data[0].schema;
    if (schema instanceof ZodReferencesBridge) {
      // For ZodReferencesBridge, access the raw schema directly
      const rawSchema = schema.schema;
      if (rawSchema && rawSchema._def && rawSchema._def.description) {
        mainObjectType = rawSchema._def.description;
      } else {
        mainObjectType = inferObjectTypeFromSchema(schema);
      }
    } else if (schema instanceof ZodBridge) {
      // For ZodBridge, access the raw schema
      const rawSchema = schema.schema;
      if (rawSchema && rawSchema._def && rawSchema._def.description) {
        mainObjectType = rawSchema._def.description;
      } else {
        mainObjectType = inferObjectTypeFromSchema(schema);
      }
    } else {
      mainObjectType = inferObjectTypeFromSchema(schema);
    }
  }

  return (
    <UniformsAutoForm
      schema={mainSchema}
      onSubmit={handleSubmit}
      data-testid="ObjectForm"
      {...formProps}
    >
      {data.map((schemaData) => {
        const { schema, items } = schemaData;

        // Get the schema name from the bridge
        let objectType;
        if (schema instanceof ZodReferencesBridge) {
          // For ZodReferencesBridge, access the raw schema directly
          const rawSchema = schema.schema;
          if (rawSchema && rawSchema._def && rawSchema._def.description) {
            objectType = rawSchema._def.description;
          } else {
            objectType = inferObjectTypeFromSchema(schema);
          }
        } else if (schema instanceof ZodBridge) {
          // For ZodBridge, access the raw schema
          const rawSchema = schema.schema;
          if (rawSchema && rawSchema._def && rawSchema._def.description) {
            objectType = rawSchema._def.description;
          } else {
            objectType = inferObjectTypeFromSchema(schema);
          }
        } else {
          objectType = inferObjectTypeFromSchema(schema);
        }

        return items.map((item, itemIndex) => {
          const objectKey = `${objectType}-${itemIndex}`;

          return (
            <ObjectProvider
              key={objectKey}
              schema={schema}
              objectType={objectType}
              data={item}
              objectId={`${objectType}-${itemIndex}`}
            >
              <ObjectFieldset />
            </ObjectProvider>
          );
        });
      })}
    </UniformsAutoForm>
  );
}

export default ObjectForm;
