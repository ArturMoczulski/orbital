import { connectField } from "uniforms";
import { AutoField } from "uniforms-mui";
import ReferenceArrayField from "./ReferenceArrayField";
import ReferenceSingleField from "./ReferenceSingleField";

// Component names as constants to avoid typos and make refactoring easier
const REFERENCE_ARRAY_FIELD = "ReferenceArrayField";
const REFERENCE_SINGLE_FIELD = "ReferenceSingleField";

// Create a custom AutoField that knows about our reference fields
function ReferenceAutoField(props: any) {
  const { uniforms, objectType } = props;

  // Log the props for debugging
  console.log(`ReferenceAutoField props for ${props.name}:`, {
    name: props.name,
    uniforms,
    objectType,
    reference: props.reference,
  });

  // Check if this field has a reference and should use our custom components
  if (uniforms?.component === REFERENCE_SINGLE_FIELD) {
    console.log(`Rendering ReferenceSingleField for ${props.name}`);
    console.log(`ReferenceSingleField props:`, {
      ...props,
      objectType,
      reference: props.reference,
    });

    // Debug: Check if reference options are available
    if (props.reference?.options) {
      console.log(
        `Reference options for ${props.name}:`,
        props.reference.options
      );
    } else {
      console.log(`No reference options found for ${props.name}`);
    }

    return <ReferenceSingleField {...props} objectType={objectType} />;
  }

  if (uniforms?.component === REFERENCE_ARRAY_FIELD) {
    console.log(`Rendering ReferenceArrayField for ${props.name}`);
    console.log(`ReferenceArrayField props:`, {
      ...props,
      objectType,
      reference: props.reference,
    });
    return <ReferenceArrayField {...props} objectType={objectType} />;
  }

  // Otherwise use the standard AutoField
  console.log(`Rendering standard AutoField for ${props.name}`);
  return <AutoField {...props} />;
}

export default connectField(ReferenceAutoField, { kind: "leaf" });
