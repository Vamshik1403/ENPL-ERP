'use client';

import { DashboardPermissions } from '../app/hooks/useDashboardPermissions';

interface DashboardSectionProps {
  children: React.ReactNode;
  requiredPermission: keyof DashboardPermissions;
  permissions: DashboardPermissions;
  fallback?: React.ReactNode;
  className?: string;
}

export function DashboardSection({ 
  children, 
  requiredPermission, 
  permissions, 
  fallback,
  className = ''
}: DashboardSectionProps) {
  // If no permissions yet, don't show anything
  if (!permissions || !permissions.hasOwnProperty(requiredPermission)) {
    return null;
  }
  
  // Check if user has the required permission
  const hasPermission = permissions[requiredPermission];
  
  if (!hasPermission) {
    if (fallback) {
      return <div className={className}>{fallback}</div>;
    }
    return null;
  }
  
  return <div className={className}>{children}</div>;
}

// Optional: Create a permission badge for testing
export function PermissionBadge({ permission, permissions }: { 
  permission: keyof DashboardPermissions; 
  permissions: DashboardPermissions 
}) {
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
      permissions[permission] 
        ? 'bg-green-100 text-green-800' 
        : 'bg-red-100 text-red-800'
    }`}>
      {permission}: {permissions[permission] ? 'Granted' : 'Denied'}
    </span>
  );
}