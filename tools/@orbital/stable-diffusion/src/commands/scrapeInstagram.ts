import axios from "axios";
import fs from "fs";
import path from "path";

/**
 * Sleep function to introduce delay between downloads
 * @param ms Time to sleep in milliseconds
 */
async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Downloads an image from a URL and saves it to the specified path
 * @param url URL of the image to download
 * @param outputPath Path where the image will be saved
 */
async function downloadImage(url: string, outputPath: string): Promise<void> {
  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    fs.writeFileSync(outputPath, response.data);
    console.log(`Downloaded: ${path.basename(outputPath)}`);
  } catch (error: any) {
    if (error.response) {
      console.error(
        `HTTP Error: ${error.response.status} ${error.response.statusText} for ${url}`
      );
    } else {
      console.error(`Failed to download ${url}: ${error.message}`);
    }
  }
}

/**
 * Main function to process Instagram posts and download images
 * @param jsonFilePath Path to the JSON file containing Instagram posts
 * @param destinationDir Directory where images will be saved
 */
async function scrapeInstagramPosts(
  jsonFilePath: string,
  destinationDir: string,
  limit?: number
): Promise<void> {
  try {
    // Ensure destination directory exists
    fs.mkdirSync(destinationDir, { recursive: true });

    // Read and parse JSON file
    const jsonData = fs.readFileSync(jsonFilePath, "utf8");
    const posts = JSON.parse(jsonData);

    // Apply limit if specified
    const postsToProcess = limit && limit > 0 ? posts.slice(0, limit) : posts;

    console.log(
      `Found ${posts.length} posts, processing ${postsToProcess.length}`
    );

    // Process each post
    for (const post of postsToProcess) {
      if (post.id && post.displayUrl) {
        const outputPath = path.join(destinationDir, `${post.id}.jpg`);

        // Download the image
        await downloadImage(post.displayUrl, outputPath);

        // Random delay between 50-100ms
        const delay = Math.floor(Math.random() * 51) + 50; // 50-100ms
        await sleep(delay);
      } else {
        console.warn("Skipping post with missing id or displayUrl");
      }
    }

    console.log(
      `Completed downloading ${postsToProcess.length} images to ${destinationDir}`
    );
  } catch (error: any) {
    console.error(`Error processing Instagram posts: ${error.message}`);
    process.exit(1);
  }
}

// Parse command line arguments
let jsonFilePath: string | undefined;
let destinationDir: string | undefined;
let limit: number | undefined;

// Process arguments
for (let i = 2; i < process.argv.length; i++) {
  const arg = process.argv[i];

  if (arg === "--limit" && i + 1 < process.argv.length) {
    limit = parseInt(process.argv[i + 1], 10);
    if (isNaN(limit)) {
      console.error("Error: --limit must be a number");
      process.exit(1);
    }
    i++; // Skip the next argument since we've processed it
  } else if (!jsonFilePath) {
    jsonFilePath = arg;
  } else if (!destinationDir) {
    destinationDir = arg;
  }
}

// Validate command line arguments
if (!jsonFilePath || !destinationDir) {
  console.error(
    "Usage: yarn scrapeInstagram <json file path> <destination directory> [--limit <number>]"
  );
  process.exit(1);
}

// Execute the main function
scrapeInstagramPosts(jsonFilePath, destinationDir, limit).catch((error) => {
  console.error(`Unhandled error: ${error.message}`);
  process.exit(1);
});
