import React from "react";
import { useGetAreasQuery } from "../services/adminApi.generated";
import { Area } from "@orbital/core/src/types/area";
import { ObjectExplorer, type QueryResult } from "@orbital/react-ui";

interface AreaExplorerProps {
  onSelect: (areaId: string) => void;
}

/**
 * Area-specific implementation of ObjectExplorer
 */
export default function AreaExplorer({ onSelect }: AreaExplorerProps) {
  const areasQuery = useGetAreasQuery(undefined);

  return (
    <ObjectExplorer<Area>
      type={Area}
      queryResult={areasQuery}
      onSelect={onSelect}
    />
  );
}
