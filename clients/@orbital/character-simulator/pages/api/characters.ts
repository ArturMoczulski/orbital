import fs from "fs";
import type { NextApiRequest, NextApiResponse } from "next";
import path from "path";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Try to load from public/data first (for Next.js public directory)
    let filePath = path.join(
      process.cwd(),
      "public",
      "data",
      "characters.json"
    );

    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      // If not, try the data/public directory
      const dataDirectory = path.join(process.cwd(), "data", "public");
      filePath = path.join(dataDirectory, "characters.json");

      // Check if this file exists
      if (!fs.existsSync(filePath)) {
        throw new Error("Characters file not found in either location");
      }
    }

    // Read the file
    const fileContents = fs.readFileSync(filePath, "utf8");

    // Parse the JSON data
    const data = JSON.parse(fileContents);

    // Return the data
    res.status(200).json(data);
  } catch (error) {
    console.error("Error reading characters data:", error);
    res.status(500).json({ error: "Failed to load characters data" });
  }
}
