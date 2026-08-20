const assert = require("node:assert/strict");
const test = require("node:test");

const {
  createAuthSessionCoordinator,
  isAuthenticationError,
} = require("./auth-session");

function createHarness({ backendRequest } = {}) {
  const files = new Map();
  const timers = [];
  const calls = [];
  let notifications = 0;
  const authPath = "C:/PinFlow/auth.dat";
  const fs = {
    existsSync: (path) => files.has(path),
    readFileSync: (path) => files.get(path),
    writeFileSync: (path, value) => files.set(path, Buffer.from(value)),
    renameSync: (from, to) => {
      files.set(to, files.get(from));
      files.delete(from);
    },
    rmSync: (path) => files.delete(path),
  };
  const request = async (...args) => {
    calls.push(args);
    if (backendRequest) return backendRequest(...args);
    return { status: 200, data: {} };
  };
  const coordinator = createAuthSessionCoordinator({
    authFilePath: () => authPath,
    backendRequest: request,
    safeStorage: {
      isEncryptionAvailable: () => true,
      encryptString: (value) => Buffer.from(`encrypted:${value}`),
      decryptString: (value) => value.toString().replace(/^encrypted:/, ""),
    },
    fs,
    log: { info() {}, error() {} },
    notifyAuthChanged: () => {
      notifications += 1;
    },
    setTimer: (callback, delay) => {
      const timer = { callback, delay, cleared: false };
      timers.push(timer);
      return timer;
    },
    clearTimer: (timer) => {
      timer.cleared = true;
    },
    setRepeatingTimer: () => ({}),
    clearRepeatingTimer() {},
    now: () => Date.parse("2026-08-20T00:00:00Z"),
    renewalMarginMs: 60_000,
    retryBaseMs: 5_000,
    retryMaxMs: 60_000,
  });
  return {
    authPath,
    calls,
    coordinator,
    files,
    notifications: () => notifications,
    timers,
  };
}

test("restore atomically persists the rotated refresh token and schedules renewal", async () => {
  const harness = createHarness({
    backendRequest: async (method, path) => {
      assert.equal(method, "POST");
      assert.equal(path, "/api/v1/auth/session");
      return {
        status: 200,
        data: {
          refreshToken: "rotated-token",
          expiresAt: "2026-08-20T01:00:00Z",
        },
      };
    },
  });
  harness.files.set(harness.authPath, Buffer.from("encrypted:saved-token"));

  assert.equal(await harness.coordinator.restore(), true);
  assert.equal(
    harness.files.get(harness.authPath).toString(),
    "encrypted:rotated-token",
  );
  assert.equal(harness.files.has(`${harness.authPath}.tmp`), false);
  assert.equal(harness.timers[0].delay, 59 * 60 * 1000);
  assert.equal(harness.notifications(), 1);
});

test("logout wins a race with an in-flight renewal", async () => {
  let resolveRenewal;
  const renewalResponse = new Promise((resolve) => {
    resolveRenewal = resolve;
  });
  const harness = createHarness({
    backendRequest: async (method, path) => {
      if (method === "POST" && path === "/api/v1/auth/session") {
        return renewalResponse;
      }
      return { status: 200, data: {} };
    },
  });
  harness.files.set(harness.authPath, Buffer.from("encrypted:saved-token"));

  const renewal = harness.coordinator.renew("test");
  const logout = harness.coordinator.logout();
  resolveRenewal({
    status: 200,
    data: {
      refreshToken: "must-not-be-persisted",
      expiresAt: "2026-08-20T01:00:00Z",
    },
  });
  await Promise.all([renewal, logout]);

  assert.equal(harness.files.has(harness.authPath), false);
  assert.equal(
    harness.calls.some(
      ([method, path]) => method === "DELETE" && path === "/api/v1/auth/session",
    ),
    true,
  );
});

test("transient renewal failure preserves auth.dat and schedules bounded retry", async () => {
  const harness = createHarness({
    backendRequest: async () => {
      throw new Error("network unavailable");
    },
  });
  harness.files.set(harness.authPath, Buffer.from("encrypted:saved-token"));

  assert.equal(await harness.coordinator.renew("test"), false);
  assert.equal(harness.files.has(harness.authPath), true);
  assert.equal(harness.timers[0].delay, 5_000);
});

test("resume renews before triggering reconciliation", async () => {
  const harness = createHarness({
    backendRequest: async (method, path) => {
      if (method === "GET") {
        return {
          status: 200,
          data: { authenticated: true, renewalRequired: true },
        };
      }
      if (path === "/api/v1/auth/session") {
        return {
          status: 200,
          data: {
            refreshToken: "rotated-token",
            expiresAt: "2026-08-20T01:00:00Z",
          },
        };
      }
      return { status: 202, data: {} };
    },
  });
  harness.files.set(harness.authPath, Buffer.from("encrypted:saved-token"));

  assert.equal(await harness.coordinator.handleResume(), true);
  assert.deepEqual(
    harness.calls.map(([method, path]) => `${method} ${path}`),
    [
      "GET /api/v1/auth/session",
      "POST /api/v1/auth/session",
      "POST /api/v1/sync/trigger",
    ],
  );
});

test("authentication errors are distinguished from transient failures", () => {
  assert.equal(isAuthenticationError(401, "token refresh failed"), true);
  assert.equal(isAuthenticationError(503, "network unavailable"), false);
});
