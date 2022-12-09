import { chalk } from 'zx';

export const logger = {
  info: (...args) => console.log(chalk.blue('info'), ...args),
  warn: (...args) => console.log(chalk.yellow('warn'), ...args),
  error: (...args) => console.log(chalk.red('error'), ...args),
};
