import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const frontendDir = resolve(scriptDir, '..');
const rootDir = resolve(frontendDir, '..');
const rootConfigPath = resolve(rootDir, 'config/app.config.json');
const frontendUiConfigPath = resolve(frontendDir, 'src/config/runtime-ui-config.json');

const rootConfig = JSON.parse(await readFile(rootConfigPath, 'utf8'));
const uiConfig = rootConfig.ui ?? {};

await writeFile(frontendUiConfigPath, `${JSON.stringify(uiConfig, null, 2)}\n`, 'utf8');
