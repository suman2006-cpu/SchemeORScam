import districtsData from '../data/districts.json';
import { RADAR_DEMO_SEED } from '../data/radarDemoSeed';
import { REGISTRY_SEED } from '../data/registrySeed';
import type {
  AuditLogEntry,
  DistrictItem,
  RadarCluster,
  SchemeEntry,
  Verdict,
} from '../engine/types';

const DISTRICTS = districtsData as DistrictItem[];

function getHourBucket(date: Date = new Date()): string {
  const d = new Date(date);
  d.setUTCMinutes(0, 0, 0);
  return d.toISOString().slice(0, 16) + 'Z';
}

class AppStore {
  private schemes: SchemeEntry[];
  private radarClusters: RadarCluster[];
  private auditLog: AuditLogEntry[];
  public readonly mode: 'memory' | 'supabase';

  constructor() {
    this.mode =
      process.env.SUPABASE_URL?.trim() && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
        ? 'supabase'
        : 'memory';
    this.schemes = structuredClone(REGISTRY_SEED);
    this.radarClusters = structuredClone(RADAR_DEMO_SEED);
    this.auditLog = [
      {
        id: 'audit-init',
        at: new Date().toISOString(),
        actor: 'system',
        action: 'SEED_INIT',
        targetId: 'registry',
        summary: 'Loaded Section 6 unconfirmed seed registry and labelled sample radar entries.',
      },
    ];
  }

  getRadarMinCount(): number {
    const parsed = Number.parseInt(process.env.RADAR_MIN_COUNT ?? '3', 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 3;
  }

  getDistricts(): DistrictItem[] {
    return DISTRICTS;
  }

  getRegistry(): SchemeEntry[] {
    return this.schemes;
  }

  upsertScheme(entry: SchemeEntry, actor: string): SchemeEntry {
    // Enforce Section 6 & 9 rule: verified status requires sourceUrl and verifiedOn
    if (entry.status === 'verified') {
      const hasValidChannel = entry.officialChannels.some(
        (c) => Boolean(c.sourceUrl?.trim()) && Boolean(c.verifiedOn?.trim()),
      );
      const hasValidProcess = entry.processes.some(
        (p) => Boolean(p.sourceUrl?.trim()) && Boolean(p.verifiedOn?.trim()),
      );
      if (!hasValidChannel && !hasValidProcess) {
        throw new Error('VERIFICATION_REQUIRED');
      }
    }

    const idx = this.schemes.findIndex((s) => s.id === entry.id);
    if (idx >= 0) {
      this.schemes[idx] = entry;
    } else {
      this.schemes.push(entry);
    }

    this.auditLog.unshift({
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      at: new Date().toISOString(),
      actor,
      action: idx >= 0 ? 'UPDATE_SCHEME' : 'CREATE_SCHEME',
      targetId: entry.id,
      summary: `Saved scheme ${entry.nameEn} (${entry.status})`,
    });

    return entry;
  }

  getRadarClusters(districtCode?: string): RadarCluster[] {
    const minCount = this.getRadarMinCount();
    const filtered = this.radarClusters.filter((item) => {
      if (districtCode && districtCode !== 'ALL' && item.districtCode !== districtCode) {
        return false;
      }
      // Hide real clusters below RADAR_MIN_COUNT; always show visibly labelled sample data
      if (!item.isSample && item.count < minCount) {
        return false;
      }
      return true;
    });

    return [...filtered].sort((a, b) => b.count - a.count);
  }

  getAllRadarClustersForAdmin(): RadarCluster[] {
    return [...this.radarClusters].sort((a, b) => b.count - a.count);
  }

  submitRadarReport(input: {
    registrableDomain: string;
    verdict: Verdict;
    schemeId: string;
    actionType: string;
    districtCode: string;
  }): { id: string; count: number; visibleOnPublicBoard: boolean } {
    const district = DISTRICTS.find((d) => d.code === input.districtCode);
    if (!district) {
      throw new Error('INVALID_DISTRICT');
    }

    const scheme = this.schemes.find((s) => s.id === input.schemeId);
    const schemeTe = scheme?.nameTe ?? 'ఇతర / గుర్తించని పథకం';
    const schemeEn = scheme?.nameEn ?? 'Other / Unidentified scheme';
    const domain = input.registrableDomain.toLowerCase().trim();
    const bucket = getHourBucket();

    const existing = this.radarClusters.find(
      (c) =>
        !c.isSample &&
        c.districtCode === district.code &&
        c.registrableDomain === domain &&
        c.actionType === input.actionType,
    );

    if (existing) {
      existing.count += 1;
      existing.dailyCounts14d[existing.dailyCounts14d.length - 1] += 1;
      existing.lastSeenBucket = bucket;
      return {
        id: existing.id,
        count: existing.count,
        visibleOnPublicBoard: existing.count >= this.getRadarMinCount(),
      };
    }

    const created: RadarCluster = {
      id: `radar-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      districtCode: district.code,
      districtTe: district.nameTe,
      districtEn: district.nameEn,
      registrableDomain: domain,
      schemeId: input.schemeId || 'unknown',
      schemeTe,
      schemeEn,
      actionType: input.actionType || 'other',
      verdict: input.verdict,
      count: 1,
      dailyCounts14d: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      isSample: false,
      lastSeenBucket: bucket,
    };

    this.radarClusters.push(created);
    return {
      id: created.id,
      count: created.count,
      visibleOnPublicBoard: created.count >= this.getRadarMinCount(),
    };
  }

  exportRadarCsv(): string {
    const header = [
      'id',
      'district_code',
      'district_en',
      'registrable_domain',
      'scheme_id',
      'action_type',
      'verdict',
      'count',
      'is_sample',
      'last_seen_bucket',
    ].join(',');

    const escapeCsv = (val: string | number | boolean) => {
      const s = String(val);
      if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };

    const rows = this.radarClusters.map((c) =>
      [
        c.id,
        c.districtCode,
        c.districtEn,
        c.registrableDomain,
        c.schemeId,
        c.actionType,
        c.verdict,
        c.count,
        c.isSample,
        c.lastSeenBucket,
      ]
        .map(escapeCsv)
        .join(','),
    );

    return [header, ...rows].join('\n');
  }

  getAuditLog(): AuditLogEntry[] {
    return this.auditLog.slice(0, 50);
  }
}

export const store = new AppStore();
