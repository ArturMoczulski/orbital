import type { NextApiHandler } from "next";
import type { AreaMapProps } from "@orbital/core/src/types/area-map";
import { AreaMapTiles } from "@orbital/core/src/types/area-map-tiles";

// Create different mock maps for different areas
const createMockMap = (id: string): AreaMapProps => {
  const areaId = parseInt(id, 10);

  // Default map properties
  const width = 10;
  const height = 10;

  // Create different maps based on area ID
  switch (areaId) {
    case 1: // Overworld - mixed terrain
      return {
        width,
        height,
        grid: Array.from({ length: height }, (_, row) =>
          Array.from({ length: width }, (_, col) => {
            // Create a mixed terrain with water on the edges
            if (
              row === 0 ||
              col === 0 ||
              row === height - 1 ||
              col === width - 1
            ) {
              return AreaMapTiles.Water;
            } else if (
              row === 1 ||
              col === 1 ||
              row === height - 2 ||
              col === width - 2
            ) {
              return AreaMapTiles.BeachSand;
            } else if ((row + col) % 3 === 0) {
              return AreaMapTiles.DirtPath;
            } else {
              return AreaMapTiles.GrassGround;
            }
          })
        ),
      };

    case 2: // Southern Lake - mostly water with some land
      return {
        width,
        height,
        grid: Array.from({ length: height }, (_, row) =>
          Array.from({ length: width }, (_, col) => {
            // Create a lake with some islands
            if (row > 2 && row < height - 3 && col > 2 && col < width - 3) {
              return AreaMapTiles.Water;
            } else if (
              (row === 2 ||
                row === height - 3 ||
                col === 2 ||
                col === width - 3) &&
              !(row === 2 && col === 2) &&
              !(row === 2 && col === width - 3) &&
              !(row === height - 3 && col === 2) &&
              !(row === height - 3 && col === width - 3)
            ) {
              return AreaMapTiles.BeachSand;
            } else if (row === 5 && col === 5) {
              // Small island in the middle
              return AreaMapTiles.BeachSand;
            } else {
              return AreaMapTiles.GrassGround;
            }
          })
        ),
      };

    case 3: // Northern Forest - mostly trees and rocks
      return {
        width,
        height,
        grid: Array.from({ length: height }, (_, row) =>
          Array.from({ length: width }, (_, col) => {
            // Create a forest with rocks and paths
            if ((row + col) % 5 === 0) {
              return AreaMapTiles.Rocks;
            } else if (row === 4 || col === 4) {
              return AreaMapTiles.DirtPath;
            } else {
              return AreaMapTiles.GrassGround;
            }
          })
        ),
      };

    default: // Default to a simple grass map with a border
      return {
        width,
        height,
        grid: Array.from({ length: height }, (_, row) =>
          Array.from({ length: width }, (_, col) => {
            if (
              row === 0 ||
              col === 0 ||
              row === height - 1 ||
              col === width - 1
            ) {
              return AreaMapTiles.DirtPath;
            } else {
              return AreaMapTiles.GrassGround;
            }
          })
        ),
      };
  }
};

const handler: NextApiHandler = (req, res) => {
  const {
    query: { id },
    method,
  } = req;

  if (method === "GET") {
    // Create a unique map for this area
    const areaMap = createMockMap(String(id));

    const area = {
      id: String(id),
      parentId: id === "1" ? undefined : "1",
      name: `Area ${id}`,
      areaMap,
    };
    return res.status(200).json(area);
  }

  res.setHeader("Allow", ["GET"]);
  res.status(405).end(`Method ${method} Not Allowed`);
};

export default handler;
