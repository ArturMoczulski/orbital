/**
 * Face2Face workflow for generating portrait images using ComfyUI
 */

export interface Txt2FaceOptions {
  outputDirectory: string;
  prompt?: string; // Optional additional prompt
  negativePrompt?: string; // Optional additional negative prompt
  width?: number;
  height?: number;
  steps?: number;
  cfg?: number;
  seed?: number;
}

// Default prompts for Realistic Vision v6
const BASE_PROMPT_TEMPLATE = `RAW portrait photograph of {PROMPT}, symmetrical face, natural skin texture, 85 mm lens, f/1.8, shot on Canon EOS R5, soft golden-hour rim-light, shallow depth of field, cinematic lighting, 8 k UHD, Kodak Portra 400 colour science, ultra-sharp focus`;
const BASE_NEGATIVE_PROMPT = `cartoon, illustration, painting, CGI, 3d render, low quality, lowres, blurry, grainy, jpeg artifacts, bad anatomy, disfigured, deformed, mutated, asymmetrical face, double face, extra limbs, fused fingers, extra fingers, poorly drawn hands, poorly drawn face, cloned face, cropped, out of frame, watermark, signature, text, logo`;

/**
 * Creates a ComfyUI workflow for generating portrait images
 */
export function createTxt2faceWorkflow(
  options: Txt2FaceOptions,
  models: { checkpoints: string[]; vaes: string[] }
) {
  // Use the first available checkpoint and VAE
  const checkpoint = Array.isArray(models.checkpoints[0])
    ? models.checkpoints[0][0]
    : models.checkpoints[0];
  const vae = Array.isArray(models.vaes[0])
    ? models.vaes[0][0]
    : models.vaes[0];

  // Default values
  const width = options.width || 832;
  const height = options.height || 832;
  const steps = options.steps || 28;
  const cfg = options.cfg || 7;
  const seed = options.seed || 42;

  // Create the workflow
  return {
    prompt: {
      // ── 1 ▪ Checkpoint ─────────────────────────────────────────────
      "1": {
        class_type: "CheckpointLoaderSimple",
        inputs: { ckpt_name: checkpoint },
      },

      // ── 2 ▪ VAE (needed to turn latents into pixels) ───────────────
      "2": {
        class_type: "VAELoader",
        inputs: { vae_name: vae },
      },

      // ── 3-4 ▪ Prompts ──────────────────────────────────────────────
      "3": {
        class_type: "CLIPTextEncode",
        inputs: {
          clip: ["1", 1],
          text: BASE_PROMPT_TEMPLATE.replace(
            "{PROMPT}",
            options.prompt || "person"
          ),
        },
      },
      "4": {
        class_type: "CLIPTextEncode",
        inputs: {
          clip: ["1", 1],
          text: options.negativePrompt
            ? `${BASE_NEGATIVE_PROMPT}, ${options.negativePrompt}`
            : BASE_NEGATIVE_PROMPT,
        },
      },

      // ── 5 ▪ Empty latent ───────────────────────────────────────────
      "5": {
        class_type: "EmptyLatentImage",
        inputs: { width, height, batch_size: 1 },
      },

      // ── 6 ▪ Sampler (latent → latent) ─────────────────────────────
      "6": {
        class_type: "KSampler",
        inputs: {
          model: ["1", 0],
          positive: ["3", 0],
          negative: ["4", 0],
          latent_image: ["5", 0],
          sampler_name: "dpmpp_2m_sde_gpu",
          scheduler: "karras",
          steps,
          cfg,
          denoise: 1.0,
          seed,
        },
      },

      // ── 7 ▪ Decode latent → RGB ───────────────────────────────────
      "7": {
        class_type: "VAEDecode",
        inputs: { samples: ["6", 0], vae: ["2", 0] },
      },
    },
  };
}
