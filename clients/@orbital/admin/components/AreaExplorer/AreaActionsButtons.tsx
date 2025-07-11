import { Area } from "@orbital/core/src/types/area";
import React from "react";
import { AreaLoadMapActionButton } from "./AreaLoadMapActionButton";

/**
 * Enum for Area Tree Node Custom Actions
 * Currently only supports LoadMap action
 *
 * Using an enum provides better type safety and maintainability
 * than string literals
 */
export enum AreaTreeNodeCustomAction {
  LoadMap = "LoadMap",
}

/**
 * Props for the AreaActionsButtons component
 */
interface AreaActionsButtonsProps {
  /**
   * The area object
   */
  area: Area;

  /**
   * Callback function when the map button is clicked
   * Receives the React event and the area object
   */
  onLoadMap: (e: React.MouseEvent, area: Area) => void;

  /**
   * Default actions from TreeExplorer
   */
  defaultActions: React.ReactNode;
}

/**
 * Maps custom action types to their corresponding components
 */
const ACTION_COMPONENTS = {
  [AreaTreeNodeCustomAction.LoadMap]: AreaLoadMapActionButton,
};

/**
 * Component that renders all actions for an area in the TreeExplorer
 * Dynamically creates buttons based on the AreaTreeNodeCustomAction enum
 */
export function AreaActionsButtons({
  area,
  onLoadMap,
  defaultActions,
}: AreaActionsButtonsProps) {
  // Create a mapping of action handlers
  const actionHandlers = {
    [AreaTreeNodeCustomAction.LoadMap]: onLoadMap,
  };

  return (
    <>
      {/* Dynamically render buttons for each custom action */}
      {Object.values(AreaTreeNodeCustomAction).map((actionType) => {
        const ActionComponent = ACTION_COMPONENTS[actionType];

        // If we have a specialized component for this action, use it
        if (ActionComponent) {
          return (
            <ActionComponent
              key={actionType}
              area={area}
              onClick={actionHandlers[actionType]}
            />
          );
        }

        // Otherwise, use the default TreeNodeActionButton (fallback case)
        return null;
      })}
      {defaultActions}
    </>
  );
}
