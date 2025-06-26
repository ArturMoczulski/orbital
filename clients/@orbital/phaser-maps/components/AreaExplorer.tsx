import { Area, AreaSchema } from "@orbital/core/src/types/area";
import { AreaMap } from "@orbital/core/src/types/area-map";
import { ObjectExplorer } from "@orbital/react-ui";
import { useEffect, useState } from "react";
import {
  useAreasControllerCreateMutation,
  useAreasControllerGetAllQuery,
  useAreasControllerGetMapQuery,
} from "../services/adminApi.generated";

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
    { _id: selectedMapId! },
    { skip: !selectedMapId }
  ) as { data?: AreaMap; isLoading: boolean; error?: unknown };

  useEffect(() => {
    if (selectedMapId && mapData) {
      onSelect(selectedMapId, mapData);
    }
  }, [selectedMapId, mapData, onSelect]);

  // Get the areas data
  const areasQuery = useAreasControllerGetAllQuery();

  // Handle adding a new area
  const handleAddArea = async (formData: any) => {
    try {
      // Add default values for required fields if they're not provided
      const areaData = {
        ...formData,
        // worldId is still required
        worldId: formData.worldId || "default-world",
        // position is now optional, so we don't need to provide a default
      };

      // Add detailed logging for area creation
      console.log("Creating new area:", areaData);
      console.log("Area name:", areaData.name);
      console.log("Area worldId:", areaData.worldId);

      // For comparison, log what an Area.mock() would generate
      try {
        const mockArea = Area.mock();
        console.log("For comparison, Area.mock() generated:", {
          name: mockArea.name,
          worldId: mockArea.worldId,
        });
      } catch (mockError) {
        console.error("Error generating mock area:", mockError);
      }

      // Wrap the data in createAreaDto as expected by the API
      const response = await createArea({ createAreaDto: areaData }).unwrap();

      console.log("Area created successfully:", response);
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
