#!/usr/bin/env node
import minimatch from 'minimatch';
import { createRequire } from 'module';
import { chalk } from 'zx';
import { program } from 'commander';
import { circularDepsDetect, printCircles } from '../dist/index.mjs';

const require = createRequire(import.meta.url);
const { description, version } = require('../package.json');

program
  .version(version)
  .description(description)
  .argument('[path]', 'command execute path. (default: process.cwd())')
  .option('--filter <pattern>', 'glob pattern to match output circles.')
  .option('--alias <pairs...>', 'path alias, follows `<from>:<to>` convention.', ['@:src'])
  .option('--absolute', 'print absolute path instead. usually use with editor which can quickly jump to the file.', false)
  .option('-i, --ignore <patterns...>', 'glob patterns to exclude matches.', ['**/node_modules/**'])
  .action((cwd, options) => {
    const { filter, alias, ...rest } = options;
    let { cycles } = circularDepsDetect({
      ...rest,
      cwd,
      alias: Object.fromEntries(alias.map(v => v.split(':'))),
    });

    if (filter) {
      const matcher = minimatch.filter(filter);
      cycles = cycles.filter(v => v.some(matcher));
    }

    if (cycles.length) {
      printCircles(cycles);
    } else {
      console.log(chalk.green('✨ No circles were found.'));
    }
  });

program.parse();
