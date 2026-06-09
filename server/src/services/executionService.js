import axios from 'axios';

const LANGUAGE_MAP = {
  cpp: 54,
  java: 62,
  python: 71
};

const JUDGE0_QUEUE_STATUSES = new Set([1, 2]);
const DEFAULT_POLL_INTERVAL_MS = 800;
const DEFAULT_POLL_TIMEOUT_MS = 30000;

function normalizeJudge0BaseUrl(url = '') {
  return url.trim().replace(/\/+$/, '');
}

function getJudge0Config() {
  const apiUrl = normalizeJudge0BaseUrl(process.env.JUDGE0_API_URL || '');
  if (!apiUrl) {
    throw new Error('JUDGE0_API_URL is not configured');
  }

  const headers = {
    'Content-Type': 'application/json'
  };

  if (process.env.JUDGE0_API_KEY) {
    headers['X-RapidAPI-Key'] = process.env.JUDGE0_API_KEY;
  }

  if (process.env.JUDGE0_API_HOST) {
    headers['X-RapidAPI-Host'] = process.env.JUDGE0_API_HOST;
  }

  return { apiUrl, headers };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function parseTimeMs(time) {
  const seconds = Number.parseFloat(time);
  return Number.isFinite(seconds) ? Math.round(seconds * 1000) : 0;
}

function mapJudge0Status(submission) {
  const statusId = submission?.status?.id;
  const description = submission?.status?.description || 'Unknown';

  if (statusId === 3) return { status: 'success', error: null, description };
  if (statusId === 5) return { status: 'tle', error: 'Time Limit Exceeded', description };
  if (statusId === 6) return { status: 'compilation_error', error: 'Compilation Error', description };
  if (description.toLowerCase().includes('memory')) {
    return { status: 'mle', error: 'Memory Limit Exceeded', description };
  }
  if (statusId >= 7 && statusId <= 12) {
    return { status: 'runtime_error', error: 'Runtime Error', description };
  }

  return { status: 'error', error: description, description };
}

function formatProviderError(err) {
  const status = err?.response?.status;
  const providerMessage = err?.response?.data?.message || err?.response?.data?.error || err.message;
  return status ? `Judge0 API failed (HTTP ${status}): ${providerMessage}` : `Judge0 API failed: ${providerMessage}`;
}

async function createSubmission({ code, language, stdin, timeoutMs, memoryLimitMb }) {
  const { apiUrl, headers } = getJudge0Config();
  const languageId = LANGUAGE_MAP[language];

  if (!languageId) {
    return {
      error: 'Unsupported language',
      status: 'error'
    };
  }

  const response = await axios.post(
    `${apiUrl}/submissions`,
    {
      source_code: code,
      language_id: languageId,
      stdin,
      cpu_time_limit: Math.max((timeoutMs || 3000) / 1000, 1),
      wall_time_limit: Math.max((timeoutMs || 3000) / 1000 + 2, 3),
      memory_limit: Math.max(memoryLimitMb || 256, 16) * 1024
    },
    {
      headers,
      params: {
        base64_encoded: false,
        wait: false
      },
      timeout: 15000
    }
  );

  return response.data;
}

async function getSubmission(token) {
  const { apiUrl, headers } = getJudge0Config();
  const response = await axios.get(`${apiUrl}/submissions/${token}`, {
    headers,
    params: {
      base64_encoded: false,
      fields: 'stdout,stderr,compile_output,message,time,memory,status,token'
    },
    timeout: 15000
  });

  return response.data;
}

async function pollSubmission(token, pollTimeoutMs = DEFAULT_POLL_TIMEOUT_MS) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < pollTimeoutMs) {
    const submission = await getSubmission(token);
    const statusId = submission?.status?.id;

    if (!JUDGE0_QUEUE_STATUSES.has(statusId)) {
      return submission;
    }

    await sleep(DEFAULT_POLL_INTERVAL_MS);
  }

  return {
    stdout: '',
    stderr: 'Execution polling timed out before Judge0 returned a final result.',
    compile_output: null,
    message: null,
    time: null,
    memory: null,
    status: {
      id: 5,
      description: 'Time Limit Exceeded'
    },
    token
  };
}

function normalizeResult(submission) {
  const mapped = mapJudge0Status(submission);
  const compileOutput = submission.compile_output || '';
  const stderr = submission.stderr || submission.message || compileOutput || '';

  return {
    stdout: submission.stdout || '',
    stderr,
    compile_output: compileOutput,
    error: mapped.error,
    status: mapped.status,
    judgeStatus: mapped.description,
    time: parseTimeMs(submission.time),
    memory: submission.memory || 0
  };
}

export const executionService = {
  async runCode({ code, language, stdin = '', timeoutMs = 3000, memoryLimitMb = 256 }) {
    if (!code || !language) {
      return {
        stdout: '',
        stderr: 'code and language are required',
        compile_output: '',
        error: 'Invalid submission',
        status: 'error',
        time: 0,
        memory: 0
      };
    }

    try {
      const created = await createSubmission({ code, language, stdin, timeoutMs, memoryLimitMb });
      if (created.error || !created.token) {
        return {
          stdout: '',
          stderr: created.error || 'Judge0 did not return a submission token',
          compile_output: '',
          error: 'Execution Error',
          status: 'error',
          time: 0,
          memory: 0
        };
      }

      const submission = await pollSubmission(created.token, Math.max(timeoutMs + 10000, DEFAULT_POLL_TIMEOUT_MS));
      return normalizeResult(submission);
    } catch (err) {
      return {
        stdout: '',
        stderr: formatProviderError(err),
        compile_output: '',
        error: 'Execution Error',
        status: 'error',
        time: 0,
        memory: 0
      };
    }
  }
};
