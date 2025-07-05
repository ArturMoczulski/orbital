import MapIcon from "@mui/icons-material/Map";
import { Area } from "@orbital/core/src/types/area";
import { TreeNodeActionButton } from "@orbital/react-ui";

/**
 * Props for the AreaMapActionButton component
 */
export interface AreaMapActionButtonProps {
  /**
   * The area object
   */
  area: Area;

  /**
   * Callback function when the map button is clicked
   */
  onLoadMap: (areaId: string) => void;
}

/**
 * A specialized action button for loading area maps
 */
export function AreaMapActionButton({
  area,
  onLoadMap,
}: AreaMapActionButtonProps) {
  return (
    <TreeNodeActionButton
      icon={<MapIcon fontSize="small" />}
      onClick={() => onLoadMap(area._id)}
      title="Load Map"
      testId={`load-map-button-${area._id}`}
      objectId={area._id}
    />
  );
}
