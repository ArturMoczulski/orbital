import MapIcon from "@mui/icons-material/Map";
import { Area } from "@orbital/core";
import React from "react";
import { AreaActionButton } from "./AreaActionButton";
import { AreaTreeNodeCustomAction } from "./AreaActionsButtons";

/**
 * Props for the AreaLoadMapActionButton component
 */
export interface AreaLoadMapActionButtonProps {
  /**
   * The area object
   */
  area: Area;

  /**
   * Callback function when the map button is clicked
   * Receives the React event and the area object
   */
  onClick: (e: React.MouseEvent, area: Area) => void;
}

/**
 * A specialized action button for loading area maps
 * Extends the base AreaActionButton with map-specific functionality
 */
export function AreaLoadMapActionButton({
  area,
  onClick,
}: AreaLoadMapActionButtonProps) {
  return (
    <AreaActionButton
      area={area}
      actionType={AreaTreeNodeCustomAction.LoadMap}
      icon={<MapIcon fontSize="small" />}
      onClick={(e, area) => onClick(e, area)}
      title="Load Map"
    />
  );
}
