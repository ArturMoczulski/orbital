import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import { useEffect, useMemo, useState } from "react";
import { ZodBridge } from "uniforms-bridge-zod";
import { AutoField, AutoForm as UniformsAutoForm } from "uniforms-mui";
import { useNotification } from "../NotificationProvider/NotificationProvider";
import { createArrayObjectsComponentDetector } from "./ArrayObjectFieldset";
import BelongsToField from "./BelongsToField";
import HasManyField from "./HasManyField";
import { ObjectFieldset } from "./ObjectFieldset";
import { ObjectSchemaProvider } from "./ObjectSchemaContext";
import {
  BELONGS_TO_FIELD,
  createReferenceFieldsComponentDetector,
  HAS_MANY_FIELD,
} from "./ReferenceField";
import {
  inferObjectTypeFromSchema,
  ZodReferencesBridge,
} from "./ZodReferencesBridge";

/**
 * Interface for API objects that can be used with ObjectForm
 *
 * This interface defines the expected structure of API objects that can be
 * passed to the ObjectForm component. It is generic to support different
 * object types.
 *
 * @template T The object type (e.g., "Area", "World")
 */
export interface ObjectFormApiInterface {
  /**
   * RTK Query mutation hooks for creating and updating objects
   *
   * The keys follow the pattern:
   * - use{ObjectType}sControllerCreateMutation - for creating objects
   * - use{ObjectType}sControllerUpdateMutation - for updating objects
   *
   * Both create and update mutations are optional, but at least one should be
   * provided if the api prop is used.
   *
   * Example:
   * {
   *   useAreasControllerCreateMutation: Function,
   *   useAreasControllerUpdateMutation: Function
   * }
   */
  [key: string]: Function | undefined;
}

/**
 * Type for schemas that may contain references to other objects
 */
export type SchemaWithObjects = ZodBridge<any> | ZodReferencesBridge<any>;

/**
 * Configuration for which components should be shown in the ObjectForm
 */
export interface ObjectFormOverlay {
  /**
   * Whether to show the SubmitField component
   * @default true
   */
  SubmitField?: boolean;
}

/**
 * Props for the ObjectForm component
 */
export interface ObjectFormProps {
  /**
   * Function to call when the form submission is successful
   * This is called after onAdd/onUpdate/api call succeeds
   */
  onSuccess?: (result: any) => void;

  /**
   * Function to show notifications
   */
  notify?: (
    message: string,
    type: "success" | "error" | "warning" | "info"
  ) => void;

  /**
   * Success message to show when form is submitted successfully
   */
  successMessage?: string;
  /**
   * The schema for the form
   */
  schema: SchemaWithObjects;

  /**
   * Function to handle form submission
   */
  onSubmit?: (data: any) => void | Promise<void>;

  /**
   * Function to handle adding a new object
   * Used when isNew is true
   */
  onAdd?: (data: any) => Promise<any>;

  /**
   * Function to handle updating an existing object
   * Used when isNew is false
   */
  onUpdate?: (data: any) => Promise<any>;

  /**
   * Whether this form is for creating a new object (true) or updating an existing one (false)
   * @default false
   */
  isNew?: boolean;

  /**
   * API object that contains RTK Query mutation hooks for CRUD operations
   * If provided, the appropriate create/update function will be inferred based on objectType
   *
   * This should be an object that implements ObjectFormApiInterface with RTK Query
   * mutation hooks following the naming convention.
   */
  api?: ObjectFormApiInterface;

  /**
   * The type of object this form is for (e.g., "Area", "World")
   * This is used to generate data-testid attributes for reference fields
   * and to find the appropriate API functions if api is provided
   */
  objectType?: string;

  /**
   * Initial data for the form
   */
  model?: Record<string, any>;

  /**
   * Whether to show inline error messages
   */
  showInlineError?: boolean;

  /**
   * Whether the form is disabled
   */
  disabled?: boolean;

  /**
   * Whether the form is read-only
   */
  readOnly?: boolean;

