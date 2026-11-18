import { spawnSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

if (process.platform !== 'darwin')
  throw new Error(
    'This installer supports macOS launchd. Use your host service manager on other platforms.',
  );
const directory = fileURLToPath(new URL('../', import.meta.url));
const escapeXML = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
await mkdir(`${directory}.local`, { recursive: true, mode: 0o700 });
const path = `${directory}.local/local.twenty.research-ai.plist`;
const argumentsList = [
  process.execPath,
  `--env-file=${directory}.env`,
  `${directory}src/bridge.ts`,
];
await writeFile(
  path,
  `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>Label</key><string>local.twenty.research-ai</string>
<key>ProgramArguments</key><array>${argumentsList.map((argument) => `<string>${escapeXML(argument)}</string>`).join('')}</array>
<key>WorkingDirectory</key><string>${escapeXML(directory)}</string>
<key>EnvironmentVariables</key><dict><key>PATH</key><string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin</string></dict>
<key>RunAtLoad</key><true/><key>KeepAlive</key><true/>
<key>StandardOutPath</key><string>${escapeXML(directory)}.local/bridge.log</string>
<key>StandardErrorPath</key><string>${escapeXML(directory)}.local/bridge.error.log</string>
</dict></plist>`,
  { mode: 0o600 },
);
const result = spawnSync(
  'launchctl',
  ['bootstrap', `gui/${process.getuid?.()}`, path],
  { stdio: 'inherit' },
);
if (result.status !== 0) process.exitCode = 1;
else
  console.log(
    'Installed local.twenty.research-ai for the current login session. Keep this checkout at its current path.',
  );
