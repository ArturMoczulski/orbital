import { Area } from "@orbital/core/src/types/area";
import React from "react";
import { AreaMapActionButton } from "./AreaMapActionButton";

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
   */
  onLoadMap: (areaId: string) => void;

  /**
   * Default actions from TreeExplorer
   */
  defaultActions: React.ReactNode;
}

/**
 * Component that renders all actions for an area in the TreeExplorer
 */
export function AreaActionsButtons({
  area,
  onLoadMap,
  defaultActions,
}: AreaActionsButtonsProps) {
  return (
    <>
      <AreaMapActionButton area={area} onLoadMap={onLoadMap} />
      {defaultActions}
    </>
  );
}
