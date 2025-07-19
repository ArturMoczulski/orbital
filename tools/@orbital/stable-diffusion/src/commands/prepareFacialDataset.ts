/**
 * prepareFacialDataset.ts
 *
 * A Node.js/TypeScript script for preparing facial datasets for LoRA training.
 * This script:
 * 1. Processes images from a source directory
 * 2. Detects faces using face-api.js
 * 3. Crops faces with padding
 * 4. Resizes to target resolution
 * 5. Optionally upscales small faces using Real-ESRGAN
 * 6. Saves processed face crops to output directory
 *
 * Usage:
 *   yarn prepareFacialDataset --source <source_dir> --face-output <output_dir> [options]
 */

import { Canvas, Image, ImageData, loadImage } from "@napi-rs/canvas";
import * as faceapi from "@vladmandic/face-api";
import { execSync } from "child_process";
import { Command } from "commander";
import fs from "fs/promises";
import path from "path";
import sharp from "sharp";

// Default configuration
const DEFAULT_CONFIG = {
  // Directories
  SOURCE_DIR: "data/source/instagram.com/arturinvegas/posts",
  FACE_OUTPUT_DIR: "data/source/instagram.com/arturinvegas/face",

  // Face detection parameters
  MIN_FACE_SIZE: 50, // Skip faces smaller than this (too blurry)
  FACE_PADDING: 0.2, // 20% padding around detected face

  // Output parameters
  TARGET_SIZE: 512, // 512 for SD-1.5, 768 for SDXL

  // Upscaling parameters
  UPSCALE_THRESHOLD: 200, // Upscale faces smaller than this after cropping
  UPSCALE_FACTOR: 2, // Upscale factor for Real-ESRGAN

  // Models directory
  MODELS_DIR: "./models",

  // File extensions to process
  EXTENSIONS: [".jpg", ".jpeg", ".png"],
};

/**
 * Interface for dataset preparation options
 */
interface DatasetPreparationOptions {
  sourceDir: string;
  faceOutputDir: string;
  minFaceSize: number;
  facePadding: number;
  targetSize: number;
  upscaleThreshold: number;
  upscaleFactor: number;
  modelsDir: string;
  generateAugmentations: boolean;
  augmentationCount: number;
}

/**
 * Initialize face-api models
 */
async function initModels(modelsDir: string): Promise<void> {
  console.log(`Loading face detection models from ${modelsDir}...`);

  // Check if models directory exists
  try {
    await fs.access(modelsDir);
  } catch (error) {
    console.error(`Models directory not found: ${modelsDir}`);
    console.error(
      "Please download face-api.js models and place them in the models directory."
    );
    console.error(
      "You can download them from: https://github.com/vladmandic/face-api/tree/master/model"
    );
    process.exit(1);
  }

  // Monkey-patch face-api.js environment with @napi-rs/canvas constructors
  // Use type assertions to satisfy TypeScript
  faceapi.env.monkeyPatch({
    Canvas: Canvas as unknown as typeof HTMLCanvasElement,
    Image: Image as unknown as typeof HTMLImageElement,
    ImageData: ImageData as unknown as typeof globalThis.ImageData,
  });

  // Load the SSD MobileNet model for face detection
  await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelsDir);
  console.log("Face detection models loaded successfully");
}

/**
 * Detect a single face in an image
 */
async function detectFace(
  img: Image
): Promise<faceapi.FaceDetection | undefined> {
  const c = new Canvas(img.width, img.height);
  const ctx = c.getContext("2d");
  ctx.drawImage(img, 0, 0);

  // In Node.js environment, we need to use a different approach
  // Create a tensor from the canvas image data
  const imageData = ctx.getImageData(0, 0, c.width, c.height);

  // Use the TensorFlow.js backend that face-api.js uses internally
  const tensor = faceapi.tf.tensor3d(new Float32Array(imageData.data), [
    c.height,
    c.width,
    4,
  ]);

  // Convert to format expected by face-api
  // Use type assertion for the slice method
  const tensorReshaped = (tensor as any).slice(
    [0, 0, 0],
    [c.height, c.width, 3]
  );

  try {
    // Detect face using the tensor
    return await faceapi.detectSingleFace(tensorReshaped as any);
  } catch (error) {
    console.error("Error in face detection:", error);
    return undefined;
  } finally {
    // Clean up tensors to prevent memory leaks
    tensor.dispose();
    tensorReshaped.dispose();
  }
}

