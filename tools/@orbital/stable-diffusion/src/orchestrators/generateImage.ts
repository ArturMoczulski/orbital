import axios from "axios";
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

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pollGenerationCompletion(promptId: string): Promise<any> {
  let completed = false;
  let outputs;
  let attempts = 0;
  const maxAttempts = 30; // Maximum number of polling attempts

  debug(`Starting to poll for completion of prompt ID: ${promptId}`);

  // First, check immediately in case it completed very quickly
  try {
    const immediateResponse = await axios.get(
      `${comfyUIUrl}/history/${promptId}`
    );

    debug(
      "Immediate history response:",
      JSON.stringify(immediateResponse.data, null, 2)
    );

    if (immediateResponse.data && immediateResponse.data[promptId]) {
      const promptResult = immediateResponse.data[promptId];

      if (promptResult.status && promptResult.status.completed) {
        debug("Prompt completed immediately");
        outputs = promptResult.outputs;
        completed = true;
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

      debug(
        `Poll attempt ${attempts}:`,
        JSON.stringify(historyResponse.data, null, 2)
      );

      if (historyResponse.data && historyResponse.data[promptId]) {
        const promptResult = historyResponse.data[promptId];

        if (promptResult.status && promptResult.status.completed) {
          outputs = promptResult.outputs;
          completed = true;
          debug("Generation completed after", attempts, "attempts");
        } else {
          console.log(
            `Generation in progress... (attempt ${attempts}/${maxAttempts})`
          );
        }
      } else {
        console.log(
          `Waiting for ComfyUI to initialize generation... (attempt ${attempts}/${maxAttempts})`
        );
      }
    } catch (error) {
      console.error(`Error during polling (attempt ${attempts}):`, error);
    }
  }

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
    outputDirectory: string;
  },
  createWorkflow: (
    options: T,
    models: {
      checkpoints: string[];
      vaes: string[];
    }
  ) => { prompt: Record<string, any> },
  outputNodeId: string = "8",
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

    // Create workflow using the provided function
    const workflow = createWorkflow(options, { checkpoints, vaes });

    // Add SaveImage node if not present
    if (
      !workflow.prompt["8"] ||
      workflow.prompt["8"].class_type !== "SaveImage"
    ) {
      // Find the last node that outputs images
      let lastImageNodeId = "7"; // Default to node 7 which is typically VAEDecode

      // Add SaveImage node with explicit output configuration
      workflow.prompt["8"] = {
        class_type: "SaveImage",
        inputs: {
          images: [lastImageNodeId, 0],
          filename_prefix: workflowName, // Use workflow name as prefix
          output_dir: "", // Use default ComfyUI output directory
        },
      };

      debug("Added SaveImage node with configuration:", workflow.prompt["8"]);
    }

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

      debug("Polling for generation completion");
      outputs = await pollGenerationCompletion(promptId);
      debug("Generation completed");
      debug("Outputs:", JSON.stringify(outputs, null, 2));
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
    debug("Checking outputs:", outputs);
    if (
      !outputs ||
      !outputs[outputNodeId] ||
      !outputs[outputNodeId].images ||
      outputs[outputNodeId].images.length === 0
    ) {
      console.error("Output node ID:", outputNodeId);
      console.error("Available output nodes:", Object.keys(outputs || {}));
      throw new Error("No images were generated in the output");
    }

    const imageInfo = outputs[outputNodeId].images[0];
    const imageFilename = imageInfo.filename;
    const comfyUIImagePath = path.join(COMFY_ROOT, "output", imageFilename);
    const targetPath = path.join(
      DATA_ROOT,
      options.outputDirectory,
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
    fs.mkdirSync(path.join(DATA_ROOT, options.outputDirectory), {
      recursive: true,
    });
    fs.copyFileSync(comfyUIImagePath, targetPath);

    console.log(`Generated image saved to ${targetPath}`);
    return targetPath;
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
