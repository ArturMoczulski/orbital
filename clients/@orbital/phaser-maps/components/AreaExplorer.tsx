import MapIcon from "@mui/icons-material/Map";
import { Area, AreaSchema } from "@orbital/core/src/types/area";
import { AreaMap } from "@orbital/core/src/types/area-map";
import {
  ObjectExplorer,
  ObjectExplorerItemActionButton,
  useWorld,
} from "@orbital/react-ui";
import { useEffect, useState } from "react";
import * as adminApi from "../services/adminApi.generated";
import { useAreasControllerGetMapQuery } from "../services/adminApi.generated";

interface AreaExplorerProps {
  onSelect: (areaId: string, areaMap: AreaMap) => void;
}

/**
 * Area-specific implementation of ObjectExplorer
 * Fetches area list and on-demand map data, then notifies parent via onSelect.
 */
export default function AreaExplorer({ onSelect }: AreaExplorerProps) {
  const { worldId } = useWorld();
  const [selectedMapId, setSelectedMapId] = useState<string | null>(null);

  const {
    data: mapData,
    isLoading: isMapLoading,
    error: mapError,
  } = useAreasControllerGetMapQuery(
    { _id: selectedMapId! },
    { skip: !selectedMapId }
  ) as { data?: AreaMap; isLoading: boolean; error?: unknown };

  useEffect(() => {
    if (selectedMapId && mapData) {
      onSelect(selectedMapId, mapData);
    }
  }, [selectedMapId, mapData, onSelect]);

  // Create a custom item actions component for the map button
  // Now receives defaultActions as a second parameter
  const renderItemActions = (area: Area, defaultActions: React.ReactNode) => {
    return (
      <>
        <ObjectExplorerItemActionButton
          icon={<MapIcon fontSize="small" />}
          onClick={() => setSelectedMapId(area._id)}
          title="Load Map"
          testId={`load-map-button-${area._id}`}
          dataCy={`area-load-map-button-${area._id}`}
        />
        {defaultActions}
      </>
    );
  };

  // Use the enhanced ObjectExplorer with API-based functionality
  return (
    <ObjectExplorer<Area>
      type="Area"
      api={adminApi}
      schema={AreaSchema}
      itemActions={renderItemActions}
      // Custom query function to filter by worldId
      query={() => {
        // Use the built-in query hook
        const result = adminApi.useAreasControllerGetAllQuery();

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
