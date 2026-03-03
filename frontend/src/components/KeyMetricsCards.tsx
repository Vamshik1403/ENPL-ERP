'use client';

import React, { useMemo, useEffect, useRef, useState, useCallback } from 'react';
import { Users, MapPin, FileText, CheckSquare, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';

/* ═══════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════ */

interface KeyMetricsProps {
  customerCount: number;
  siteCount: number;
  serviceContractCount: number;
  totalTasks: number;
  customerDates: string[];
  siteDates: string[];
  contractDates: string[];
  taskDates: string[];
  loading: boolean;
  onNavigate: (href: string) => void;
}

interface MonthBucket {
  label: string;
  count: number;
}

/* ═══════════════════════════════════════════════════════
   UTILITY: group dates into monthly buckets
   ═══════════════════════════════════════════════════════ */

function buildMonthlyBuckets(dates: string[], months = 8): MonthBucket[] {
  const now = new Date();
  const labels: string[] = [];
  const counts: number[] = new Array(months).fill(0);

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    labels.push(d.toLocaleString('en', { month: 'short' }));
  }

  dates.forEach((ds) => {
    const dt = new Date(ds);
    const monthsAgo =
      (now.getFullYear() - dt.getFullYear()) * 12 +
      (now.getMonth() - dt.getMonth());
    const idx = months - 1 - monthsAgo;
    if (idx >= 0 && idx < months) counts[idx]++;
  });

  return labels.map((l, i) => ({ label: l, count: counts[i] }));
}

/** Compute cumulative running total from buckets */
function cumulativeBuckets(buckets: MonthBucket[]): number[] {
  let sum = 0;
  return buckets.map((b) => {
    sum += b.count;
    return sum;
  });
}

/** Trend: compare last month vs the one before */
function computeTrend(buckets: MonthBucket[]): { pct: number; direction: 'up' | 'down' | 'flat' } {
  if (buckets.length < 2) return { pct: 0, direction: 'flat' };
  const current = buckets[buckets.length - 1].count;
  const previous = buckets[buckets.length - 2].count;
  if (previous === 0) {
    return current > 0 ? { pct: 100, direction: 'up' } : { pct: 0, direction: 'flat' };
  }
  const pct = Math.round(((current - previous) / previous) * 100);
  return { pct: Math.abs(pct), direction: pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat' };
}

/* ═══════════════════════════════════════════════════════
   ANIMATED COUNT-UP HOOK
   ═══════════════════════════════════════════════════════ */

function useCountUp(target: number, duration = 800) {
  const [display, setDisplay] = useState(0);
  const raf = useRef<number | null>(null);
  const prev = useRef(0);

  useEffect(() => {
    const start = prev.current;
    const diff = target - start;
    if (diff === 0) return;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(start + diff * eased);
      setDisplay(value);
      if (progress < 1) {
        raf.current = requestAnimationFrame(tick);
      } else {
        prev.current = target;
      }
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current !== null) cancelAnimationFrame(raf.current); };
  }, [target, duration]);

  return display;
}

/* ═══════════════════════════════════════════════════════
   MICRO CHART 1: SMOOTH AREA (Customers)
   ═══════════════════════════════════════════════════════ */

