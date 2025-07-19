import fs from "fs";
import type { NextApiRequest, NextApiResponse } from "next";
import path from "path";
import { ConversationThread } from "../../../store";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { characterId } = req.query;

  if (!characterId || Array.isArray(characterId)) {
    return res.status(400).json({ error: "Invalid character ID" });
  }

  // Define the directory and file path
  const conversationsDir = path.join(
    process.cwd(),
    "public",
    "data",
    characterId,
    "conversations"
  );
  const filePath = path.join(conversationsDir, "threads.json");

  // Handle GET request - retrieve conversation threads
  if (req.method === "GET") {
    try {
      // Check if the directory and file exist
      if (!fs.existsSync(filePath)) {
        // If the file doesn't exist, return an empty array
        return res.status(200).json([]);
      }

      // Read the file
      const fileContents = fs.readFileSync(filePath, "utf8");

      // Parse the JSON data
      const data = JSON.parse(fileContents);

      // Return the data
      res.status(200).json(data);
    } catch (error) {
      console.error(
        `Error reading conversation threads for ${characterId}:`,
        error
      );
      res.status(500).json({ error: "Failed to load conversation threads" });
    }
  }
  // Handle POST request - save conversation threads
  else if (req.method === "POST") {
    try {
      const threads = req.body as ConversationThread[];

      // Ensure the directory exists
      if (!fs.existsSync(conversationsDir)) {
        fs.mkdirSync(conversationsDir, { recursive: true });
      }

      // Write the data to the file
      fs.writeFileSync(filePath, JSON.stringify(threads, null, 2));

      // Return success
      res.status(200).json({ success: true });
    } catch (error) {
      console.error(
        `Error saving conversation threads for ${characterId}:`,
        error
      );
      res.status(500).json({ error: "Failed to save conversation threads" });
    }
  }
  // Handle unsupported methods
  else {
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
}