  /**
   * Redux integration props for array operations
   */
  arrayDispatch?: (action: any) => void;
  arrayCreateUpdateAction?: (
    objectType: string,
    objectId: string,
    data: Record<string, any>
  ) => any;
  arrayCreateRemoveAction?: (key: string, index: number) => any;
  arrayItemsSelector?: () => Record<string, any>[];

  /**
   * Redux integration props for individual objects
   */
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

  /**
   * Configuration for which components should be shown
   * @default All components are shown
   */
  overlay?: ObjectFormOverlay;

  /**
   * Additional props to pass to the form
   */
  [key: string]: any;
}

// Register custom field types with Uniforms
const fieldTypes = {
  [BELONGS_TO_FIELD]: BelongsToField,
  [HAS_MANY_FIELD]: HasManyField,
};

/**
 * A form component that automatically detects and handles references to other objects.
 * It wraps AutoForm and provides specialized handling for object references:
 * - For single object references, it uses ObjectFieldset
 * - For array fields of objects, it uses ArrayObjectFieldset
 */
/**
 * Find the appropriate API function for creating or updating an object
 * @param api The API object
 * @param objectType The type of object
 * @param isNew Whether this is a create or update operation
 * @returns The appropriate API function or undefined if not found
 */
function findApiFunction(
  api: ObjectFormApiInterface | undefined,
  objectType: string,
  isNew: boolean
): Function | undefined {
  if (!api || !objectType) return undefined;

  // Convert first letter to uppercase for Pascal case
  const pascalObjectType =
    objectType.charAt(0).toUpperCase() + objectType.slice(1);

  // For RTK Query API objects, look for the mutation functions
  const createMutationName = `use${pascalObjectType}sControllerCreateMutation`;
  const updateMutationName = `use${pascalObjectType}sControllerUpdateMutation`;

  if (isNew) {
    // For create operations, look for create mutation
    if (typeof api[createMutationName] === "function") {
      return api[createMutationName];
    }
  } else {
    // For update operations, look for update mutation
    if (typeof api[updateMutationName] === "function") {
      return api[updateMutationName];
    }
  }

  return undefined;
}

