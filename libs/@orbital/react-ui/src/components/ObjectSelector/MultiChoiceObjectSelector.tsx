import MultiObjectSelectUI from "./MultiObjectSelectUI";
import { ObjectSelector, ObjectSelectorProps } from "./ObjectSelector";

/**
 * Props interface for the MultiChoiceObjectSelector component
 * Omits the UIComponent prop since it's fixed to MultiObjectSelectUI
 */
export type MultiChoiceObjectSelectorProps = Omit<
  ObjectSelectorProps,
  "UIComponent"
> & {
  // Any additional props specific to MultiChoiceObjectSelector can be added here
};

/**
 * MultiChoiceObjectSelector component
 * A wrapper around ObjectSelector that uses MultiObjectSelectUI
 */
export function MultiChoiceObjectSelector(
  props: MultiChoiceObjectSelectorProps
) {
  return <ObjectSelector {...props} UIComponent={MultiObjectSelectUI} />;
}

export default MultiChoiceObjectSelector;
