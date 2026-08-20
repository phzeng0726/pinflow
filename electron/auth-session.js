const DEFAULT_RENEWAL_MARGIN_MS = 60 * 1000;
const DEFAULT_RETRY_BASE_MS = 5 * 1000;
const DEFAULT_RETRY_MAX_MS = 5 * 60 * 1000;
const DEFAULT_MONITOR_INTERVAL_MS = 30 * 1000;

function isAuthenticationError(status, message = "") {
  return (
    status === 401 ||
    status === 403 ||
    /(expired|revoked|invalid.*token|refresh token|unauthorized)/i.test(message)
  );
}

function createSerializedRunner() {
  let tail = Promise.resolve();
  return (operation) => {
    const result = tail.then(operation, operation);
    tail = result.catch(() => {});
    return result;
  };
}

function createAuthSessionCoordinator({
  authFilePath,
  backendRequest,
  safeStorage,
  fs,
  log,
  notifyAuthChanged,
  setTimer = setTimeout,
  clearTimer = clearTimeout,
  setRepeatingTimer = setInterval,
  clearRepeatingTimer = clearInterval,
  now = () => Date.now(),
  renewalMarginMs = DEFAULT_RENEWAL_MARGIN_MS,
  retryBaseMs = DEFAULT_RETRY_BASE_MS,
  retryMaxMs = DEFAULT_RETRY_MAX_MS,
  monitorIntervalMs = DEFAULT_MONITOR_INTERVAL_MS,
}) {
  const serialize = createSerializedRunner();
  let renewalTimer;
  let retryTimer;
  let monitorTimer;
  let expiresAtMs = 0;
  let retryCount = 0;
  let epoch = 0;
  let stopped = false;

  function cancelRenewalTimers() {
    if (renewalTimer) clearTimer(renewalTimer);
    if (retryTimer) clearTimer(retryTimer);
    renewalTimer = undefined;
    retryTimer = undefined;
  }

  function removeSavedAuth() {
    fs.rmSync(authFilePath(), { force: true });
  }

  function readSavedRefreshToken() {
    if (!safeStorage.isEncryptionAvailable() || !fs.existsSync(authFilePath())) {
      return undefined;
    }
    return safeStorage.decryptString(fs.readFileSync(authFilePath()));
  }

  function persistRefreshToken(refreshToken) {
    if (!refreshToken || !safeStorage.isEncryptionAvailable()) return false;
    const target = authFilePath();
    const temporary = `${target}.tmp`;
    try {
      fs.writeFileSync(temporary, safeStorage.encryptString(refreshToken));
      fs.renameSync(temporary, target);
      return true;
    } catch (error) {
      fs.rmSync(temporary, { force: true });
      throw error;
    }
  }

  function scheduleRenewal(expiresAt) {
    if (stopped) return;
    if (renewalTimer) clearTimer(renewalTimer);
    expiresAtMs = expiresAt ? Date.parse(expiresAt) : 0;
    const fallbackDelay = 45 * 60 * 1000;
    const delay = expiresAtMs
      ? Math.max(0, expiresAtMs - now() - renewalMarginMs)
      : fallbackDelay;
    renewalTimer = setTimer(() => {
      renewalTimer = undefined;
      void renew("scheduled");
    }, delay);
  }

  function scheduleRetry() {
    if (stopped) return;
    if (retryTimer) clearTimer(retryTimer);
    const delay = Math.min(retryBaseMs * 2 ** retryCount, retryMaxMs);
    retryCount += 1;
    retryTimer = setTimer(() => {
      retryTimer = undefined;
      void renew("retry");
    }, delay);
  }

  async function clearInvalidSession(message) {
    cancelRenewalTimers();
    expiresAtMs = 0;
    retryCount = 0;
    removeSavedAuth();
    try {
      await backendRequest("DELETE", "/api/v1/auth/session");
    } catch (error) {
      log.error("[auth] Failed to clear backend session:", error);
    }
    log.error(`[auth] Session is no longer valid: ${message}`);
    notifyAuthChanged();
  }

  async function renew(reason = "manual", { triggerSync = false } = {}) {
    const requestedEpoch = epoch;
    return serialize(async () => {
      if (stopped || requestedEpoch !== epoch) return false;
      let refreshToken;
      try {
        refreshToken = readSavedRefreshToken();
      } catch (error) {
        log.error("[auth] Failed to decrypt saved session:", error);
        await clearInvalidSession("saved session could not be decrypted");
        return false;
      }
      if (!refreshToken) return false;

      try {
        const response = await backendRequest("POST", "/api/v1/auth/session", {
          accessToken: "",
          refreshToken,
        });
        if (requestedEpoch !== epoch || stopped) return false;
        if (response.status !== 200) {
          const message = response.data.error || "Failed to renew saved session";
          if (isAuthenticationError(response.status, message)) {
            await clearInvalidSession(message);
          } else {
            log.error(`[auth] Session renewal deferred (${response.status}): ${message}`);
            scheduleRetry();
          }
          return false;
        }

        persistRefreshToken(response.data.refreshToken || refreshToken);
        retryCount = 0;
        if (retryTimer) clearTimer(retryTimer);
        retryTimer = undefined;
        scheduleRenewal(response.data.expiresAt);
        log.info(`[auth] Session renewed (${reason})`);
        notifyAuthChanged();
        if (triggerSync) {
          await backendRequest("POST", "/api/v1/sync/trigger");
        }
        return true;
      } catch (error) {
        if (requestedEpoch !== epoch || stopped) return false;
        log.error(`[auth] Session renewal deferred (${reason}):`, error);
        scheduleRetry();
        return false;
      }
    });
  }

  async function acceptSession(session, fallbackRefreshToken) {
    const requestedEpoch = epoch;
    return serialize(async () => {
      if (stopped || requestedEpoch !== epoch) return false;
      const refreshToken = session.refreshToken || fallbackRefreshToken;
      persistRefreshToken(refreshToken);
      retryCount = 0;
      cancelRenewalTimers();
      scheduleRenewal(session.expiresAt);
      notifyAuthChanged();
      return true;
    });
  }

  async function restore() {
    if (!fs.existsSync(authFilePath()) || !safeStorage.isEncryptionAvailable()) {
      return false;
    }
    return renew("startup");
  }

  async function logout() {
    epoch += 1;
    cancelRenewalTimers();
    expiresAtMs = 0;
    retryCount = 0;
    return serialize(async () => {
      removeSavedAuth();
      await backendRequest("DELETE", "/api/v1/auth/session");
      notifyAuthChanged();
    });
  }

  async function handleResume() {
    let status;
    try {
      status = await backendRequest("GET", "/api/v1/auth/session");
    } catch (error) {
      log.error("[auth] Resume status check failed:", error);
    }
    const session = status?.data;
    const needsRenewal =
      !session?.authenticated ||
      session.renewalRequired ||
      !expiresAtMs ||
      expiresAtMs - now() <= renewalMarginMs;
    if (needsRenewal) {
      return renew("resume", { triggerSync: true });
    }
    await backendRequest("POST", "/api/v1/sync/trigger");
    return true;
  }

  async function monitorAuth() {
    try {
      const response = await backendRequest("GET", "/api/v1/auth/session");
      if (response.data?.renewalRequired) {
        await renew("backend-requested");
      }
    } catch (error) {
      log.error("[auth] Session monitor failed:", error);
    }
  }

  function startMonitoring() {
    if (monitorTimer || stopped) return;
    monitorTimer = setRepeatingTimer(() => void monitorAuth(), monitorIntervalMs);
  }

  function stop() {
    stopped = true;
    epoch += 1;
    cancelRenewalTimers();
    if (monitorTimer) clearRepeatingTimer(monitorTimer);
    monitorTimer = undefined;
  }

  return {
    acceptSession,
    handleResume,
    logout,
    persistRefreshToken,
    readSavedRefreshToken,
    renew,
    restore,
    startMonitoring,
    stop,
  };
}

module.exports = {
  createAuthSessionCoordinator,
  createSerializedRunner,
  isAuthenticationError,
};
