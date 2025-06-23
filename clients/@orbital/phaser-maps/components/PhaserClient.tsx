"use client";
import React, { useRef, useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Phaser from "phaser";
import type { AreaMapProps } from "@orbital/core/src/types/area-map";
import { AreaMapTiles } from "@orbital/core/src/types/area-map-tiles";

interface PhaserClientProps {
  areaMap?: AreaMapProps;
}

export default function PhaserClient({ areaMap }: PhaserClientProps) {
  // Create a completely new approach that doesn't rely on dependency injection
  const gameRef = useRef<HTMLDivElement>(null);
  const gameInstanceRef = useRef<Phaser.Game | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Create a new game instance when the component mounts
  useEffect(() => {
    if (!gameRef.current) return;

    // Clean up any existing game instance
    if (gameInstanceRef.current) {
      console.log("PhaserClient: Cleaning up existing game instance");
      gameInstanceRef.current.destroy(true);
      gameInstanceRef.current = null;
    }

    console.log("PhaserClient: Setting up new game instance");

    // Create a simple scene class directly in this component
    class DirectMapScene extends Phaser.Scene {
      private mapData: AreaMapProps | undefined;
      private mapContainer: Phaser.GameObjects.Container | null = null;
      private loadingText: Phaser.GameObjects.Text | null = null;

      constructor() {
        super({ key: "DirectMapScene" });
      }

      init(data: AreaMapProps | undefined) {
        console.log("DirectMapScene.init: Received data:", data);
        this.mapData = data;
      }

      create() {
        console.log("DirectMapScene.create: Creating scene");

        // Clear any existing content
        this.children.removeAll();

        // Add a background
        this.add.rectangle(
          this.scale.width / 2,
          this.scale.height / 2,
          this.scale.width,
          this.scale.height,
          0x333333
        );

        // Add a border
        const graphics = this.add.graphics();
        graphics.lineStyle(4, 0xffffff, 1);
        graphics.strokeRect(
          10,
          10,
          this.scale.width - 20,
          this.scale.height - 20
        );

        // Add a title
        this.add
          .text(this.scale.width / 2, 30, "PHASER MAP VIEWER", {
            fontSize: "18px",
            color: "#ffffff",
            backgroundColor: "#ff0000",
            padding: { x: 10, y: 5 },
          })
          .setOrigin(0.5, 0);

        // Add loading text
        this.loadingText = this.add
          .text(this.scale.width / 2, this.scale.height / 2, "Loading map...", {
            fontSize: "24px",
            color: "#ffffff",
            backgroundColor: "#000000",
            padding: { x: 20, y: 10 },
          })
          .setOrigin(0.5);

        // If we don't have map data, show a message
        if (!this.mapData || !this.mapData.grid) {
          this.loadingText.setText("No map data available");
          return;
        }

        try {
          // Draw the map directly
          this.drawMap(this.mapData);

          // Hide loading text
          if (this.loadingText) {
            this.loadingText.setVisible(false);
          }
        } catch (error) {
          console.error("Error drawing map:", error);
          if (this.loadingText) {
            this.loadingText.setText(
              `Error drawing map: ${
                error instanceof Error ? error.message : String(error)
              }`
            );
          }
        }
      }

      // Method to update the map data without recreating the scene
      updateMap(newMapData: AreaMapProps) {
        console.log("DirectMapScene.updateMap: Updating map with new data");
        this.mapData = newMapData;

        // Show loading text during update
        if (this.loadingText) {
          this.loadingText.setText("Updating map...");
          this.loadingText.setVisible(true);
        }

        // Remove existing map container if it exists
        if (this.mapContainer) {
          this.mapContainer.destroy();
          this.mapContainer = null;
        }

        // Draw the new map
        try {
          this.drawMap(newMapData);

          // Hide loading text
          if (this.loadingText) {
            this.loadingText.setVisible(false);
          }
        } catch (error) {
          console.error("Error updating map:", error);
          if (this.loadingText) {
            this.loadingText.setText(
              `Error updating map: ${
                error instanceof Error ? error.message : String(error)
              }`
            );
          }
        }
      }

      drawMap(mapData: AreaMapProps) {
        // Create a container for the map
        this.mapContainer = this.add.container(
          this.scale.width / 2,
          this.scale.height / 2
        );

        // Calculate tile size
        const maxWidth = this.scale.width * 0.8;
        const maxHeight = this.scale.height * 0.6;
        const tileSize = Math.min(
          maxWidth / mapData.width,
          maxHeight / mapData.height
        );

        // Calculate offsets to center the map
        const offsetX = -(mapData.width * tileSize) / 2;
        const offsetY = -(mapData.height * tileSize) / 2;

        // Add a background for the map area
        const mapBg = this.add.rectangle(
          0,
          0,
          mapData.width * tileSize + 20,
          mapData.height * tileSize + 20,
          0x000000,
          0.2
        );
        this.mapContainer.add(mapBg);

        // Define tile colors
        const tileColors: Record<number, number> = {
          [AreaMapTiles.Water]: 0x3366cc,
          [AreaMapTiles.BeachSand]: 0xf4e285,
          [AreaMapTiles.DirtGround]: 0x8b5a2b,
          [AreaMapTiles.GrassGround]: 0x4caf50,
          [AreaMapTiles.Rocks]: 0x757575,
          [AreaMapTiles.DirtPath]: 0xa97142,
          [AreaMapTiles.CobblePath]: 0xbbb8b0,
          [AreaMapTiles.Snow]: 0xffffff,
        };

        // Draw each tile
        let tileCount = 0;
        for (let row = 0; row < mapData.height; row++) {
          if (!mapData.grid[row]) continue;

          for (let col = 0; col < mapData.width; col++) {
            if (col >= mapData.grid[row].length) continue;

            const tileCode = mapData.grid[row][col];
            const color = tileColors[tileCode] || 0x000000;

            const x = offsetX + col * tileSize + tileSize / 2;
            const y = offsetY + row * tileSize + tileSize / 2;

            const rect = this.add.rectangle(x, y, tileSize, tileSize, color);
            rect.setStrokeStyle(1, 0x000000);
            this.mapContainer.add(rect);
            tileCount++;
          }
        }

        // Add a border around the map
        const mapBorder = this.add.rectangle(
          0,
          0,
          mapData.width * tileSize + 10,
          mapData.height * tileSize + 10,
          0x000000,
          0
        );
        mapBorder.setStrokeStyle(4, 0xff0000);
        this.mapContainer.add(mapBorder);

        // Add text to show tile count
        const countText = this.add.text(
          0,
          offsetY + mapData.height * tileSize + 30,
          `Map has ${tileCount} tiles (${mapData.width}x${mapData.height})`,
          {
            fontSize: "14px",
            color: "#ffffff",
            backgroundColor: "#000000",
            padding: { x: 10, y: 5 },
          }
        );
        countText.setOrigin(0.5, 0);
        this.mapContainer.add(countText);
      }
    }

    // Create a new game instance
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.CANVAS,
      width: 800,
      height: 600,
      backgroundColor: "#333333",
      scene: [DirectMapScene],
      render: {
        pixelArt: false,
        antialias: true,
        roundPixels: false,
        transparent: false,
      },
      // Don't set parent here - we'll manually attach the canvas
    };

    console.log("PhaserClient: Creating new Phaser game with config:", config);
    const game = new Phaser.Game(config);
    gameInstanceRef.current = game;

    // Wait for the game to be ready before attaching the canvas
    game.events.once("ready", () => {
      console.log("PhaserClient: Game ready event fired");

      // Force the canvas to be visible with explicit styles
      game.canvas.style.display = "block";
      game.canvas.style.width = "100%";
      game.canvas.style.height = "100%";
      game.canvas.style.position = "absolute";
      game.canvas.style.top = "0";
      game.canvas.style.left = "0";
      game.canvas.style.zIndex = "5";
      game.canvas.style.backgroundColor = "#333333";
      game.canvas.style.border = "2px dashed red";

      // Attach the canvas to our container
      if (gameRef.current) {
        gameRef.current.appendChild(game.canvas);
      }

      // Start the scene with the map data
      game.scene.start("DirectMapScene", areaMap);

      // Set loading to false
      setIsLoading(false);
    });

    return () => {
      console.log("PhaserClient: Cleaning up");
      if (gameInstanceRef.current) {
        gameInstanceRef.current.destroy(true);
        gameInstanceRef.current = null;
      }
    };
  }, []); // Only run once on mount

  // When areaMap changes, update the scene instead of recreating it
  useEffect(() => {
    if (!gameInstanceRef.current || !areaMap) return;

    console.log("PhaserClient: areaMap changed, updating scene");
    setIsLoading(true);

    // Get the scene and update it
    const scene = gameInstanceRef.current.scene.getScene(
      "DirectMapScene"
    ) as any;
    if (scene && scene.updateMap) {
      // Use a small timeout to allow the loading state to be rendered
      setTimeout(() => {
        scene.updateMap(areaMap);
        setIsLoading(false);
      }, 50);
    } else {
      console.error(
        "PhaserClient: Could not get scene or scene doesn't have updateMap method"
      );
      setIsLoading(false);
    }
  }, [areaMap]);

  // Add a visible border to the container to help with debugging
  return (
    <div
      ref={gameRef}
      style={{
        width: "100%",
        height: "100%",
        border: "3px solid blue",
        position: "relative",
        overflow: "hidden", // Ensure content doesn't overflow
      }}
    >
      {/* Add a debug overlay */}
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          background: "rgba(0,0,0,0.7)",
          color: "white",
          padding: "5px",
          zIndex: 10, // Higher than canvas but not too high
          pointerEvents: "none",
        }}
      >
        Map should be visible here (Canvas has red dashed border)
      </div>

      {/* Add a background grid to help visualize the container */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage:
            "linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)",
          backgroundSize: "20px 20px",
          backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
          zIndex: 1,
        }}
      />

      {/* Loading overlay */}
      {isLoading && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 20,
            pointerEvents: "none",
          }}
        >
          <Typography
            variant="h5"
            sx={{ color: "white", textShadow: "0 0 5px black" }}
          >
            Loading map...
          </Typography>
        </div>
      )}

      {/* Fallback content in case Phaser fails to render */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center",
          zIndex: 2,
          pointerEvents: "none",
        }}
      >
        <Typography variant="body1" sx={{ color: "text.secondary" }}>
          {areaMap ? "Loading map..." : "No area loaded"}
        </Typography>
      </div>
    </div>
  );
}
