# Memory Bank CLI

A simple CLI tool to initialize memory bank projects for AI agent collaboration.

## Installation

```bash
npm install -g memory-bank
```

## Usage

Run the CLI from your project root:

```bash
npx init-memory-bank
```

This will start an interactive menu that asks you to choose between:

- **Lua** - For Lua/Love2D game development
- **Web** - For TypeScript/React/Next.js development

## What it does

The CLI will:

1. Create a `.memory-bank` directory in your project
2. Create a `.specs` directory for feature specifications
3. Copy the appropriate `.cursorrules` file to your project root
4. Copy the development guide to `.memory-bank/developmentGuide.md`

## Project Structure

After running the CLI, your project will have:

```
your-project/
├── .memory-bank/
│   └── developmentGuide.md
├── .specs/
└── .cursorrules
```

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Run in development mode
npm run dev
```

## License

MIT
