import { Area } from "@orbital/core/src/types/area";
import { TreeNodeActionButton } from "@orbital/react-ui";
import { AreaTreeNodeCustomAction } from "./AreaActionsButtons";

/**
 * Base props for all Area action buttons
 */
export interface AreaActionButtonProps {
  /**
   * The area object
   */
  area: Area;

  /**
   * The custom action type this button represents
   */
  actionType: AreaTreeNodeCustomAction;

  /**
   * Icon to display in the button
   */
  icon: JSX.Element;

  /**
   * Title/tooltip for the button
   */
  title: string;

  /**
   * Click handler that receives the React event and the area object
   */
  onClick: (e: React.MouseEvent, area: Area) => void;

  /**
   * Optional test ID override
   * If not provided, a default test ID will be generated based on the action type
   */
  testId?: string;
}

/**
 * Abstract base component for Area action buttons
 * Provides a standardized API for all area action buttons
 */
export function AreaActionButton({
  area,
  actionType,
  icon,
  onClick,
  title,
  testId,
}: AreaActionButtonProps) {
  return (
    <TreeNodeActionButton
      icon={icon}
      onClick={(e: React.MouseEvent) => onClick(e, area)}
      title={title}
      testId={actionType + "Button"}
      object={area}
    />
  );
}
