"use client";
import React, { useEffect, useRef } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { AreaMapProps } from "@orbital/core/src/types/area-map";
import { AreaMapTiles } from "@orbital/core/src/types/area-map-tiles";

// Define tile colors (same as in MapViewer)
const tileColors: Record<AreaMapTiles, string> = {
  [AreaMapTiles.Water]: "#3366cc",
  [AreaMapTiles.BeachSand]: "#f4e285",
  [AreaMapTiles.DirtGround]: "#8b5a2b",
  [AreaMapTiles.GrassGround]: "#4caf50",
  [AreaMapTiles.Rocks]: "#757575",
  [AreaMapTiles.DirtPath]: "#a97142",
  [AreaMapTiles.CobblePath]: "#bbb8b0",
  [AreaMapTiles.Snow]: "#ffffff",
};

interface CanvasMapRendererProps {
  areaMap?: AreaMapProps;
}

export default function CanvasMapRenderer({ areaMap }: CanvasMapRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Draw the map when areaMap changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw a background
    ctx.fillStyle = "#333333";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw a border
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    // Draw text to show we're in the canvas
    ctx.fillStyle = "#ffffff";
    ctx.font = "24px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Canvas Map Renderer", canvas.width / 2, 50);

    // If no map data, draw a test pattern
    if (!areaMap) {
      drawTestPattern(ctx, canvas.width, canvas.height);
      return;
    }

    // Draw the map
    drawMap(ctx, areaMap, canvas.width, canvas.height);
  }, [areaMap]);

  // Draw a test pattern
  const drawTestPattern = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    const colors = ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff"];
    const size = 50;
    const spacing = 60;
    const startX = width / 2 - spacing * 2;
    const startY = height / 2 - spacing * 2;

    // Draw "No Map Data" text
    ctx.fillStyle = "#ffffff";
    ctx.font = "20px Arial";
    ctx.textAlign = "center";
    ctx.fillText("No Map Data - Showing Test Pattern", width / 2, 80);

    // Draw a grid of colored rectangles
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        const x = startX + col * spacing;
        const y = startY + row * spacing;
        const color = colors[(row + col) % colors.length];

        ctx.fillStyle = color;
        ctx.fillRect(x - size / 2, y - size / 2, size, size);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.strokeRect(x - size / 2, y - size / 2, size, size);

        // Add a small text label
        ctx.fillStyle = "#ffffff";
        ctx.font = "12px Arial";
        ctx.textAlign = "center";
        ctx.fillText(`${row},${col}`, x, y + 5);
      }
    }
  };

  // Draw the map
  const drawMap = (
    ctx: CanvasRenderingContext2D,
    mapData: AreaMapProps,
    canvasWidth: number,
    canvasHeight: number
  ) => {
    // Calculate tile size
    const tileSize = Math.min(
      canvasWidth / mapData.width,
      canvasHeight / mapData.height
    );

    // Calculate offset to center the map
    const offsetX = (canvasWidth - tileSize * mapData.width) / 2;
    const offsetY = (canvasHeight - tileSize * mapData.height) / 2;

    // Draw map info text
    ctx.fillStyle = "#ffffff";
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
      `Map Size: ${mapData.width}x${
        mapData.height
      }, Tile Size: ${tileSize.toFixed(2)}px`,
      canvasWidth / 2,
      80
    );

    // Draw each tile
    for (let row = 0; row < mapData.height; row++) {
      for (let col = 0; col < mapData.width; col++) {
        const code = mapData.grid[row][col] as AreaMapTiles;
        const color = tileColors[code] || "#000000";

        const x = offsetX + col * tileSize;
        const y = offsetY + row * tileSize;

        // Draw the tile
        ctx.fillStyle = color;
        ctx.fillRect(x, y, tileSize, tileSize);

        // Draw a border around the tile
        ctx.strokeStyle = "#333333";
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, tileSize, tileSize);
      }
    }

    // Draw a border around the map
    ctx.strokeStyle = "#ff0000";
    ctx.lineWidth = 4;
    ctx.strokeRect(
      offsetX - 5,
      offsetY - 5,
      mapData.width * tileSize + 10,
      mapData.height * tileSize + 10
    );
  };

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        border: "3px solid purple",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Typography
        sx={{
          position: "absolute",
          top: 10,
          left: 10,
          bgcolor: "rgba(0,0,0,0.7)",
          color: "white",
          padding: "5px",
          zIndex: 10,
          pointerEvents: "none",
        }}
      >
        Direct Canvas Renderer (No Phaser)
      </Typography>
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
        }}
      />
    </Box>
  );
}
