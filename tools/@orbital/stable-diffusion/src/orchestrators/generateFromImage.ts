import axios from "axios";
import fs from "fs";
import { last } from "lodash";
import path from "path";
import { fileURLToPath } from "url";
import { BaseInputWorkflowOptions } from "../workflows/common.js";
import { generateImage as generateImageImpl } from "./generateImage.js";

// Get __dirname equivalent in ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Hard-coding path constants
const comfyUIUrl = "http://127.0.0.1:8188";
const DATA_ROOT = path.resolve(__dirname, "../../data");

// Add debug logging
const DEBUG = true;
function debug(...args: any[]) {
  if (DEBUG) {
    console.log("[DEBUG]", ...args);
  }
}

/**
 * Uploads an image to ComfyUI and then generates a new image using the uploaded image
 * This is useful when ComfyUI doesn't have direct filesystem access to the input image
 *
 * @param imagePath Path to the local image file to upload
 * @param options Options for the workflow
 * @param createWorkflow Function to create the workflow
 * @param outputNodeId Optional ID of the SaveImage node
 * @param workflowName Optional name for the workflow
 * @returns Path to the generated image or null if generation failed
 */
export async function generateFromImage<T extends BaseInputWorkflowOptions>(
  imagePath: string,
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
    debug("Starting image upload and generation process");
    debug("Input image path:", imagePath);

    // Check if the input file exists
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Input image not found at ${imagePath}`);
    }

    // Generate a random ID for the uploaded file to prevent name collisions
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileExt = path.extname(imagePath);
    const fileName = `uploaded_${randomId}${fileExt}`;

    debug(`Reading file from ${imagePath}`);
    const fileBuffer = fs.readFileSync(imagePath);

    // Create form data for the upload
    const formData = new FormData();
    formData.append("image", new Blob([fileBuffer]), fileName);
    formData.append("overwrite", "true");

    debug(`Uploading file to ComfyUI as ${fileName}`);

    // Upload the file to ComfyUI
    const uploadResponse = await axios.post(
      `${comfyUIUrl}/upload/image`,
      formData,
      {
        headers: {
          // FormData automatically sets the correct Content-Type header with boundary
          // No need to manually set it as it can cause issues with multipart uploads
        },
      }
    );

    debug("Upload response:", uploadResponse.data);

    // Check if the upload was successful
    if (!uploadResponse.data || uploadResponse.status !== 200) {
      throw new Error(
        `Failed to upload image: ${JSON.stringify(uploadResponse.data)}`
      );
    }

    // Get the uploaded file name from the response
    // ComfyUI typically returns the file name in the response
    // The exact format depends on the ComfyUI version
    let uploadedFileName = fileName;
    if (uploadResponse.data.name) {
      uploadedFileName = uploadResponse.data.name;
    } else if (uploadResponse.data.filename) {
      uploadedFileName = uploadResponse.data.filename;
    } else if (
      uploadResponse.data.files &&
      uploadResponse.data.files.length > 0
    ) {
      uploadedFileName =
        uploadResponse.data.files[0].name || uploadResponse.data.files[0];
    }

    debug(`File uploaded successfully as ${uploadedFileName}`);

    // Create a modified workflow creation function that uses the uploaded file
    const modifiedCreateWorkflow = (
      options: T,
      models: {
        checkpoints: string[];
        vaes: string[];
      }
    ) => {
      // First, get the original workflow
      const originalWorkflow = createWorkflow(
        { ...options, input: last(options.input.split("/")) },
        models
      );

      debug(
        "Original workflow before modification:",
        JSON.stringify(originalWorkflow, null, 2)
      );

      // Find and modify all LoadImage nodes
      let foundLoadImageNode = false;

      for (const [nodeId, node] of Object.entries(originalWorkflow.prompt)) {
        if (
          typeof node === "object" &&
          node !== null &&
          (node as any).class_type === "LoadImage"
        ) {
          debug(
            `Found LoadImage node ${nodeId} with image: ${(node as any).inputs.image}`
          );

          // Replace the image path with the uploaded file name
          // This is the key fix - ComfyUI expects just the filename for uploaded files
          (node as any).inputs.image = uploadedFileName;

          debug(
            `Modified LoadImage node ${nodeId} to use uploaded file: ${uploadedFileName}`
          );
          foundLoadImageNode = true;
        }
      }

      if (!foundLoadImageNode) {
        console.warn(
          "No LoadImage nodes found in the workflow. This may indicate a problem."
        );
        debug(
          "Workflow nodes:",
          Object.keys(originalWorkflow.prompt).join(", ")
        );

        // Dump the workflow structure for debugging
        for (const [nodeId, node] of Object.entries(originalWorkflow.prompt)) {
          if (typeof node === "object" && node !== null) {
            debug(
              `Node ${nodeId} is of class_type: ${(node as any).class_type}`
            );
          }
        }
      }

      debug("Modified workflow:", JSON.stringify(originalWorkflow, null, 2));

      return originalWorkflow;
    };

    debug(
      "Calling generateImage with modified workflow that uses the uploaded file"
    );

    // Call the original generateImage function with the original options but modified workflow
    return await generateImageImpl(
      options,
      modifiedCreateWorkflow,
      outputNodeId,
      workflowName
    );
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response) {
      console.error(
        `HTTP Error during upload or generation: ${error.response.status} ${error.response.statusText}`
      );
      console.error(`Details: ${JSON.stringify(error.response.data)}`);
    } else {
      console.error(`Unexpected error: ${error.message}`);
    }
    return null;
  }
}
