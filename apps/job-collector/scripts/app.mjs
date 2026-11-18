import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const staged = join(root, '.app');
if (existsSync(join(root, '.env'))) process.loadEnvFile(join(root, '.env'));
const command = process.argv[2] ?? 'build';
if (!['build', 'apply', 'plan', 'exec'].includes(command)) {
  throw new Error(`Unsupported app command: ${command}`);
}
if (command !== 'exec') {
  await rm(staged, { recursive: true, force: true });
  await mkdir(staged, { recursive: true });
  for (const name of ['package.json', 'tsconfig.json', 'README.md']) {
    await cp(join(root, name), join(staged, name));
  }
  await cp(join(root, 'src'), join(staged, 'src'), { recursive: true });
  await cp(join(root, '../yarn.lock'), join(staged, 'yarn.lock'));
  await cp(
    join(root, 'application.config.ts'),
    join(staged, 'application.config.ts'),
  );

  const prepareDefinitions = async (directory) => {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) {
        await prepareDefinitions(path);
      } else if (/\.tsx?$/.test(entry.name)) {
        const source = await readFile(path, 'utf8');
        // The CLI discovers entities only through default exports; authored source uses named exports.
        await writeFile(
          path,
          source.replace(
            /export const \w+ = (define\w+\()/g,
            'export default $1',
          ),
        );
      }
    }
  };
  await prepareDefinitions(staged);
}
const binary = resolve(root, '../node_modules/.bin/twenty');
const result = spawnSync(
  binary,
  ['app', command, '--path', staged, ...process.argv.slice(3)],
  {
    cwd: root,
    env: process.env,
    stdio: 'inherit',
  },
);
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
