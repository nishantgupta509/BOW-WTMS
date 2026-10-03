import { UserRole } from '../types';

export const PERMISSIONS = {
  createTrip: ['Operator', 'Supervisor', 'Manager', 'Admin'],
  editDraft: ['Operator', 'Supervisor', 'Manager', 'Admin'],
  confirmTrip: ['Supervisor', 'Manager', 'Admin'],
  changeFreight: ['Manager', 'Admin'],
  changeDetention: ['Manager', 'Admin'],
  changeApprovedKm: ['Manager', 'Admin'],
  cancelTrip: ['Supervisor', 'Manager', 'Admin'],
  reopenClosedTrip: ['Admin'],
  deleteTrip: ['Admin'],
  viewAuditLog: ['Operator', 'Supervisor', 'Manager', 'Admin'],
  dispatchTrip: ['Supervisor', 'Manager', 'Admin'],
  approveDetention: ['Supervisor', 'Manager', 'Admin'],
} as const;

export function hasPermission(role: UserRole, action: keyof typeof PERMISSIONS): boolean {
  const allowedRoles = PERMISSIONS[action] as readonly string[];
  return allowedRoles.includes(role);
}