/**
 * Check if Real-ESRGAN is installed
 */
function checkRealESRGAN(): boolean {
  try {
    execSync("realesrgan-ncnn-vulkan -h", { stdio: "ignore" });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Upscale an image using Real-ESRGAN
 */
async function upscaleImage(
  inputPath: string,
  outputPath: string,
  scale: number
): Promise<boolean> {
  try {
    console.log(
      `Upscaling image with Real-ESRGAN: ${path.basename(inputPath)}`
    );

    // Create a temporary directory for upscaling
    const tempDir = path.join(path.dirname(outputPath), ".temp");
    await fs.mkdir(tempDir, { recursive: true });

    // Temporary file paths
    const tempInput = path.join(tempDir, path.basename(inputPath));
    const tempOutput = path.join(
      tempDir,
      `upscaled_${path.basename(inputPath)}`
    );

    // Copy input file to temp directory
    await fs.copyFile(inputPath, tempInput);

    // Run Real-ESRGAN
    const command = `realesrgan-ncnn-vulkan -i "${tempInput}" -o "${tempOutput}" -n realesrgan-x${scale}plus`;
    execSync(command, { stdio: "inherit" });

    // Check if upscaled file exists
    await fs.access(tempOutput);

    // Copy upscaled file to output path
    await fs.copyFile(tempOutput, outputPath);

    // Clean up temporary files
    await fs.rm(tempDir, { recursive: true, force: true });

    return true;
  } catch (error) {
    console.error(`Error upscaling image: ${error}`);
    return false;
  }
}

/**
 * Generate augmented versions of an image
 */
async function generateAugmentations(
  imagePath: string,
  count: number,
  options: DatasetPreparationOptions
): Promise<void> {
  console.log(
    `Generating ${count} augmentations for ${path.basename(imagePath)}...`
  );

  const baseName = path.basename(imagePath, path.extname(imagePath));
  const outputDir = path.dirname(imagePath);

  for (let i = 1; i <= count; i++) {
    const outputPath = path.join(
      outputDir,
      `${baseName}_aug${i}${path.extname(imagePath)}`
    );

    // Random rotation between -10 and 10 degrees
    const rotation = Math.random() * 20 - 10;

    // Random brightness adjustment between 0.9 and 1.1
    const brightness = 0.9 + Math.random() * 0.2;

    // Apply transformations
    await sharp(imagePath)
      .rotate(rotation)
      .modulate({ brightness })
      .toFile(outputPath);

    console.log(
      `Created augmentation ${i}/${count}: ${path.basename(outputPath)}`
    );
  }
}

/**
 * Process a single image file
 */
async function processImage(
  filePath: string,
  options: DatasetPreparationOptions
): Promise<void> {
  const fileName = path.basename(filePath);
  console.log(`Processing ${fileName}...`);

  try {
    // Load the image
    const img = await loadImage(filePath);

    // Detect face
    const detection = await detectFace(img);
    if (!detection) {
      console.log(`No face detected in ${fileName}`);
      return;
    }

    // Get face box
    const { x, y, width, height } = detection.box;

    // Log face size but don't skip based on size
    if (Math.min(width, height) < options.minFaceSize) {
      console.log(
        `Small face detected in ${fileName} (${width}x${height}), processing anyway`
      );
    }

    // Calculate padding (keeping aspect ratio square)
    const pad = options.facePadding * Math.max(width, height);
    const cx = x + width / 2;
    const cy = y + height / 2;
    const half = 0.5 * Math.max(width, height) + pad;

    // Calculate crop dimensions (ensuring we don't go out of bounds)
    // Round to integers as required by sharp.extract()
    const crop = {
      left: Math.round(Math.max(0, cx - half)),
      top: Math.round(Math.max(0, cy - half)),
      width: Math.round(
        Math.min(img.width, cx + half) - Math.max(0, cx - half)
      ),
      height: Math.round(
        Math.min(img.height, cy + half) - Math.max(0, cy - half)
      ),
    };

    // Ensure output directories exist
    await fs.mkdir(options.faceOutputDir, { recursive: true });

    // Prepare output file paths
    const baseName = path.basename(filePath, path.extname(filePath));
    const faceOutputPath = path.join(options.faceOutputDir, `${baseName}.png`);

    // Determine the longest dimension of the crop
    const LONG = Math.max(crop.width, crop.height);
    const hasRealESRGAN = checkRealESRGAN();

    // Temporary path for intermediate processing
    const tempCropPath = path.join(
      options.faceOutputDir,
      `.temp_${baseName}.png`
    );

    if (LONG >= options.targetSize) {
      // Case 1: Crop is larger than target size
      // Down-scale with Lanczos so the longest edge = target
      console.log(
        `Face crop is large (${LONG}px), downscaling to ${options.targetSize}px`
      );
      await sharp(filePath)
        .extract(crop)
        .resize(options.targetSize, options.targetSize, {
          fit: "cover",
          kernel: "lanczos3",
        })
        .toFile(faceOutputPath);
    } else if (LONG < options.upscaleThreshold && hasRealESRGAN) {
      // Case 3: Crop is very small (< 200px) or visibly blurry
      // Use 2× RealESRGAN → then resize/center-crop to target
      console.log(
        `Face crop is very small (${LONG}px), upscaling with RealESRGAN`
      );

      // ❶ save the raw crop
      await sharp(filePath).extract(crop).toFile(tempCropPath);

      // ❷ run realesrgan-x2plus
      const upscaleSuccess = await upscaleImage(
        tempCropPath,
        faceOutputPath,
        options.upscaleFactor
      );

      if (upscaleSuccess) {
        // Resize the upscaled image to target size
        await sharp(faceOutputPath)
          .resize(options.targetSize, options.targetSize, {
            fit: "cover",
            kernel: "lanczos3",
          })
          .toFile(faceOutputPath + ".tmp");

        // Replace original with resized
        await fs.rename(faceOutputPath + ".tmp", faceOutputPath);

        // Clean up temp file
        await fs.unlink(tempCropPath);
      } else {
        // Fallback to normal processing if upscaling fails
        console.log(
          "RealESRGAN upscaling failed, falling back to direct resize"
        );
        await sharp(filePath)
          .extract(crop)
          .resize(options.targetSize, options.targetSize, {
            fit: "cover",
            kernel: "lanczos3",
          })
          .toFile(faceOutputPath);
      }
    } else {
      // Case 2: Crop is between upscaleThreshold and target size
      // Exact resize to target (Lanczos)
      console.log(
        `Face crop is medium-sized (${LONG}px), direct resize to ${options.targetSize}px`
      );
      await sharp(filePath)
        .extract(crop)
        .resize(options.targetSize, options.targetSize, {
          fit: "cover",
          kernel: "lanczos3",
        })
        .toFile(faceOutputPath);
    }

    console.log(`Saved face crop: ${path.basename(faceOutputPath)}`);

    // Generate augmentations if enabled
    if (options.generateAugmentations && options.augmentationCount > 0) {
      await generateAugmentations(
        faceOutputPath,
        options.augmentationCount,
        options
      );
    }

    // No full-body processing in this file
  } catch (error) {
    console.error(`Error processing ${fileName}: ${error}`);
  }
}

/**
 * Main function to process all images in a directory
 */
async function processDirectory(
  options: DatasetPreparationOptions
): Promise<void> {
  console.log(`Processing images from ${options.sourceDir}...`);
  console.log(`Saving face crops to ${options.faceOutputDir}`);

  try {
    // Initialize face-api models
    await initModels(options.modelsDir);

    // Check for Real-ESRGAN
    const hasRealESRGAN = checkRealESRGAN();
    if (hasRealESRGAN) {
      console.log("Real-ESRGAN detected, will use for upscaling small faces");
    } else {
      console.log("Real-ESRGAN not found, upscaling will be skipped");
      console.log(
        "To enable upscaling, install Real-ESRGAN: brew install real-esrgan"
      );
    }

    // Get all files in source directory
    const files = await fs.readdir(options.sourceDir);

    // Filter for image files
    const imageFiles = files.filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return DEFAULT_CONFIG.EXTENSIONS.includes(ext);
    });

    console.log(`Found ${imageFiles.length} image files to process`);

    // Process each image
    for (const file of imageFiles) {
      const filePath = path.join(options.sourceDir, file);
      await processImage(filePath, options);
    }

    console.log("Processing complete!");
    console.log(`Processed ${imageFiles.length} images`);
    console.log(`Face crops saved to ${options.faceOutputDir}`);
  } catch (error) {
    console.error(`Error processing directory: ${error}`);
    process.exit(1);
  }
}

