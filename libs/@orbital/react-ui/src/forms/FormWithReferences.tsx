import React from "react";
import { ZodBridge } from "uniforms-bridge-zod";
import { AutoForm as UniformsAutoForm } from "uniforms-mui";
import ReferenceArrayField from "./ReferenceArrayField";
import ReferenceSingleField from "./ReferenceSingleField";
import { ZodReferencesBridge } from "./ZodReferencesBridge";

// Component names as constants to avoid typos and make refactoring easier
const REFERENCE_ARRAY_FIELD = "ReferenceArrayField";
const REFERENCE_SINGLE_FIELD = "ReferenceSingleField";

// Register custom field types with Uniforms
const fieldTypes = {
  [REFERENCE_SINGLE_FIELD]: ReferenceSingleField,
  [REFERENCE_ARRAY_FIELD]: ReferenceArrayField,
};

/**
 * Provider component that adds reference field support to Uniforms
 */
export function ReferenceFormProvider(props: any) {
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

  // Render the form with our custom context
  return <UniformsAutoForm {...props} context={context} />;
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
  return (
    <ReferenceFormProvider schema={schema} onSubmit={onSubmit} {...props} />
  );
}
