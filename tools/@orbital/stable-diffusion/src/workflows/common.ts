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
