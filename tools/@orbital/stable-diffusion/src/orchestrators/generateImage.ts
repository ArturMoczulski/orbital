import axios from "axios";
import cliProgress from "cli-progress";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Hard-coding path constants
const comfyUIUrl = "http://127.0.0.1:8188";
const COMFY_ROOT = path.resolve(
  __dirname,
  "../../../../../services/@comfyanonymous/ComfyUI"
);
const DATA_ROOT = path.resolve(__dirname, "../../data");

// Add debug logging
const DEBUG = true;
function debug(...args: any[]) {
  if (DEBUG) {
    console.log("[DEBUG]", ...args);
  }
}

// Separate debug function that doesn't interfere with progress bar
function silentDebug(...args: any[]) {
  // When progress bar is active, store logs to display later or write to a different stream
  if (DEBUG) {
    // Using process.stderr doesn't interfere with the progress bar on stdout
    process.stderr.write(`[DEBUG] ${args.join(" ")}\n`);
  }
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pollGenerationCompletion(promptId: string): Promise<any> {
  let completed = false;
  let outputs;
  let attempts = 0;
  const maxAttempts = 30; // Maximum number of polling attempts

  // No debug logs during polling to keep progress bar on one line

  // Create a new progress bar
  const progressBar = new cliProgress.SingleBar({
    format: "Image Generation Progress |{bar}| {percentage}% | {status}",
    barCompleteChar: "\u2588",
    barIncompleteChar: "\u2591",
    hideCursor: true,
    clearOnComplete: true,
    forceRedraw: true,
    stream: process.stdout,
    noTTYOutput: false,
  });

  // Initialize the progress bar
  progressBar.start(100, 0, {
    status: "Initializing...",
  });

  // First, check immediately in case it completed very quickly
  try {
    const immediateResponse = await axios.get(
      `${comfyUIUrl}/history/${promptId}`
    );

    // Remove debug log during polling

    if (immediateResponse.data && immediateResponse.data[promptId]) {
      const promptResult = immediateResponse.data[promptId];

      if (promptResult.status && promptResult.status.completed) {
        // Remove debug log during polling
        outputs = promptResult.outputs;
        completed = true;
        progressBar.update(100, { status: "Completed" });
      }
    }
  } catch (error) {
    console.error("Error checking immediate completion:", error);
  }

  // If not completed immediately, start polling
  while (!completed && attempts < maxAttempts) {
    attempts++;
    await sleep(2000);

    try {
      const historyResponse = await axios.get(
        `${comfyUIUrl}/history/${promptId}`
      );

      // No debug logs during polling to keep progress bar on one line

      if (historyResponse.data && historyResponse.data[promptId]) {
        const promptResult = historyResponse.data[promptId];

        // Calculate progress percentage
        let progressPercentage = Math.min(
          Math.round((attempts / maxAttempts) * 100),
          99
        );
        let statusMessage = `Processing (${attempts}/${maxAttempts})`;

        // Check if ComfyUI provides progress information
        if (
          promptResult.status &&
          typeof promptResult.status.progress === "number"
        ) {
          progressPercentage = Math.min(
            Math.round(promptResult.status.progress * 100),
            99
          );
        }

        // Check for execution_cached status
        if (promptResult.status && promptResult.status.execution_cached) {
          statusMessage = "Using cached result";
          progressPercentage = 95;
        }

        if (promptResult.status && promptResult.status.completed) {
          outputs = promptResult.outputs;
          completed = true;
          progressBar.update(100, { status: "Completed" });
          // No debug logs during polling to keep progress bar on one line
        } else {
          progressBar.update(progressPercentage, { status: statusMessage });
        }
      } else {
        progressBar.update(
          Math.min(Math.round((attempts / maxAttempts) * 100), 99),
          {
            status: `Initializing (${attempts}/${maxAttempts})`,
          }
        );
      }
    } catch (error) {
      console.error(`Error during polling (attempt ${attempts}):`, error);
    }
  }

  // Stop the progress bar
  progressBar.stop();

  if (!completed) {
    console.error(`Polling timed out after ${maxAttempts} attempts`);
  }

  return outputs;
}

/**
 * Generic function to generate images using ComfyUI with custom workflows
 * @param options The options for the workflow
 * @param createWorkflow A function that creates a ComfyUI workflow based on the options
 * @param outputNodeId The ID of the SaveImage node in the workflow (default: "8")
 * @returns The path to the generated image
 */
async function generateImageImpl<T>(
  options: T & {
    output?: string;
    seed?: number;
  },
  createWorkflow: (
    options: T,
    models: {
      checkpoints: string[];
      vaes: string[];
    }
  ) => { prompt: Record<string, any> },
  outputNodeId: string = "",
  workflowName: string = "generated"
): Promise<string | null> {
  try {
    debug("Starting image generation with options:", options);

    // Get list of available checkpoints and VAEs
    debug("Fetching available models from ComfyUI");
    const modelsResponse = await axios.get(`${comfyUIUrl}/object_info`);
    const checkpoints =
      modelsResponse.data.CheckpointLoaderSimple?.input?.required?.ckpt_name ||
      [];
    const vaes = modelsResponse.data.VAELoader?.input?.required?.vae_name || [];

    debug("Available checkpoints:", checkpoints);
    debug("Available VAEs:", vaes);

    // Check if models are available
    if (checkpoints.length === 0) {
      throw new Error("No checkpoint models available in ComfyUI");
    }
    if (vaes.length === 0) {
      throw new Error("No VAE models available in ComfyUI");
    }

    // If no seed is provided, generate a random one to prevent caching
    if (options.seed === undefined) {
      (options as any).seed = Math.floor(Math.random() * 1000000);
      debug(`No seed provided, using random seed: ${(options as any).seed}`);
    }

    // Create workflow using the provided function
    const workflow = createWorkflow(options, { checkpoints, vaes });

    // Find existing SaveImage node or add one
    let saveImageNodeId = outputNodeId;
    let foundSaveImageNode = false;

    // First, check if there's already a SaveImage node in the workflow
    for (const [nodeId, node] of Object.entries(workflow.prompt)) {
      if (typeof node === "object" && node.class_type === "SaveImage") {
        saveImageNodeId = nodeId;
        foundSaveImageNode = true;
        debug(`Found existing SaveImage node at index ${nodeId}`);
        break;
      }
    }

    if (!foundSaveImageNode) {
      // Find the highest node index and the last node that outputs images
      let highestNodeIndex = 0;
      let lastImageNodeId = "";

      for (const nodeId of Object.keys(workflow.prompt)) {
        const numericId = parseInt(nodeId, 10);
        if (!isNaN(numericId) && numericId > highestNodeIndex) {
          highestNodeIndex = numericId;
        }

        // Check for nodes that output images (VAEDecode, ImageUpscaleWithModel, etc.)
        const node = workflow.prompt[nodeId];
        if (typeof node === "object") {
          if (node.class_type === "ImageUpscaleWithModel") {
            // Prefer ImageUpscaleWithModel as it's likely the final upscaled image
            lastImageNodeId = nodeId;
            debug(
              `Found ImageUpscaleWithModel node at index ${nodeId}, using as image source`
            );
            break; // Prioritize this node if found
          } else if (node.class_type === "VAEDecode") {
            // VAEDecode nodes also output images
            lastImageNodeId = nodeId;
          }
        }
      }

      // If we couldn't find an image output node, use the highest node as a fallback
      if (!lastImageNodeId) {
        lastImageNodeId = highestNodeIndex.toString();
        debug(
          `No image output node found, using highest node ${lastImageNodeId} as image source`
        );
      } else if (workflow.prompt[lastImageNodeId].class_type === "VAEDecode") {
        debug(`Using VAEDecode node ${lastImageNodeId} as image source`);
      }

      // Add SaveImage node at the next available index
      saveImageNodeId = (highestNodeIndex + 1).toString();

      workflow.prompt[saveImageNodeId] = {
        class_type: "SaveImage",
        inputs: {
          images: [lastImageNodeId, 0],
          filename_prefix: workflowName, // Use workflow name as prefix
          output_dir: "", // Use default ComfyUI output directory
        },
      };

      debug(
        `Added SaveImage node at index ${saveImageNodeId} with configuration:`,
        workflow.prompt[saveImageNodeId]
      );
    }

    // Update the outputNodeId to match the SaveImage node
    outputNodeId = saveImageNodeId;

    debug("Submitting workflow to ComfyUI");
    debug("Workflow:", JSON.stringify(workflow, null, 2));

    // Variable to store outputs, declared outside try block for scope
    let outputs: any;

    try {
      const generateResponse = await axios.post(
        `${comfyUIUrl}/prompt`,
        workflow
      );
      const promptId = generateResponse.data.prompt_id;
      console.log(`Prompt submitted with ID: ${promptId}`);

      debug(
        "Response from ComfyUI:",
        JSON.stringify(generateResponse.data, null, 2)
      );

      console.log("Starting image generation...");
      outputs = await pollGenerationCompletion(promptId);
      console.log("Image generation completed successfully!");
      debug(
        "Outputs:",
        outputs ? JSON.stringify(outputs, null, 2) : "undefined"
      );
    } catch (error: any) {
      console.error("Error submitting workflow to ComfyUI:", error.message);
      if (axios.isAxiosError(error) && error.response) {
        console.error(`Response status: ${error.response.status}`);
        console.error(
          `Response data:`,
          JSON.stringify(error.response.data, null, 2)
        );
      }
      throw error;
    }

    // Check if we have valid outputs
    debug(
      "Checking outputs:",
      outputs ? JSON.stringify(outputs, null, 2) : "undefined"
    );

    // Try to get the image directly from the ComfyUI output directory
    // This is a fallback in case the API doesn't return the expected output structure
    const comfyUIOutputDir = path.join(COMFY_ROOT, "output");
    debug("Checking ComfyUI output directory:", comfyUIOutputDir);

    // Find any node in the outputs that contains images
    let imageInfo = null;
    let usedNodeId = null;

    if (outputs) {
      // First try with the expected outputNodeId if provided
      if (
        outputNodeId &&
        outputs[outputNodeId] &&
        outputs[outputNodeId].images &&
        outputs[outputNodeId].images.length > 0
      ) {
        imageInfo = outputs[outputNodeId].images[0];
        usedNodeId = outputNodeId;
        debug(`Using expected output node ID: ${outputNodeId}`);
      } else {
        // If that fails, search for any node that has images
        debug("Searching for any node with image outputs...");

        for (const nodeId of Object.keys(outputs)) {
          if (
            outputs[nodeId] &&
            outputs[nodeId].images &&
            outputs[nodeId].images.length > 0
          ) {
            imageInfo = outputs[nodeId].images[0];
            usedNodeId = nodeId;
            debug(`Found images in node ${nodeId}, using this as output node`);
            break;
          }
        }
      }
    }

    // If we still don't have images from the API response, check the output directory
    if (!imageInfo && fs.existsSync(comfyUIOutputDir)) {
      debug(
        "No images found in API response, checking ComfyUI output directory"
      );
      const files = fs.readdirSync(comfyUIOutputDir);

      // Sort files by modification time (newest first)
      const sortedFiles = files
        .filter(
          (file) =>
            file.endsWith(".png") ||
            file.endsWith(".jpg") ||
            file.endsWith(".jpeg")
        )
        .map((file) => {
          const filePath = path.join(comfyUIOutputDir, file);
          const stats = fs.statSync(filePath);
          return { file, mtime: stats.mtime };
        })
        .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

      debug(
        "Files in ComfyUI output directory:",
        sortedFiles.map((f) => f.file).join(", ")
      );

      // Use the most recently created image file
      if (sortedFiles.length > 0) {
        const newestFile = sortedFiles[0].file;
        debug(`Using most recent file from output directory: ${newestFile}`);
        imageInfo = { filename: newestFile };
      }
    }

    // If we still don't have images, throw an error
    if (!imageInfo) {
      console.error("Expected output node ID:", outputNodeId);
      console.error(
        "Available output nodes:",
        outputs ? Object.keys(outputs) : []
      );
      console.error(
        "ComfyUI output directory contents:",
        fs.existsSync(comfyUIOutputDir)
          ? fs.readdirSync(comfyUIOutputDir).join(", ")
          : "Directory not found"
      );
      throw new Error("No images were generated in any output node");
    }
    const imageFilename = imageInfo.filename;
    const comfyUIImagePath = path.join(COMFY_ROOT, "output", imageFilename);
    const targetPath = path.join(
      DATA_ROOT,
      options.output || "output",
      imageFilename
    );

    debug("ComfyUI image path:", comfyUIImagePath);
    debug("Target path:", targetPath);

    // Check if the generated image exists
    if (!fs.existsSync(comfyUIImagePath)) {
      throw new Error(`Generated image not found at ${comfyUIImagePath}`);
    }

    const stats = fs.statSync(comfyUIImagePath);
    debug("Generated image size:", stats.size, "bytes");

    if (stats.size < 5000) {
      console.warn(
        "Warning: Generated image is very small, might be blank or corrupted"
      );
    }

    // Ensure output directory exists
    const outputDir = path.join(DATA_ROOT, options.output || "output");
    debug(`Ensuring output directory exists: ${outputDir}`);
    try {
      fs.mkdirSync(outputDir, {
        recursive: true,
      });
      debug(`Output directory created/verified: ${outputDir}`);
    } catch (error) {
      console.error(`Error creating output directory: ${error}`);
      throw new Error(`Failed to create output directory: ${error}`);
    }

    // Check if the target file already exists and create a unique filename with increasing index
    const fileBaseName = path.basename(
      imageFilename,
      path.extname(imageFilename)
    );
    const fileExt = path.extname(imageFilename);

    // Extract the base name without the index suffix (e.g., "face2face" from "face2face_00001_")
    const baseNameWithoutIndex = fileBaseName.replace(/_\d+_$/, "");

    // Find the highest existing index in the output directory
    let highestIndex = 0;
    if (fs.existsSync(outputDir)) {
      const files = fs.readdirSync(outputDir);
      const pattern = new RegExp(
        `^${baseNameWithoutIndex}_(\\d{5})_${fileExt}$`
      );

      for (const file of files) {
        const match = file.match(pattern);
        if (match && match[1]) {
          const index = parseInt(match[1], 10);
          if (index > highestIndex) {
            highestIndex = index;
          }
        }
      }
    }

    // Create a new filename with the next index
    const newIndex = highestIndex + 1;
    const newFileName = `${baseNameWithoutIndex}_${String(newIndex).padStart(5, "0")}_${fileExt}`;
    const newTargetPath = path.join(outputDir, newFileName);

    // Copy the file to the target path with the new filename
    fs.copyFileSync(comfyUIImagePath, newTargetPath);

    // Delete the original file from ComfyUI output directory
    try {
      fs.unlinkSync(comfyUIImagePath);
      debug(`Deleted original file from ComfyUI output: ${comfyUIImagePath}`);
    } catch (error) {
      console.warn(
        `Warning: Could not delete original file from ComfyUI output: ${error}`
      );
    }

    console.log(`Generated image saved to ${newTargetPath}`);
    return newTargetPath;
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response) {
      console.error(
        `HTTP Error: ${error.response.status} ${error.response.statusText}`
      );
      console.error(`Details: ${JSON.stringify(error.response.data)}`);
    } else {
      console.error(`Unexpected error: ${error.message}`);
    }
    return null;
  }
}

// Export the function with the same name as the file for dynamic imports
export const generateImage = generateImageImpl;
