#!/bin/bash

# Create models directory if it doesn't exist
mkdir -p models

# Define the base URL
MODEL_URL_BASE="https://raw.githubusercontent.com/vladmandic/face-api/master/model"

# Download the weights manifest
echo "Downloading weights manifest..."
curl -L -o models/ssd_mobilenetv1_model-weights_manifest.json \
     "$MODEL_URL_BASE/ssd_mobilenetv1_model-weights_manifest.json"

# Download the model binary file
echo "Downloading model binary..."
curl -L -o models/ssd_mobilenetv1_model.bin \
     "$MODEL_URL_BASE/ssd_mobilenetv1_model.bin"

echo "All files downloaded to ./models directory"
ls -la models/