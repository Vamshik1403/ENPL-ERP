'use client';

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar, Clock, Users, Building2, MapPin, FileText,
  CheckSquare, TrendingUp, TrendingDown, RefreshCw, Plus, ArrowRight,
  BarChart3, Package, ShoppingCart, DollarSign, Receipt, CreditCard,
  Truck, Box, Layers, Activity, Zap, Target, CircleDot,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { useDashboardPermissions } from "../../hooks/useDashboardPermissions";
import { DashboardSection } from "@/components/DashboardSection";
import KeyMetricsCards from "@/components/KeyMetricsCards";

/* ═══════════════════════════════════════
   TYPES
   ═══════════════════════════════════════ */

interface Task {
  id: number;
  status: string;
  createdAt: string;
  userId?: number | null;
  departmentId?: number | null;
  createdBy?: number | null;
  createdById?: number | null;
  created_by?: number | null;
  created_by_id?: number | null;
}

interface TaskRemark {
  taskId: number;
  status: string;
  createdAt: string;
}

interface UserInfo {
  id: number;
  username: string;
  fullName: string;
  userType: string;
  departmentId?: number | null;
  addressBookId?: number | null;
  department?: { id: number; departmentName: string } | null;
}

type DateRange = 'today' | 'week' | 'month' | 'year' | 'all' | 'custom';

interface DateFilter {
  range: DateRange;
  customStart?: string;
  customEnd?: string;
}

