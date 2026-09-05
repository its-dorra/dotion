export type DecisionType = "ALLOW" | "DENY" | "ABSTAIN";

export interface Decision {
  readonly type: DecisionType;
  readonly reason?: string;
}

export const allow = (reason?: string): Decision => ({
  type: "ALLOW",
  ...(reason ? { reason } : {}),
});

export const deny = (reason?: string): Decision => ({
  type: "DENY",
  ...(reason ? { reason } : {}),
});

export const abstain = (reason?: string): Decision => ({
  type: "ABSTAIN",
  ...(reason ? { reason } : {}),
});

export const isAllowed = (decision: Decision): boolean =>
  decision.type === "ALLOW";

export const isDenied = (decision: Decision): boolean =>
  decision.type === "DENY";

export const isAbstain = (decision: Decision): boolean =>
  decision.type === "ABSTAIN";
