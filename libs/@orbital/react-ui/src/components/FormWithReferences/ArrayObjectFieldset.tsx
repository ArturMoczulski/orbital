import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import Paper from "@mui/material/Paper";
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
  // Schema props
  schema: z.ZodType<any> | ZodBridge<any> | ZodReferencesBridge<any>;
  objectType?: string;

  // Field props
  items?: any[]; // Optional override for items from context
  onChange: (items: any[]) => void; // Required for standalone usage
  label?: string;
  error?: boolean;
  errorMessage?: string;
  disabled?: boolean;
  readOnly?: boolean;

  // Additional props
  addButtonLabel?: string;
  removeButtonLabel?: string;
  "data-testid"?: string;
  arrayId?: string;

  // Redux integration props for array operations
  itemsSelector?: () => Record<string, any>[];
  dispatch?: (action: any) => void;
  createUpdateAction?: (
    objectType: string,
    objectId: string,
    data: Record<string, any>
  ) => any;
  createRemoveAction?: (key: string, index: number) => any;

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

  // Optional callback for data updates (for testing)
  onUpdate?: (items: Record<string, any>[]) => void;
}

/**
 * A component that renders an array of objects, where each object is rendered
 * using an ObjectFieldset within an ObjectProvider.
 *
 * This component includes its own ArrayObjectProvider, so it can be used standalone.
 */
export function ArrayObjectFieldset({
  // Schema props
  schema,
  objectType,

  // Field props
  items,
  onChange,
  label,
  error,
  errorMessage,
  disabled = false,
  readOnly = false,

  // Additional props
  addButtonLabel,
  removeButtonLabel = "Remove",
  "data-testid": dataTestId,
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

  // Optional callback for data updates
  onUpdate,
}: ArrayObjectFieldsetProps) {
  // Create a wrapper component that includes the ArrayObjectProvider
  const FieldsetContent = () => {
    // Get schema and data from context
    const {
      schema: contextSchema,
      objectType: contextObjectType,
      items: contextItems,
      addItem,
      updateItem,
      removeItem,
    } = useArrayObject();

    // Use the schema and objectType from context
    const finalSchema = contextSchema;
    const finalObjectType = contextObjectType;

    // Use items from context or from itemsSelector if available
    // This ensures we're always using the latest data from Redux
    const reduxItems = itemsSelector ? itemsSelector() : undefined;
    const finalItems = reduxItems || contextItems;

    // Function to handle changes to an individual item
    const handleItemChange = (index: number, newData: any) => {
      // Use the context method
      updateItem(index, newData, true);
    };

    // Function to add a new item
    const handleAddItem = () => {
      const newItem =
        finalSchema instanceof ZodBridge && finalSchema.getInitialModel
          ? finalSchema.getInitialModel()
          : {};

      // Use the context method
      addItem(newItem);
    };

    // Function to remove an item
    const handleRemoveItem = (index: number) => {
      // Create a new array with the item removed
      const newItems = [...finalItems];
      newItems.splice(index, 1);

      // If we have a Redux action creator for removing items, use it
      if (dispatch && createRemoveAction) {
        const action = createRemoveAction(arrayId || finalObjectType, index);
        dispatch(action);

        // Always call onChange to ensure the UI updates immediately
        onChange(newItems);

        // Don't call removeItem when using Redux to avoid double dispatch
        // The Redux action should handle the state update
      } else {
        // Otherwise use the context method
        removeItem(index);
      }
    };

    return (
      <Box data-testid={dataTestId || "ArrayObjectFieldset"}>
        {/* Array management container */}
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          {/* Header section */}
          <Box sx={{ mb: 2 }}>
            {label && <Typography variant="h6">{label}</Typography>}
          </Box>

          {/* Array items section */}
          <Box sx={{ mb: 2 }}>
            {finalItems.map((item, index) => (
              <Card key={index} variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <ObjectProvider
                    schema={finalSchema}
                    objectType={finalObjectType}
                    data={item}
                    objectId={`${finalObjectType}-${index}`}
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
                            objectDataSelector(
                              finalObjectType,
                              `${finalObjectType}-${index}`
                            )
                        : undefined
                    }
                    // Pass array index for context
                    arrayIndex={index}
                  >
                    <ObjectFieldset
                      header={(data, type) => `${type} ${index + 1}`}
                    />
                  </ObjectProvider>

                  {!disabled && !readOnly && (
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => handleRemoveItem(index)}
                      style={{ marginTop: "8px" }}
                      data-object-id={`${finalObjectType}-${index}`}
                      data-testid="RemoveItem"
                    >
                      {removeButtonLabel}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>

          {/* Error message section */}
          {error && errorMessage && (
            <Alert
              severity="error"
              variant="filled"
              sx={{
                mb: 2,
                "& .MuiAlert-message": {
                  color: "white",
                },
              }}
            >
              {errorMessage}
            </Alert>
          )}

          {/* Array action buttons section */}
          <CardActions sx={{ justifyContent: "flex-start", p: 0 }}>
            {!disabled && !readOnly && (
              <Button
                variant="contained"
                color="primary"
                onClick={handleAddItem}
                data-testid="AddItem"
              >
                {addButtonLabel || `Add ${finalObjectType}`}
              </Button>
            )}
          </CardActions>
        </Paper>
      </Box>
    );
  };

  // Wrap the content with ArrayObjectProvider if not already in one
  return (
    <ArrayObjectProvider
      schema={schema}
      objectType={objectType}
      items={items}
      onChange={onChange}
      arrayId={arrayId}
      // Pass array-level Redux integration props if available
      itemsSelector={itemsSelector}
      dispatch={dispatch}
      createUpdateAction={createUpdateAction}
      createRemoveAction={createRemoveAction}
      // Pass object-level Redux integration props if available
      objectDispatch={objectDispatch}
      objectCreateUpdateAction={objectCreateUpdateAction}
      objectDataSelector={objectDataSelector}
      // Pass testing callback
      onUpdate={onUpdate}
    >
      <FieldsetContent />
    </ArrayObjectProvider>
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
            createRemoveAction,
            itemsSelector,
            // Object-level Redux props
            objectDispatch,
            objectCreateUpdateAction,
            objectDataSelector,
            ...rest
          } = fieldProps;

          return (
            <ArrayObjectFieldset
              schema={itemSchema}
              objectType={itemObjectType}
              items={value}
              onChange={onChange}
              // Pass array-level Redux integration props if available
              dispatch={dispatch}
              createUpdateAction={createUpdateAction}
              createRemoveAction={createRemoveAction}
              itemsSelector={itemsSelector}
              // Pass object-level Redux integration props if available
              objectDispatch={objectDispatch}
              objectCreateUpdateAction={objectCreateUpdateAction}
              objectDataSelector={objectDataSelector}
              {...rest}
            />
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
