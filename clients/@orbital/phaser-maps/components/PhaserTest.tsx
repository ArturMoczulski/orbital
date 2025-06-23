"use client";
import React, { useEffect, useRef } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Phaser from "phaser";

// Simple Phaser scene that just draws some shapes and text
class TestScene extends Phaser.Scene {
  constructor() {
    super({ key: "TestScene" });
  }

  create() {
    // Add a background
    const bg = this.add.rectangle(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      this.cameras.main.width,
      this.cameras.main.height,
      0x333333
    );

    // Add some text
    const text = this.add.text(
      this.cameras.main.width / 2,
      50,
      "Phaser Test Scene",
      {
        fontSize: "24px",
        color: "#ffffff",
        backgroundColor: "#ff0000",
        padding: { x: 10, y: 5 },
      }
    );
    text.setOrigin(0.5, 0);

    // Add a grid of colored rectangles
    const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff];
    const size = 50;
    const spacing = 60;
    const startX = this.cameras.main.width / 2 - spacing * 2;
    const startY = this.cameras.main.height / 2 - spacing * 2;

    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        const x = startX + col * spacing;
        const y = startY + row * spacing;
        const color = colors[(row + col) % colors.length];

        const rect = this.add.rectangle(x, y, size, size, color);
        rect.setStrokeStyle(2, 0xffffff);

        // Add a small text label
        this.add
          .text(x, y, `${row},${col}`, {
            fontSize: "12px",
            color: "#ffffff",
          })
          .setOrigin(0.5);
      }
    }

    // Add a border around the entire scene
    const graphics = this.add.graphics();
    graphics.lineStyle(4, 0xffffff, 1);
    graphics.strokeRect(
      10,
      10,
      this.cameras.main.width - 20,
      this.cameras.main.height - 20
    );

    console.log("TestScene created with elements:", {
      bg: bg,
      text: text,
      graphics: graphics,
    });
  }
}

export default function PhaserTest() {
  const gameRef = useRef<HTMLDivElement>(null);
  const gameInstanceRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!gameRef.current) return;

    // Destroy any existing game instance
    if (gameInstanceRef.current) {
      gameInstanceRef.current.destroy(true);
      gameInstanceRef.current = null;
    }

    // Create a new Phaser game instance with explicit dimensions
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.CANVAS, // Force Canvas renderer
      width: 800, // Set explicit width
      height: 600, // Set explicit height
      backgroundColor: "#000000",
      scene: [TestScene],
      render: {
        pixelArt: false,
        antialias: true,
        roundPixels: false,
      },
      // Don't set parent here - we'll manually attach the canvas
    };

    console.log("PhaserTest: Creating new Phaser game with config:", config);
    const game = new Phaser.Game(config);
    gameInstanceRef.current = game;

    // Wait for the game to be ready before attaching the canvas
    game.events.once("ready", () => {
      console.log("PhaserTest: Game ready event fired");

      // Force the canvas to be visible with explicit styles
      game.canvas.style.display = "block";
      game.canvas.style.width = "100%";
      game.canvas.style.height = "100%";
      game.canvas.style.position = "absolute";
      game.canvas.style.top = "0";
      game.canvas.style.left = "0";
      game.canvas.style.zIndex = "5";
      game.canvas.style.backgroundColor = "#000000";
      game.canvas.style.border = "2px dashed green";

      // Attach the canvas to our container
      if (gameRef.current) {
        gameRef.current.appendChild(game.canvas);
      }
    });

    return () => {
      console.log("PhaserTest: Destroying Phaser game");
      if (gameInstanceRef.current) {
        gameInstanceRef.current.destroy(true);
        gameInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        border: "3px solid green",
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
        Phaser Test Component
      </Typography>
      <div
        ref={gameRef}
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
        }}
      />

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
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Test renderer should appear here
        </Typography>
      </div>
    </Box>
  );
}
