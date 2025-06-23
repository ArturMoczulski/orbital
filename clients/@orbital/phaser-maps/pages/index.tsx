"use client";
import React, { useState } from "react";
import dynamic from "next/dynamic";
import Box from "@mui/material/Box";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import ObjectExplorer from "../components/ObjectExplorer";
import { useGetAreaQuery } from "../services/areaApi";
import { skipToken } from "@reduxjs/toolkit/query/react";

// Dynamically load PhaserClient without SSR
const PhaserClient = dynamic(() => import("../components/PhaserClient"), {
  ssr: false,
});

// Dynamically load PhaserTest without SSR
const PhaserTest = dynamic(() => import("../components/PhaserTest"), {
  ssr: false,
});

// Dynamically load CanvasMapRenderer without SSR
const CanvasMapRenderer = dynamic(
  () => import("../components/CanvasMapRenderer"),
  {
    ssr: false,
  }
);

export default function ExplorerPage() {
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [key, setKey] = useState<number>(0); // Key for forcing remount

  // Debug: Log when selectedAreaId changes
  const handleSelectArea = (id: string) => {
    console.log("ExplorerPage: Setting selectedAreaId to:", id);
    setSelectedAreaId(id);

    // Force remount of components when area changes
    setKey((prevKey) => prevKey + 1);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const {
    data: area,
    isLoading,
    error,
  } = useGetAreaQuery(selectedAreaId ?? skipToken);

  // Debug: Log when area data changes
  console.log("ExplorerPage: area data:", area);

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
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="phaser tabs"
        >
          <Tab label="Map Viewer" />
          <Tab label="Test Renderer" />
          <Tab label="Canvas Renderer" />
        </Tabs>

        {/* Map Viewer Tab */}
        <Box
          sx={{
            flexGrow: 1,
            position: "relative",
            display: activeTab === 0 ? "block" : "none",
            height: "calc(100vh - 48px)", // Subtract tab height
          }}
        >
          {isLoading && (
            <Box sx={{ p: 2, position: "absolute", zIndex: 10 }}>
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
              border: "1px solid #ccc",
            }}
            key={`map-viewer-${key}`}
          >
            <PhaserClient areaMap={area?.areaMap} />
          </Box>
        </Box>

        {/* Test Renderer Tab */}
        <Box
          sx={{
            flexGrow: 1,
            position: "relative",
            display: activeTab === 1 ? "block" : "none",
            height: "calc(100vh - 48px)", // Subtract tab height
          }}
          key={`test-renderer-${key}`}
        >
          <PhaserTest />
        </Box>

        {/* Canvas Renderer Tab */}
        <Box
          sx={{
            flexGrow: 1,
            position: "relative",
            display: activeTab === 2 ? "block" : "none",
            height: "calc(100vh - 48px)", // Subtract tab height
          }}
          key={`canvas-renderer-${key}`}
        >
          <CanvasMapRenderer areaMap={area?.areaMap} />
        </Box>
      </Box>
    </Box>
  );
}