export function ObjectForm({
  schema,
  onSubmit,
  onAdd,
  onUpdate,
  onSuccess,
  notify: notifyProp,
  successMessage = "Form submitted successfully",
  isNew = false,
  api,
  model,
  objectType: providedObjectType,
  showInlineError = true,
  disabled = false,
  readOnly = false,
  // Redux integration props for array operations
  arrayDispatch,
  arrayCreateUpdateAction,
  arrayCreateRemoveAction,
  arrayItemsSelector,
  // Redux integration props for individual objects
  objectDispatch,
  objectCreateUpdateAction,
  objectDataSelector,
  overlay = {},
  ...props
}: ObjectFormProps) {
  // State to track loading status during form submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  // State to track error messages
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Infer object type from schema if not provided
  const objectType = providedObjectType || inferObjectTypeFromSchema(schema);

  // Log state changes for debugging
  console.log(`ObjectForm isSubmitting: ${isSubmitting}`);

  // Force re-render when isSubmitting changes
  useEffect(() => {
    console.log(`isSubmitting changed to: ${isSubmitting}`);
  }, [isSubmitting]);

  // Try to get the notification context, but don't throw if it's not available
  let notificationContext = null;
  try {
    notificationContext = useNotification();
  } catch (error) {
    // Notification context is not available, will use notify prop if provided
  }

  // Use the notify function from props if provided, otherwise use the one from context
  const notify =
    notifyProp || (notificationContext && notificationContext.notify);

  // Create the submit handler based on the provided props
  const handleSubmit = useMemo(() => {
    // If onSubmit is provided, use it directly
    if (onSubmit) {
      return onSubmit;
    }

    // If isNew is true, use onAdd or find the create API function
    if (isNew) {
      if (onAdd) {
        return async (data: any) => {
          try {
            // Set loading state to true
            console.log("Setting isSubmitting to true (onAdd)");
            setIsSubmitting(true);

            // Force a longer delay to ensure state update is processed and visible in tests
            await new Promise((resolve) => setTimeout(resolve, 500));

            // Call the onAdd function with the form data
            const result = await onAdd(data);

            // Clear any previous error messages
            setErrorMessage(null);

            // Show success notification if notify function is available
            if (notify) {
              notify(successMessage, "success");
            }

            // Call onSuccess callback if provided
            if (onSuccess) {
              onSuccess(result);
            }

            return result;
          } catch (error: any) {
            console.error(`Error adding ${objectType}:`, error);

            // Set error message for display in the form
            setErrorMessage(error.message || `Error adding ${objectType}`);

            // Show error notification if notify function is available
            if (notify) {
              notify(error.message || `Error adding ${objectType}`, "error");
            }

            throw error;
          } finally {
            // Set loading state to false regardless of success or failure
            console.log("Setting isSubmitting to false (onAdd finally)");
            setIsSubmitting(false);

            // Force a re-render to ensure the loading indicator is hidden
            setTimeout(() => {
              console.log(
                "Forced re-render after setting isSubmitting to false"
              );
            }, 0);
          }
        };
      }

      // Try to find the create API function
      const createFunction = findApiFunction(api, objectType, true);
      if (createFunction) {
        return async (data: any) => {
          try {
            // Set loading state to true
            console.log("Setting isSubmitting to true (api create)");
            setIsSubmitting(true);

            // Force a longer delay to ensure state update is processed and visible in tests
            await new Promise((resolve) => setTimeout(resolve, 500));

            // Convert first letter to uppercase for Pascal case
            const pascalObjectType =
              objectType.charAt(0).toUpperCase() + objectType.slice(1);

            // Call the API function with the form data
            const result = await createFunction({
              [`create${pascalObjectType}Dto`]: data,
            });

            // If objectDispatch and objectCreateUpdateAction are provided, update Redux
            if (objectDispatch && objectCreateUpdateAction) {
              objectDispatch(
                objectCreateUpdateAction(
                  objectType.toLowerCase(),
                  result.data || data,
                  false
                )
              );
            }

            // Clear any previous error messages
            setErrorMessage(null);

            // Show success notification if notify function is available
            if (notify) {
              notify(successMessage, "success");
            }

            // Call onSuccess callback if provided
            if (onSuccess) {
              onSuccess(result);
            }

            return result;
          } catch (error: any) {
            console.error(`Error creating ${objectType}:`, error);

            // Set error message for display in the form
            setErrorMessage(error.message || `Error creating ${objectType}`);

            // Show error notification if notify function is available
            if (notify) {
              notify(error.message || `Error creating ${objectType}`, "error");
            }

            throw error;
          } finally {
            // Set loading state to false regardless of success or failure
            setIsSubmitting(false);

            // Force a re-render to ensure the loading indicator is hidden
            setTimeout(() => {
              console.log(
                "Forced re-render after setting isSubmitting to false"
              );
            }, 0);
          }
        };
      }
    } else {
      // If isNew is false, use onUpdate or find the update API function
      if (onUpdate) {
        return async (data: any) => {
          try {
            // Set loading state to true
            setIsSubmitting(true);

            // Force a longer delay to ensure state update is processed and visible in tests
            await new Promise((resolve) => setTimeout(resolve, 500));

            // Call the onUpdate function with the form data
            const result = await onUpdate(data);

            // Clear any previous error messages
            setErrorMessage(null);

            // Show success notification if notify function is available
            if (notify) {
              notify(successMessage, "success");
            }

            // Call onSuccess callback if provided
            if (onSuccess) {
              onSuccess(result);
            }

            return result;
          } catch (error: any) {
            console.error(`Error updating ${objectType}:`, error);

            // Set error message for display in the form
            setErrorMessage(error.message || `Error updating ${objectType}`);

            // Show error notification if notify function is available
            if (notify) {
              notify(error.message || `Error updating ${objectType}`, "error");
            }

            throw error;
          } finally {
            // Set loading state to false regardless of success or failure
            setIsSubmitting(false);

            // Force a re-render to ensure the loading indicator is hidden
            setTimeout(() => {
              console.log(
                "Forced re-render after setting isSubmitting to false"
              );
            }, 0);
          }
        };
      }

      // Try to find the update API function
      const updateFunction = findApiFunction(api, objectType, false);
      if (updateFunction && model && model.id) {
        return async (data: any) => {
          try {
            // Set loading state to true
            setIsSubmitting(true);

            // Force a longer delay to ensure state update is processed and visible in tests
            await new Promise((resolve) => setTimeout(resolve, 500));

            // Convert first letter to uppercase for Pascal case
            const pascalObjectType =
              objectType.charAt(0).toUpperCase() + objectType.slice(1);

            // Call the API function with the ID and form data
            const result = await updateFunction({
              _id: model.id,
              [`update${pascalObjectType}Dto`]: data,
            });

            // If objectDispatch and objectCreateUpdateAction are provided, update Redux
            if (objectDispatch && objectCreateUpdateAction) {
              objectDispatch(
                objectCreateUpdateAction(
                  objectType.toLowerCase(),
                  result.data || data,
                  true
                )
              );
            }

            // Show success notification if notify function is available
            if (notify) {
              notify(successMessage, "success");
            }

            // Call onSuccess callback if provided
            if (onSuccess) {
              onSuccess(result);
            }

            return result;
          } catch (error: any) {
            console.error(`Error updating ${objectType}:`, error);

            // Set error message for display in the form
            setErrorMessage(error.message || `Error updating ${objectType}`);

            // Show error notification if notify function is available
            if (notify) {
              notify(error.message || `Error updating ${objectType}`, "error");
            }

            throw error;
          } finally {
            // Set loading state to false regardless of success or failure
            setIsSubmitting(false);

            // Force a re-render to ensure the loading indicator is hidden
            setTimeout(() => {
              console.log(
                "Forced re-render after setting isSubmitting to false"
              );
            }, 0);
          }
        };
      }
    }

    // If no handler is found, log a warning and return a no-op function
    console.warn(
      `No submit handler found for ${isNew ? "creating" : "updating"} ${objectType}. Please provide onSubmit, on${isNew ? "Add" : "Update"}, or api.`
    );
    return (data: any) => {
      console.warn("Form submitted but no handler was provided:", data);
      return Promise.resolve();
    };
  }, [
    onSubmit,
    onAdd,
    onUpdate,
    onSuccess,
    notify,
    successMessage,
    isNew,
    api,
    objectType,
    model,
    objectDispatch,
    objectCreateUpdateAction,
  ]);

  // Create a component detector that distinguishes between object, array object, and reference fields
  const objectDetector = useMemo(() => {
    return (props: any, uniforms: any) => {
      const fieldName = props.name;

      // Check if it's an array of objects
      if (props.field?.type === "array" && props.fieldType === Array) {
        // Use the ArrayObjectFieldset detector
        const arrayDetector = createArrayObjectsComponentDetector(
          schema,
          objectType
        );
        const result = arrayDetector(props, uniforms);

        if (result) {
          // For array fields, we need to pass Redux props to the ArrayObjectFieldset
          return (fieldProps: any) => {
            // Get the original component function
            const FieldComponent = result;

            // Create a new component with Redux props
            return (
              <FieldComponent
                {...fieldProps}
                // Pass array-level Redux integration props
                dispatch={arrayDispatch}
                createUpdateAction={arrayCreateUpdateAction}
                createRemoveAction={arrayCreateRemoveAction}
                itemsSelector={arrayItemsSelector}
                // Pass object-level Redux integration props
                objectDispatch={objectDispatch}
                objectCreateUpdateAction={objectCreateUpdateAction}
                objectDataSelector={objectDataSelector}
              />
            );
          };
        }
      }

      // For regular object fields, use ObjectFieldset
      if (props.field?.type === "object" && props.fieldType === Object) {
        return (fieldProps: any) => (
          <ObjectFieldset
            {...fieldProps}
            objectType={objectType}
            // Pass Redux props to ObjectFieldset
            dispatch={objectDispatch}
            createUpdateAction={objectCreateUpdateAction}
            dataSelector={objectDataSelector}
          />
        );
      }

      // For reference fields (BelongsTo and HasMany), use the reference fields detector
      const referenceDetector = createReferenceFieldsComponentDetector(
        schema,
        objectType
      );
      const referenceResult = referenceDetector(props, uniforms);

      // If the reference detector returns a component, use it
      if (
        referenceResult !== AutoField.defaultComponentDetector(props, uniforms)
      ) {
        return referenceResult;
      }

      // For other field types, use the default component
      return AutoField.defaultComponentDetector(props, uniforms);
    };
  }, [
    schema,
    objectType,
    arrayDispatch,
    arrayCreateUpdateAction,
    arrayCreateRemoveAction,
    arrayItemsSelector,
    objectDispatch,
    objectCreateUpdateAction,
    objectDataSelector,
  ]);

  // Create a context for the form
  const formContext = useMemo(() => {
    return {
      uniforms: {
        fieldTypes,
        objectType,
      },
    };
  }, [objectType]);

  // Create a custom props object without objectType to avoid passing it to the DOM
  const formProps = { ...props };

  // Create a schema with context
  const schemaWithContext = useMemo(() => {
    // Create a proxy to add the getContextField method without TypeScript errors
    const schemaProxy = Object.create(schema);

    // Add the getContextField method to the proxy
    schemaProxy.getContextField = () => formContext;

    return schemaProxy;
  }, [schema, formContext]);

  // Determine if the submit button should be shown
  const showSubmitButton = overlay.SubmitField !== false;

  return (
    <ObjectSchemaProvider schema={schema} objectType={objectType}>
      <AutoField.componentDetectorContext.Provider value={objectDetector}>
        {/* Loading indicator - always rendered in the DOM but visibility controlled by display property */}
        <Box
          sx={{
            position: "fixed", // Changed from absolute to fixed to ensure it's visible
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: isSubmitting ? "flex" : "none !important", // Added !important to ensure it overrides any inline styles
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(255, 255, 255, 0.8)", // Slightly more opaque
            zIndex: 9999, // Even higher z-index
          }}
          data-testid="object-form-loading-indicator"
        >
          <CircularProgress
            data-testid="object-form-circular-progress"
            size={80} // Even larger
            thickness={6} // Even more visible
            sx={{
              color: "#1976d2", // Primary blue color for better visibility
              position: "relative",
              zIndex: 10000, // Ensure the spinner itself is visible
            }}
          />
        </Box>
        {/* Debug element to show isSubmitting state */}
        <div
          style={{ display: "none" }}
          data-testid={`submitting-state-${isSubmitting}`}
        ></div>
        <Box sx={{ position: "relative" }}>
          {/* Error message at the top of the form */}
          {errorMessage && (
            <Alert
              severity="error"
              variant="filled"
              sx={{
                mb: 2,
                "& .MuiAlert-message": {
                  color: "white",
                },
              }}
              onClose={() => setErrorMessage(null)}
            >
              {errorMessage}
            </Alert>
          )}

          <UniformsAutoForm
            schema={schemaWithContext}
            model={model}
            onSubmit={handleSubmit}
            disabled={disabled || isSubmitting}
            readOnly={readOnly || isSubmitting}
            showInlineError={showInlineError}
            submitField={showSubmitButton ? undefined : () => null}
            data-testid={props["data-testid"] || "ObjectForm"}
            {...formProps}
          />
        </Box>
      </AutoField.componentDetectorContext.Provider>
    </ObjectSchemaProvider>
  );
}

export default ObjectForm;
