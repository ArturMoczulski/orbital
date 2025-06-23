import Phaser from "phaser";
import { AreaMapProps } from "@orbital/core/src/types/area-map";
import { AreaMapTiles } from "@orbital/core/src/types/area-map-tiles";

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
  private tileRects: Phaser.GameObjects.Rectangle[][] = [];
  private mapWidth: number;
  private mapHeight: number;

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
    this.mapWidth = mapData.width;
    this.mapHeight = mapData.height;
    this.tileSize = Math.min(width / this.mapWidth, height / this.mapHeight);
    this.drawMap(mapData, tileColors);
    scene.add.existing(this);
  }

  private drawMap(
    mapData: AreaMapProps,
    tileColors: Record<AreaMapTiles, number>
  ) {
    // Clear any existing children
    this.removeAll(true);

    for (let row = 0; row < mapData.height; row++) {
      this.tileRects[row] = [];
      for (let col = 0; col < mapData.width; col++) {
        const code = mapData.grid[row][col] as AreaMapTiles;
        const color = tileColors[code] || 0x000000;
        const rect = this.scene.add
          .rectangle(
            col * this.tileSize,
            row * this.tileSize,
            this.tileSize,
            this.tileSize,
            color
          )
          .setOrigin(0, 0);
        rect.setStrokeStyle(1, 0x000000);
        this.add(rect);
        this.tileRects[row][col] = rect;
      }
    }
  }

  setZoom(zoom: number) {
    this.setScale(zoom);
    return this;
  }

  setScroll(scrollX: number, scrollY: number) {
    this.scene.cameras.main.setScroll(scrollX, scrollY);
    return this;
  }

  resize(width: number, height: number) {
    this.tileSize = Math.min(width / this.mapWidth, height / this.mapHeight);
    this.tileRects.forEach((row, r) =>
      row.forEach((rect, c) =>
        rect
          .setPosition(
            c * this.tileSize + this.tileSize / 2,
            r * this.tileSize + this.tileSize / 2
          )
          .setSize(this.tileSize, this.tileSize)
      )
    );
    return this;
  }
}

export class MapViewerScene extends Phaser.Scene {
  private mapData?: AreaMapProps;
  private mapViewer?: MapViewer;
  private loadingText?: Phaser.GameObjects.Text;

  constructor() {
    super({ key: "MapViewerScene" });
  }

  init(data?: AreaMapProps) {
    this.mapData = data;
  }

  create() {
    // background fill
    this.add.rectangle(
      this.scale.width / 2,
      this.scale.height / 2,
      this.scale.width,
      this.scale.height,
      0x333333
    );

    // loading text
    this.loadingText = this.add
      .text(this.scale.width / 2, this.scale.height / 2, "Loading map...", {
        fontSize: "24px",
        color: "#ffffff",
        backgroundColor: "#000000",
        padding: { x: 10, y: 5 },
      })
      .setOrigin(0.5);

    if (!this.mapData || !this.mapData.grid) {
      this.loadingText.setText("No map data available");
      return;
    }

    // draw initial map
    this.drawMap(this.mapData);
    if (this.loadingText) {
      this.loadingText.setVisible(false);
    }
  }

  private drawMap(data: AreaMapProps) {
    // remove previous map viewer
    if (this.mapViewer) {
      this.mapViewer.destroy(true);
      this.mapViewer = undefined;
    }

    // create new map viewer container anchored top-left
    this.mapViewer = new MapViewer(
      this,
      0,
      0,
      this.scale.width,
      this.scale.height,
      data
    );

    // center the map container within the canvas
    const tileSize = Math.min(
      this.scale.width / data.width,
      this.scale.height / data.height
    );
    const offsetX = (this.scale.width - data.width * tileSize) / 2;
    const offsetY = (this.scale.height - data.height * tileSize) / 2;
    this.mapViewer.setPosition(offsetX, offsetY);
  }

  updateMap(newData: AreaMapProps) {
    if (this.loadingText) {
      this.loadingText.setVisible(true).setText("Updating map...");
    }
    this.mapData = newData;
    this.drawMap(newData);
    if (this.loadingText) {
      this.loadingText.setVisible(false);
    }
  }
}
