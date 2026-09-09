import { DurableObject } from "cloudflare:workers";

export interface UserCreditRow {
  id: number;
  balance: number;
  daily_allowance: number;
  last_reset_at: number;
  total_tokens_used: number;
  [key: string]: SqlStorageValue;
}

export interface TokenLedgerRow {
  id: number;
  tokens: number;
  type: "deduction" | "reset" | "topup";
  timestamp: number;
  metadata: string | null;
  [key: string]: SqlStorageValue;
}

const DEFAULT_DAILY_ALLOWANCE = 90_000;
const RESET_INTERVAL_MS = 24 * 60 * 60 * 1000;

export class UserCreditsDO extends DurableObject<Env> {
  constructor(state: DurableObjectState, env: Env) {
    super(state, env);
    this.ensureSchema();
  }

  private ensureSchema(): void {
    this.ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS user_credits (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        balance INTEGER NOT NULL,
        daily_allowance INTEGER NOT NULL,
        last_reset_at INTEGER NOT NULL,
        total_tokens_used INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS token_ledger (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tokens INTEGER NOT NULL,
        type TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        metadata TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_token_ledger_timestamp ON token_ledger(timestamp);
    `);

    const rows = this.ctx.storage.sql
      .exec<UserCreditRow>("SELECT * FROM user_credits WHERE id = 1 LIMIT 1")
      .toArray();

    if (rows.length === 0) {
      const now = Date.now();
      this.ctx.storage.sql.exec(
        `INSERT INTO user_credits (id, balance, daily_allowance, last_reset_at, total_tokens_used)
         VALUES (1, ?, ?, ?, 0);`,
        DEFAULT_DAILY_ALLOWANCE,
        DEFAULT_DAILY_ALLOWANCE,
        now,
      );

      this.ctx.storage.sql.exec(
        `INSERT INTO token_ledger (tokens, type, timestamp, metadata)
         VALUES (?, 'reset', ?, 'Initial daily allowance');`,
        DEFAULT_DAILY_ALLOWANCE,
        now,
      );
    }
  }

  private getAndRefreshCreditsSync(): UserCreditRow {
    const rows = this.ctx.storage.sql
      .exec<UserCreditRow>("SELECT * FROM user_credits WHERE id = 1 LIMIT 1")
      .toArray();

    let current = rows[0];
    const now = Date.now();

    if (!current) {
      this.ensureSchema();
      const refetched = this.ctx.storage.sql
        .exec<UserCreditRow>("SELECT * FROM user_credits WHERE id = 1 LIMIT 1")
        .toArray();
      current = refetched[0];
      if (!current) {
        throw new Error("Failed to initialize user_credits table");
      }
    }

    if (now - current.last_reset_at >= RESET_INTERVAL_MS) {
      const updatedBalance = current.daily_allowance;
      this.ctx.storage.sql.exec(
        `UPDATE user_credits 
         SET balance = ?, last_reset_at = ? 
         WHERE id = 1;`,
        updatedBalance,
        now,
      );

      this.ctx.storage.sql.exec(
        `INSERT INTO token_ledger (tokens, type, timestamp, metadata)
         VALUES (?, 'reset', ?, 'Daily quota reset');`,
        updatedBalance,
        now,
      );

      return {
        ...current,
        balance: updatedBalance,
        last_reset_at: now,
      };
    }

    return current;
  }

  async checkTokenQuota(
    params: { minTokens: number } = { minTokens: 50 },
  ): Promise<{
    allowed: boolean;
    remainingTokens: number;
    resetAt: number;
    message?: string;
  }> {
    const credits = this.getAndRefreshCreditsSync();
    const minRequired = params.minTokens;
    const resetAt = credits.last_reset_at + RESET_INTERVAL_MS;

    if (credits.balance < minRequired) {
      const hoursRemaining = Math.max(
        1,
        Math.ceil((resetAt - Date.now()) / (1000 * 60 * 60)),
      );
      return {
        allowed: false,
        remainingTokens: credits.balance,
        resetAt,
        message: `You have exhausted your daily AI token quota (${credits.daily_allowance.toLocaleString()} tokens). Quota resets in ${hoursRemaining}h.`,
      };
    }

    return {
      allowed: true,
      remainingTokens: credits.balance,
      resetAt,
    };
  }

  /**
   * Settle token usage after stream completion.
   * Atomically decrements balance and records a ledger transaction in SQLite.
   */
  async settleTokenUsage(params: {
    tokensUsed: number;
    metadata: string;
  }): Promise<{
    remainingTokens: number;
    totalUsed: number;
  }> {
    this.getAndRefreshCreditsSync();
    const tokensToDeduct = Math.max(0, Math.floor(params.tokensUsed));
    const now = Date.now();

    this.ctx.storage.sql.exec(
      `UPDATE user_credits 
       SET balance = MAX(0, balance - ?), 
           total_tokens_used = total_tokens_used + ? 
       WHERE id = 1;`,
      tokensToDeduct,
      tokensToDeduct,
    );

    this.ctx.storage.sql.exec(
      `INSERT INTO token_ledger (tokens, type, timestamp, metadata)
       VALUES (?, 'deduction', ?, ?);`,
      tokensToDeduct,
      now,
      params.metadata,
    );

    const rows = this.ctx.storage.sql
      .exec<UserCreditRow>(
        "SELECT balance, total_tokens_used FROM user_credits WHERE id = 1",
      )
      .toArray();

    const updated = rows[0];
    if (!updated) {
      throw new Error("Failed to retrieve updated user_credits");
    }

    return {
      remainingTokens: updated.balance,
      totalUsed: updated.total_tokens_used,
    };
  }

  async getBalance(): Promise<{
    balance: number;
    dailyAllowance: number;
    resetAt: number;
    totalUsed: number;
  }> {
    const credits = this.getAndRefreshCreditsSync();
    return {
      balance: credits.balance,
      dailyAllowance: credits.daily_allowance,
      resetAt: credits.last_reset_at + RESET_INTERVAL_MS,
      totalUsed: credits.total_tokens_used,
    };
  }

  async addCredits(params: { tokens: number; reason: string }): Promise<{
    balance: number;
  }> {
    this.getAndRefreshCreditsSync();
    const tokensToAdd = Math.max(0, Math.floor(params.tokens));
    const now = Date.now();

    this.ctx.storage.sql.exec(
      `UPDATE user_credits 
       SET balance = balance + ? 
       WHERE id = 1;`,
      tokensToAdd,
    );

    this.ctx.storage.sql.exec(
      `INSERT INTO token_ledger (tokens, type, timestamp, metadata)
       VALUES (?, 'topup', ?, ?);`,
      tokensToAdd,
      now,
      params.reason,
    );

    const rows = this.ctx.storage.sql
      .exec<UserCreditRow>("SELECT balance FROM user_credits WHERE id = 1")
      .toArray();

    const updated = rows[0];
    if (!updated) {
      throw new Error("Failed to retrieve updated user_credits");
    }

    return { balance: updated.balance };
  }

  async getLedger(limit: number = 50): Promise<TokenLedgerRow[]> {
    return this.ctx.storage.sql
      .exec<TokenLedgerRow>(
        `SELECT * FROM token_ledger ORDER BY id DESC LIMIT ?;`,
        Math.min(limit, 200),
      )
      .toArray();
  }
}
