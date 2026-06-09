import { exec } from 'child_process';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

const DEFAULT_PISTON_ENDPOINTS = [];

function normalizePistonEndpoint(url) {
  if (!url) return null;

  const trimmed = url.trim().replace(/\/+$/, '');
  if (!trimmed) return null;
  if (/\/api\/v2\/piston\/execute$/i.test(trimmed)) return trimmed;
  if (/\/api\/v2\/execute$/i.test(trimmed)) {
    return trimmed.replace(/\/api\/v2\/execute$/i, '/api/v2/piston/execute');
  }

  return `${trimmed}/api/v2/piston/execute`;
}

/**
 * Local execution service for Java, Python, and C++.
 * Uses system-installed compilers/interpreters — no Docker required.
 * Falls back to a configured Piston API if local compilers/interpreters are not found on the system.
 * 
 * Prerequisites:
 *   - Python: python3 or python must be on PATH
 *   - Java:   java + javac must be on PATH (JDK installed)
 *   - C++:    g++ must be on PATH (GCC/MinGW on Windows)
 */
export const executionService = {
  async runCode({ code, language, stdin = '', timeoutMs = 3000 }) {
    const id = uuidv4().replace(/-/g, '');
    const tmpDir = path.join(os.tmpdir(), `usaco_${id}`);

    try {
      mkdirSync(tmpDir, { recursive: true });

      let result;
      switch (language) {
        case 'python':
          result = await runPython(code, stdin, tmpDir, timeoutMs);
          break;
        case 'java':
          result = await runJava(code, stdin, tmpDir, timeoutMs);
          break;
        case 'cpp':
          result = await runCpp(code, stdin, tmpDir, timeoutMs);
          break;
        default:
          result = { stdout: '', stderr: 'Unsupported language', error: 'Unsupported language', status: 'error', time: 0 };
      }

      // Check if local execution failed because compilers/interpreters are missing
      const isMissingCompiler = result.status === 'error' && (
        (result.stderr && (
          result.stderr.toLowerCase().includes('not found') ||
          result.stderr.toLowerCase().includes('not recognized') ||
          result.stderr.toLowerCase().includes('command not found')
        )) ||
        (result.error && (
          result.error.toLowerCase().includes('enoent') ||
          result.error.toLowerCase().includes('not found') ||
          result.error.toLowerCase().includes('not recognized') ||
          result.error.toLowerCase().includes('command not found')
        ))
      );

      if (isMissingCompiler) {
        console.log(`Local compiler/interpreter missing for ${language}. Checking configured Piston fallback...`);
        return await runCodeViaPiston(code, language, stdin, timeoutMs);
      }

      return result;
    } catch (err) {
      console.log(`Local execution failed with system error: ${err.message}. Checking configured Piston fallback...`);
      return await runCodeViaPiston(code, language, stdin, timeoutMs);
    } finally {
      // Clean up temp directory
      try { rmSync(tmpDir, { recursive: true, force: true }); } catch (_) { }
    }
  }
};