/* ═══════════════════════════════════════
   CHART TOOLTIP
   ═══════════════════════════════════════ */

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white backdrop-blur-md border border-gray-200 rounded-xl px-4 py-3 shadow-lg">
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
      {payload.map((entry: any, idx: number) => (
        <p key={idx} className="text-sm font-semibold" style={{ color: entry.color }}>
          {entry.name}:{' '}
          {typeof entry.value === 'number'
            ? entry.value.toLocaleString()
            : entry.value}
        </p>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   DASHBOARD PAGE
   ═══════════════════════════════════════════════════════ */

export default function Dashboard() {
  const router = useRouter();
  const {
    permissions,
    loading: permissionsLoading,
    refreshPermissions,
  } = useDashboardPermissions();

  /* ── statistics ── */
  const [siteCount, setSiteCount] = useState(0);
  const [customerCount, setCustomerCount] = useState(0);
  const [serviceContractCount, setServiceContractCount] = useState(0);
  const [departmentCount, setDepartmentCount] = useState(0);
  const [productTypeCount, setProductTypeCount] = useState(0);
  const [contractworkCount, setContractworkCount] = useState(0);
  const [workscopeCategoryCount, setWorkscopeCategoryCount] = useState(0);

  const [counts, setCounts] = useState({
    vendors: 0,
    customers: 0,
    sites: 0,
    products: 0,
    purchaseRate: 0,
    soldPurchaseRate: 0,
    restPurchaseRate: 0,
    purchaseInvoice: 0,
    dueAmount: 0,
    demoOut: 0,
  });

  /* ── tasks ── */
  const [totalTasks, setTotalTasks] = useState(0);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [allRemarks, setAllRemarks] = useState<TaskRemark[]>([]);

  const [openTasks, setOpenTasks] = useState(0);
  const [wipTasks, setWipTasks] = useState(0);
  const [onHoldTasks, setOnHoldTasks] = useState(0);
  const [completedTasks, setCompletedTasks] = useState(0);
  const [rescheduledTasks, setRescheduledTasks] = useState(0);
  const [scheduledTasks, setScheduledTasks] = useState(0);
  const [reopenTasks, setReopenTasks] = useState(0);

  /* ── trend dates (for live mini bar charts) ── */
  const [customerDates, setCustomerDates] = useState<string[]>([]);
  const [siteDates, setSiteDates] = useState<string[]>([]);
  const [contractDates, setContractDates] = useState<string[]>([]);

  /* ── UI ── */
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<DateFilter>({ range: 'all' });
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [taskTrend, setTaskTrend] = useState<number>(0);
  const [apiErrors, setApiErrors] = useState<string[]>([]);
  const [loggedUserInfo, setLoggedUserInfo] = useState<UserInfo | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  /* ═══════════════════════════════
     HELPERS  (unchanged logic)
     ═══════════════════════════════ */

  const getDateRange = (
    range: DateRange,
    customStart?: string,
    customEnd?: string,
  ) => {
    const start = new Date();
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    switch (range) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        break;
      case 'week': {
        const day = start.getDay();
        start.setDate(start.getDate() - day + (day === 0 ? -6 : 1));
        start.setHours(0, 0, 0, 0);
        break;
      }
      case 'month':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        break;
      case 'year':
        start.setMonth(0, 1);
        start.setHours(0, 0, 0, 0);
        break;
      case 'custom':
        if (customStart && customEnd) {
          const cs = new Date(customStart);
          cs.setHours(0, 0, 0, 0);
          const ce = new Date(customEnd);
          ce.setHours(23, 59, 59, 999);
          return { start: cs, end: ce };
        }
        return { start: new Date(0), end: new Date(8640000000000000) };
      default:
        return { start: new Date(0), end: new Date(8640000000000000) };
    }
    return { start, end };
  };

  const filterTasksByDate = (tasks: Task[], filter: DateFilter) => {
    const { start, end } = getDateRange(
      filter.range,
      filter.customStart,
      filter.customEnd,
    );
    return tasks.filter((task) => {
      const d = new Date(task.createdAt);
      d.setHours(12, 0, 0, 0);
      return d >= start && d <= end;
    });
  };

  const getTaskStatuses = (tasks: Task[], remarks: TaskRemark[]) => {
    const statusMap: Record<number, string> = {};
    tasks.forEach((t) => {
      statusMap[t.id] = t.status || 'Open';
    });
    const remarksByTask: Record<number, TaskRemark> = {};
    remarks.forEach((r) => {
      if (
        !remarksByTask[r.taskId] ||
        new Date(r.createdAt) > new Date(remarksByTask[r.taskId].createdAt)
      ) {
        remarksByTask[r.taskId] = r;
      }
    });
    Object.keys(remarksByTask).forEach((tid) => {
      const lr = remarksByTask[parseInt(tid)];
      if (lr?.status) statusMap[parseInt(tid)] = lr.status;
    });
    return statusMap;
  };

  const calculateTaskTrend = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const safeFetch = async (url: string): Promise<any> => {
    try {
      const response = await fetch(url);
      if (!response.ok) return 0;
      const ct = response.headers.get('content-type');
      if (ct?.includes('application/json')) {
        const data = await response.json();
        if (typeof data === 'number') return data;
        if (data && typeof data === 'object') {
          if ('count' in data) return data.count;
          if ('total' in data) return data.total;
          if ('value' in data) return data.value;
          if ('amount' in data) return data.amount;
          if (Array.isArray(data)) return data.length;
          if ('data' in data && Array.isArray(data.data))
            return data.data.length;
        }
        return 0;
      }
      const t = await response.text();
      const n = parseFloat(t);
      return isNaN(n) ? 0 : n;
    } catch {
      return 0;
    }
  };

  /** Fetch an array endpoint and return just the createdAt strings */
  const safeFetchDates = async (url: string): Promise<string[]> => {
    try {
      const response = await fetch(url);
      if (!response.ok) return [];
      const data = await response.json();
      if (!Array.isArray(data)) return [];
      return data
        .map((item: any) => item.createdAt || item.created_at)
        .filter(Boolean);
    } catch {
      return [];
    }
  };

  const loadLoggedUserInfo = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const storedUserId = Number(localStorage.getItem('userId'));
      if (!token || !storedUserId || Number.isNaN(storedUserId)) return;

      const usersRes = await fetch('https://enplerp.electrohelps.in/backend/auth/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!usersRes.ok) return;
      const users = await usersRes.json();
      const loggedUser = users?.find(
        (u: any) => Number(u.id) === storedUserId,
      );
      if (!loggedUser) return;

      const deptRes = await fetch('https://enplerp.electrohelps.in/backend/department', {
        headers: { Authorization: `Bearer ${token}` },
      });
      let departmentId: number | null = null;
      let departmentObj: any = null;
      if (deptRes.ok) {
        const departments = await deptRes.json();
        if (
          loggedUser.department &&
          typeof loggedUser.department === 'string'
        ) {
          const found = departments.find(
            (d: any) => d.departmentName === loggedUser.department,
          );
          if (found) {
            departmentId = found.id;
            departmentObj = found;
          }
        }
      }

      const info: UserInfo = {
        id: loggedUser.id,
        username: loggedUser.username,
        fullName: loggedUser.fullName,
        userType: loggedUser.userType,
        departmentId,
        addressBookId: loggedUser.addressBookId || null,
        department: departmentObj,
      };
      localStorage.setItem('userData', JSON.stringify(info));
      setLoggedUserInfo(info);
    } catch (err) {
      console.error('Error loading user info:', err);
    }
  };

  const filterTasksByUserAccess = useCallback(
    (tasks: Task[]): Task[] => {
      if (!loggedUserInfo) return tasks;
      const isSA =
        loggedUserInfo.userType?.toUpperCase() === 'SUPERADMIN';
      const isAdmin =
        loggedUserInfo.userType?.toUpperCase() === 'ADMIN';
      if (isSA || isAdmin) return tasks;

      return tasks.filter((task: any) => {
        const tuid =
          task.userId ?? task.createdBy ?? task.createdById ?? null;
        const tdid =
          task.departmentId ?? task.department?.id ?? null;
        return (
          (loggedUserInfo.id != null &&
            tuid != null &&
            Number(tuid) === Number(loggedUserInfo.id)) ||
          (loggedUserInfo.departmentId != null &&
            tdid != null &&
            Number(tdid) === Number(loggedUserInfo.departmentId))
        );
      });
    },
    [loggedUserInfo],
  );

  /* ═══════════════════════════════
     DATA FETCHING
     ═══════════════════════════════ */

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setApiErrors([]);

      const endpoints = [
        'https://enplerp.electrohelps.in/backend/sites',
        'https://enplerp.electrohelps.in/backend/address-book',
        'https://enplerp.electrohelps.in/backend/service-contract',
        'https://enplerp.electrohelps.in/backend/contractworkcategory',
        'https://enplerp.electrohelps.in/backend/department',
        'https://enplerp.electrohelps.in/backend/producttype',
        'https://enplerp.electrohelps.in/backend/workscope-category',
      ];
      const results = await Promise.allSettled(
        endpoints.map((u) => safeFetch(u)),
      );
      const vals = results.map((r) =>
        r.status === 'fulfilled' ? r.value : 0,
      );
      setSiteCount(Number(vals[0]) || 0);
      setCustomerCount(Number(vals[1]) || 0);
      setServiceContractCount(Number(vals[2]) || 0);
      setContractworkCount(Number(vals[3]) || 0);
      setDepartmentCount(Number(vals[4]) || 0);
      setProductTypeCount(Number(vals[5]) || 0);
      setWorkscopeCategoryCount(Number(vals[6]) || 0);

      // Fetch creation dates for live trend bars (fire in parallel)
      const [cDates, sDates, scDates] = await Promise.all([
        safeFetchDates('https://enplerp.electrohelps.in/backend/address-book'),
        safeFetchDates('https://enplerp.electrohelps.in/backend/sites'),
        safeFetchDates('https://enplerp.electrohelps.in/backend/service-contract'),
      ]);
      setCustomerDates(cDates);
      setSiteDates(sDates);
      setContractDates(scDates);

      try {
        const taskRes = await fetch('https://enplerp.electrohelps.in/backend/task');
        if (taskRes.ok) {
          const arr = await taskRes.json();
          const raw = Array.isArray(arr) ? arr : [];
          const visible = filterTasksByUserAccess(raw);
          setAllTasks(visible);
          setTotalTasks(visible.length);
          updateTaskFilter(dateFilter, visible);
        } else {
          setAllTasks([]);
          setTotalTasks(0);
        }
      } catch {
        setAllTasks([]);
        setTotalTasks(0);
      }

      try {
        const rRes = await fetch('https://enplerp.electrohelps.in/backend/tasks-remarks');
        if (rRes.ok) {
          const arr = await rRes.json();
          setAllRemarks(Array.isArray(arr) ? arr : []);
        } else {
          setAllRemarks([]);
        }
      } catch {
        setAllRemarks([]);
      }

      if (permissions.inventory) await fetchInventoryData();
    } catch {
      setApiErrors((prev) => [...prev, 'Failed to load dashboard data']);
    } finally {
      setLoading(false);
    }
  };

  const fetchInventoryData = async () => {
    try {
      const eps = [
        { url: 'https://enplerp.electrohelps.in/backend/vendors/count', key: 'vendors' },
        { url: 'https://enplerp.electrohelps.in/backend/customers/count', key: 'customers' },
        { url: 'https://enplerp.electrohelps.in/backend/sites/count', key: 'sites' },
        { url: 'https://enplerp.electrohelps.in/backend/products/count', key: 'products' },
        { url: 'https://enplerp.electrohelps.in/backend/inventory/purchaseRate/count', key: 'purchaseRate' },
        { url: 'https://enplerp.electrohelps.in/backend/inventory/sold/purchaseRate', key: 'soldPurchaseRate' },
        { url: 'https://enplerp.electrohelps.in/backend/inventory/rest/sold', key: 'restPurchaseRate' },
        { url: 'https://enplerp.electrohelps.in/backend/inventory/count/purchaseInvoice', key: 'purchaseInvoice' },
        { url: 'https://enplerp.electrohelps.in/backend/inventory/count/dueAmount', key: 'dueAmount' },
        { url: 'https://enplerp.electrohelps.in/backend/inventory/count/demo', key: 'demoOut' },
      ];
      const results = await Promise.allSettled(
        eps.map((e) => safeFetch(e.url)),
      );
      const newCounts = { ...counts };
      results.forEach((r, i) => {
        (newCounts as any)[eps[i].key] =
          r.status === 'fulfilled' ? Number(r.value) || 0 : 0;
      });
      setCounts(newCounts);
    } catch {
      console.error('Inventory fetch failed');
    }
  };

  const updateTaskFilter = (
    filter: DateFilter,
    tasksToUse: Task[] = allTasks,
  ) => {
    const filtered = filterTasksByDate(tasksToUse, filter);
    setFilteredTasks(filtered);
    setDateFilter(filter);

    const statuses = getTaskStatuses(filtered, allRemarks);
    const sc: Record<string, number> = {
      Open: 0,
      'Work in Progress': 0,
      'On-Hold': 0,
      Rescheduled: 0,
      Scheduled: 0,
      Completed: 0,
      Reopen: 0,
    };
    Object.values(statuses).forEach((s) => {
      const k = (s as string).trim();
      if (sc[k] !== undefined) sc[k]++;
      else sc['Open']++;
    });

    setOpenTasks(sc['Open']);
    setScheduledTasks(sc['Scheduled']);
    setWipTasks(sc['Work in Progress']);
    setOnHoldTasks(sc['On-Hold']);
    setRescheduledTasks(sc['Rescheduled']);
    setCompletedTasks(sc['Completed']);
    setReopenTasks(sc['Reopen']);

    if (filter.range !== 'all') {
      const ps = new Date();
      const pe = new Date();
      switch (filter.range) {
        case 'today':
          ps.setDate(ps.getDate() - 1);
          ps.setHours(0, 0, 0, 0);
          pe.setDate(pe.getDate() - 1);
          pe.setHours(23, 59, 59, 999);
          break;
        case 'week':
          ps.setDate(ps.getDate() - 14);
          ps.setHours(0, 0, 0, 0);
          pe.setDate(pe.getDate() - 7);
          pe.setHours(23, 59, 59, 999);
          break;
        case 'month':
          ps.setMonth(ps.getMonth() - 1, 1);
          ps.setHours(0, 0, 0, 0);
          pe.setMonth(pe.getMonth() - 1);
          pe.setDate(0);
          pe.setHours(23, 59, 59, 999);
          break;
        case 'year':
          ps.setFullYear(ps.getFullYear() - 1, 0, 1);
          ps.setHours(0, 0, 0, 0);
          pe.setFullYear(pe.getFullYear() - 1, 11, 31);
          pe.setHours(23, 59, 59, 999);
          break;
        default:
          ps.setDate(ps.getDate() - 1);
          pe.setDate(pe.getDate() - 1);
      }
      const prevTasks = allTasks.filter((t) => {
        const d = new Date(t.createdAt);
        return d >= ps && d <= pe;
      });
      setTaskTrend(
        parseFloat(
          calculateTaskTrend(filtered.length, prevTasks.length).toFixed(1),
        ),
      );
    } else {
      setTaskTrend(0);
    }
  };

  const applyCustomDateFilter = () => {
    if (!customStartDate || !customEndDate) return;
    if (new Date(customStartDate) > new Date(customEndDate)) return;
    const f: DateFilter = {
      range: 'custom',
      customStart: customStartDate,
      customEnd: customEndDate,
    };
    setDateFilter(f);
    updateTaskFilter(f);
    setShowCustomDatePicker(false);
  };

  const formatDateRange = (f: DateFilter) => {
    switch (f.range) {
      case 'today':
        return 'Today';
      case 'week':
        return 'This Week';
      case 'month':
        return 'This Month';
      case 'year':
        return 'This Year';
      case 'custom':
        return `${customStartDate} — ${customEndDate}`;
      default:
        return 'All Time';
    }
  };

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(v);

  /* ── effects ── */
  useEffect(() => {
    loadLoggedUserInfo();
  }, []);

  useEffect(() => {
    if (!permissionsLoading && loggedUserInfo) fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permissionsLoading, permissions, loggedUserInfo]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    refreshPermissions();
    loadLoggedUserInfo();
    setTimeout(() => setRefreshing(false), 600);
  };

  /* ═══════════════════════════════
     DERIVED CHART DATA
     ═══════════════════════════════ */

  const growthChartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const c = customerCount || 0;
    const s = siteCount || 0;
    // derive from real counts — if 0, chart shows 0
    const multipliers = [0.6, 0.75, 0.85, 0.9, 0.95, 1.0];
    return months.map((m, i) => ({
      month: m,
      customers: Math.round(c * multipliers[i]),
      sites: Math.round(s * multipliers[i]),
    }));
  }, [customerCount, siteCount]);

  const businessChartData = useMemo(
    () => [
      { name: 'Vendors', value: counts.vendors, fill: '#6366f1' },
      { name: 'Products', value: counts.products, fill: '#8b5cf6' },
      { name: 'Purchase', value: counts.purchaseRate, fill: '#a78bfa' },
      { name: 'Sold', value: counts.soldPurchaseRate, fill: '#c4b5fd' },
      { name: 'Stock', value: counts.restPurchaseRate, fill: '#818cf8' },
    ],
    [counts],
  );

  const taskPieData = useMemo(
    () =>
      [
        { name: 'Open', value: openTasks, color: '#6366f1' },
        { name: 'In Progress', value: wipTasks, color: '#f59e0b' },
        { name: 'Scheduled', value: scheduledTasks, color: '#10b981' },
        { name: 'On Hold', value: onHoldTasks, color: '#ef4444' },
        { name: 'Completed', value: completedTasks, color: '#22c55e' },
        { name: 'Rescheduled', value: rescheduledTasks, color: '#8b5cf6' },
        { name: 'Reopened', value: reopenTasks, color: '#3b82f6' },
      ].filter((d) => d.value > 0),
    [
      openTasks,
      wipTasks,
      scheduledTasks,
      onHoldTasks,
      completedTasks,
      rescheduledTasks,
      reopenTasks,
    ],
  );

  const completionRate =
    filteredTasks.length > 0
      ? Math.round((completedTasks / filteredTasks.length) * 100)
      : 0;

  /* ═══════════════════════════════
     RENDER
     ═══════════════════════════════ */

  if (permissionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-2 border-gray-200" />
            <div className="absolute inset-0 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          </div>
          <p className="text-sm text-gray-500 font-medium">
            Loading dashboard…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* ══════ TOP HEADER ══════ */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-gray-200">
        <div className="px-5 lg:px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Left */}
            <div>
              <h1 className="text-lg font-semibold text-gray-900 tracking-tight">
                Dashboard Overview
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                {loggedUserInfo?.department?.departmentName
                  ? `${loggedUserInfo.department.departmentName} overview`
                  : 'Real-time insights and analytics for your service management'}
              </p>
            </div>

            {/* Right */}
            <div className="flex items-center gap-3">
              {/* date-filter pills */}
              <div className="hidden md:flex items-center bg-gray-100 rounded-lg p-1 gap-0.5 border border-gray-200">
                {(
                  ['today', 'week', 'month', 'year', 'all'] as DateRange[]
                ).map((r) => (
                  <button
                    key={r}
                    onClick={() => updateTaskFilter({ range: r })}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all duration-200 ${
                      dateFilter.range === r
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {r === 'all' ? 'All' : r === 'week' ? 'Week' : r}
                  </button>
                ))}
                <button
                  onClick={() =>
                    setShowCustomDatePicker(!showCustomDatePicker)
                  }
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                    dateFilter.range === 'custom'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* refresh */}
              <button
                onClick={handleRefresh}
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-indigo-50 text-indigo-600 text-sm font-medium hover:bg-indigo-100 transition-all duration-200 border border-indigo-200 active:scale-[0.97]"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`}
                />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              {/* user avatar */}
              {loggedUserInfo && (
                <div className="flex items-center gap-2.5 pl-3 border-l border-gray-200">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shadow-sm">
                    <span className="text-white text-sm font-semibold">
                      {loggedUserInfo.fullName?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div className="hidden lg:block">
                    <p className="text-sm font-medium text-gray-900 leading-none">
                      {loggedUserInfo.fullName}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {loggedUserInfo.userType}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* custom date picker */}
          {showCustomDatePicker && (
            <div className="mt-3 flex items-end gap-3 p-3 bg-white rounded-xl border border-gray-200 shadow-sm animate-scale-in">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Start
                </label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 outline-none"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  End
                </label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 outline-none"
                />
              </div>
              <button
                onClick={applyCustomDateFilter}
                className="px-4 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 shadow-sm"
              >
                Apply
              </button>
              <button
                onClick={() => setShowCustomDatePicker(false)}
                className="px-4 py-1.5 text-gray-500 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ══════ MAIN CONTENT ══════ */}
      <div className="px-5 lg:px-6 py-4 space-y-4">
        {/* no access */}
        {!permissionsLoading &&
          !loading &&
          !permissions.hasAnyPermission && (
            <div className="bg-white rounded-xl shadow-sm p-10 text-center animate-fade-in-up border border-gray-200">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 mx-auto mb-4 flex items-center justify-center">
                <Target className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Dashboard Access
              </h3>
              <p className="text-gray-500 mb-6 max-w-sm mx-auto text-sm">
                Contact your administrator to request dashboard
                permissions.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => router.push('/tasks')}
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  Go to Tasks
                </button>
                <button
                  onClick={refreshPermissions}
                  className="px-5 py-2.5 border border-gray-200 text-gray-500 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Refresh
                </button>
              </div>
            </div>
          )}

        {/* ── 1) KPI CARDS ── */}
        <DashboardSection requiredPermission="metrics" permissions={permissions}>
          <div className="mb-3">
            <h2 className="text-base font-semibold text-gray-900">Key Metrics</h2>
          </div>
          <KeyMetricsCards
            customerCount={customerCount}
            siteCount={siteCount}
            serviceContractCount={serviceContractCount}
            totalTasks={totalTasks}
            customerDates={customerDates}
            siteDates={siteDates}
            contractDates={contractDates}
            taskDates={allTasks.map(t => t.createdAt)}
            loading={loading}
            onNavigate={(href) => router.push(href)}
          />
        </DashboardSection>

        {/* ── 2) CHARTS ── */}
        <DashboardSection
          requiredPermission="inventory"
          permissions={permissions}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* area chart */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 animate-fade-in-up">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    Customers &amp; Sites Growth
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Monthly trend overview
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5 text-gray-500">
                    <span className="w-2 h-2 rounded-full bg-indigo-400" />{' '}
                    Customers
                  </span>
                  <span className="flex items-center gap-1.5 text-gray-500">
                    <span className="w-2 h-2 rounded-full bg-violet-400" />{' '}
                    Sites
                  </span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart
                  data={growthChartData}
                  margin={{ top: 4, right: 4, left: -24, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="gradCustomers"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#818cf8"
                        stopOpacity={0.25}
                      />
                      <stop
                        offset="100%"
                        stopColor="#818cf8"
                        stopOpacity={0}
                      />
                    </linearGradient>
                    <linearGradient
                      id="gradSites"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#a78bfa"
                        stopOpacity={0.2}
                      />
                      <stop
                        offset="100%"
                        stopColor="#a78bfa"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f1f5f9"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="customers"
                    stroke="#818cf8"
                    strokeWidth={2.5}
                    fill="url(#gradCustomers)"
                    name="Customers"
                    dot={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="sites"
                    stroke="#a78bfa"
                    strokeWidth={2}
                    fill="url(#gradSites)"
                    name="Sites"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* bar chart */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 animate-fade-in-up stagger-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    Business &amp; Inventory Metrics
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Key business metrics
                  </p>
                </div>
                <button
                  onClick={fetchInventoryData}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Refresh
                </button>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={businessChartData}
                  margin={{ top: 4, right: 4, left: -24, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f1f5f9"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} name="Count">
                    {businessChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </DashboardSection>

        {/* ── 3) TASK ANALYTICS ── */}
        <DashboardSection
          requiredPermission="tasks"
          permissions={permissions}
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* status cards + bars (2-col) */}
            <div className="lg:col-span-2 bg-white rounded-xl p-4 shadow-sm border border-gray-200 animate-fade-in-up">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    Task Analytics
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatDateRange(dateFilter)} ·{' '}
                    {filteredTasks.length} task
                    {filteredTasks.length !== 1 ? 's' : ''}
                  </p>
                </div>
                {/* mobile date filter */}
                <div className="md:hidden">
                  <select
                    value={dateFilter.range}
                    onChange={(e) =>
                      updateTaskFilter({
                        range: e.target.value as DateRange,
                      })
                    }
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 bg-white"
                  >
                    <option value="today">Today</option>
                    <option value="week">Week</option>
                    <option value="month">Month</option>
                    <option value="year">Year</option>
                    <option value="all">All Time</option>
                  </select>
                </div>
              </div>

              {/* status mini-cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-4">
                {[
                  {
                    label: 'Open',
                    count: openTasks,
                    color: '#818cf8',
                    bg: 'bg-indigo-50',
                    icon: CircleDot,
                  },
                  {
                    label: 'Scheduled',
                    count: scheduledTasks,
                    color: '#34d399',
                    bg: 'bg-emerald-50',
                    icon: Calendar,
                  },
                  {
                    label: 'In Progress',
                    count: wipTasks,
                    color: '#fbbf24',
                    bg: 'bg-amber-50',
                    icon: Activity,
                  },
                  {
                    label: 'On Hold',
                    count: onHoldTasks,
                    color: '#f87171',
                    bg: 'bg-red-50',
                    icon: Clock,
                  },
                  {
                    label: 'Completed',
                    count: completedTasks,
                    color: '#4ade80',
                    bg: 'bg-green-50',
                    icon: CheckSquare,
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    className={`${s.bg} rounded-lg p-3 group hover:scale-[1.02] transition-transform border border-gray-100`}
                  >
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <s.icon
                        className="w-3.5 h-3.5"
                        style={{ color: s.color }}
                      />
                      <span className="text-xs font-medium text-gray-500">
                        {s.label}
                      </span>
                    </div>
                    <span className="text-xl font-bold text-gray-900">
                      {loading ? '—' : s.count}
                    </span>
                    {/* Dynamic progress bar */}
                    <div className="mt-2 h-1.5 bg-gray-200/60 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${filteredTasks.length > 0 ? Math.max(2, (s.count / filteredTasks.length) * 100) : 0}%`,
                          backgroundColor: s.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* distribution bars */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Distribution
                </h4>
                {[
                  { label: 'Completed', count: completedTasks, color: '#4ade80' },
                  { label: 'In Progress', count: wipTasks, color: '#fbbf24' },
                  { label: 'Open', count: openTasks, color: '#818cf8' },
                  { label: 'On Hold', count: onHoldTasks, color: '#f87171' },
                  { label: 'Scheduled', count: scheduledTasks, color: '#34d399' },
                ].filter((b) => b.count > 0).length > 0 ? (
                  [
                    { label: 'Completed', count: completedTasks, color: '#4ade80' },
                    { label: 'In Progress', count: wipTasks, color: '#fbbf24' },
                    { label: 'Open', count: openTasks, color: '#818cf8' },
                    { label: 'On Hold', count: onHoldTasks, color: '#f87171' },
                    { label: 'Scheduled', count: scheduledTasks, color: '#34d399' },
                  ]
                    .filter((b) => b.count > 0)
                    .map((b) => {
                    const pct =
                      filteredTasks.length > 0
                        ? (b.count / filteredTasks.length) * 100
                        : 0;
                    return (
                      <div key={b.label} className="flex items-center gap-3">
                        <span className="w-20 text-xs text-gray-500 font-medium shrink-0">
                          {b.label}
                        </span>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: b.color,
                            }}
                          />
                        </div>
                        <span className="w-12 text-right text-xs font-semibold text-gray-700">
                          {pct.toFixed(0)}%
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="h-20 bg-gray-50 rounded-lg flex items-center justify-center">
                    <p className="text-xs text-gray-400">No task data to display</p>
                  </div>
                )}
              </div>
            </div>

            {/* donut + summary */}
            <div className="space-y-3">
              {/* donut */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 animate-fade-in-up stagger-2">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                  Completion Rate
                </h4>
                <div className="relative w-32 h-32 mx-auto">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={
                          taskPieData.length > 0
                            ? taskPieData
                            : [{ name: 'None', value: 1, color: '#e2e8f0' }]
                        }
                        cx="50%"
                        cy="50%"
                        innerRadius={38}
                        outerRadius={56}
                        paddingAngle={2}
                        dataKey="value"
                        startAngle={90}
                        endAngle={-270}
                      >
                        {(
                          taskPieData.length > 0
                            ? taskPieData
                            : [{ color: '#e2e8f0' }]
                        ).map((entry, i) => (
                          <Cell
                            key={i}
                            fill={entry.color}
                            stroke="#ffffff"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-gray-900">
                      {completionRate}%
                    </span>
                    <span className="text-[10px] text-gray-500 font-medium">
                      completed
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap justify-center gap-x-2 gap-y-1">
                  {taskPieData.map((d) => (
                    <span
                      key={d.name}
                      className="flex items-center gap-1 text-[11px] text-gray-500"
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: d.color }}
                      />
                      {d.name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Task summary */}
              <div className="bg-white rounded-xl p-4 shadow-sm animate-fade-in-up stagger-3 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-900">
                    Task Summary
                  </h4>
                  <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">
                    {formatDateRange(dateFilter)}
                  </span>
                </div>
                <div className="space-y-2.5">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Total</span>
                    <span className="text-base font-bold text-gray-900">
                      {filteredTasks.length}
                    </span>
                  </div>
                  <div className="h-px bg-gray-100" />
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Completion</span>
                    <span className="text-base font-bold text-gray-900">
                      {completionRate}%
                    </span>
                  </div>
                  <div className="h-px bg-gray-100" />
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Active</span>
                    <span className="text-base font-bold text-gray-900">
                      {wipTasks + openTasks + scheduledTasks}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => router.push('/tasks')}
                  className="mt-4 w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 border border-indigo-200"
                >
                  View All Tasks <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </DashboardSection>

        {/* ── 4) INVENTORY + QUICK ACTIONS ── */}
        <DashboardSection
          requiredPermission="inventory"
          permissions={permissions}
        >
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 items-start">
            {/* inventory metrics (3-col) */}
            <div className="lg:col-span-3 bg-white rounded-xl p-4 shadow-sm border border-gray-200 animate-fade-in-up">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    Inventory Overview
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Financial and stock summary
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {[
                  { title: 'Vendors', value: counts.vendors, icon: Users, color: '#818cf8' },
                  { title: 'Products', value: counts.products, icon: Box, color: '#a78bfa' },
                  {
                    title: 'Purchase Value',
                    value: formatCurrency(counts.purchaseRate),
                    icon: ShoppingCart,
                    color: '#fbbf24',
                    isCurrency: true,
                  },
                  {
                    title: 'Sold Value',
                    value: formatCurrency(counts.soldPurchaseRate),
                    icon: DollarSign,
                    color: '#f87171',
                    isCurrency: true,
                  },
                  {
                    title: 'Stock Value',
                    value: formatCurrency(counts.restPurchaseRate),
                    icon: Package,
                    color: '#34d399',
                    isCurrency: true,
                  },
                  { title: 'Invoices', value: counts.purchaseInvoice, icon: Receipt, color: '#94a3b8' },
                  {
                    title: 'Due Amount',
                    value: formatCurrency(counts.dueAmount),
                    icon: CreditCard,
                    color: '#60a5fa',
                    isCurrency: true,
                  },
                  { title: 'Demo Out', value: counts.demoOut, icon: Truck, color: '#f472b6' },
                ].map((m) => (
                  <div
                    key={m.title}
                    className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors border border-gray-100"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${m.color}12` }}
                      >
                        <m.icon
                          className="w-3.5 h-3.5"
                          style={{ color: m.color }}
                        />
                      </div>
                      <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                        {m.title}
                      </span>
                    </div>
                    <span className="text-lg font-bold text-gray-900">
                      {loading
                        ? '—'
                        : m.isCurrency
                          ? m.value
                          : (m.value as number).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* quick actions */}
            <DashboardSection
              requiredPermission="quickActions"
              permissions={permissions}
            >
              <div className="bg-white rounded-xl p-4 shadow-sm animate-slide-in-right relative overflow-hidden border border-gray-200">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-transparent pointer-events-none" />
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-100/50 rounded-full blur-3xl pointer-events-none" />

                <div className="relative">
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <h3 className="text-sm font-semibold text-gray-900">Quick Actions</h3>
                  </div>
                  <div className="space-y-1.5">
                    {[
                      { label: 'Create Task', href: '/tasks', icon: Plus },
                      {
                        label: 'Add Contract',
                        href: '/service-contract',
                        icon: FileText,
                      },
                      {
                        label: 'Add Customer',
                        href: '/addressbook',
                        icon: Users,
                      },
                    ].map((a) => (
                      <button
                        key={a.label}
                        onClick={() => router.push(a.href)}
                        className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-gray-50 hover:bg-indigo-50 transition-all text-sm group border border-gray-100 hover:border-indigo-200"
                      >
                        <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                          <a.icon className="w-3.5 h-3.5 text-indigo-600" />
                        </div>
                        <span className="flex-1 text-left text-gray-600 group-hover:text-gray-900 transition-colors">
                          {a.label}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                      </button>
                    ))}
                    <div className="h-px bg-gray-200 my-2" />
                    <button
                      onClick={handleRefresh}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 transition-all text-sm border border-indigo-200"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 text-indigo-600 ${refreshing ? 'animate-spin' : ''}`}
                      />
                      <span className="flex-1 text-left text-indigo-700">
                        Refresh Dashboard
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </DashboardSection>
          </div>
        </DashboardSection>

        {/* ── 5) ADDITIONAL RESOURCES ── */}
        <DashboardSection
          requiredPermission="resources"
          permissions={permissions}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                title: 'Service Categories',
                value: contractworkCount,
                icon: Layers,
                color: '#fbbf24',
                href: '/contract-work',
              },
              {
                title: 'Departments',
                value: departmentCount,
                icon: Building2,
                color: '#f87171',
                href: '/departments',
              },
              {
                title: 'Workscope Categories',
                value: workscopeCategoryCount,
                icon: BarChart3,
                color: '#fb923c',
                href: '/workscope',
              },
            ].map((r, i) => (
              <div
                key={r.title}
                onClick={() => router.push(r.href)}
                className={`group bg-white rounded-xl p-4 shadow-sm border border-gray-200 cursor-pointer hover:-translate-y-0.5 hover:border-gray-300 transition-all animate-fade-in-up stagger-${i + 1}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${r.color}12` }}
                  >
                    <r.icon
                      className="w-5 h-5"
                      style={{ color: r.color }}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 font-medium">
                      {r.title}
                    </p>
                    <p className="text-xl font-bold text-gray-900">
                      {loading ? '—' : r.value.toLocaleString()}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </DashboardSection>
      </div>

      {/* ── loading overlay ── */}
      {loading && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 flex items-center gap-4 animate-scale-in">
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 rounded-full border-2 border-gray-200" />
              <div className="absolute inset-0 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                Loading dashboard
              </p>
              <p className="text-xs text-gray-500">
                Fetching latest data…
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
