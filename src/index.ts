#!/usr/bin/env node

import inquirer from "inquirer";
import * as fs from "fs";
import * as path from "path";

interface MemoryBankType {
  name: string;
  cursorRulesPath: string;
  developmentGuidePath: string;
}

const MEMORY_BANK_TYPES: Record<string, MemoryBankType> = {
  lua: {
    name: "Lua",
    cursorRulesPath: path.join(__dirname, "..", "Lua", ".cursorrules"),
    developmentGuidePath: path.join(__dirname, "..", "Lua", ".cursorrules"), // Using .cursorrules as development guide for Lua
  },
  web: {
    name: "Web",
    cursorRulesPath: path.join(__dirname, "..", "Web", ".cursorrules"),
    developmentGuidePath: path.join(
      __dirname,
      "..",
      "Web",
      "developmentGuide.md",
    ),
  },
};

export async function main() {
  console.log("🚀 Memory Bank Initializer");
  console.log("==========================\n");

  try {
    const { memoryBankType } = await inquirer.prompt([
      {
        type: "list",
        name: "memoryBankType",
        message: "What type of memory bank would you like to install?",
        choices: [
          { name: "Lua - For Lua/Love2D game development", value: "lua" },
          {
            name: "Web - For TypeScript/React/Next.js development",
            value: "web",
          },
        ],
      },
    ]);

    const selectedType = MEMORY_BANK_TYPES[memoryBankType];

    if (!selectedType) {
      throw new Error(`Unknown memory bank type: ${memoryBankType}`);
    }

    console.log(`\n📦 Installing ${selectedType.name} Memory Bank...\n`);

    // Create .memory-bank directory
    const memoryBankDir = path.join(process.cwd(), ".memory-bank");
    if (!fs.existsSync(memoryBankDir)) {
      fs.mkdirSync(memoryBankDir, { recursive: true });
      console.log("✅ Created .memory-bank directory");
    }

    // Create .specs directory
    const specsDir = path.join(process.cwd(), ".specs");
    if (!fs.existsSync(specsDir)) {
      fs.mkdirSync(specsDir, { recursive: true });
      console.log("✅ Created .specs directory");
    }

    // Copy .cursorrules to project root
    const cursorRulesDest = path.join(process.cwd(), ".cursorrules");
    if (fs.existsSync(selectedType.cursorRulesPath)) {
      fs.copyFileSync(selectedType.cursorRulesPath, cursorRulesDest);
      console.log("✅ Copied .cursorrules to project root");
    } else {
      throw new Error(
        `Source .cursorrules not found: ${selectedType.cursorRulesPath}`,
      );
    }

    // Copy development guide to .memory-bank directory
    const developmentGuideDest = path.join(
      memoryBankDir,
      "developmentGuide.md",
    );
    if (fs.existsSync(selectedType.developmentGuidePath)) {
      fs.copyFileSync(selectedType.developmentGuidePath, developmentGuideDest);
      console.log("✅ Copied development guide to .memory-bank directory");
    } else {
      throw new Error(
        `Source development guide not found: ${selectedType.developmentGuidePath}`,
      );
    }

    console.log("\n🎉 Memory Bank setup complete!");
    console.log("\n📁 Created directories:");
    console.log("   - .memory-bank/ (contains developmentGuide.md)");
    console.log("   - .specs/ (for feature specifications)");
    console.log("\n📄 Created files:");
    console.log("   - .cursorrules (project-specific rules)");
    console.log("\n🚀 You can now start using your Memory Bank!");
  } catch (error) {
    console.error(
      "\n❌ Error:",
      error instanceof Error ? error.message : error,
    );
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
