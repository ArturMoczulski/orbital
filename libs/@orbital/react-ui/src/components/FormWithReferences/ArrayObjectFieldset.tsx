import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { ZodBridge } from "uniforms-bridge-zod";
import { z } from "zod";
import { useArrayObjectData } from "./ArrayObjectDataContext";
import { ArrayObjectProvider } from "./ArrayObjectProvider";
import { ObjectFieldset } from "./ObjectFieldset";
import { ObjectProvider } from "./ObjectProvider";
import { useObjectSchema } from "./ObjectSchemaContext";
import { createReferenceFieldsComponentDetector } from "./ReferenceField";
import {
  ZodReferencesBridge,
  inferObjectTypeFromSchema,
} from "./ZodReferencesBridge";

/**
 * Hook that combines schema and data context for array objects
 */
export function useArrayObject() {
  const { schema, objectType } = useObjectSchema();
  const { items, addItem, updateItem, removeItem } = useArrayObjectData();

  return {
    schema,
    objectType,
    items,
    addItem,
    updateItem,
    removeItem,
  };
}

export interface ArrayObjectFieldsetProps {
  // Field props
  items?: any[]; // Optional override for items from context
  onChange?: (items: any[]) => void; // Optional override for context methods
  label?: string;
  error?: boolean;
  errorMessage?: string;
  disabled?: boolean;
  readOnly?: boolean;

  // Additional props
  addButtonLabel?: string;
  removeButtonLabel?: string;
  "data-testid"?: string;

  // Redux integration props for individual objects
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
}

/**
 * A component that renders an array of objects, where each object is rendered
 * using an ObjectFieldset within an ObjectProvider.
 *
 * This component should be used within an ArrayObjectProvider.
 */
export function ArrayObjectFieldset({
  items: propItems,
  onChange,
  label,
  error,
  errorMessage,
  disabled = false,
  readOnly = false,
  addButtonLabel,
  removeButtonLabel = "Remove",
  "data-testid": dataTestId,
  // Redux integration props for individual objects
  objectDispatch,
  objectCreateUpdateAction,
  objectDataSelector,
}: ArrayObjectFieldsetProps) {
  // Get schema and data from context
  const {
    schema,
    objectType,
    items: contextItems,
    addItem,
    updateItem,
    removeItem,
  } = useArrayObject();

  // Use items from props if provided, otherwise use context
  const items = propItems !== undefined ? propItems : contextItems;

  // Function to handle changes to an individual item
  const handleItemChange = (index: number, newData: any) => {
    if (onChange) {
      // If onChange is provided, use it directly
      const newItems = [...items];
      newItems[index] = { ...newItems[index], ...newData };
      onChange(newItems);
    } else {
      // Otherwise use the context method
      updateItem(index, newData, true);
    }
  };

  // Function to add a new item
  const handleAddItem = () => {
    const newItem =
      schema instanceof ZodBridge && schema.getInitialModel
        ? schema.getInitialModel()
        : {};

    if (onChange) {
      // If onChange is provided, use it directly
      onChange([...items, newItem]);
    } else {
      // Otherwise use the context method
      addItem(newItem);
    }
  };

  // Function to remove an item
  const handleRemoveItem = (index: number) => {
    if (onChange) {
      // If onChange is provided, use it directly
      const newItems = [...items];
      newItems.splice(index, 1);
      onChange(newItems);
    } else {
      // Otherwise use the context method
      removeItem(index);
    }
  };

  return (
    <div data-testid={dataTestId || "ArrayObjectFieldset"}>
      {label && <Typography variant="h6">{label}</Typography>}

      {error && errorMessage && (
        <Typography color="error">{errorMessage}</Typography>
      )}

      {/* Render each item in the array */}
      {items.map((item, index) => (
        <Card key={index} variant="outlined" style={{ marginBottom: "16px" }}>
          <CardContent>
            <ObjectProvider
              schema={schema}
              objectType={objectType}
              data={item}
              objectId={`${objectType}-${index}`}
              onUpdate={(key, data) => {
                if (key === "main") {
                  handleItemChange(index, data);
                }
              }}
              // Pass Redux integration props for individual objects
              dispatch={objectDispatch}
              createUpdateAction={objectCreateUpdateAction}
              dataSelector={
                objectDataSelector
                  ? () =>
                      objectDataSelector(objectType, `${objectType}-${index}`)
                  : undefined
              }
              // Pass array index for context
              arrayIndex={index}
            >
              <ObjectFieldset header={(data, type) => `${type} ${index + 1}`} />
            </ObjectProvider>

            {!disabled && !readOnly && (
              <Button
                variant="outlined"
                color="error"
                onClick={() => handleRemoveItem(index)}
                style={{ marginTop: "8px" }}
                data-testid={`remove-item-${index}`}
              >
                {removeButtonLabel}
              </Button>
            )}
          </CardContent>
        </Card>
      ))}

      {!disabled && !readOnly && (
        <Button
          variant="contained"
          color="primary"
          onClick={handleAddItem}
          data-testid="add-item"
        >
          {addButtonLabel || `Add ${objectType}`}
        </Button>
      )}
    </div>
  );
}

