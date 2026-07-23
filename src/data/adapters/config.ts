import raw from '../../../data-sources.config.json'
import type { Origin } from './types'

// Typed accessor over the single `data-sources.config.json`. Endpoints/keys are
// TODO(paint); this module only shapes + validates what is present.

export interface BackupSourceConfig {
  id: string
  label: string
  origin: Origin
  endpoint: string
  keyEnv: string | null
  allowedAsBackup: boolean
}

export interface SourceConfig {
  id: string
  label: string
  unit: string
  origin: Origin
  endpoint: string
  keyEnv: string | null
  refreshIntervalMs: number
  fallbackSnapshot: string
  backups: BackupSourceConfig[]
}

export type SourceId = 'tideLevel' | 'canalRiverLevel' | 'rainfall' | 'pumpGateStatus'

const sources = (raw as { sources: Record<SourceId, SourceConfig> }).sources

export function sourceConfig(id: SourceId): SourceConfig {
  return sources[id]
}

export function refreshIntervalOf(id: SourceId): number {
  return sources[id]?.refreshIntervalMs ?? 60000
}

/** True when an endpoint is still a placeholder the operator must fill in. */
export function isTodo(endpoint: string): boolean {
  return endpoint.startsWith('TODO(')
}

export const SOURCE_IDS = Object.keys(sources) as SourceId[]
