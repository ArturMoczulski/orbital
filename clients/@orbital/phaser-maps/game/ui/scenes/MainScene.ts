import Phaser from "phaser";
import type { AreaMapProps } from "@orbital/core/src/types/area-map";
// @ts-ignore: no declaration file for rexui plugin
import UIPlugin from "phaser3-rex-plugins/dist/rexuiplugin.js";
import { ClientSettingsPopup, Theme, Button } from "@orbital/phaser-ui";
import { MapViewer } from "@orbital/phaser";

export default class MainScene extends Phaser.Scene {
  private theme: Theme;
  private mapData!: AreaMapProps;
  rexUI!: any;

  constructor() {
    super({
      key: "MainScene",
      plugins: {
        scene: [
          {
            key: "rexUI",
            plugin: UIPlugin,
            mapping: "rexUI",
          },
        ],
      },
    });

    // Use the active theme directly
    this.theme = Theme.active;
  }

  init(data: AreaMapProps) {
    console.log("MainScene.init: Received map data:", data);

    // Validate the map data
    if (
      !data ||
      !data.grid ||
      !Array.isArray(data.grid) ||
      data.grid.length === 0
    ) {
      console.error("MainScene.init: Invalid map data received:", data);
      // Create a default map if data is invalid
      this.mapData = {
        width: 5,
        height: 5,
        // Create a grid with independent arrays for each row to avoid reference issues
        grid: Array.from(
          { length: 5 },
          () => Array.from({ length: 5 }, () => 3) // Fill with grass tiles
        ),
      };
    } else {
      // Use the provided map data
      this.mapData = data;
    }

    // Log the scene dimensions
    console.log("MainScene.init: Scene dimensions:", {
      width: this.scale.width,
      height: this.scale.height,
      gameWidth: this.scale.gameSize.width,
      gameHeight: this.scale.gameSize.height,
    });
  }

  create() {
    console.log("MainScene.create: Starting scene creation");

    // expose for debugging
    // @ts-ignore
    window.currentPhaserScene = this;

    // Clear any existing graphics
    this.children.each((child) => {
      if (child instanceof Phaser.GameObjects.Graphics) {
        child.clear();
      }
    });

    // Add a background to the entire scene for visibility
    const bgGraphics = this.add.graphics();
    bgGraphics.fillStyle(0xccccff, 0.3); // Light blue with transparency
    bgGraphics.fillRect(0, 0, this.scale.width, this.scale.height);
    bgGraphics.lineStyle(8, 0x0000ff, 1); // Thick blue border
    bgGraphics.strokeRect(0, 0, this.scale.width, this.scale.height);
    console.log("MainScene.create: Added background and border to scene");

    // Add debug text to show we're in the scene
    const debugText = this.add.text(
      this.scale.width / 2,
      50,
      "MainScene Active - Map Should Appear Below",
      {
        fontSize: "18px",
        color: "#ff0000",
        backgroundColor: "#ffffff",
        padding: { x: 10, y: 5 },
      }
    );
    debugText.setOrigin(0.5, 0);
    debugText.setDepth(1000); // Ensure it's on top

    // Create a test grid to verify rendering
    this.createTestGrid();

    // instantiate MapViewer with passed mapData
    const mapData = this.mapData; // Use data from init
    console.log("MainScene.create: Using mapData:", mapData);
    if (!mapData || typeof mapData.width !== "number") {
      console.error("map data missing or invalid", mapData);

      // Add error text
      const errorText = this.add.text(
        this.scale.width / 2,
        this.scale.height / 2,
        "ERROR: Map data missing or invalid",
        {
          fontSize: "24px",
          color: "#ff0000",
          backgroundColor: "#ffffff",
          padding: { x: 20, y: 10 },
        }
      );
      errorText.setOrigin(0.5);
      return;
    }

    try {
      // Draw the map directly instead of using MapViewer
      this.drawMapDirectly(mapData);

      // Only create MapViewer as a fallback
      this.createMapViewer(mapData);
    } catch (error) {
      console.error("Error creating map:", error);

      // Add error text
      const errorText = this.add.text(
        this.scale.width / 2,
        this.scale.height / 2,
        `ERROR creating map: ${
          error instanceof Error ? error.message : String(error)
        }`,
        {
          fontSize: "24px",
          color: "#ff0000",
          backgroundColor: "#ffffff",
          padding: { x: 20, y: 10 },
        }
      );
      errorText.setOrigin(0.5);
    }
  }

