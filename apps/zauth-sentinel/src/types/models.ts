export type SentinelUser = {
  id: number;
  subject_id: string;
  email: string | null;
  display_name: string | null;
  rank: string;
  unit: string;
  clearance_level: string;
};

export type Assurance = {
  acr: string;
  amr: string[];
  uid?: string;
  did?: string;
};

export type SentinelSession = {
  session_id: string;
  user_id: number;
  subject_id: string;
  acr: string | null;
  amr: string[] | null;
  uid: string | null;
  did: string | null;
  expires_at: string;
};

export type Personnel = {
  id: number;
  user_id: number | null;
  full_name: string;
  rank: string;
  unit: string;
  service_number: string;
  clearance_level: string;
  zk_verified: boolean;
  zk_verified_at: string | null;
  last_checkpoint: string | null;
  status: string;
  photo_placeholder: string | null;
  created_at: string;
};

export type CheckpointEntry = {
  id: number;
  personnel_id: number;
  personnel_name?: string;
  personnel_rank?: string;
  checkpoint_name: string;
  location: string | null;
  verified_by_name?: string;
  verification_method: string;
  acr_at_verify: string | null;
  result: string;
  notes: string | null;
  verified_at: string;
};

export type ArmouryEntry = {
  id: number;
  personnel_id: number;
  personnel_name?: string;
  personnel_rank?: string;
  weapon_type: string;
  weapon_serial: string;
  action: string;
  authorized_by_name?: string;
  acr_at_action: string | null;
  reason: string | null;
  action_at: string;
};

export type Dispatch = {
  id: number;
  title: string;
  content: string;
  classification: string;
  priority: string;
  tags: string[];
  is_archived: boolean;
  updated_at: string;
  created_at: string;
};

export type DashboardStats = {
  total_personnel: number;
  zk_verified: number;
  checkpoints_today: number;
  weapons_out: number;
  recent_activity: ActivityItem[];
};

export type ActivityItem = {
  type: "checkpoint" | "armoury" | "dispatch";
  description: string;
  timestamp: string;
};