/**
 * Helper function to get the schema for array items
 * @param schema The parent schema
 * @param fieldName The name of the array field
 * @returns The schema for items in the array, or null if not found
 */
export function getArrayItemSchema(
  schema: z.ZodType<any> | ZodBridge<any> | ZodReferencesBridge<any>,
  fieldName: string
): ZodBridge<any> | ZodReferencesBridge<any> | null {
  try {
    // For ZodReferencesBridge
    if (schema instanceof ZodReferencesBridge) {
      const rawSchema = schema.schema;

      // Use type assertion to access internal Zod properties
      const zodSchema = rawSchema as any;
      if (zodSchema && zodSchema._def && zodSchema._def.shape) {
        const fieldSchema = zodSchema._def.shape[fieldName];

        // Check if it's an array and get the element type
        if (
          fieldSchema &&
          fieldSchema._def &&
          fieldSchema._def.type === "array"
        ) {
          const elementSchema = fieldSchema._def.element;

          // If the element is a Zod object, wrap it in a ZodBridge
          if (elementSchema) {
            return new ZodBridge({ schema: elementSchema });
          }
        }
      }
    }
    // For ZodBridge
    else if (schema instanceof ZodBridge) {
      const rawSchema = schema.schema;

      // Use type assertion to access internal Zod properties
      const zodSchema = rawSchema as any;
      if (zodSchema && zodSchema._def && zodSchema._def.shape) {
        const fieldSchema = zodSchema._def.shape[fieldName];

        // Check if it's an array and get the element type
        if (
          fieldSchema &&
          fieldSchema._def &&
          fieldSchema._def.type === "array"
        ) {
          const elementSchema = fieldSchema._def.element;

          // If the element is a Zod object, wrap it in a ZodBridge
          if (elementSchema) {
            return new ZodBridge({ schema: elementSchema });
          }
        }
      }
    }
    // For raw Zod schema
    else {
      // Use type assertion to access internal Zod properties
      const zodSchema = schema as any;
      if (zodSchema && zodSchema._def && zodSchema._def.shape) {
        const fieldSchema = zodSchema._def.shape[fieldName];

        // Check if it's an array and get the element type
        if (
          fieldSchema &&
          fieldSchema._def &&
          fieldSchema._def.type === "array"
        ) {
          const elementSchema = fieldSchema._def.element;

          // If the element is a Zod object, wrap it in a ZodBridge
          if (elementSchema) {
            return new ZodBridge({ schema: elementSchema });
          }
        }
      }
    }

    return null;
  } catch (error) {
    console.error("Error getting array item schema:", error);
    return null;
  }
}

/**
 * Creates a component detector that can recognize arrays of objects and render
 * an ArrayObjectFieldset for them.
 *
 * @param schema The schema for the form
 * @param objectType The type of object this form is for
 * @returns A component detector function compatible with AutoField.componentDetectorContext
 */
export function createArrayObjectsComponentDetector(
  schema: z.ZodType<any> | ZodBridge<any> | ZodReferencesBridge<any>,
  objectType: string
) {
  return (props: any, uniforms: any) => {
    const fieldName = props.name;

    // Check if the field is an array
    if (props.field?.type === "array" && props.fieldType === Array) {
      // Try to get the item schema
      const itemSchema = getArrayItemSchema(schema, fieldName);

      if (itemSchema) {
        // Infer the object type from the item schema
        const itemObjectType = inferObjectTypeFromSchema(itemSchema) || "Item";

        // Return a component that handles arrays of objects using the Provider pattern
        return (fieldProps: any) => {
          // Extract value, onChange, and Redux props from fieldProps
          const {
            value,
            onChange,
            // Array-level Redux props
            dispatch,
            createUpdateAction,
            itemsSelector,
            // Object-level Redux props
            objectDispatch,
            objectCreateUpdateAction,
            objectDataSelector,
            ...rest
          } = fieldProps;

          return (
            <ArrayObjectProvider
              schema={itemSchema}
              objectType={itemObjectType}
              items={value}
              onChange={onChange}
              // Pass array-level Redux integration props if available
              dispatch={dispatch}
              createUpdateAction={createUpdateAction}
              itemsSelector={itemsSelector}
              // Pass object-level Redux integration props if available
              objectDispatch={objectDispatch}
              objectCreateUpdateAction={objectCreateUpdateAction}
              objectDataSelector={objectDataSelector}
            >
              <ArrayObjectFieldset {...rest} />
            </ArrayObjectProvider>
          );
        };
      }
    }

    // Fall back to the existing reference field detector
    return createReferenceFieldsComponentDetector(schema, objectType)(
      props,
      uniforms
    );
  };
}

export default ArrayObjectFieldset;
