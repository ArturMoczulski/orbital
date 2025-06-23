"use client";
import React, { useState } from "react";
import dynamic from "next/dynamic";
import Box from "@mui/material/Box";
import ObjectExplorer from "../components/ObjectExplorer";
import { useGetAreaQuery } from "../services/areaApi";
import { skipToken } from "@reduxjs/toolkit/query/react";

// Dynamically load PhaserClient without SSR
const PhaserClient = dynamic(() => import("../components/PhaserClient"), {
  ssr: false,
});

export default function ExplorerPage() {
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);

  // Handle area selection
  const handleSelectArea = (id: string) => {
    setSelectedAreaId(id);
  };

  const {
    data: area,
    isLoading,
    error,
  } = useGetAreaQuery(selectedAreaId ?? skipToken);

  return (
    <Box display="flex" sx={{ height: "100vh" }}>
      <Box
        sx={{
          width: "33%",
          borderRight: "1px solid #ccc",
          p: 1,
          overflow: "auto",
        }}
      >
        <ObjectExplorer onSelect={handleSelectArea} />
      </Box>
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        {/* Map Viewer */}
        <Box
          sx={{
            flexGrow: 1,
            position: "relative",
            height: "100%",
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
            <PhaserClient areaMap={area?.areaMap} isLoading={isLoading} />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
