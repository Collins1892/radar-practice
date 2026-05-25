import path from 'node:path';

const appTsconfig = path.join('tsconfig.app.json');
const nodeTsconfig = path.join('tsconfig.node.json');

/** @param {string[]} files */
function splitByProject(files) {
  const app = [];
  const node = [];
  for (const file of files) {
    if (file.replace(/\\/g, '/').includes('vite.config')) {
      node.push(file);
    } else {
      app.push(file);
    }
  }
  return { app, node };
}

/** @type {import('lint-staged').Configuration} */
export default {
  '*.{ts,tsx}': (files) => {
    const { app, node } = splitByProject(files);
    const commands = [];

    if (app.length > 0) {
      commands.push(`tsc-files --noEmit -p ${appTsconfig} ${app.join(' ')}`);
    }
    if (node.length > 0) {
      commands.push(`tsc-files --noEmit -p ${nodeTsconfig} ${node.join(' ')}`);
    }

    commands.push(`eslint --max-warnings 0 ${files.join(' ')}`);
    commands.push(`prettier --write ${files.join(' ')}`);

    return commands;
  },
  '*.{css,json,html,md}': 'prettier --write',
};
