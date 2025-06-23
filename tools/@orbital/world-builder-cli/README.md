# world-builder-cli

CLI tool to generate objects using LLMs and the CompositeObjectGenerationRunnable.

## Installation

```bash
npm install -g world-builder-cli
```

Or from local project:

```bash
cd tools/@orbital/world-builder
npm install
npm run build
npm link
```

## Usage

### Environment Setup

Create a `.env.local` file in the `tools/@orbital/world-builder-cli` directory with your OpenAI API key:

```
OPENAI_API_KEY=your-api-key-here
OPENAI_MODEL_NAME=gpt-4o  # Optional, defaults to gpt-4o
```

### Basic Usage

```bash
world-builder-cli generate <type> <input> [options]
```

Where:

- `<type>`: Type of object to generate (e.g., 'Area', 'City', etc.)
- `<input>`: Path to a JSON file or a JSON string containing the generation input

Options:

- `-o, --output <file>`: Save the generated object to a file instead of stdout
- `-v, --verbose`: Enable verbose output for debugging
- `-m, --model <name>`: Override the model name from .env.local
- `-l, --list-types`: List available object types that can be generated

You can also use the `list-types` subcommand to see available types:

```bash
world-builder-cli generate list-types
```

### Input Format

The input JSON should contain:

- Properties matching the input schema for the specified type
- Nested objects can be included directly in the input

Example input file for Area (see `examples/area-input.json`):

```json
{
  "climate": "temperate",
  "description": "A lush forest area with ancient ruins",
  "areaMap": {
    "size": "medium",
    "description": "A forest clearing with ancient stone structures and a small stream",
    "tiles": {
      "grass": 0,
      "water": 1,
      "stone": 2,
      "tree": 3
    }
  }
}
```

Example input for City:

```json
{
  "name": "Metropolis",
  "population": 1000000,
  "isCapital": true,
  "districts": [
    {
      "name": "Downtown",
      "description": "The bustling city center"
    },
    {
      "name": "Harbor District",
      "description": "Busy port area with ships and markets"
    }
  ]
}
```

### Examples

Generate an Area object using a JSON file and save the output:

```bash
world-builder-cli generate Area examples/area-input.json --output generated-area.json --verbose
```

Generate an Area using a specific model:

```bash
world-builder-cli generate Area examples/area-input.json --model gpt-4
```

Generate an Area using a JSON string:

```bash
world-builder-cli generate Area '{"climate":"arid","description":"a desert oasis","areaMap":{"size":"small","description":"A small oasis","tiles":{"sand":0,"water":1}}}' --verbose
```

Generate a City object:

```bash
world-builder-cli generate City '{"name":"Metropolis","population":1000000,"isCapital":true}' --output city.json
```

List all available object types:

```bash
world-builder-cli generate --list-types
# or
world-builder-cli generate list-types
```

### Using npm/yarn Scripts

You can also use the provided npm/yarn scripts:

```bash
# Using yarn
yarn generate Area '{"climate":"tropical","description":"A lush jungle","areaMap":{"size":"medium"}}' -o area.json

# Using yarn with a specific model
yarn generate Area '{"climate":"tropical","description":"A lush jungle","areaMap":{"size":"medium"}}' -o area.json -m gpt-4

# Using npm
npm run generate -- Area '{"climate":"tropical","description":"A lush jungle","areaMap":{"size":"medium"}}' -o area.json

# Using npm with a specific model
npm run generate -- Area '{"climate":"tropical","description":"A lush jungle","areaMap":{"size":"medium"}}' -o area.json -m gpt-4

# Generate a different type of object
npm run generate -- City '{"name":"New York","population":8000000}' -o city.json
```

Outputs a generated object as JSON.
