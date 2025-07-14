import { useMemo } from "react";
import { ZodBridge } from "uniforms-bridge-zod";
import { AutoField, AutoForm as UniformsAutoForm } from "uniforms-mui";
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
   * The schema for the form
   */
  schema: SchemaWithObjects;

  /**
   * Function to handle form submission
   */
  onSubmit: (data: any) => void | Promise<void>;

  /**
   * The type of object this form is for (e.g., "Area", "World")
   * This is used to generate data-testid attributes for reference fields
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
export function ObjectForm({
  schema,
  onSubmit,
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
  // Infer object type from schema if not provided
  const objectType = providedObjectType || inferObjectTypeFromSchema(schema);

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
        <UniformsAutoForm
          schema={schemaWithContext}
          model={model}
          onSubmit={onSubmit}
          disabled={disabled}
          readOnly={readOnly}
          showInlineError={showInlineError}
          submitField={showSubmitButton ? undefined : () => null}
          data-testid={props["data-testid"] || "ObjectForm"}
          {...formProps}
        />
      </AutoField.componentDetectorContext.Provider>
    </ObjectSchemaProvider>
  );
}

export default ObjectForm;
