import { Area, AreaSchema } from "@orbital/core/src/types/area";
import { AreaMap } from "@orbital/core/src/types/area-map";
import { TreeExplorer, useWorld } from "@orbital/react-ui";
import { useEffect, useState } from "react";
import {
  useAreasControllerFindQuery,
  useAreasControllerGetMapQuery,
} from "../../services/adminApi.generated";
import { AreaActionsButtons } from "./AreaActionsButtons";

interface AreaExplorerProps {
  onSelect: (area: Area, areaMap: AreaMap) => void;
}

/**
 * Area-specific implementation of TreeExplorer
 * Fetches area list and on-demand map data, then notifies parent via onSelect.
 */
export default function AreaExplorer({ onSelect }: AreaExplorerProps) {
  const { worldId } = useWorld();
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);

  const {
    data: mapData,
    isLoading: isMapLoading,
    error: mapError,
  } = useAreasControllerGetMapQuery(
    { _id: selectedArea?._id! },
    { skip: !selectedArea }
  ) as { data?: AreaMap; isLoading: boolean; error?: unknown };

  useEffect(() => {
    if (selectedArea && mapData) {
      onSelect(selectedArea, mapData);
    }
  }, [selectedArea, mapData, onSelect]);

  // Use the enhanced TreeExplorer with API-based functionality
  return (
    <TreeExplorer<Area>
      type={Area.name}
      schema={AreaSchema as any}
      itemActions={(area: Area, defaultActions: React.ReactNode) => (
        <AreaActionsButtons
          area={area}
          onLoadMap={(e: React.MouseEvent, areaObj: Area) =>
            setSelectedArea(areaObj)
          }
          defaultActions={defaultActions}
        />
      )}
      // Custom query function to filter by worldId
      query={() => {
        // Use the built-in query hook
        const result = useAreasControllerFindQuery({});

        // Create a properly typed version of the query result
        const typedResult = result as unknown as {
          data?: Area[];
          isLoading: boolean;
          error?: any;
        };

        // If we have data and a worldId, filter the areas by worldId
        if (typedResult.data && worldId) {
          return {
            ...typedResult,
            data: typedResult.data.filter(
              (area: Area) => area.worldId === worldId
            ),
          };
        }

        return typedResult;
      }}
    />
  );
}
