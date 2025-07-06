import { connectField, useField } from "uniforms";
import { AutoField } from "uniforms-mui";
import ReferenceAutoField from "./ReferenceAutoField";

/**
 * A custom AutoField component that checks if a field has a reference in the schema
 * and renders the appropriate component based on that.
 *
 * - If the field has a reference, it renders ReferenceAutoField
 * - Otherwise, it renders the standard AutoField
 */
function FormWithReferencesAutoField(props: any) {
  // Get the field props and uniforms context
  const [fieldProps, uniforms] = useField(props.name, props);

  // Extract the objectType from props, parent form, or field name
  // Default to the field name's first part (capitalized) if not provided
  const objectType =
    props.objectType ||
    (uniforms as any).objectType ||
    props.name?.split(".")[0]?.charAt(0).toUpperCase() +
      props.name?.split(".")[0]?.slice(1) ||
    "Unknown";

  // Check if the field has a reference in its uniforms metadata
  if (
    props.field?.uniforms?.component === "ReferenceSingleField" ||
    props.field?.uniforms?.component === "ReferenceArrayField" ||
    props.reference
  ) {
    console.log(
      `FormWithReferencesAutoField: Rendering ReferenceAutoField for ${props.name} with objectType ${objectType}`
    );
    // If it has a reference, render ReferenceAutoField with objectType
    return <ReferenceAutoField {...props} objectType={objectType} />;
  }

  // Otherwise, render the standard AutoField
  console.log(
    `FormWithReferencesAutoField: Rendering standard AutoField for ${props.name}`
  );
  return <AutoField {...props} />;
}

export default connectField(FormWithReferencesAutoField, { kind: "leaf" });
