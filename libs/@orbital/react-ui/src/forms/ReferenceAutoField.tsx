import { connectField } from "uniforms";
import { AutoField } from "uniforms-mui";
import ReferenceArrayField from "./ReferenceArrayField";
import ReferenceSingleField from "./ReferenceSingleField";

// Component names as constants to avoid typos and make refactoring easier
const REFERENCE_ARRAY_FIELD = "ReferenceArrayField";
const REFERENCE_SINGLE_FIELD = "ReferenceSingleField";

// Create a custom AutoField that knows about our reference fields
function ReferenceAutoField(props: any) {
  const { uniforms } = props;

  // Check if this field has a reference and should use our custom components
  if (uniforms?.component === REFERENCE_SINGLE_FIELD) {
    return <ReferenceSingleField {...props} />;
  }

  if (uniforms?.component === REFERENCE_ARRAY_FIELD) {
    return <ReferenceArrayField {...props} />;
  }

  // Otherwise use the standard AutoField
  return <AutoField {...props} />;
}

export default connectField(ReferenceAutoField, { kind: "leaf" });
