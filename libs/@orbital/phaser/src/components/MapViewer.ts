import Phaser from "phaser";
import { AreaMapProps } from "@orbital/core/src/types/area-map";
import { AreaMapTiles } from "@orbital/core/src/types/area-map-tiles";

const defaultTileColors: Record<AreaMapTiles, string> = {
  [AreaMapTiles.Water]: "#3366cc",
  [AreaMapTiles.BeachSand]: "#f4e285",
  [AreaMapTiles.DirtGround]: "#8b5a2b",
  [AreaMapTiles.GrassGround]: "#4caf50",
  [AreaMapTiles.Rocks]: "#757575",
  [AreaMapTiles.DirtPath]: "#a97142",
  [AreaMapTiles.CobblePath]: "#bbb8b0",
  [AreaMapTiles.Snow]: "#ffffff",
};

export class MapViewer extends Phaser.GameObjects.Container {
  private tileSize: number;
  private tileRects: Phaser.GameObjects.Rectangle[][] = [];

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    mapData: AreaMapProps,
    tileColors: Record<AreaMapTiles, string> = defaultTileColors
  ) {
    super(scene, x, y);
    this.tileSize = Math.min(width / mapData.width, height / mapData.height);
    this.drawMap(mapData, tileColors);
    scene.add.existing(this);
  }

  private drawMap(
    mapData: AreaMapProps,
    tileColors: Record<AreaMapTiles, string>
  ) {
    for (let row = 0; row < mapData.height; row++) {
      this.tileRects[row] = [];
      for (let col = 0; col < mapData.width; col++) {
        const code = mapData.grid[row][col] as AreaMapTiles;
        const colorStr = tileColors[code] ?? "#000000";
        const color = Phaser.Display.Color.HexStringToColor(colorStr).color;
        const rect = this.scene.add.rectangle(
          col * this.tileSize + this.tileSize / 2,
          row * this.tileSize + this.tileSize / 2,
          this.tileSize,
          this.tileSize,
          color
        );
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
    this.tileSize = Math.min(
      width / this.tileRects[0].length,
      height / this.tileRects.length
    );
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
