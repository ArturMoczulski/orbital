"use client";
import Box from "@mui/material/Box";
import type { AreaMap } from "@orbital/core/src/types/area-map";
import { WorldExplorer } from "@orbital/react-ui";
import dynamic from "next/dynamic";
import { useState } from "react";
import AreaExplorer from "../components/AreaExplorer";
import { useAreasControllerGetByIdQuery } from "../services/adminApi.generated";

// Dynamically load PhaserClient without SSR
const PhaserClient = dynamic(() => import("../components/PhaserClient"), {
  ssr: false,
});

export default function ExplorerPage() {
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [selectedAreaMap, setSelectedAreaMap] = useState<AreaMap | null>(null);

  // Handle area selection with map
  const handleSelectArea = (_id: string, areaMap: AreaMap) => {
    setSelectedAreaId(_id);
    setSelectedAreaMap(areaMap);
  };

  const {
    data: area,
    isLoading,
    error,
  } = useAreasControllerGetByIdQuery(
    { _id: selectedAreaId! },
    { skip: !selectedAreaId }
  );

  return (
    <Box display="flex" sx={{ height: "100vh", flexDirection: "row" }}>
      {/* World Explorer with header and context providers - takes 30% width */}
      <WorldExplorer
        objectTypes={[
          {
            type: "Area",
            label: "Areas",
            component: <AreaExplorer onSelect={handleSelectArea} />,
          },
        ]}
        defaultObjectType="Area"
        defaultWorldId="world1"
        defaultWorldName="Fantasy World"
        worlds={[
          { id: "world1", name: "Fantasy World" },
          { id: "world2", name: "Sci-Fi World" },
          { id: "world3", name: "Medieval World" },
        ]}
        username="explorer"
      />
      {/* Map Viewer - takes 70% width */}
      <Box
        sx={{
          flexGrow: 1,
          position: "relative",
          width: "70%",
        }}
      >
        {isLoading && (
          <Box
            sx={{
              position: "absolute",
              zIndex: 100,
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "24px",
            }}
          >
            Loading area...
          </Box>
        )}
        {error && (
          <Box
            sx={{
              p: 2,
              position: "absolute",
              zIndex: 10,
              color: "error.main",
            }}
          >
            Error loading area: {String(error)}
          </Box>
        )}
        <Box
          sx={{
            width: "100%",
            height: "100%",
            position: "relative",
          }}
        >
          <PhaserClient
            areaMap={selectedAreaMap ?? undefined}
            isLoading={
              isLoading || (selectedAreaId !== null && selectedAreaMap === null)
            }
          />
        </Box>
      </Box>
    </Box>
  );
}
