import type { NextApiHandler } from "next";
import type { AreaMapProps } from "@orbital/core/src/types/area-map";
import { AreaMapTiles } from "@orbital/core/src/types/area-map-tiles";

interface Area {
  id: string;
  parentId?: string;
  name: string;
}

/**
 * Mock area definitions for tree view (no map data in list)
 */
const mockAreas: Area[] = [
  { id: "1", name: "Overworld" },
  { id: "2", parentId: "1", name: "Southern Lake" },
  { id: "3", parentId: "1", name: "Northern Forest" },
];

const handler: NextApiHandler = (req, res) => {
  if (req.method === "GET") {
    // Return only tree metadata
    return res.status(200).json(mockAreas);
  }
  res.setHeader("Allow", ["GET"]);
  res.status(405).end("Method Not Allowed");
};

export default handler;
