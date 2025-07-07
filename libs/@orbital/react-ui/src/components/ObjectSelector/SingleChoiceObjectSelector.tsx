import { ObjectSelector, ObjectSelectorProps } from "./ObjectSelector";
import { SingleObjectSelectUI } from "./SingleObjectSelectUI";

/**
 * Props interface for the SingleChoiceObjectSelector component
 * Omits the UIComponent prop since it's fixed to SingleSelectUI
 */
export type SingleChoiceObjectSelectorProps = Omit<
  ObjectSelectorProps,
  "UIComponent"
> & {
  // Any additional props specific to SingleChoiceObjectSelector can be added here
};

/**
 * SingleChoiceObjectSelector component
 * A wrapper around ObjectSelector that uses SingleSelectUI
 */
export function SingleChoiceObjectSelector(
  props: SingleChoiceObjectSelectorProps
) {
  return <ObjectSelector {...props} UIComponent={SingleObjectSelectUI} />;
}

export default SingleChoiceObjectSelector;
