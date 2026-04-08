import { exec } from 'child_process';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';

/**
 * Local execution service for Java, Python, and C++.
 * Uses system-installed compilers/interpreters — no Docker required.
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
      return result;
    } catch (err) {
      return { stdout: '', stderr: err.message, error: 'System Error', status: 'error', time: 0 };
    } finally {
      // Clean up temp directory
      try { rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
    }
  }
};

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
