import React from "react";
import { ZodBridge } from "uniforms-bridge-zod";
import { AutoField, AutoForm as UniformsAutoForm } from "uniforms-mui";
import BelongsToField from "./BelongsToField";
import HasManyField from "./HasManyField";
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

// Register custom field types with Uniforms
const fieldTypes = {
  [BELONGS_TO_FIELD]: BelongsToField,
  [HAS_MANY_FIELD]: HasManyField,
};

/**
 * Provider component that adds reference field support to Uniforms
 */
export function ReferenceFormProvider(props: any) {
  // Extract schema and objectType from props
  const { schema, objectType, ...otherProps } = props;

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
        // Add objectType to the context
        objectType,
      },
    };
  }, [props.context, objectType]);

  // Create a custom props object without objectType to avoid passing it to the DOM
  const formProps = { ...otherProps };

  // Use the reusable component detector
  const customComponentDetector = createReferenceFieldsComponentDetector(
    schema,
    context.uniforms?.objectType || "Unknown"
  );

  // Render the form with our custom context and component detector
  return (
    <ObjectSchemaProvider schema={schema} objectType={objectType}>
      {/* @ts-ignore - TypeScript doesn't understand the componentDetectorContext API correctly */}
      <AutoField.componentDetectorContext.Provider
        value={customComponentDetector}
      >
        <UniformsAutoForm {...formProps} context={context} />
      </AutoField.componentDetectorContext.Provider>
    </ObjectSchemaProvider>
  );
}

/**
 * Props for the form with references
 */
export interface FormWithReferencesProps {
  /**
   * The schema for the form
   */
  schema: ZodBridge<any> | ZodReferencesBridge<any>;

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
   * Additional props to pass to the form
   */
  [key: string]: any;
}

/**
 * Form component that handles references
 */
export function FormWithReferences({
  schema,
  onSubmit,
  ...props
}: FormWithReferencesProps) {
  const objectType = props.objectType || inferObjectTypeFromSchema(schema);

  return (
    <ReferenceFormProvider
      schema={schema}
      onSubmit={onSubmit}
      {...props}
      objectType={objectType}
    />
  );
}
