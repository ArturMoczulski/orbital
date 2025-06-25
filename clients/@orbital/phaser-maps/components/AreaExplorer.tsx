import React, { useState, useEffect } from "react";
import { Area, AreaSchema } from "@orbital/core/src/types/area";
import { AreaMap } from "@orbital/core/src/types/area-map";
import {
  useAreasControllerGetAllQuery,
  useAreasControllerGetMapQuery,
  useAreasControllerCreateMutation,
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

  // Add the create mutation
  const [createArea, { isLoading: isCreating }] =
    useAreasControllerCreateMutation();

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

  // Handle adding a new area
  const handleAddArea = async (formData: any) => {
    try {
      // Create a new Area object with the form data and ensure all required fields
      const newArea = {
        ...formData,
        // Required fields with defaults if not provided
        name: formData.name || "New Area",
        position: formData.position || { x: 0, y: 0, z: 0 },
        description: formData.description || "",
        worldId: formData.worldId || "default",
      };

      console.log("Creating new area:", newArea);

      // Call the create mutation and unwrap to catch HTTP errors
      await createArea(newArea).unwrap();

      console.log("Area created successfully");
      // Notify user of success
      alert("Area created successfully");
    } catch (error: any) {
      console.error("Error creating area:", error);
      // Extract meaningful error message
      const errMsg =
        (error.data && (error.data.message || error.data.code)) ||
        error.message ||
        "Unknown error";
      alert(`Error creating area: ${errMsg}`);
    }
  };

  // Define the props with the schema property and onAdd callback
  const explorerProps = {
    type: Area,
    queryResult: areasQuery,
    onSelect: (id: string) => setSelectedMapId(id),
    schema: AreaSchema,
    onAdd: handleAddArea,
  };

  // Use type assertion to tell TypeScript that ObjectExplorer accepts these props
  return <ObjectExplorer<Area> {...(explorerProps as any)} />;
}
