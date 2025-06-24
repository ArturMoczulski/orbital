import React, { useState, useEffect } from "react";
import { Area } from "@orbital/core/src/types/area";
import { AreaMap } from "@orbital/core/src/types/area-map";
import {
  useAreasControllerGetAllQuery,
  useAreasControllerGetMapQuery,
} from "../services/adminApi.generated";
import { ObjectExplorer, QueryResult } from "@orbital/react-ui";

interface AreaExplorerProps {
  onSelect: (areaId: string, areaMap: AreaMap) => void;
}

/**
 * Area-specific implementation of ObjectExplorer
 * Fetches area list and on-demand map data, then notifies parent via onSelect.
 */
export default function AreaExplorer({ onSelect }: AreaExplorerProps) {
  const [selectedMapId, setSelectedMapId] = useState<string | null>(null);

  const {
    data: mapData,
    isLoading: isMapLoading,
    error: mapError,
  } = useAreasControllerGetMapQuery(
    { id: selectedMapId! },
    { skip: !selectedMapId }
  ) as { data?: AreaMap; isLoading: boolean; error?: unknown };

  useEffect(() => {
    if (selectedMapId && mapData) {
      onSelect(selectedMapId, mapData);
    }
  }, [selectedMapId, mapData, onSelect]);

  const areasQuery =
    useAreasControllerGetAllQuery() as unknown as QueryResult<Area>;

  return (
    <ObjectExplorer<Area>
      type={Area}
      queryResult={areasQuery}
      onSelect={(id) => setSelectedMapId(id)}
    />
  );
}
