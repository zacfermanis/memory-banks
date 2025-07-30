#!/usr/bin/env node

import { ConfigureCommand } from './commands/configure-command';

async function main() {
  console.log('🔧 Memory Bank Configuration');
  console.log('============================\n');

  try {
    const configureCommand = new ConfigureCommand();
    await configureCommand.run();
  } catch (error) {
    console.error(
      '\n❌ Error:',
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
