import { pool } from "./pool.js";

const SEED_MARKER_SVC = "SEED-MARKER-001";

const PERSONNEL = [
  { full_name: "Col. Rajendra Singh Rathore", rank: "Colonel", unit: "3 Rajputana Rifles", service_number: "IC-72341", clearance_level: "TOP_SECRET", zk_verified: true, status: "ACTIVE", photo_placeholder: "RS" },
  { full_name: "Maj. Vikram Chauhan", rank: "Major", unit: "4 Sikh Light Infantry", service_number: "IC-81256", clearance_level: "SECRET", zk_verified: true, status: "ACTIVE", photo_placeholder: "VC" },
  { full_name: "Capt. Priya Sharma", rank: "Captain", unit: "Corps of Signals", service_number: "SS-45921", clearance_level: "SECRET", zk_verified: true, status: "ACTIVE", photo_placeholder: "PS" },
  { full_name: "Sub. Balwinder Singh", rank: "Subedar", unit: "4 Sikh Light Infantry", service_number: "JC-112847", clearance_level: "CONFIDENTIAL", zk_verified: true, status: "DEPLOYED", photo_placeholder: "BS" },
  { full_name: "Nb Sub. Mohan Thapa", rank: "Naib Subedar", unit: "11 Gorkha Rifles", service_number: "JC-215903", clearance_level: "CONFIDENTIAL", zk_verified: true, status: "ACTIVE", photo_placeholder: "MT" },
  { full_name: "Hav. Deepak Kumar", rank: "Havildar", unit: "3 Rajputana Rifles", service_number: "15847632", clearance_level: "CONFIDENTIAL", zk_verified: true, status: "ACTIVE", photo_placeholder: "DK" },
  { full_name: "Hav. Ranjit Gogoi", rank: "Havildar", unit: "2 Assam Regiment", service_number: "16234701", clearance_level: "CONFIDENTIAL", zk_verified: false, status: "DEPLOYED", photo_placeholder: "RG" },
  { full_name: "Nk. Suresh Yadav", rank: "Naik", unit: "Rajput Regiment", service_number: "17532841", clearance_level: "CONFIDENTIAL", zk_verified: true, status: "ACTIVE", photo_placeholder: "SY" },
  { full_name: "Nk. Arun Pillai", rank: "Naik", unit: "Corps of Engineers", service_number: "17891023", clearance_level: "CONFIDENTIAL", zk_verified: true, status: "ACTIVE", photo_placeholder: "AP" },
  { full_name: "L/Nk. Karan Mehra", rank: "Lance Naik", unit: "3 Rajputana Rifles", service_number: "18245671", clearance_level: "CONFIDENTIAL", zk_verified: false, status: "ACTIVE", photo_placeholder: "KM" },
  { full_name: "Sep. Rohit Tiwari", rank: "Sepoy", unit: "11 Gorkha Rifles", service_number: "19012345", clearance_level: "UNCLASSIFIED", zk_verified: true, status: "ACTIVE", photo_placeholder: "RT" },
  { full_name: "Sep. Gurpreet Sandhu", rank: "Sepoy", unit: "4 Sikh Light Infantry", service_number: "19234567", clearance_level: "UNCLASSIFIED", zk_verified: false, status: "ON_LEAVE", photo_placeholder: "GS" },
  { full_name: "Sep. Manoj Patel", rank: "Sepoy", unit: "Rajput Regiment", service_number: "19456789", clearance_level: "UNCLASSIFIED", zk_verified: true, status: "ACTIVE", photo_placeholder: "MP" },
  { full_name: "Sep. Aman Rawat", rank: "Sepoy", unit: "Corps of Signals", service_number: "19678901", clearance_level: "UNCLASSIFIED", zk_verified: false, status: "ACTIVE", photo_placeholder: "AR" },
  { full_name: "Brig. Harshvardhan Pant", rank: "Brigadier", unit: "HQ Northern Command", service_number: "IC-58120", clearance_level: "TOP_SECRET", zk_verified: true, status: "ACTIVE", photo_placeholder: "HP" },
];

const CHECKPOINTS = [
  { personnel_idx: 0, checkpoint_name: "Gate Alpha", location: "Sector 7, LoC", method: "zk_biometric", result: "PASS" },
  { personnel_idx: 1, checkpoint_name: "Forward Post Bravo", location: "Sector 12, Siachen", method: "zk_biometric", result: "PASS" },
  { personnel_idx: 3, checkpoint_name: "Gate Alpha", location: "Sector 7, LoC", method: "zk_biometric", result: "PASS" },
  { personnel_idx: 6, checkpoint_name: "Camp Delta Entry", location: "Tezpur Garrison", method: "passkey", result: "FLAGGED" },
  { personnel_idx: 4, checkpoint_name: "Ammunition Depot Gate", location: "Sector 3, Western Command", method: "zk_biometric", result: "PASS" },
  { personnel_idx: 2, checkpoint_name: "Signals HQ", location: "New Delhi Cantonment", method: "zk_biometric", result: "PASS" },
  { personnel_idx: 14, checkpoint_name: "HQ Northern Command", location: "Udhampur", method: "zk_biometric", result: "PASS" },
  { personnel_idx: 7, checkpoint_name: "Forward Post Bravo", location: "Sector 12, Siachen", method: "zk_biometric", result: "PASS" },
];

