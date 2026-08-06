// keepAliveService — Supabase keep-alive engine.
// Pings Supabase every 5 days to prevent Free-tier project pausing (7 days inactivity).
// Strategies: REST query → RPC keepalive → raw fetch fallback.
// Includes retry, visibility-aware re-ping, and monitoring integration.

const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;
const RETRY_DELAYS_MS = [1000, 5000, 15000, 60000];
const PING_TIMEOUT_MS = 15000;

let initialized = false;
let timerId = null;
let retryCount = 0;
let lastPingAt = null;
let lastPingStatus = null;
let lastPingError = null;
let consecutiveFailures = 0;
let totalPings = 0;
let successfulPings = 0;

function getCredentials() {
  return {
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  };
}

function isConfigured() {
  const { supabaseUrl, supabaseAnonKey } = getCredentials();
  return !!(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-project'));
}

function log(level, msg, extra) {
  if (import.meta.env.DEV) {
    console[level](`[KeepAlive] ${msg}`, extra ?? '');
  }
}

async function pingWithTimeout(fetchFn) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PING_TIMEOUT_MS);
  try {
    const result = await fetchFn(controller.signal);
    clearTimeout(timeoutId);
    return result;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

async function pingViaRest(signal) {
  const { supabaseUrl, supabaseAnonKey } = getCredentials();
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase credentials not configured');
  }

  const res = await fetch(
    `${supabaseUrl}/rest/v1/bookmarks?select=id&limit=1`,
    {
      signal,
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!res.ok) {
    throw new Error(`REST ping failed: HTTP ${res.status}`);
  }
  return res;
}

async function pingViaRpc(signal) {
  const { supabaseUrl, supabaseAnonKey } = getCredentials();
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase credentials not configured');
  }

  const res = await fetch(
    `${supabaseUrl}/rest/v1/rpc/keepalive`,
    {
      signal,
      method: 'POST',
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: '{}',
    }
  );

  if (!res.ok) {
    throw new Error(`RPC ping failed: HTTP ${res.status}`);
  }
  return res;
}

async function pingViaAuth(signal) {
  const { supabaseUrl, supabaseAnonKey } = getCredentials();
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase credentials not configured');
  }

  const res = await fetch(
    `${supabaseUrl}/auth/v1/`,
    {
      signal,
      headers: {
        apikey: supabaseAnonKey,
      },
    }
  );

  if (!res.ok && res.status !== 404) {
    throw new Error(`Auth ping failed: HTTP ${res.status}`);
  }
  return res;
}

async function logKeepAlivePing(strategy) {
  const { supabaseUrl, supabaseAnonKey } = getCredentials();
  if (!supabaseUrl || !supabaseAnonKey) return;

  try {
    await fetch(
      `${supabaseUrl}/rest/v1/keepalive_log`,
      {
        method: 'POST',
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({ source: 'bookmarkhub', strategy }),
      }
    );
  } catch {
    // Non-critical: logging failure should not fail the ping
  }
}

async function executePing() {
  const strategies = [
    { name: 'REST', fn: pingViaRest },
    { name: 'RPC', fn: pingViaRpc },
    { name: 'Auth', fn: pingViaAuth },
  ];

  for (const strategy of strategies) {
    try {
      await pingWithTimeout(strategy.fn);
      return { ok: true, strategy: strategy.name };
    } catch (err) {
      log('warn', `Strategy ${strategy.name} failed: ${err.message}`);
    }
  }

  return { ok: false, strategy: 'none' };
}

async function ping() {
  totalPings++;
  const now = new Date();
  lastPingAt = now.toISOString();

  log('info', `Ping #${totalPings} at ${lastPingAt}`);

  try {
    const result = await executePing();

    if (result.ok) {
      successfulPings++;
      consecutiveFailures = 0;
      retryCount = 0;
      lastPingStatus = 'ok';
      lastPingError = null;
      log('info', `Ping successful via ${result.strategy}`);
      logKeepAlivePing(result.strategy);
    } else {
      throw new Error('All ping strategies failed');
    }
  } catch (err) {
    consecutiveFailures++;
    lastPingStatus = 'error';
    lastPingError = err.message;
    log('error', `Ping failed: ${err.message}`);

    if (retryCount < RETRY_DELAYS_MS.length) {
      const delay = RETRY_DELAYS_MS[retryCount];
      retryCount++;
      log('info', `Retry ${retryCount}/${RETRY_DELAYS_MS.length} in ${delay}ms`);
      setTimeout(() => ping(), delay);
    } else {
      log('error', `All ${RETRY_DELAYS_MS.length} retries exhausted`);
      retryCount = 0;
    }
  }

  return {
    initialized,
    lastPingAt,
    lastPingStatus,
    lastPingError,
    consecutiveFailures,
    totalPings,
    successfulPings,
    uptime: totalPings > 0 ? Math.round((successfulPings / totalPings) * 100) : 0,
    intervalMs: FIVE_DAYS_MS,
    nextPingAt: initialized && lastPingAt
      ? new Date(new Date(lastPingAt).getTime() + FIVE_DAYS_MS).toISOString()
      : null,
  };
}

function handleVisibilityChange() {
  if (document.visibilityState === 'visible' && initialized) {
    const now = Date.now();
    const lastPingMs = lastPingAt ? new Date(lastPingAt).getTime() : 0;
    const elapsed = now - lastPingMs;

    if (elapsed > FIVE_DAYS_MS) {
      log('info', 'Tab became visible and keep-alive interval elapsed — triggering ping');
      ping();
    }
  }
}

export const keepAliveService = {
  start() {
    if (initialized) return;
    if (!isConfigured()) {
      log('warn', 'Supabase not configured — keep-alive disabled');
      return;
    }

    initialized = true;
    log('info', `Keep-alive started — interval: ${FIVE_DAYS_MS}ms (5 days)`);

    ping();

    timerId = setInterval(ping, FIVE_DAYS_MS);

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }
  },

  stop() {
    if (timerId !== null) {
      clearInterval(timerId);
      timerId = null;
    }
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    }
    initialized = false;
    retryCount = 0;
    log('info', 'Keep-alive stopped');
  },

  async manualPing() {
    log('info', 'Manual ping triggered');
    return ping();
  },

  getStatus() {
    return {
      initialized,
      lastPingAt,
      lastPingStatus,
      lastPingError,
      consecutiveFailures,
      totalPings,
      successfulPings,
      uptime: totalPings > 0 ? Math.round((successfulPings / totalPings) * 100) : 0,
      intervalMs: FIVE_DAYS_MS,
      nextPingAt: initialized && lastPingAt
        ? new Date(new Date(lastPingAt).getTime() + FIVE_DAYS_MS).toISOString()
        : null,
    };
  },

  reset() {
    consecutiveFailures = 0;
    retryCount = 0;
    lastPingError = null;
    log('info', 'Counters reset');
  },
};
