#!/bin/bash
# fix-comfyui-nodes-macos.sh
# Script to fix ComfyUI custom nodes installation issues on macOS with Apple Silicon
# This script should be run from the ComfyUI directory

set -e  # Exit on error

echo "Starting ComfyUI custom nodes fix for macOS with Apple Silicon..."

# Activate the virtual environment
if [ -d "venv" ]; then
  echo "Activating virtual environment..."
  source venv/bin/activate
else
  echo "Error: Virtual environment not found. Please run this script from the ComfyUI directory."
  exit 1
fi

# Upgrade huggingface_hub
echo "Upgrading huggingface_hub..."
pip install --upgrade huggingface_hub==0.33.4

# Upgrade diffusers
echo "Upgrading diffusers..."
pip install --upgrade diffusers==0.34.0

# Downgrade NumPy for compatibility
echo "Downgrading NumPy for compatibility..."
pip install numpy==1.26.4

# Reinstall torch for Apple Silicon
echo "Reinstalling torch for Apple Silicon..."
pip install --force-reinstall torch torchvision torchaudio

# Install dghs-imgutils for comfyui-logicutils
echo "Installing dghs-imgutils for comfyui-logicutils..."
pip install dghs-imgutils

# Fix comfyui-mvadapter requirements
echo "Fixing comfyui-mvadapter requirements..."
if [ -d "custom_nodes/comfyui-mvadapter" ]; then
  echo "Modifying comfyui-mvadapter requirements.txt to accept newer versions..."
  sed -i '' 's/diffusers==0.27.2/diffusers>=0.27.2/g' custom_nodes/comfyui-mvadapter/requirements.txt
  sed -i '' 's/huggingface_hub==0.24.6/huggingface_hub>=0.24.6/g' custom_nodes/comfyui-mvadapter/requirements.txt
  pip install -r custom_nodes/comfyui-mvadapter/requirements.txt
else
  echo "comfyui-mvadapter not found, skipping..."
fi

# Manually install comfyui_controlnet_aux
echo "Manually installing comfyui_controlnet_aux..."
if [ ! -d "custom_nodes/comfyui_controlnet_aux" ]; then
  echo "Cloning comfyui_controlnet_aux repository..."
  cd custom_nodes
  git clone https://github.com/Fannovel16/comfyui_controlnet_aux.git
  cd comfyui_controlnet_aux
  
  # Install dependencies except mediapipe (not available for Apple Silicon)
  echo "Installing dependencies..."
  pip install -r requirements.txt --no-deps
  pip install opencv-python timm scipy svglib reportlab
  pip install onnxruntime
  
  # Return to ComfyUI directory
  cd ../..
else
  echo "comfyui_controlnet_aux already installed, skipping..."
fi

echo "Fix completed successfully!"
echo "Please restart ComfyUI with the following command:"
echo "PYTORCH_ENABLE_MPS_FALLBACK=1 python main.py --listen 127.0.0.1"
echo ""
echo "The PYTORCH_ENABLE_MPS_FALLBACK=1 environment variable allows operations"
echo "that exceed MPS memory limits to run on the CPU instead, which helps"
echo "prevent crashes with large models or complex workflows."
echo ""
echo "WARNING: Even with CPU fallback enabled, you may encounter memory errors"
echo "with certain image resolutions. Avoid these problematic dimensions:"
echo "  - 1024x1024"
echo "  - 2048x512"
echo "  - 512x2048"
echo "  - 1024x512"
echo "  - 512x1024"
echo ""
echo "This is due to a 32-bit integer limitation (2^31 = 2,147,483,648) in the"
echo "Metal Performance Shaders (MPS) implementation. When processing images with"
echo "these dimensions, internal tensor operations can create arrays with dimensions"
echo "that exceed this 32-bit limit. This is a software limitation, not an actual"
echo "memory limitation - even on high-end Apple Silicon chips with plenty of RAM,"
echo "the same error occurs."
echo ""
echo "Try using slightly different dimensions (e.g., 1023x1023 instead of 1024x1024)"
echo "to avoid the 'total bytes of NDArray > 2**32' error. This small change keeps"
echo "the tensor dimensions just under the limit that would trigger the error."

# Deactivate virtual environment
deactivate