import React from "react";
import { ZodBridge } from "uniforms-bridge-zod";
import { AutoField, AutoForm as UniformsAutoForm } from "uniforms-mui";
import BelongsToField from "./BelongsToField";
import HasManyField from "./HasManyField";
import { ObjectSchemaProvider } from "./ObjectSchemaContext";
import {
  inferObjectTypeFromSchema,
  ZodReferencesBridge,
} from "./ZodReferencesBridge";

// Component names as constants to avoid typos and make refactoring easier
const HAS_MANY_FIELD = "HasManyField";
const BELONGS_TO_FIELD = "BelongsToField";

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

  // Create a component detector that checks for reference fields
  // This follows the recommended approach for Uniforms v4
  const customComponentDetector = (props: any, uniforms: any) => {
    // Get the objectType from the context
    const objectType = context.uniforms?.objectType || "Unknown";

    // Check if the field has a reference in its uniforms metadata
    if (props.field?.uniforms?.component === BELONGS_TO_FIELD) {
      // Create a wrapper component that passes the reference props
      const ReferenceSingleFieldWithProps = (fieldProps: any) => {
        // Extract reference from the field
        const reference = props.field?.reference;

        // Pass the reference props and objectType to ReferenceSingleField
        return (
          <BelongsToField
            {...fieldProps}
            reference={reference}
            objectType={objectType}
            schema={schema}
          />
        );
      };

      return ReferenceSingleFieldWithProps;
    }

    if (props.field?.uniforms?.component === HAS_MANY_FIELD) {
      // Create a wrapper component that passes the reference props
      const ReferenceArrayFieldWithProps = (fieldProps: any) => {
        // Extract reference from the field
        const reference = props.field?.reference;

        // Pass the reference props and objectType to ReferenceArrayField
        return (
          <HasManyField
            {...fieldProps}
            reference={reference}
            objectType={objectType}
            schema={schema}
          />
        );
      };

      return ReferenceArrayFieldWithProps;
    }

    return AutoField.defaultComponentDetector(props, uniforms);
  };

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
