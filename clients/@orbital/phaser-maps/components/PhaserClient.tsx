"use client";
import React, { useRef, useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Phaser from "phaser";
import type { AreaMapProps } from "@orbital/core/src/types/area-map";
import { AreaMapTiles } from "@orbital/core/src/types/area-map-tiles";

interface PhaserClientProps {
  areaMap?: AreaMapProps;
  isLoading?: boolean;
}

export default function PhaserClient({
  areaMap,
  isLoading = false,
}: PhaserClientProps) {
  const gameRef = useRef<HTMLDivElement>(null);
  const gameInstanceRef = useRef<Phaser.Game | null>(null);
  const [internalLoading, setInternalLoading] = useState(true);

  // Combined loading state (either parent is loading or internal is loading)
  const isCurrentlyLoading = isLoading || internalLoading;

  // Create a new game instance when the component mounts
  useEffect(() => {
    if (!gameRef.current) return;

    // Clean up any existing game instance
    if (gameInstanceRef.current) {
      gameInstanceRef.current.destroy(true);
      gameInstanceRef.current = null;
    }

    // Create a simple scene class directly in this component
    class DirectMapScene extends Phaser.Scene {
      private mapData: AreaMapProps | undefined;
      private mapContainer: Phaser.GameObjects.Container | null = null;
      private loadingText: Phaser.GameObjects.Text | null = null;

      constructor() {
        super({ key: "DirectMapScene" });
      }

      init(data: AreaMapProps | undefined) {
        this.mapData = data;
      }

      create() {
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

        // Calculate tile size to fill the entire canvas
        const maxWidth = this.scale.width;
        const maxHeight = this.scale.height;
        const tileSize = Math.min(
          maxWidth / mapData.width,
          maxHeight / mapData.height
        );

        // Calculate offsets to center the map
        const offsetX = -(mapData.width * tileSize) / 2;
        const offsetY = -(mapData.height * tileSize) / 2;

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
          }
        }
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

    const game = new Phaser.Game(config);
    gameInstanceRef.current = game;

    // Wait for the game to be ready before attaching the canvas
    game.events.once("ready", () => {
      // Force the canvas to be visible with explicit styles
      game.canvas.style.display = "block";
      game.canvas.style.width = "100%";
      game.canvas.style.height = "100%";
      game.canvas.style.position = "absolute";
      game.canvas.style.top = "0";
      game.canvas.style.left = "0";
      game.canvas.style.zIndex = "5";
      game.canvas.style.backgroundColor = "#333333";

      // Attach the canvas to our container
      if (gameRef.current) {
        gameRef.current.appendChild(game.canvas);
      }

      // Start the scene with the map data
      game.scene.start("DirectMapScene", areaMap);

      // Set loading to false
      setInternalLoading(false);
    });

    return () => {
      if (gameInstanceRef.current) {
        gameInstanceRef.current.destroy(true);
        gameInstanceRef.current = null;
      }
    };
  }, []); // Only run once on mount

  // When areaMap changes, update the scene instead of recreating it
  useEffect(() => {
    if (!gameInstanceRef.current || !areaMap) return;

    setInternalLoading(true);

    // Get the scene and update it
    const scene = gameInstanceRef.current.scene.getScene(
      "DirectMapScene"
    ) as any;
    if (scene && scene.updateMap) {
      // Use a small timeout to allow the loading state to be rendered
      setTimeout(() => {
        scene.updateMap(areaMap);
        // Wait a bit before hiding the loading indicator to ensure the map is fully rendered
        setTimeout(() => {
          setInternalLoading(false);
        }, 200);
      }, 50);
    } else {
      setInternalLoading(false);
    }
  }, [areaMap]);

  return (
    <div
      ref={gameRef}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Loading overlay */}
      {isCurrentlyLoading && (
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
      {!areaMap && (
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
            No area loaded
          </Typography>
        </div>
      )}
    </div>
  );
}
