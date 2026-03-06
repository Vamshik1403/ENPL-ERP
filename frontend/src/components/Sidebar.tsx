'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  LayoutDashboard,
  Users,
  User,
  MapPin,
  FileText,
  CheckSquare,
  Building,
  Package,
  ClipboardList,
  BarChart3,
  Settings,
  ChevronRight,
  User2,
  UserCheckIcon,
  LogOut,
  Menu,
  ChevronLeft,
  Warehouse,
  ShoppingCart,
  Layers,
  Package2,
  Receipt,
  Truck,
  CreditCard,
  FolderTree,
  Briefcase,
  Wrench,
  Shield,
  Database,
  Box,
  BarChart,
  Cog,
  Home,
  Contact,
  Store,
  FileCheck,
  FileBarChart,
  X,
  HardHat
} from 'lucide-react';

/* -------------------- Types -------------------- */

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  nested?: NavigationItem[];
  permissionKey: string;
}

interface PermissionSet {
  edit: boolean;
  read: boolean;
  create: boolean;
  delete: boolean;
}

interface AllPermissions {
  [key: string]: PermissionSet;
}

interface UserPermissionResponse {
  id: number;
  userId: number;
  permissions: {
    permissions: AllPermissions;
  };
  createdAt: string;
  updatedAt: string;
}

interface ExpandedSections {
  [key: string]: boolean;
}

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

/* -------------------- Icons Configuration -------------------- */

const iconProps = {
  size: 18,
  strokeWidth: 2,
  className: "flex-shrink-0"
};

/* -------------------- Menu Items Configuration -------------------- */

const mainNavigationItems: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard {...iconProps} />,
    permissionKey: 'DASHBOARD'
  },
  {
    name: 'Address Book',
    href: '/addressbook',
    icon: <Contact {...iconProps} />,
    permissionKey: 'ADDRESSBOOK',
    nested: [
      { 
        name: 'Customers', 
        href: '/addressbook', 
        icon: <User {...iconProps} />,
        permissionKey: 'CUSTOMERS'
      },
      { 
        name: 'Branches', 
        href: '/sites', 
        icon: <MapPin {...iconProps} />,
        permissionKey: 'SITES'
      },
      {
        name: 'Vendors',
        href: '/vendor',
        icon: <Store {...iconProps} />,
        permissionKey: 'VENDORS'
      },
      { 
        name: 'Customer Self Portal', 
        href: '/customer-registration', 
        icon: <User2 {...iconProps} />,
        permissionKey: 'CUSTOMER_REGISTRATION'
      }
    ]
  },
  {
    name: 'Inventory Management',
    href: '/category',
    icon: <Warehouse {...iconProps} />,
    permissionKey: 'INVENTORY MANAGEMENT',
    nested: [
      { 
        name: 'Categories', 
        href: '/category', 
        icon: <FolderTree {...iconProps} />,
        permissionKey: 'CATEGORIES'
      },
      { 
        name: 'Subcategories', 
        href: '/subCategory', 
        icon: <Layers {...iconProps} />,
        permissionKey: 'SUBCATEGORIES'
      },
      { 
        name: 'Products SKU', 
        href: '/products-sku', 
        icon: <Package2 {...iconProps} />,
        permissionKey: 'PRODUCTS_SKU'
      },
      {
        name: 'Inventory',
        href: '/inventory',
        icon: <Database {...iconProps} />,
        permissionKey: 'INVENTORY',
      },
      {
        name: 'Purchase Invoice',
        href: '/purchase-invoice',
        icon: <Receipt {...iconProps} />,
        permissionKey: 'PURCHASE_INVOICE'
      },
      {
        name: 'Material Outward',
        href: '/material',
        icon: <Truck {...iconProps} />,
        permissionKey: 'MATERIAL_OUTWARD'
      },
      {
        name: 'Vendors Payments',
        href: '/vendorPayment',
        icon: <CreditCard {...iconProps} />,
        permissionKey: 'VENDORS_PAYMENTS'
      }
    ]
  },
  { 
    name: 'Tasks', 
    href: '/tasks', 
    icon: <CheckSquare {...iconProps} />,
    permissionKey: 'TASKS'
  },
  {
    name: 'Engineers',
    href: '/engineers',
    icon: <HardHat {...iconProps} />,
    permissionKey: 'ENGINEERS'
  },
  { 
    name: 'Service Contracts', 
    href: '/service-contract', 
    icon: <FileCheck {...iconProps} />,
    permissionKey: 'SERVICE_CONTRACTS'
  },
];

