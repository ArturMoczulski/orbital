"use client";
import React, { useRef, useEffect, useState } from "react";
import Typography from "@mui/material/Typography";
import Phaser from "phaser";
import type { AreaMapProps } from "@orbital/core/src/types/area-map";
import { MapViewerScene } from "@orbital/phaser/src/components/MapViewer";

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

  // Combined loading state (parent or internal)
  const isCurrentlyLoading = isLoading || internalLoading;

  // Initialize Phaser game on mount
  useEffect(() => {
    if (!gameRef.current) return;

    // Clean up existing game
    if (gameInstanceRef.current) {
      gameInstanceRef.current.destroy(true);
    }

    // Configure Phaser to use MapViewerScene
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.CANVAS,
      width: 800,
      height: 600,
      backgroundColor: "#333333",
      scene: [MapViewerScene],
      render: {
        pixelArt: false,
        antialias: true,
        roundPixels: false,
        transparent: false,
      },
    };

    const game = new Phaser.Game(config);
    gameInstanceRef.current = game;

    // Style and attach canvas
    game.events.once("ready", () => {
      const canvas = game.canvas;
      canvas.style.display = "block";
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      canvas.style.position = "absolute";
      canvas.style.top = "0";
      canvas.style.left = "0";
      canvas.style.zIndex = "5";
      canvas.style.backgroundColor = "#333333";

      gameRef.current?.appendChild(canvas);

      // Start scene with initial map data
      game.scene.start("MapViewerScene", areaMap);
      setInternalLoading(false);
    });

    return () => {
      gameInstanceRef.current?.destroy(true);
      gameInstanceRef.current = null;
    };
  }, []);

  // Update map when data changes
  useEffect(() => {
    const game = gameInstanceRef.current;
    if (!game || !areaMap) return;

    setInternalLoading(true);

    const scene = game.scene.getScene("MapViewerScene") as any;
    if (scene?.updateMap) {
      scene.updateMap(areaMap);
    }

    setInternalLoading(false);
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
