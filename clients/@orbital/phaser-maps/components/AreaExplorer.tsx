import React from "react";
import { useGetAreasQuery } from "../services/areaApi";
import { Area } from "@orbital/core/src/types/area";
import { ObjectExplorer } from "@orbital/react-ui";

interface AreaExplorerProps {
  onSelect: (areaId: string) => void;
}

/**
 * Area-specific implementation of ObjectExplorer
 */
export default function AreaExplorer({ onSelect }: AreaExplorerProps) {
  const areasQuery = useGetAreasQuery();

  return (
    <ObjectExplorer<Area>
      queryResult={areasQuery}
      onSelect={onSelect}
      objectTypeName="Areas"
    />
  );
}
