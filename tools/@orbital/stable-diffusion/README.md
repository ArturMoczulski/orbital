# Stable Diffusion Tools

A collection of TypeScript tools for working with Stable Diffusion.

## Installation

```bash
# Install dependencies
yarn install

# Build the project
yarn build
```

### System Dependencies

The canvas package requires some native dependencies to be installed on your system:

#### macOS

For macOS, especially on Apple Silicon (M1/M2/M3) Macs:

```bash
# Install Cairo, Pango, and other dependencies
brew install pkg-config cairo pango libpng jpeg giflib librsvg

# Clean node_modules and reinstall with specific canvas version
rm -rf node_modules
yarn install

# Use the provided setup script for Apple Silicon Macs
yarn setup-canvas-m1

# If you still encounter issues, try installing canvas globally
npm install -g canvas@2.11.0
```

For Intel Macs:

```bash
# Install Cairo, Pango, and other dependencies
brew install pkg-config cairo pango libpng jpeg giflib librsvg

# Clean node_modules and reinstall
rm -rf node_modules
yarn install

# Use the provided setup script
yarn setup-canvas
```

**Troubleshooting Canvas Installation:**

If you're still having issues with canvas, try these steps:

1. Make sure XCode Command Line Tools are installed:

   ```bash
   xcode-select --install
   ```

2. Set the PKG_CONFIG_PATH manually:

   ```bash
   # For Apple Silicon Macs
   export PKG_CONFIG_PATH="/opt/homebrew/lib/pkgconfig:/opt/homebrew/opt/libffi/lib/pkgconfig"

   # For Intel Macs
   export PKG_CONFIG_PATH="/usr/local/lib/pkgconfig:/usr/local/opt/libffi/lib/pkgconfig"
   ```

3. Install canvas globally with a specific version:

   ```bash
   npm install -g canvas@2.11.0
   ```

4. Link the global canvas to your project:
   ```bash
   npm link canvas
   ```

#### Linux (Ubuntu/Debian)

```bash
# Install Cairo, Pango, and other dependencies
sudo apt-get update
sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
```

#### Windows

For Windows, follow the detailed instructions in the [node-canvas wiki](https://github.com/Automattic/node-canvas/wiki/Installation:-Windows).

## Available Commands

### Prepare Facial Dataset

Processes a folder of images (e.g., Instagram photos) and prepares them for LoRA training by:

1. Detecting faces using face-api.js
2. Cropping faces with padding
3. Resizing to target resolution
4. Optionally upscaling small faces using Real-ESRGAN
5. Saving processed images to output directories

#### Prerequisites

Before running the script, you need to:

1. Install the required dependencies:

   ```bash
   yarn add @vladmandic/face-api @tensorflow/tfjs-node @napi-rs/canvas sharp
   ```

2. Download face-api.js models:

   ```bash
   # Use the provided script to download the models
   yarn download-face-api-models
   ```

   This will download the required face-api.js models to the `./models` directory.

   Alternatively, you can download the models manually:

   ```bash
   # Create models directory
   mkdir -p models

   # Download models (example using curl)
   curl -L https://github.com/vladmandic/face-api/raw/master/model/ssd_mobilenetv1_model-weights_manifest.json -o models/ssd_mobilenetv1_model-weights_manifest.json
   curl -L https://github.com/vladmandic/face-api/raw/master/model/ssd_mobilenetv1_model-shard1 -o models/ssd_mobilenetv1_model-shard1
   ```

   **Important**: Make sure the models are downloaded to the correct location. The script expects them to be in the `./models` directory relative to where you run the script from.

3. (Optional) Install Real-ESRGAN for upscaling small faces:
   ```bash
   brew install real-esrgan
   # or for Intel Macs:
   # arch -x86_64 brew install real-esrgan
   ```

#### Usage

```bash
# Basic usage with default options
yarn prepareFacialDataset

# Specify source and output directories
yarn prepareFacialDataset --source data/source/instagram.com/username/posts --face-output data/source/instagram.com/username/face

# Full options
yarn prepareFacialDataset \
  --source data/source/instagram.com/username/posts \
  --face-output data/source/instagram.com/username/face \
  --full-output data/source/instagram.com/username/full \
  --min-face 160 \
  --padding 0.2 \
  --target 512 \
  --upscale-threshold 200 \
  --upscale-factor 2 \
  --models ./models \
  --augment \
  --augment-count 5
```

#### Options

- `--source`: Source directory containing images (default: `data/source/instagram.com/arturinvegas/posts`)
- `--face-output`: Output directory for face crops (default: `data/source/instagram.com/arturinvegas/face`)
- `--full-output`: Output directory for full-body crops (default: `data/source/instagram.com/arturinvegas/full`)
- `--min-face`: Minimum face size to process in pixels (default: `160`)
- `--padding`: Padding around face as ratio of face size (default: `0.2`)
- `--target`: Target size for output images in pixels (default: `512`)
- `--upscale-threshold`: Threshold for upscaling small faces in pixels (default: `200`)
- `--upscale-factor`: Factor for upscaling small faces (default: `2`)
- `--models`: Directory containing face-api models (default: `./models`)
- `--augment`: Generate augmented versions of processed images (default: `false`)
- `--augment-count`: Number of augmentations to generate per image (default: `5`)

### Scrape Instagram

Downloads images from Instagram posts.

```bash
yarn scrapeInstagram <json file path> <destination directory> [--limit <number>]
```

### Run Workflow

Executes a workflow with a specific orchestrator.

```bash
yarn workflow <orchestrator> <workflow> [options]
```

## Directory Structure

```
data/
  source/
    instagram.com/
      username/
        posts/     # Source images
        face/      # Face crops
        full/      # Full-body crops
  raw/             # Alternative location for raw images
  crops/           # Alternative location for face crops
  full/            # Alternative location for full-body crops
  reg/             # Regularization images
models/            # Face-api.js models
src/
  commands/        # CLI commands
  workflows/       # Workflow definitions
  orchestrators/   # Workflow orchestrators
```

## LoRA Training (Python)

After preparing your dataset, you can train a LoRA using kohya-ss:

1. Generate regularization images:

   ```bash
   python gen_reg_images.py --class_prompt "photo of a person" --n 200 --w 512 --h 512 --out data/reg
   ```

2. Create a training configuration file (`data/training_config.toml`):

   ```toml
   [general]
   flip_aug = true
   resolution = 512,512

   [[datasets]]
   data_dir = "data/source/instagram.com/username/face"
   class_tokens = "my_person"
   num_repeats = 10

   [[datasets]]
   data_dir = "data/reg"
   class_tokens = "person"
   num_repeats = 1
   ```

3. Train the LoRA:
   ```bash
   accelerate launch kohya_ss/train_network.py \
     --pretrained_model_name_or_path stabilityai/stable-diffusion-1.5 \
     --dataset_config data/training_config.toml \
     --network_module networks.lora \
     --output_dir loras/my_person \
     --prior_loss_weight 1.0 \
     --max_train_steps 2000 \
     --learning_rate 1e-4 \
     --network_dim 128 --network_alpha 64 \
     --mixed_precision fp16
   ```