const ARMOURY_ENTRIES = [
  { personnel_idx: 5, weapon_type: "INSAS Rifle", weapon_serial: "INS-2024-4521", action: "CHECKOUT", reason: "Patrol duty - Sector 7" },
  { personnel_idx: 7, weapon_type: "9mm Pistol", weapon_serial: "BEL-9P-1187", action: "CHECKOUT", reason: "Guard duty assignment" },
  { personnel_idx: 1, weapon_type: "AK-203", weapon_serial: "AK203-IN-0034", action: "CHECKOUT", reason: "Forward area deployment" },
  { personnel_idx: 10, weapon_type: "INSAS Rifle", weapon_serial: "INS-2024-4522", action: "CHECKOUT", reason: "Range practice" },
  { personnel_idx: 10, weapon_type: "INSAS Rifle", weapon_serial: "INS-2024-4522", action: "RETURN", reason: "Range practice complete" },
  { personnel_idx: 8, weapon_type: "INSAS Rifle", weapon_serial: "INS-2024-4523", action: "CHECKOUT", reason: "Perimeter security" },
];

export async function seedDatabase(): Promise<void> {
  const existing = await pool.query(
    `SELECT 1 FROM sentinel_personnel WHERE service_number = $1 LIMIT 1`,
    [SEED_MARKER_SVC]
  );

  if (existing.rows.length > 0) {
    return;
  }

  // Insert marker row
  await pool.query(
    `INSERT INTO sentinel_personnel (full_name, rank, unit, service_number, clearance_level, zk_verified, status, photo_placeholder)
     VALUES ('SEED MARKER', 'System', 'System', $1, 'UNCLASSIFIED', FALSE, 'RETIRED', 'XX')`,
    [SEED_MARKER_SVC]
  );

  // Insert personnel
  const personnelIds: number[] = [];
  for (const p of PERSONNEL) {
    const result = await pool.query<{ id: number }>(
      `INSERT INTO sentinel_personnel (full_name, rank, unit, service_number, clearance_level, zk_verified, zk_verified_at, status, photo_placeholder)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id::int`,
      [
        p.full_name, p.rank, p.unit, p.service_number, p.clearance_level,
        p.zk_verified, p.zk_verified ? new Date(Date.now() - Math.random() * 7 * 86400000).toISOString() : null,
        p.status, p.photo_placeholder
      ]
    );
    personnelIds.push(result.rows[0].id);
  }

  // Insert checkpoint entries
  for (const c of CHECKPOINTS) {
    const pid = personnelIds[c.personnel_idx];
    const offset = Math.floor(Math.random() * 48);
    await pool.query(
      `INSERT INTO sentinel_checkpoints (personnel_id, checkpoint_name, location, verification_method, result, verified_at)
       VALUES ($1, $2, $3, $4, $5, NOW() - ($6 || ' hours')::interval)`,
      [pid, c.checkpoint_name, c.location, c.method, c.result, offset]
    );
  }

  // Update last_checkpoint for personnel
  await pool.query(`
    UPDATE sentinel_personnel p SET last_checkpoint = sub.checkpoint_name
    FROM (
      SELECT DISTINCT ON (personnel_id) personnel_id, checkpoint_name
      FROM sentinel_checkpoints ORDER BY personnel_id, verified_at DESC
    ) sub
    WHERE p.id = sub.personnel_id
  `);

  // Insert armoury entries
  for (const a of ARMOURY_ENTRIES) {
    const pid = personnelIds[a.personnel_idx];
    const offset = Math.floor(Math.random() * 36);
    await pool.query(
      `INSERT INTO sentinel_armoury (personnel_id, weapon_type, weapon_serial, action, reason, action_at)
       VALUES ($1, $2, $3, $4, $5, NOW() - ($6 || ' hours')::interval)`,
      [pid, a.weapon_type, a.weapon_serial, a.action, a.reason, offset]
    );
  }

  console.log(`Seeded ${PERSONNEL.length} personnel, ${CHECKPOINTS.length} checkpoints, ${ARMOURY_ENTRIES.length} armoury entries.`);
}