async function runCodeViaPiston(code, language, stdin = '', timeoutMs = 3000) {
  try {
    const classNameMatch = code.match(/public\s+class\s+(\w+)/);
    const className = classNameMatch ? classNameMatch[1] : 'Main';

    const langMap = {
      cpp: 'cpp',
      java: 'java',
      python: 'python'
    };

    const fileNames = {
      cpp: 'solution.cpp',
      java: `${className}.java`,
      python: 'solution.py'
    };

    const pistonLang = langMap[language] || language;
    const fileName = fileNames[language] || 'solution';

    const pistonUrl = normalizePistonEndpoint(process.env.PISTON_API_URL);
    const endpoints = [
      ...(pistonUrl ? [pistonUrl] : []),
      ...DEFAULT_PISTON_ENDPOINTS
    ].filter((url, index, urls) => url && urls.indexOf(url) === index);

    if (endpoints.length === 0) {
      return {
        stdout: '',
        stderr: 'Local compiler/interpreter is not available on this server, and no PISTON_API_URL is configured. Install the required compiler on the server or set PISTON_API_URL to a self-hosted Piston instance.',
        error: 'Execution Provider Unavailable',
        status: 'error',
        time: 0
      };
    }

    const requestBody = {
      language: pistonLang,
      version: '*',
      files: [
        {
          name: fileName,
          content: code
        }
      ],
      stdin: stdin,
      run_timeout: timeoutMs,
      compile_timeout: 10000
    };

    const startTime = Date.now();
    let response = null;
    let lastError = null;

    for (let i = 0; i < endpoints.length; i++) {
      const endpoint = endpoints[i];
      try {
        response = await axios.post(endpoint, requestBody, {
          timeout: Math.max(timeoutMs + 2000, 15000)
        });
        lastError = null;
        break;
      } catch (err) {
        lastError = err;
        const status = err?.response?.status;
        console.warn(`Piston endpoint failed: ${endpoint}${status ? ` (HTTP ${status})` : ''}`);
      }
    }

    if (!response && lastError) {
      throw lastError;
    }

    const elapsed = Date.now() - startTime;
    const data = response.data;

    // Check compilation errors
    if (data.compile && data.compile.code !== 0) {
      return {
        stdout: data.compile.stdout || '',
        stderr: `Compilation Error:\n${data.compile.stderr || data.compile.output || ''}`,
        error: 'Compilation Error',
        status: 'error',
        time: 0
      };
    }

    const runResult = data.run || {};
    const stdout = runResult.stdout || '';
    const stderr = runResult.stderr || '';

    if (runResult.code !== 0) {
      return {
        stdout,
        stderr,
        error: runResult.signal === 'SIGKILL' ? 'Time Limit Exceeded' : 'Runtime Error',
        status: runResult.signal === 'SIGKILL' ? 'tle' : 'error',
        time: Math.min(elapsed, timeoutMs)
      };
    }

    return {
      stdout,
      stderr,
      error: null,
      status: 'success',
      time: Math.min(elapsed, timeoutMs)
    };
  } catch (err) {
    const status = err?.response?.status;
    const statusSuffix = status ? ` (HTTP ${status})` : '';
    const message = status === 401 || status === 403
      ? 'Unauthorized by execution provider. Check PISTON_API_URL or endpoint access settings.'
      : err.message;

    return {
      stdout: '',
      stderr: `Piston execution failed${statusSuffix}: ${message}`,
      error: 'Execution Error',
      status: 'error',
      time: 0
    };
  }
}


function runCommand(cmd, stdin, timeoutMs) {
  return new Promise((resolve) => {
    const start = Date.now();
    const child = exec(cmd, { timeout: timeoutMs, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
      const time = Date.now() - start;
      if (error && error.killed) {
        resolve({ stdout, stderr: 'Time Limit Exceeded', error: 'TLE', status: 'tle', time });
      } else if (error) {
        resolve({ stdout, stderr, error: error.message, status: 'error', time });
      } else {
        resolve({ stdout, stderr, error: null, status: 'success', time });
      }
    });

    if (stdin && child.stdin) {
      child.stdin.write(stdin);
      child.stdin.end();
    }
  });
}

async function runPython(code, stdin, tmpDir, timeoutMs) {
  const filePath = path.join(tmpDir, 'solution.py');
  writeFileSync(filePath, code, 'utf-8');

  // Try python3 first, fall back to python
  const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
  const cmd = `${pythonCmd} "${filePath}"`;
  return runCommand(cmd, stdin, timeoutMs);
}

async function runJava(code, stdin, tmpDir, timeoutMs) {
  // Extract the public class name from the code, defaulting to Main
  const classNameMatch = code.match(/public\s+class\s+(\w+)/);
  const className = classNameMatch ? classNameMatch[1] : 'Main';

  const filePath = path.join(tmpDir, `${className}.java`);
  writeFileSync(filePath, code, 'utf-8');

  // Step 1: Compile
  const compileResult = await runCommand(`javac "${filePath}"`, '', 15000);
  if (compileResult.status === 'error') {
    return {
      ...compileResult,
      error: 'Compilation Error',
      status: 'error',
      stderr: `Compilation Error:\n${compileResult.stderr}`
    };
  }

  // Step 2: Run with memory limit and security policy
  const runCmd = `java -cp "${tmpDir}" -Xmx256m -Xss64m ${className}`;
  return runCommand(runCmd, stdin, timeoutMs);
}

async function runCpp(code, stdin, tmpDir, timeoutMs) {
  const srcPath = path.join(tmpDir, 'solution.cpp');
  const exePath = path.join(tmpDir, process.platform === 'win32' ? 'solution.exe' : 'solution');
  writeFileSync(srcPath, code, 'utf-8');

  // Step 1: Compile
  const compileResult = await runCommand(`g++ -O2 -o "${exePath}" "${srcPath}"`, '', 15000);
  if (compileResult.status === 'error') {
    return {
      ...compileResult,
      error: 'Compilation Error',
      status: 'error',
      stderr: `Compilation Error:\n${compileResult.stderr}`
    };
  }

  // Step 2: Run
  const runCmd = `"${exePath}"`;
  return runCommand(runCmd, stdin, timeoutMs);
}
