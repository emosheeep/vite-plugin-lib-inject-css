#!/usr/bin/env node
import { fs, chalk } from 'zx';
import { createRequire } from 'module';
import { program } from 'commander';
import { circularDepsDetect, printCircles, logger } from '../dist/index.js';

const require = createRequire(import.meta.url);
const { description, version } = require('../package.json');

program
  .version(version)
  .description(description)
  .argument('[path]', 'command execute path. (default: process.cwd())')
  .option('--filter <pattern>', 'glob pattern to filter output circles.')
  .option(
    '--absolute',
    'print absolute path instead. usually use with editor which can quickly jump to the file.',
    false,
  )
  .option(
    '-o, --output <filename>',
    'output the analysis into specified json file.',
  )
  .option('-i, --ignore <patterns...>', 'glob patterns to exclude matches.', [
    '**/node_modules/**',
  ])
  .option('-t, --throw', "exit with code 1 when cycles're found.", false)
  .action(async (cwd, options) => {
    const { output, throw: isThrow, ...rest } = options;
    const cycles = await circularDepsDetect({
      ...rest,
      cwd,
    });

    if (!cycles.length) return;

    if (output) {
      fs.writeFileSync(
        output || 'circles.json',
        JSON.stringify(cycles, null, 2),
      );
      console.log(
        [
          chalk.blue('info'),
          'Output has been redirected to',
          chalk.cyan.underline(output),
        ].join(' '),
      );
    } else {
      printCircles(cycles);
    }

    if (isThrow) {
      logger.error('Command failed with exit code 1');
      process.exit(1);
    }
  });

program.parse();
