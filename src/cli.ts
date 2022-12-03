import minimatch from 'minimatch';
import { chalk } from 'zx';
import { description } from '../package.json';
import { program } from 'commander';
import { circularDepsDetect } from './circle';
import { printCircles } from './utils';

program
  .name('ds')
  .description(description)
  .argument('[path]', 'command execute path. (default: process.cwd())')
  .option('--filter <pattern>', 'glob pattern to match output circles.')
  .option('--alias <pairs...>', 'path alias, follows `<from>:<to>` convention.', ['@:src'])
  .option('--absolute', 'print absolute path instead. usually use with editor which can quickly jump to the file.', false)
  .option('-i, --ignore <patterns...>', 'glob patterns to exclude matches.', ['node_modules'])
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
