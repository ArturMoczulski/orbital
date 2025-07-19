/**
 * Common interfaces and types for Stable Diffusion workflows
 */

/**
 * Base options interface for all Stable Diffusion workflows
 */
export interface BaseWorkflowOptions {
  output: string; // Output directory for generated images
  prompt?: string; // Optional additional prompt
  negativePrompt?: string; // Optional additional negative prompt
  width?: number;
  height?: number;
  steps?: number;
  cfg?: number;
  seed?: number;
  upscale?: boolean; // Whether to add hi-res upscale pass
  upscaleDenoise?: number; // Denoise strength for upscale (0.25-0.35 recommended)
  fastSampler?: boolean; // Use faster sampler (dpmpp_2m without SDE) for ~10% speed boost
  preview?: boolean; // Use fast preview mode with lower resolution and fewer steps
}

export interface BaseInputWorkflowOptions extends BaseWorkflowOptions {
  input: string;
}

/**
 * Options for text-to-face generation
 */
export interface Txt2FaceOptions extends BaseWorkflowOptions {
  // No additional properties specific to txt2face
}

/**
 * Options for face-to-face generation (image-to-image)
 */
export interface Face2FaceOptions extends BaseWorkflowOptions {
  input: string; // Path to the input face image
  denoise?: number; // Denoise strength for img2img (0.6-0.8 recommended)
}

/**
 * Options for batch image upscaling
 */
export interface UpscaleImageOptions extends BaseWorkflowOptions {
  input: string; // Path to the input image or directory
  modelName?: string; // Name of the upscale model to use (default: RealESRGAN_x2plus.pth)
  outputPrefix?: string; // Prefix for output filenames (default: original filename + "_up")
  recursive?: boolean; // Whether to process subdirectories recursively
}

/**
 * Options for training a face LoRA model
 */
export interface TrainFaceLoraOptions extends BaseWorkflowOptions {
  datasetPath: string; // Path to the directory containing the training dataset
  networkDim?: number; // Dimension of the LoRA network (4-128, default: 32)
  trainingSteps?: number; // Number of training steps (default: 1000)
  learningRate?: number; // Learning rate for training (default: 0.0001)
  batchSize?: number; // Batch size for training (default: 1)
  resolution?: number; // Resolution for training images (default: 512)
  baseModel?: string; // Base model to train on (checkpoint name)
  device?: string; // Device to use for training (default: "cuda")
  saveEveryNSteps?: number; // Save checkpoint every N steps (default: 100)
  textEncoder?: boolean; // Whether to train the text encoder (default: true)
  unet?: boolean; // Whether to train the UNet (default: true)
  clipSkip?: number; // Number of CLIP layers to skip (default: 1)
}
