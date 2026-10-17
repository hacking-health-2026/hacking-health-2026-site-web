import type { Status } from './api'

export const alertLabels: Record<Status, string> = {
  critical: 'Danger',
  watch: 'Risque modéré',
  low: 'Risque faible',
  unknown: 'Informations insuffisantes',
}

export const alertColors: Record<Status, string> = {
  critical: 'Rouge',
  watch: 'Orange',
  low: 'Vert',
  unknown: 'Non classé',
}

export function severityStatus(severity: string): Status {
  return (
    ({ Rouge: 'critical', Orange: 'watch', Vert: 'low' } as Record<string, Status>)[severity] ??
    'unknown'
  )
}
