const { nextRetryAtIso } = require('./conflict');

const MAX_RETRIES = 8;

/**
 * Fields to persist when a push attempt fails (matches pushOutbox UPDATE).
 */
function buildFailureUpdate(currentRetryCount, errorMessage) {
  const retry_count = currentRetryCount + 1;
  return {
    retry_count,
    last_error: String(errorMessage || 'unknown'),
    next_retry_at: nextRetryAtIso(retry_count),
  };
}

/** Whether an outbox row should be included in the next push batch. */
function isEligibleForPush(row, nowIso = new Date().toISOString()) {
  if (row.retry_count >= MAX_RETRIES) return false;
  if (!row.next_retry_at) return true;
  return row.next_retry_at <= nowIso;
}

module.exports = { buildFailureUpdate, isEligibleForPush, MAX_RETRIES };
