import { AreaMapProps, AreaMapTiles } from "@orbital/core";
import Phaser from "phaser";

const defaultTileColors: Record<AreaMapTiles, number> = {
  [AreaMapTiles.Water]: 0x3366cc,
  [AreaMapTiles.BeachSand]: 0xf4e285,
  [AreaMapTiles.DirtGround]: 0x8b5a2b,
  [AreaMapTiles.GrassGround]: 0x4caf50,
  [AreaMapTiles.Rocks]: 0x757575,
  [AreaMapTiles.DirtPath]: 0xa97142,
  [AreaMapTiles.CobblePath]: 0xbbb8b0,
  [AreaMapTiles.Snow]: 0xffffff,
};

export class MapViewer extends Phaser.GameObjects.Container {
  private tileSize: number;
  private mapWidth: number;
  private mapHeight: number;
  private labelText: Phaser.GameObjects.Text;
  private graphics: Phaser.GameObjects.Graphics;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    mapData: AreaMapProps,
    tileColors: Record<AreaMapTiles, number> = defaultTileColors
  ) {
    super(scene, x, y);
    this.mapWidth = mapData.width ?? 0;
    this.mapHeight = mapData.height ?? 0;
    this.tileSize = Math.min(width / this.mapWidth, height / this.mapHeight);

    // Create a single graphics object for all tiles
    this.graphics = scene.add.graphics({ x: 0, y: 0 });
    this.add(this.graphics);

    // create loading/update/no-data label
    this.labelText = scene.add
      .text(0, 0, "", {
        fontSize: "24px",
        color: "#ffffff",
        backgroundColor: "#000000",
        padding: { x: 10, y: 5 },
      })
      .setOrigin(0.5);
    this.labelText.setPosition(width / 2, height / 2);
    this.add(this.labelText);

    scene.add.existing(this);
    this.drawMap(mapData, tileColors);
  }

  private drawMap(
    mapData: AreaMapProps,
    tileColors: Record<AreaMapTiles, number>
  ) {
    // show loading
    this.labelText.setVisible(true).setText("Loading map...");

    // Clear the graphics object
    this.graphics.clear();

    // no-data case
    if (!mapData.grid || mapData.width === 0 || mapData.height === 0) {
      this.labelText.setText("No map data available");
      return;
    }

    // Draw all tiles in a single graphics object
    const size = this.tileSize;
    const strokeWidth = Math.max(1, Math.min(2, size / 16)); // Adaptive stroke width

    // First pass: fill all tiles
    for (let row = 0; row < (mapData.height ?? 0); row++) {
      for (let col = 0; col < (mapData.width ?? 0); col++) {
        const code = mapData.grid[row][col] as AreaMapTiles;
        const color = tileColors[code] ?? 0x000000;

        this.graphics.fillStyle(color, 1);
        this.graphics.fillRect(col * size, row * size, size, size);
      }
    }

    // Second pass: draw grid lines (optional, can be removed for better performance)
    if (size > 4) {
      // Only draw grid lines if tiles are big enough
      this.graphics.lineStyle(strokeWidth, 0x000000, 0.3);
      for (let row = 0; row <= (mapData.height ?? 0); row++) {
        this.graphics.beginPath();
        this.graphics.moveTo(0, row * size);
        this.graphics.lineTo((mapData.width ?? 0) * size, row * size);
        this.graphics.closePath();
        this.graphics.strokePath();
      }
      for (let col = 0; col <= (mapData.width ?? 0); col++) {
        this.graphics.beginPath();
        this.graphics.moveTo(col * size, 0);
        this.graphics.lineTo(col * size, (mapData.height ?? 0) * size);
        this.graphics.closePath();
        this.graphics.strokePath();
      }
    }

    // hide label once drawing finished
    this.labelText.setVisible(false);
  }

  public updateMap(
    mapData: AreaMapProps,
    tileColors: Record<AreaMapTiles, number> = defaultTileColors
  ): this {
    // show updating label
    this.labelText.setVisible(true).setText("Updating map...");

    // update dimensions and tile size
    this.mapWidth = mapData.width ?? 0;
    this.mapHeight = mapData.height ?? 0;
    this.tileSize = Math.min(
      this.scene.scale.width / this.mapWidth,
      this.scene.scale.height / this.mapHeight
    );

    // redraw map with new data
    this.drawMap(mapData, tileColors);

    // hide label after update
    this.labelText.setVisible(false);
    return this;
  }

  public resize(width: number, height: number): this {
    // recalc tile size and reposition label
    this.tileSize = Math.min(width / this.mapWidth, height / this.mapHeight);
    this.labelText.setPosition(width / 2, height / 2);

    // Redraw the entire map with the new tile size
    this.drawMap(
      {
        width: this.mapWidth,
        height: this.mapHeight,
        grid: this.scene.data.get("currentMapGrid") || [],
      },
      defaultTileColors
    );

    return this;
  }

  public setZoom(zoom: number): this {
    this.setScale(zoom);
    return this;
  }

  public setScroll(scrollX: number, scrollY: number): this {
    this.scene.cameras.main.setScroll(scrollX, scrollY);
    return this;
  }
}

export class MapViewerScene extends Phaser.Scene {
  private mapData?: AreaMapProps;
  private mapViewer?: MapViewer;

  constructor() {
    super({ key: "MapViewerScene" });
  }

  init(data?: AreaMapProps) {
    this.mapData = data;
  }

  create() {
    const initialData: AreaMapProps = this.mapData ?? {
      width: 0,
      height: 0,
      grid: [],
    };

    this.mapViewer = new MapViewer(
      this,
      0,
      0,
      this.scale.width,
      this.scale.height,
      initialData
    );

    this.reposition(initialData);

    this.scale.on("resize", (gameSize: Phaser.Structs.Size) => {
      if (this.mapViewer && this.mapData) {
        this.mapViewer.resize(gameSize.width, gameSize.height);
        this.reposition(this.mapData);
      }
    });
  }

  public updateMap(newData: AreaMapProps) {
    if (!this.mapViewer) return;
    // Store the current grid data for resize operations
    this.data.set("currentMapGrid", newData.grid);
    this.mapViewer.updateMap(newData);
    this.reposition(newData);
  }

  private reposition(data: AreaMapProps) {
    const size = Math.min(
      this.scale.width / (data.width || 1),
      this.scale.height / (data.height || 1)
    );
    this.mapViewer?.setPosition(
      (this.scale.width - (data.width || 0) * size) / 2,
      (this.scale.height - (data.height || 0) * size) / 2
    );
  }
}
