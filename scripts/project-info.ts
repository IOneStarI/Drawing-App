import { exec } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

interface PackageInfo {
  description: string;
  name: string;
  version: string;
}

/** Runs a shell command asynchronously and returns its output, including output from failed commands. */
async function runCommand(command: string): Promise<string> {
  try {
    const { stdout, stderr } = await execAsync(command);
    return [stdout.trim(), stderr.trim()].filter(Boolean).join('\n');
  } catch (error) {
    if (error && typeof error === 'object' && 'stdout' in error && 'stderr' in error) {
      const commandError = error as { stderr: string; stdout: string };
      return [commandError.stdout.trim(), commandError.stderr.trim()].filter(Boolean).join('\n');
    }

    return 'The command could not be completed.';
  }
}

/** Reads package metadata and prints project details followed by the Jest command output. */
async function main(): Promise<void> {
  const packageJson = JSON.parse(await readFile(join(process.cwd(), 'package.json'), 'utf8')) as PackageInfo;

  console.log(`Project: ${packageJson.name}`);
  console.log(`Version: ${packageJson.version}`);
  console.log(packageJson.description);
  console.log('');
  console.log('Running Jest tests...');
  console.log(await runCommand('npm test -- --runInBand'));
}

void main();
