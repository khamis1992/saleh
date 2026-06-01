// Status color system — badge classes for the Linear dark theme
export const statusColors: Record<string, string> = {
  // General
  active: 'badge-success',
  inactive: 'badge',
  draft: 'badge',
  pending: 'badge-warning',
  approved: 'badge-primary',
  rejected: 'badge-danger',

  // Leasing
  available: 'badge-success',
  leased: 'badge-primary',
  reserved: 'badge-primary',

  // Financial
  paid: 'badge-success',
  partially_paid: 'badge-warning',
  overdue: 'badge-danger',
  cancelled: 'badge',
  written_off: 'badge',
  issued: 'badge-primary',
  posted: 'badge-success',

  // Projects
  completed: 'badge-success',
  in_progress: 'badge-primary',
  on_hold: 'badge-warning',
  delayed: 'badge-danger',

  // Maintenance
  emergency: 'badge-danger',
  high: 'badge-danger',
  medium: 'badge-warning',
  low: 'badge-success',
  waiting_parts: 'badge-warning',
  tenant_confirmed: 'badge-primary',
  scheduled: 'badge-primary',
  submitted: 'badge-warning',
  under_review: 'badge-warning',
  assigned: 'badge-primary',
  notice_sent: 'badge-primary',

  // Legal
  legal: 'badge-danger',
  generated: 'badge-primary',
  sent: 'badge-primary',
  acknowledged: 'badge-success',
  closed: 'badge',
  expired: 'badge',
  filed: 'badge-primary',
  hearing_scheduled: 'badge-warning',
  judgment_issued: 'badge-success',
  enforcement: 'badge-danger',

  // Equipment
  under_maintenance: 'badge-warning',
  damaged: 'badge-danger',
  sold: 'badge',
  retired: 'badge',

  // Rent Schedule
  upcoming: 'badge-primary',
  due: 'badge-warning',

  // Cheque
  received: 'badge-primary',
  deposited: 'badge-primary',
  cleared: 'badge-success',
  bounced: 'badge-danger',
  returned: 'badge',

  // Buildings
  ready: 'badge-success',

  // Attendance
  present: 'badge-success',
  absent: 'badge-danger',
  late: 'badge-warning',
  half_day: 'badge-warning',
  leave: 'badge-primary',
  holiday: 'badge-primary',
};

export function getStatusColor(status: string): string {
  return statusColors[status] || 'badge';
}
