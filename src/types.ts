// Domain types for the Nimos control plane.
export type Pulse = {
  agents_total: number;
  agents_active: number;
  open_tasks: number;
  open_asks: number;
  last_event: { ts: string; title: string; kind: string } | null;
};

export type Business = {
  id: string;
  name: string;
  state?: string | null;
  site_url?: string | null;
  blocker?: string | null;
  revenue_target_mrr?: number | null;
};

export type Ask = {
  id: string;
  agent_id?: string | null;
  business_id?: string | null;
  kind?: string | null;
  key_name?: string | null;
  title?: string | null;
  why?: string | null;
  signup_url?: string | null;
  status: string;
  value?: string | null;
  created?: string | null;
  filled_at?: string | null;
};

export type Agent = {
  id: string;
  business_id?: string | null;
  name: string;
  role: string;
  tier?: string | null;
  is_active: number;
  interval_minutes?: number | null;
  sole_goal?: string | null;
};

export type Task = {
  id: string;
  business_id?: string | null;
  agent_id?: string | null;
  title?: string | null;
  status?: string | null;
  priority?: string | null;
  updated?: string | null;
};

export type NimosEvent = {
  id: string;
  ts: string;
  business_id?: string | null;
  source?: string | null;
  kind: string;
  title: string;
  body?: string | null;
  needs_ben?: number | null;
};