/**
 * Main function
 */
async function main(): Promise<void> {
  const program = new Command();

  program
    .name("prepareFacialDataset")
    .description("Prepare facial dataset for LoRA training")
    .option(
      "-s, --source <dir>",
      "Source directory containing images",
      DEFAULT_CONFIG.SOURCE_DIR
    )
    .option(
      "-f, --face-output <dir>",
      "Output directory for face crops",
      DEFAULT_CONFIG.FACE_OUTPUT_DIR
    )
    .option(
      "--min-face <size>",
      "Minimum face size to process (px)",
      String(DEFAULT_CONFIG.MIN_FACE_SIZE)
    )
    .option(
      "--padding <ratio>",
      "Padding around face (as ratio of face size)",
      String(DEFAULT_CONFIG.FACE_PADDING)
    )
    .option(
      "--target <size>",
      "Target size for output images (px)",
      String(DEFAULT_CONFIG.TARGET_SIZE)
    )
    .option(
      "--upscale-threshold <size>",
      "Threshold for upscaling small faces (px)",
      String(DEFAULT_CONFIG.UPSCALE_THRESHOLD)
    )
    .option(
      "--upscale-factor <factor>",
      "Factor for upscaling small faces",
      String(DEFAULT_CONFIG.UPSCALE_FACTOR)
    )
    .option(
      "--models <dir>",
      "Directory containing face-api models",
      DEFAULT_CONFIG.MODELS_DIR
    )
    .option(
      "--augment",
      "Generate augmented versions of processed images",
      false
    )
    .option(
      "--augment-count <count>",
      "Number of augmentations to generate per image",
      "5"
    )
    .parse(process.argv);

  const options = program.opts();

  // Convert string options to appropriate types
  const datasetOptions: DatasetPreparationOptions = {
    sourceDir: options.source,
    faceOutputDir: options.faceOutput,
    minFaceSize: parseInt(options.minFace, 10),
    facePadding: parseFloat(options.padding),
    targetSize: parseInt(options.target, 10),
    upscaleThreshold: parseInt(options.upscaleThreshold, 10),
    upscaleFactor: parseInt(options.upscaleFactor, 10),
    modelsDir: options.models,
    generateAugmentations: options.augment,
    augmentationCount: parseInt(options.augmentCount, 10),
  };

  // Process the directory
  await processDirectory(datasetOptions);
}

// Run the main function if this file is being executed directly
if (process.argv[1] && process.argv[1].includes("prepareFacialDataset")) {
  main().catch((error) => {
    console.error("Unhandled error:", error);
    process.exit(1);
  });
}

// Export the main function for use in other modules
export { main as prepareFacialDataset };