  // Draw the map directly using Phaser primitives
  private drawMapDirectly(mapData: AreaMapProps) {
    try {
      console.log("MainScene.drawMapDirectly: Drawing map directly");

      // Validate map data again
      if (!mapData || !mapData.grid || !Array.isArray(mapData.grid)) {
        console.error("MainScene.drawMapDirectly: Invalid map data:", mapData);
        throw new Error("Invalid map data structure");
      }

      // Create a container for the map
      const mapContainer = this.add.container(
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
      mapContainer.add(mapBg);

      // Add a label
      const mapLabel = this.add.text(0, offsetY - 30, "DIRECT MAP RENDERING", {
        fontSize: "16px",
        color: "#ff0000",
        backgroundColor: "#ffffff",
        padding: { x: 10, y: 5 },
      });
      mapLabel.setOrigin(0.5, 0.5);
      mapContainer.add(mapLabel);

      // Define tile colors
      const tileColors: Record<number, number> = {
        0: 0x3366cc, // Water
        1: 0xf4e285, // BeachSand
        2: 0x8b5a2b, // DirtGround
        3: 0x4caf50, // GrassGround
        4: 0x757575, // Rocks
        5: 0xa97142, // DirtPath
        6: 0xbbb8b0, // CobblePath
        7: 0xffffff, // Snow
      };

      // Draw each tile
      let tileCount = 0;

      // Validate grid dimensions
      if (mapData.grid.length !== mapData.height) {
        console.warn(
          `MainScene.drawMapDirectly: Grid height (${mapData.grid.length}) doesn't match declared height (${mapData.height})`
        );
      }

      for (let row = 0; row < mapData.height; row++) {
        // Skip invalid rows
        if (!mapData.grid[row] || !Array.isArray(mapData.grid[row])) {
          console.error(
            `MainScene.drawMapDirectly: Invalid row data at row ${row}`
          );
          continue;
        }

        // Validate row width
        if (mapData.grid[row].length !== mapData.width) {
          console.warn(
            `MainScene.drawMapDirectly: Row ${row} width (${mapData.grid[row].length}) doesn't match declared width (${mapData.width})`
          );
        }

        for (let col = 0; col < mapData.width; col++) {
          // Skip invalid columns
          if (col >= mapData.grid[row].length) {
            console.error(
              `MainScene.drawMapDirectly: Missing column ${col} in row ${row}`
            );
            continue;
          }

          const tileCode = mapData.grid[row][col];
          const color = tileColors[tileCode] || 0x000000;

          const x = offsetX + col * tileSize + tileSize / 2;
          const y = offsetY + row * tileSize + tileSize / 2;

          const rect = this.add.rectangle(x, y, tileSize, tileSize, color);
          rect.setStrokeStyle(1, 0x000000);
          mapContainer.add(rect);
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
      mapContainer.add(mapBorder);

      // Add text to show tile count
      const countText = this.add.text(
        0,
        offsetY + mapData.height * tileSize + 30,
        `Map has ${tileCount} tiles (${mapData.width}x${mapData.height})`,
        {
          fontSize: "14px",
          color: "#000000",
          backgroundColor: "#ffffff",
          padding: { x: 10, y: 5 },
        }
      );
      countText.setOrigin(0.5, 0);
      mapContainer.add(countText);

      console.log(
        `MainScene.drawMapDirectly: Drew ${tileCount} tiles directly`
      );
    } catch (error) {
      console.error("Error in drawMapDirectly:", error);

      // Add error text
      const errorText = this.add.text(
        this.scale.width / 2,
        this.scale.height / 2 - 100,
        `ERROR drawing map directly: ${
          error instanceof Error ? error.message : String(error)
        }`,
        {
          fontSize: "16px",
          color: "#ff0000",
          backgroundColor: "#ffffff",
          padding: { x: 10, y: 5 },
        }
      );
      errorText.setOrigin(0.5);
    }
  }

  // Create the MapViewer as a fallback
  private createMapViewer(mapData: AreaMapProps) {
    console.log("MainScene.createMapViewer: Creating MapViewer as fallback");

    // Calculate dimensions
    const gameWidth = this.scale.gameSize.width;
    const gameHeight = this.scale.gameSize.height;
    const tileSize = Math.min(
      gameWidth / mapData.width,
      gameHeight / mapData.height
    );
    const offsetX = (gameWidth - tileSize * mapData.width) / 2;
    const offsetY = (gameHeight - tileSize * mapData.height) / 2;

    // Create a visible container area first
    const containerGraphics = this.add.graphics();
    containerGraphics.fillStyle(0xffcccc, 0.5); // Light red with transparency
    containerGraphics.fillRect(
      offsetX - 10,
      offsetY - 10,
      mapData.width * tileSize + 20,
      mapData.height * tileSize + 20
    );

    try {
      // Create the MapViewer
      const viewer = new MapViewer(
        this,
        offsetX,
        offsetY,
        gameWidth,
        gameHeight,
        mapData
      );

      // Debug: Check if the MapViewer has children (rectangles)
      const childCount = viewer.getAll().length;
      console.log(
        "MainScene.createMapViewer: MapViewer children count:",
        childCount
      );

      // Position the viewer at the bottom of the screen
      viewer.setPosition(this.scale.width / 2, this.scale.height - 100);
      viewer.setScale(0.5); // Smaller scale since we have the direct rendering

      // Add a label
      const viewerLabel = this.add.text(
        this.scale.width / 2,
        this.scale.height - 200,
        "MAPVIEWER COMPONENT (FALLBACK)",
        {
          fontSize: "12px",
          color: "#0000ff",
          backgroundColor: "#ffffff",
          padding: { x: 5, y: 3 },
        }
      );
      viewerLabel.setOrigin(0.5, 0.5);
    } catch (error) {
      console.error("Error creating MapViewer:", error);
    }
  }

  // Create a test grid to verify rendering is working
  private createTestGrid() {
    console.log("MainScene.createTestGrid: Creating direct test grid");

    // Create a container for the test grid
    const testContainer = this.add.container(
      this.scale.width / 2,
      this.scale.height / 2 - 100
    );

    // Add a visible background to the container
    const testBg = this.add.rectangle(0, 0, 300, 300, 0x000000, 0.2);
    testContainer.add(testBg);

    // Add a text label
    const testLabel = this.add.text(0, -170, "TEST GRID (DIRECT RENDERING)", {
      fontSize: "16px",
      color: "#ff0000",
      backgroundColor: "#ffffff",
      padding: { x: 10, y: 5 },
    });
    testLabel.setOrigin(0.5, 0.5);
    testContainer.add(testLabel);

    // Create a 5x5 grid of colored rectangles
    const testTileSize = 30;
    const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff];

    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        const x = (col - 2) * testTileSize;
        const y = (row - 2) * testTileSize;
        const color = colors[(row + col) % colors.length];

        const rect = this.add.rectangle(
          x,
          y,
          testTileSize,
          testTileSize,
          color
        );
        rect.setStrokeStyle(2, 0xffffff);
        testContainer.add(rect);

        console.log(
          `Added test rect at ${x},${y} with color ${color.toString(16)}`
        );
      }
    }
  }

  update() {
    // Update game logic here

    // Add a pulsing effect to the debug text to make it more visible
    const debugTexts = this.children
      .getAll()
      .filter((child) => child instanceof Phaser.GameObjects.Text);

    debugTexts.forEach((text: any) => {
      const scale = 1 + Math.sin(this.time.now / 500) * 0.05;
      text.setScale(scale);
    });
  }
}