function AreaMicroChart({ data, color }: { data: number[]; color: string }) {
  const w = 120, h = 48;
  const padY = 4;
  const max = Math.max(...data, 1);

  // Build smooth path using catmull-rom to bezier conversion
  const points = data.map((v, i) => ({
    x: (i / (data.length - 1)) * w,
    y: h - padY - (v / max) * (h - padY * 2),
  }));

  const buildSmoothPath = (pts: { x: number; y: number }[]) => {
    if (pts.length < 2) return '';
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(i - 1, 0)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(i + 2, pts.length - 1)];
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  };

  const linePath = buildSmoothPath(points);
  const areaPath = `${linePath} L ${w} ${h} L 0 ${h} Z`;
  const gradId = `area-grad-${color.replace('#', '')}`;
  const lastPt = points[points.length - 1];

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.15} />
          <stop offset="100%" stopColor={color} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`}>
        <animate attributeName="opacity" from="0" to="1" dur="0.6s" fill="freeze" />
      </path>
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="300"
        strokeDashoffset="300"
      >
        <animate attributeName="stroke-dashoffset" from="300" to="0" dur="1s" fill="freeze" calcMode="spline" keySplines="0.25 0.1 0.25 1" />
      </path>
      {lastPt && (
        <circle cx={lastPt.x} cy={lastPt.y} r="3" fill="white" stroke={color} strokeWidth="2">
          <animate attributeName="opacity" from="0" to="1" dur="0.3s" begin="0.8s" fill="freeze" />
        </circle>
      )}
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════
   MICRO CHART 2: STEP LINE (Sites)
   ═══════════════════════════════════════════════════════ */

function StepMicroChart({ data, color }: { data: number[]; color: string }) {
  const w = 120, h = 48;
  const padY = 6;
  const max = Math.max(...data, 1);

  const points = data.map((v, i) => ({
    x: (i / (data.length - 1)) * w,
    y: h - padY - (v / max) * (h - padY * 2),
  }));

  // Step path: horizontal then vertical
  let stepPath = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    stepPath += ` H ${points[i].x} V ${points[i].y}`;
  }

  const gradId = `step-grad-${color.replace('#', '')}`;
  const fillPath = `${stepPath} V ${h} H 0 Z`;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.08} />
          <stop offset="100%" stopColor={color} stopOpacity={0.01} />
        </linearGradient>
      </defs>
      <path d={fillPath} fill={`url(#${gradId})`}>
        <animate attributeName="opacity" from="0" to="1" dur="0.5s" fill="freeze" />
      </path>
      <path
        d={stepPath}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="300"
        strokeDashoffset="300"
      >
        <animate attributeName="stroke-dashoffset" from="300" to="0" dur="0.8s" fill="freeze" calcMode="spline" keySplines="0.25 0.1 0.25 1" />
      </path>
      {points.map((pt, i) => (
        <circle key={i} cx={pt.x} cy={pt.y} r="2.5" fill="white" stroke={color} strokeWidth="1.5">
          <animate attributeName="opacity" from="0" to="1" dur="0.2s" begin={`${0.3 + i * 0.08}s`} fill="freeze" />
        </circle>
      ))}
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════
   MICRO CHART 3: GRADIENT BARS (Service Contracts)
   ═══════════════════════════════════════════════════════ */

function GradientBarsMicroChart({ data, color }: { data: number[]; color: string }) {
  const w = 120, h = 48;
  const padY = 2;
  const max = Math.max(...data, 1);
  const barW = 8;
  const gap = (w - barW * data.length) / (data.length - 1 || 1);

  const gradId = `bar-grad-${color.replace('#', '')}`;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.9} />
          <stop offset="100%" stopColor={color} stopOpacity={0.35} />
        </linearGradient>
      </defs>
      {data.map((v, i) => {
        const barH = Math.max(3, (v / max) * (h - padY * 2));
        const x = i * (barW + gap);
        const y = h - padY - barH;
        return (
          <rect
            key={i}
            x={x}
            y={h}
            width={barW}
            height={0}
            rx={3}
            fill={`url(#${gradId})`}
            opacity={0.5 + (i / data.length) * 0.5}
          >
            <animate
              attributeName="y"
              from={h}
              to={y}
              dur={`${0.3 + i * 0.06}s`}
              fill="freeze"
              calcMode="spline"
              keySplines="0.25 0.1 0.25 1"
            />
            <animate
              attributeName="height"
              from="0"
              to={barH}
              dur={`${0.3 + i * 0.06}s`}
              fill="freeze"
              calcMode="spline"
              keySplines="0.25 0.1 0.25 1"
            />
          </rect>
        );
      })}
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════
   MICRO CHART 4: ACTIVITY BARS (Tasks)
   ═══════════════════════════════════════════════════════ */

function ActivityBarsMicroChart({ data, color }: { data: number[]; color: string }) {
  const w = 120, h = 48;
  const padY = 2;
  const max = Math.max(...data, 1);
  const barW = 10;
  const gap = (w - barW * data.length) / (data.length - 1 || 1);
  const lastIdx = data.length - 1;
  const glowId = `glow-${color.replace('#', '')}`;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <defs>
        <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {data.map((v, i) => {
        const barH = Math.max(3, (v / max) * (h - padY * 2));
        const x = i * (barW + gap);
        const y = h - padY - barH;
        const isLast = i === lastIdx;
        return (
          <g key={i}>
            <rect
              x={x}
              y={h}
              width={barW}
              height={0}
              rx={3}
              fill={color}
              opacity={isLast ? 1 : 0.35 + (i / data.length) * 0.45}
              filter={isLast ? `url(#${glowId})` : undefined}
            >
              <animate
                attributeName="y"
                from={h}
                to={y}
                dur={`${0.3 + i * 0.06}s`}
                fill="freeze"
                calcMode="spline"
                keySplines="0.25 0.1 0.25 1"
              />
              <animate
                attributeName="height"
                from="0"
                to={barH}
                dur={`${0.3 + i * 0.06}s`}
                fill="freeze"
                calcMode="spline"
                keySplines="0.25 0.1 0.25 1"
              />
            </rect>
            {/* subtle pulse on latest bar */}
            {isLast && (
              <rect
                x={x - 1}
                y={y - 1}
                width={barW + 2}
                height={barH + 2}
                rx={4}
                fill="none"
                stroke={color}
                strokeWidth="1"
                opacity="0"
              >
                <animate attributeName="opacity" values="0;0.4;0" dur="2s" repeatCount="indefinite" />
              </rect>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════
   TREND BADGE
   ═══════════════════════════════════════════════════════ */

function TrendBadge({ pct, direction, color }: { pct: number; direction: 'up' | 'down' | 'flat'; color: string }) {
  if (direction === 'flat') {
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-gray-400">
        — 0%
      </span>
    );
  }

  const isUp = direction === 'up';
  return (
    <span
      className="inline-flex items-center gap-0.5 text-[11px] font-semibold rounded-full px-1.5 py-0.5"
      style={{
        color: isUp ? '#059669' : '#dc2626',
        backgroundColor: isUp ? 'rgba(5,150,105,0.08)' : 'rgba(220,38,38,0.08)',
      }}
    >
      {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {pct}%
    </span>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */

export default function KeyMetricsCards({
  customerCount,
  siteCount,
  serviceContractCount,
  totalTasks,
  customerDates,
  siteDates,
  contractDates,
  taskDates,
  loading,
  onNavigate,
}: KeyMetricsProps) {

  /* ── monthly buckets ── */
  const customerBuckets = useMemo(() => buildMonthlyBuckets(customerDates, 8), [customerDates]);
  const siteBuckets     = useMemo(() => buildMonthlyBuckets(siteDates, 8), [siteDates]);
  const contractBuckets = useMemo(() => buildMonthlyBuckets(contractDates, 8), [contractDates]);
  const taskBuckets     = useMemo(() => buildMonthlyBuckets(taskDates, 8), [taskDates]);

  /* ── cumulative for area/step charts ── */
  const customerCumulative = useMemo(() => cumulativeBuckets(customerBuckets), [customerBuckets]);
  const siteCumulative     = useMemo(() => cumulativeBuckets(siteBuckets), [siteBuckets]);

  /* ── raw counts for bar charts ── */
  const contractCounts = useMemo(() => contractBuckets.map(b => b.count), [contractBuckets]);
  const taskCounts     = useMemo(() => taskBuckets.map(b => b.count), [taskBuckets]);

  /* ── trends ── */
  const customerTrend = useMemo(() => computeTrend(customerBuckets), [customerBuckets]);
  const siteTrend     = useMemo(() => computeTrend(siteBuckets), [siteBuckets]);
  const contractTrend = useMemo(() => computeTrend(contractBuckets), [contractBuckets]);
  const taskTrend     = useMemo(() => computeTrend(taskBuckets), [taskBuckets]);

  /* ── animated numbers ── */
  const animCustomer = useCountUp(loading ? 0 : customerCount);
  const animSite     = useCountUp(loading ? 0 : siteCount);
  const animContract = useCountUp(loading ? 0 : serviceContractCount);
  const animTask     = useCountUp(loading ? 0 : totalTasks);

  /* ── this week change ── */
  const thisWeekChange = useCallback((dates: string[]) => {
    const now = new Date();
    const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    return dates.filter((d) => new Date(d) >= weekAgo).length;
  }, []);

  const customerThisWeek = useMemo(() => thisWeekChange(customerDates), [customerDates, thisWeekChange]);
  const siteThisWeek     = useMemo(() => thisWeekChange(siteDates), [siteDates, thisWeekChange]);
  const contractThisWeek = useMemo(() => thisWeekChange(contractDates), [contractDates, thisWeekChange]);
  const taskThisWeek     = useMemo(() => thisWeekChange(taskDates), [taskDates, thisWeekChange]);

  const cards = [
    {
      key: 'customers',
      title: 'Customers',
      value: animCustomer,
      rawValue: customerCount,
      icon: Users,
      color: '#10B981',
      colorLight: 'rgba(16,185,129,0.08)',
      href: '/addressbook',
      subtitle: 'Total registered customers',
      thisWeek: customerThisWeek,
      trend: customerTrend,
      chart: <AreaMicroChart data={customerCumulative} color="#10B981" />,
    },
    {
      key: 'sites',
      title: 'Sites',
      value: animSite,
      rawValue: siteCount,
      icon: MapPin,
      color: '#6366F1',
      colorLight: 'rgba(99,102,241,0.08)',
      href: '/sites',
      subtitle: 'Customer locations',
      thisWeek: siteThisWeek,
      trend: siteTrend,
      chart: <StepMicroChart data={siteCumulative} color="#6366F1" />,
    },
    {
      key: 'contracts',
      title: 'Service Contracts',
      value: animContract,
      rawValue: serviceContractCount,
      icon: FileText,
      color: '#8B5CF6',
      colorLight: 'rgba(139,92,246,0.08)',
      href: '/service-contract',
      subtitle: 'Active agreements',
      thisWeek: contractThisWeek,
      trend: contractTrend,
      chart: <GradientBarsMicroChart data={contractCounts} color="#8B5CF6" />,
    },
    {
      key: 'tasks',
      title: 'Total Tasks',
      value: animTask,
      rawValue: totalTasks,
      icon: CheckSquare,
      color: '#F59E0B',
      colorLight: 'rgba(245,158,11,0.08)',
      href: '/tasks',
      subtitle: 'Your tasks',
      thisWeek: taskThisWeek,
      trend: taskTrend,
      chart: <ActivityBarsMicroChart data={taskCounts} color="#F59E0B" />,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => (
        <div
          key={card.key}
          onClick={() => onNavigate(card.href)}
          className="group relative bg-white rounded-xl cursor-pointer border border-gray-100 shadow-sm overflow-hidden"
          style={{
            animation: `metricFadeIn 0.5s ease-out ${idx * 0.08}s both`,
            transition: 'transform 0.3s ease-out, box-shadow 0.3s ease-out',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.06)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
          }}
        >
          {/* Top accent line */}
          <div className="h-[2px] w-full" style={{ backgroundColor: card.color, opacity: 0.6 }} />

          <div className="p-5 pb-3">
            {/* Header row: icon + title + arrow */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: card.colorLight }}
                >
                  <card.icon className="w-3.5 h-3.5" style={{ color: card.color }} />
                </div>
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
                  {card.title}
                </span>
              </div>
              <ArrowRight
                className="w-3.5 h-3.5 text-gray-200 group-hover:text-gray-400 transition-colors duration-300 group-hover:translate-x-0.5 transform"
              />
            </div>

            {/* Value row: number + trend */}
            <div className="flex items-end gap-2.5">
              <span className="text-3xl font-bold text-gray-900 leading-none tabular-nums">
                {loading ? (
                  <span className="inline-block w-10 h-8 bg-gray-100 rounded-md animate-pulse" />
                ) : (
                  card.value.toLocaleString()
                )}
              </span>
              {!loading && <TrendBadge {...card.trend} color={card.color} />}
            </div>

            {/* Subtitle with this-week count */}
            <div className="flex items-center gap-2 mt-1.5">
              <p className="text-xs text-gray-400">{card.subtitle}</p>
              {!loading && card.thisWeek > 0 && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ color: card.color, backgroundColor: card.colorLight }}>
                  +{card.thisWeek} this week
                </span>
              )}
            </div>
          </div>

          {/* Chart area */}
          <div
            className="px-5 pb-4 flex justify-end items-end transition-opacity duration-300 group-hover:opacity-100 opacity-80"
            style={{ minHeight: 52 }}
          >
            {card.chart}
          </div>
        </div>
      ))}

      {/* Keyframes */}
      <style jsx>{`
        @keyframes metricFadeIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
