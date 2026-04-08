import { spawn, exec } from 'child_process';
import { v4 as uuidv4 } from 'uuid';

export const executionService = {
  /**
   * Run code in an isolated Docker container with strict resource limits.
   * Uses standard input mapped directly into the VM to avoid complex volume mounts.
   *
   * @param {string} code - The user code to run
   * @param {string} language - javascript | python
   * @param {number} timeoutMs - Max execution time in ms (default 2000)
   * @returns {Promise<{stdout: string, stderr: string, error: string|null, status: string, time: number}>}
   */
  async runCode({ code, language, timeoutMs = 2000 }) {
    return new Promise((resolve) => {
      const images = {
        javascript: { image: 'node:20-alpine', cmd: ['node', '-'] },
        python: { image: 'python:3.11-alpine', cmd: ['python', '-'] },
      };

      if (!images[language]) {
        return resolve({ stdout: '', stderr: '', error: 'Unsupported language', status: 'error', time: 0 });
      }

      const { image, cmd } = images[language];
      const containerName = `exec_${uuidv4()}`;
      
      const startTime = Date.now();

      // Enforce: No network, max 256m memory, half CPU core limit
      const dockerArgs = [
        'run', '--rm', '-i',
        '--name', containerName,
        '--network', 'none',
        '--memory', '256m',
        '--cpus', '0.5',
        image,
        ...cmd
      ];

      const child = spawn('docker', dockerArgs);

      let stdout = '';
      let stderr = '';
      let isTimeout = false;

      child.stdout.on('data', (data) => { stdout += data.toString(); });
      child.stderr.on('data', (data) => { stderr += data.toString(); });

      // Timeout safety switch to forcibly kill the container
      const timeoutHandle = setTimeout(() => {
        isTimeout = true;
        // Kill the container synchronously 
        exec(`docker kill ${containerName}`, () => {
          resolve({
            stdout,
            stderr: 'Execution Time Limit Exceeded (2s)',
            error: 'Time Limit Exceeded',
            status: 'tle',
            time: timeoutMs
          });
        });
      }, timeoutMs);

      child.on('close', (code) => {
        if (isTimeout) return; // Promise already resolved via timeout
        
        clearTimeout(timeoutHandle);
        const timeTaken = Date.now() - startTime;
        
        if (code !== 0) {
          return resolve({ stdout, stderr, error: 'Runtime Error', status: 'error', time: timeTaken });
        }

        resolve({ stdout, stderr, error: null, status: 'success', time: timeTaken });
      });

      child.on('error', (err) => {
         clearTimeout(timeoutHandle);
         resolve({ stdout: '', stderr: err.message, error: 'System Error', status: 'error', time: 0 });
      });

      // Write the code to stdin to execute
      child.stdin.write(code);
      child.stdin.end();
    });
  }
};