const setupItems: NavigationItem[] = [
  { 
    name: 'Departments', 
    href: '/departments', 
    icon: <Building {...iconProps} />,
    permissionKey: 'DEPARTMENTS'
  },
  { 
    name: 'Service Category', 
    href: '/contract-work', 
    icon: <ClipboardList {...iconProps} />,
    permissionKey: 'SERVICE_CATEGORY'
  },
  { 
    name: 'WorkScope Category', 
    href: '/workscope', 
    icon: <Wrench {...iconProps} />,
    permissionKey: 'WORKSCOPE_CATEGORY'
  },
  { 
    name: 'Users Permission', 
    href: '/userpermission', 
    icon: <Shield {...iconProps} />,
    permissionKey: 'USERS'
  }
];

/* -------------------- Mobile Sidebar Component -------------------- */

export default function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // User info
  const [clientFullName, setClientFullName] = useState("User");
  const [clientUserType, setClientUserType] = useState("");
  const [userId, setUserId] = useState<number | null>(null);

  // ✅ SUPERADMIN flag
  const isSuperAdmin = clientUserType === "SUPERADMIN";
  
  // Permissions state
  const [allPermissions, setAllPermissions] = useState<AllPermissions>({});
  const [loadingPermissions, setLoadingPermissions] = useState(true);

  // Collapse Sections
  const [expandedSections, setExpandedSections] = useState<ExpandedSections>({
    addressbook: true,
    inventorymanagement: true,
    setup: true
  });

  // Check for mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      // On mobile, always show burger icon and collapse sidebar
      if (window.innerWidth < 768) {
        setIsCollapsed(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, [setIsCollapsed]);

  useEffect(() => {
    const name = localStorage.getItem("fullName");
    const type = localStorage.getItem("userType");
    const storedUserId = localStorage.getItem("userId");

    if (name) setClientFullName(name);
    if (type) setClientUserType(type);
    if (storedUserId) {
      setUserId(parseInt(storedUserId));
    }
  }, []);

  // 🔹 Fetch permissions with dynamic userId
  const fetchPermissions = async () => {
    try {
      // ✅ If SUPERADMIN → show all links, no need to fetch permissions
      if (isSuperAdmin) {
        setAllPermissions({});
        setLoadingPermissions(false);
        return;
      }

      const storedUserId = localStorage.getItem("userId");
      
      if (!storedUserId) {
        console.warn('No user ID found in localStorage');
        setLoadingPermissions(false);
        return;
      }

      const userId = parseInt(storedUserId);
      
      // Fetch permissions for specific user
      const res = await fetch(`http://localhost:8000/user-permissions/${userId}`);
      
      if (!res.ok) {
        console.warn(`Failed to fetch permissions for user ${userId}, using default`);
        setAllPermissions({});
        return;
      }

      const contentType = res.headers.get("content-type") || "";
      const rawText = await res.text();

      if (!rawText) {
        console.warn(`Empty response body for user ${userId} permissions`);
        setAllPermissions({});
        return;
      }

      if (!contentType.includes("application/json")) {
        console.warn(`Non-JSON response for user ${userId} permissions:`, rawText);
        setAllPermissions({});
        return;
      }

      let data: UserPermissionResponse | null = null;
      try {
        data = JSON.parse(rawText) as UserPermissionResponse;
      } catch (e) {
        console.warn(`Invalid JSON response for user ${userId} permissions:`, rawText);
        setAllPermissions({});
        return;
      }

      if (data && data.permissions && data.permissions.permissions) {
        const perms = data.permissions.permissions;
        setAllPermissions(perms);
        console.log('✅ Loaded permissions:', perms);
      } else {
        console.warn('Invalid permissions data structure:', data);
        setAllPermissions({});
      }
    } catch (err) {
      console.error('❌ Error fetching sidebar permissions:', err);
      setAllPermissions({});
    } finally {
      setLoadingPermissions(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, [userId, isSuperAdmin]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getSectionKey = (itemName: string): string =>
    itemName.toLowerCase().replace(/\s/g, '');

  const isActive = (href: string) => pathname === href;
  const isActiveParent = (nested?: NavigationItem[]) =>
    nested?.some(item => pathname === item.href);

  // 🔹 Check if user has read permission for a menu item
  const hasReadPermission = (permissionKey: string): boolean => {
    // ✅ SUPERADMIN sees everything
    if (isSuperAdmin) return true;

    if (loadingPermissions) return false;
    
    const permission = allPermissions[permissionKey];
    if (!permission) {
      console.warn(`No permission found for key: ${permissionKey}`);
      return false;
    }
    
    return permission.read === true;
  };

  // 🔹 Filter navigation items based on read permission
  const filterNavigationItems = (items: NavigationItem[]): NavigationItem[] => {
    // ✅ SUPERADMIN: show all without filtering
    if (isSuperAdmin) return items;

    return items
      .map(item => {
        // Handle nested items first
        if (item.nested && item.nested.length > 0) {
          const filteredNested = filterNavigationItems(item.nested);

          // If parent has NO read permission but children do → show children ONLY
          if (!hasReadPermission(item.permissionKey)) {
            return filteredNested.length > 0
              ? { ...item, nested: filteredNested }
              : null;
          }

          // Parent has permission → show with filtered children
          return filteredNested.length > 0
            ? { ...item, nested: filteredNested }
            : hasReadPermission(item.permissionKey)
            ? item
            : null;
        }

        // Non-nested item → normal permission check
        return hasReadPermission(item.permissionKey) ? item : null;
      })
      .filter(Boolean) as NavigationItem[];
  };

  // 🔹 Render navigation item with enhanced UI
  const renderNavigationItem = (item: NavigationItem, level = 0) => {
    const hasNested = !!item.nested?.length;
    const isActiveItem = isActive(item.href);
    const isParentActive = hasNested && isActiveParent(item.nested);
    const sectionKey = getSectionKey(item.name);

    return (
      <div key={`${item.href}-${level}`} className={`${level > 0 ? "ml-1" : ""}`}>
        {hasNested ? (
          <>
            <button
              onClick={() => toggleSection(sectionKey)}
              className={`
                flex items-center w-full py-2.5 px-3 rounded-xl text-sm transition-all duration-200
                group relative
                ${isParentActive || isActiveItem
                  ? "bg-indigo-50 text-indigo-700 font-semibold"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}
              `}
            >
              <span className="mr-3">{item.icon}</span>
              {(!isCollapsed || isMobile) && <span className="flex-1 text-left font-medium">{item.name}</span>}
              {(!isCollapsed || isMobile) && (
                <ChevronRight
                  className={`w-4 h-4 transition-transform duration-200 text-gray-400 ${
                    expandedSections[sectionKey] ? "rotate-90" : ""
                  }`}
                />
              )}
            </button>

            {(!isCollapsed || isMobile) && (
              <div
                className={`
                  ml-6 pl-3 border-l border-gray-200 overflow-hidden transition-all duration-300 ease-out
                  ${expandedSections[sectionKey] ? "max-h-96 opacity-100 mt-1" : "max-h-0 opacity-0"}
                `}
              >
                <div className="space-y-0.5">
                  {item.nested?.map((n) => (
                    <div key={n.href}>
                      {renderNavigationItem(n, level + 1)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <Link
            href={item.href}
            onClick={() => isMobile && setIsMobileOpen(false)}
            className={`
              flex items-center py-2.5 px-3 rounded-xl text-sm transition-all duration-200
              group
              ${isActiveItem
                ? "bg-white text-gray-900 shadow-sm font-semibold"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}
            `}
          >
            <span className="mr-3">{item.icon}</span>
            {(!isCollapsed || isMobile) && (
              <span className="font-medium flex-1 text-left">
                {item.name}
              </span>
            )}
            {(!isCollapsed || isMobile) && isActiveItem && (
              <div className="ml-2 w-1.5 h-1.5 bg-indigo-600 rounded-full"></div>
            )}
          </Link>
        )}
      </div>
    );
  };

  // 🔹 Filter all menu items based on permissions
  const filteredMainItems = filterNavigationItems(mainNavigationItems);
  const filteredSetupItems = filterNavigationItems(setupItems);

  // 🔹 Check if any Setup items are visible
  const hasVisibleSetupItems = filteredSetupItems.length > 0;

  // 🔹 Show loading state
  if (loadingPermissions) {
    return (
      <>
        {isMobile && (
          <button
            onClick={() => setIsMobileOpen(true)}
            className="md:hidden fixed top-4 left-4 z-40 p-2.5 rounded-xl bg-white text-gray-700 shadow-md border border-gray-200"
          >
            <Menu size={22} />
          </button>
        )}

        <div className={`
          bg-[#f8fafc] text-gray-700
          ${isCollapsed ? "w-16" : "w-56"}
          ${isMobile ? (isMobileOpen ? "fixed inset-0 z-50 w-56" : "hidden") : "fixed"}
          h-screen left-0 top-0 z-30 border-r border-gray-200
          transition-all duration-300 shadow-sm
        `}>
          <div className="px-4 py-4 border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 animate-pulse"></div>
                {(!isCollapsed || isMobile) && (
                  <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
                )}
              </div>
              {isMobile && (
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 md:hidden"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              )}
            </div>
          </div>
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <div className="w-10 h-10 border-3 border-gray-200 border-t-indigo-500 rounded-full animate-spin"></div>
            {(!isCollapsed || isMobile) && (
              <div className="text-center">
                <p className="text-sm text-gray-500">Loading permissions...</p>
                <p className="text-xs text-gray-400 mt-1">Please wait</p>
              </div>
            )}
          </div>
        </div>

        {isMobile && isMobileOpen && (
          <div 
            className="fixed inset-0 bg-black/30 z-40 md:hidden backdrop-blur-sm"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </>
    );
  }

  return (
    <>
      {/* Mobile Burger Button */}
      {isMobile && !isMobileOpen && (
        <button
          onClick={() => setIsMobileOpen(true)}
          className="md:hidden fixed top-4 left-4 z-40 p-2.5 rounded-xl bg-white text-gray-700 shadow-md border border-gray-200 hover:shadow-lg transition-all duration-200"
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>
      )}

      {/* Sidebar */}
      <div
        className={`
          bg-[#f8fafc] text-gray-700
          ${isCollapsed && !isMobile ? "w-16" : "w-56"}
          ${isMobile ? (isMobileOpen ? "fixed inset-y-0 left-0 z-50 w-56" : "hidden") : "fixed"}
          h-screen left-0 top-0 z-30 border-r border-gray-200
          transition-all duration-300 shadow-sm flex flex-col
        `}
      >
        {/* Header with Collapse Toggle */}
        <div className="px-4 py-4 border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-sm">E</span>
              </div>
              {(!isCollapsed || isMobile) && (
                <h1 className="font-bold text-xl text-gray-900 tracking-tight">
                  ENPL ERP
                </h1>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isMobile ? (
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                  aria-label="Close menu"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              ) : (
                <button
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                  title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                  aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                  {isCollapsed ? (
                    <Menu size={20} className="text-gray-500" />
                  ) : (
                    <ChevronLeft size={20} className="text-gray-500" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable Menu Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 custom-scrollbar">
          <div className="space-y-1">
            {/* Main Navigation Items */}
            {filteredMainItems.length > 0 && (
              <div className="mb-4">
                {(!isCollapsed || isMobile) && (
                  <div className="px-3 mb-2">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Main</p>
                  </div>
                )}
                <div className="space-y-1">
                  {filteredMainItems.map(item => renderNavigationItem(item))}
                </div>
              </div>
            )}

            {/* Setup Section */}
            {hasVisibleSetupItems && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                {(!isCollapsed || isMobile) && (
                  <div className="px-3 mb-2">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Settings</p>
                  </div>
                )}
                <button
                  onClick={() => toggleSection("setup")}
                  className={`
                    flex items-center w-full py-2.5 px-3 rounded-xl text-sm transition-all duration-200
                    group
                    ${filteredSetupItems.some(it => isActive(it.href))
                      ? "bg-indigo-50 text-indigo-700 font-semibold"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}
                  `}
                >
                  <Cog size={18} strokeWidth={2} className="mr-3" />
                  {(!isCollapsed || isMobile) && <span className="flex-1 text-left font-medium">System Setup</span>}
                  {(!isCollapsed || isMobile) && (
                    <ChevronRight
                      className={`w-4 h-4 transition-transform duration-200 text-gray-400 ${
                        expandedSections.setup ? "rotate-90" : ""
                      }`}
                    />
                  )}
                </button>

                {(!isCollapsed || isMobile) && (
                  <div
                    className={`
                      ml-6 pl-3 border-l border-gray-200 overflow-hidden transition-all duration-300 ease-out
                      ${expandedSections.setup ? "max-h-80 opacity-100 mt-1" : "max-h-0 opacity-0"}
                    `}
                  >
                    <div className="space-y-0.5">
                      {filteredSetupItems.map((item) => (
                        <div key={item.href}>
                          {renderNavigationItem(item, 1)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* User Profile Footer */}
        <div
          className={`
            border-t border-gray-200 bg-white/80 backdrop-blur-sm p-3
            ${(isCollapsed && !isMobile) ? "px-2" : "px-3"}
            transition-all duration-200
          `}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-indigo-600 text-white font-semibold text-xs shadow-sm flex-shrink-0">
              {clientFullName.charAt(0).toUpperCase()}
            </div>

            {(!isCollapsed || isMobile) && (
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="leading-tight">
                    <div className="font-semibold text-sm text-gray-900 truncate">{clientFullName}</div>
                    <div className="text-xs text-gray-500 capitalize">{clientUserType}</div>
                  </div>
                  <div className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md font-medium">
                    ID: {userId}
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = "/login";
            }}
            className={`
              mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-xl
              bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600
              font-medium transition-all duration-200 border border-gray-200 hover:border-red-200
              group
              ${(isCollapsed && !isMobile) ? "text-xs p-2" : "text-sm"}
            `}
          >
            <LogOut size={16} className={isCollapsed && !isMobile ? "" : "group-hover:-translate-x-0.5 transition-transform"} />
            {(!isCollapsed || isMobile) && "Logout"}
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobile && isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    
    </>
  );
}