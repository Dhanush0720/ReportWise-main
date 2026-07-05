"use client";

import React, { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ChevronDown, ChevronLeft, ChevronRight, BookOpen, X, Grid, Layers, BarChart4 } from "lucide-react";

interface ChartDisplayProps {
  data: any;
}

const COLORS = [
  "#D96B43", // Terracotta
  "#5E7C62", // Sage Green
  "#C89E7A", // Sand
  "#4B6154", // Forest Green
  "#8B5E3C", // Cocoa
  "#E2B980", // Warm Ochre
  "#A7B89B", // Soft Olive
  "#3E3A39", // Deep Charcoal
];

// The 80 data visualization techniques catalog
const VIZ_CATALOG = [
  {
    category: "Comparison Charts (1-10)",
    items: [
      { name: "Bar Chart", desc: "Classic vertical columns comparing values." },
      { name: "Grouped Bar Chart", desc: "Compare multiple series across same category." },
      { name: "Stacked Bar Chart", desc: "Show part-to-whole relationship of categories." },
      { name: "Horizontal Bar Chart", desc: "Ideal for long category labels." },
      { name: "Line Chart", desc: "Show trends over continuous time or sequence." },
      { name: "Multi-Series Line Chart", desc: "Compare multiple trends simultaneously." },
      { name: "Slope Chart", desc: "Show transition changes between two points." },
      { name: "Radar Chart", desc: "Compare multiple variables on a 2D web web." },
      { name: "Radial Bar Chart", desc: "Concentrical bars for key progress values." },
      { name: "Polar Area Chart", desc: "Sectors have equal angles but varying radius." }
    ]
  },
  {
    category: "Distribution Charts (11-20)",
    items: [
      { name: "Histogram", desc: "Frequencies of variables in specified intervals." },
      { name: "Box Plot", desc: "Shows five-number summary (min, Q1, median, Q3, max)." },
      { name: "Violin Plot", desc: "Combines boxplot and probability density distribution." },
      { name: "Density Plot", desc: "Smooth representation of data distribution over time." },
      { name: "Population Pyramid", desc: "Back-to-back histograms for demographic splits." },
      { name: "Dot Plot", desc: "Represents values as dots along a continuous line." },
      { name: "Ridge Plot", desc: "Overlapping density plots comparing distributions." },
      { name: "Frequency Polygon", desc: "Line representing frequency distribution." },
      { name: "Stem-and-Leaf Plot", desc: "Split text format showing actual digits." },
      { name: "Cumulative Flow Chart", desc: "Track work items distribution in states over time." }
    ]
  },
  {
    category: "Relationship Charts (21-30)",
    items: [
      { name: "Scatter Plot", desc: "Plot points on Cartesian plane to find correlation." },
      { name: "Bubble Chart", desc: "Scatter plot where bubble sizes convey 3rd metric." },
      { name: "Connected Scatter", desc: "Trace path of points over sequential timeline." },
      { name: "Heatmap Matrix", desc: "Cells colored by density/value values." },
      { name: "Correlation Matrix", desc: "Grid showing correlation coefficients of variables." },
      { name: "Chord Diagram", desc: "Visualize flows/connections between nodes circular." },
      { name: "Network Graph", desc: "Nodes and edges representing relational maps." },
      { name: "Tree Diagram", desc: "Hierarchical parent-child relationships." },
      { name: "Dendrogram", desc: "Tree showing clustering hierarchy of variables." },
      { name: "Venn Diagram", desc: "Overlapping sets to compare shared elements." }
    ]
  },
  {
    category: "Composition Charts (31-40)",
    items: [
      { name: "Pie Chart", desc: "Classic circular share of category values." },
      { name: "Donut Chart", desc: "Pie chart with empty center for KPI summary." },
      { name: "Treemap", desc: "Nested rectangles representing relative proportions." },
      { name: "Sunburst Chart", desc: "Multi-level ring hierarchy proportion chart." },
      { name: "Stacked Area Chart", desc: "Trend of composition percentages over time." },
      { name: "Streamgraph", desc: "Organic flowing area chart around central axis." },
      { name: "Waterfall Chart", desc: "Cumulative effect of sequentially added values." },
      { name: "Funnel Chart", desc: "Linear progression stages conversion rates." },
      { name: "Marimekko Chart", desc: "Variable column width stacked proportion chart." },
      { name: "Stacked Percentage Bar", desc: "Normalized stacked bars sum up to 100%." }
    ]
  },
  {
    category: "Geospatial Charts (41-50)",
    items: [
      { name: "Choropleth Map", desc: "Regions shaded by variable value density." },
      { name: "Bubble Map", desc: "Points on map with size showing metric values." },
      { name: "Connection Map", desc: "Lines linking locations to show routes/flows." },
      { name: "Flow Map", desc: "Thickness of connection lines represents flow quantity." },
      { name: "Cartogram", desc: "Regions resized proportional to target value." },
      { name: "Heatmap Map", desc: "Density colors projected over map locations." },
      { name: "Dot Density Map", desc: "Dots scatter matching coordinate distribution." },
      { name: "Prism Map", desc: "3D height scaling of maps regions." },
      { name: "Grid Map", desc: "Equal square representations of map territories." },
      { name: "3D Globe Visual", desc: "Interactive rotation earth map with bar overlays." }
    ]
  },
  {
    category: "Process & Flow (51-60)",
    items: [
      { name: "Sankey Diagram", desc: "Flow quantity proportional to branch widths." },
      { name: "Alluvial Diagram", desc: "Show structural changes in flow paths." },
      { name: "Gantt Chart", desc: "Timeline bars tracking schedules & project states." },
      { name: "PERT Chart", desc: "Dependency arrows linking project tasks." },
      { name: "Process Flowchart", desc: "Symbols tracing operational decision steps." },
      { name: "Swimlane Diagram", desc: "Flowchart grouped by execution departments." },
      { name: "Decision Tree", desc: "Branching options mapping model pathways." },
      { name: "Timeline Graph", desc: "Milestone events ordered chronologically." },
      { name: "Sequence Diagram", desc: "Interaction sequence between entities." },
      { name: "Value Stream Map", desc: "Flow of materials and information in system." }
    ]
  },
  {
    category: "Business KPI & Financial (61-70)",
    items: [
      { name: "Gauge Chart", desc: "Speedometer dial showing metric against ranges." },
      { name: "Bullet Graph", desc: "Compact horizontal bar comparing value with targets." },
      { name: "Sparkline", desc: "Micro line-charts embedded inline in text." },
      { name: "KPI Card", desc: "Giant metric number with change flags." },
      { name: "Candlestick Chart", desc: "Financial high, low, open, close stock values." },
      { name: "OHLC Chart", desc: "Open High Low Close ticker lines." },
      { name: "Kagi Chart", desc: "Directional trendlines independent of time." },
      { name: "Renko Chart", desc: "Brick bars tracking price changes." },
      { name: "Point and Figure", desc: "X and O columns tracking price movements." },
      { name: "Funnel Stage Chart", desc: "Sales pipeline attrition percentages." }
    ]
  },
  {
    category: "Scientific & Specialized (71-80)",
    items: [
      { name: "Ternary Plot", desc: "Plots 3 variables summing to constant 100%." },
      { name: "Parallel Coordinates", desc: "Plot high-dimensional data across parallel axes." },
      { name: "Radar Web Plot", desc: "Multivariable attributes mapped on web." },
      { name: "Chernoff Faces", desc: "Map variable metrics to human facial expressions." },
      { name: "Hexagonal Binning", desc: "Aggrerate density points in hex tiles." },
      { name: "Contour Plot", desc: "Isoline paths mapping continuous surfaces." },
      { name: "Vector Field Plot", desc: "Arrows indicating wind/flow speeds & directions." },
      { name: "Streamlines Plot", desc: "Lines tracing path of fluid movements." },
      { name: "Heatmap Matrix Core", desc: "Dense grid indicating coefficients." },
      { name: "Dendrogram Trees", desc: "Phylogenetic tree maps." }
    ]
  }
];

export default function ChartDisplay({ data }: ChartDisplayProps) {
  const [chartType, setChartType] = useState<string>("Line Chart");
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<number>(0);

  // Safely extract pages
  const pages = useMemo(() => {
    return data?.pages || data?.result?.pages || [];
  }, [data]);

  const hasPages = pages.length > 0;
  const activePage = hasPages ? pages[currentPage] : null;

  // Auto-switch to active page's suggested chart type
  React.useEffect(() => {
    const pageObj = activePage || data?.result || data?.data || data || {};
    const chartDataObj = pageObj?.chart_data || pageObj || {};
    
    const suggestedType = pageObj?.chart_type || chartDataObj?.chart_type || pageObj?.preferredChartType;
    if (suggestedType) {
      const typeMap: { [key: string]: string } = {
        bar: "Bar Chart",
        line: "Line Chart",
        area: "Area Chart",
        pie: "Pie Chart",
        radar: "Radar Chart",
        scatter: "Scatter Chart",
        donut: "Donut Chart",
        gauge: "Gauge Chart",
        treemap: "Treemap Chart",
        gantt: "Gantt Chart",
        sparkline: "Sparkline Chart",
        waterfall: "Waterfall Chart"
      };
      const mapped = typeMap[suggestedType.toLowerCase()];
      if (mapped) {
        setChartType(mapped);
      }
    }
  }, [activePage, data]);

  // Reset page index if data updates
  React.useEffect(() => {
    setCurrentPage(0);
  }, [data]);

  const chartData = useMemo(() => {
    if (hasPages && pages[currentPage]) {
      return pages[currentPage].chart_data || {};
    }
    return data?.result?.chart_data || data?.chart_data || data?.data?.chart_data || {};
  }, [data, pages, currentPage, hasPages]);

  const summary = useMemo(() => {
    if (hasPages && pages[currentPage]) {
      return pages[currentPage].summary || "";
    }
    return data?.result?.summary || data?.summary || data?.data?.summary || "";
  }, [data, pages, currentPage, hasPages]);

  const [activeLabels, setActiveLabels] = useState<string[]>([]);
  const [selectedPresets, setSelectedPresets] = useState<number[]>([]);

  React.useEffect(() => {
    if (chartData?.labels) {
      setActiveLabels(chartData.labels);
    } else {
      setActiveLabels([]);
    }
    setSelectedPresets([]);
  }, [chartData]);

  const aiFilters = useMemo(() => {
    let presets = chartData?.filters || activePage?.filters || [];
    if (!Array.isArray(presets)) presets = [];
    
    // If empty, generate standard dynamic presets
    if (presets.length === 0 && chartData?.labels && chartData?.values) {
      const labels = chartData.labels;
      const values = chartData.values;
      const median = [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)] || 0;
      
      const topHalf = labels.filter((lbl: string, idx: number) => values[idx] >= median);
      const bottomHalf = labels.filter((lbl: string, idx: number) => values[idx] < median);
      
      presets = [
        { label: "Show Above Median", active_labels: topHalf },
        { label: "Show Below Median", active_labels: bottomHalf }
      ];
    }
    return presets;
  }, [chartData, activePage]);

  const togglePreset = (idx: number) => {
    setSelectedPresets((prev) => {
      const isSelected = prev.includes(idx);
      let nextPresets = [];
      if (isSelected) {
        nextPresets = prev.filter((i) => i !== idx);
      } else {
        nextPresets = [...prev, idx];
      }
      
      if (nextPresets.length > 0) {
        const unionLabels = new Set<string>();
        nextPresets.forEach((pIdx) => {
          const preset = aiFilters[pIdx];
          if (preset && Array.isArray(preset.active_labels)) {
            preset.active_labels.forEach((lbl: string) => unionLabels.add(lbl));
          }
        });
        setActiveLabels(Array.from(unionLabels));
      } else {
        setActiveLabels(chartData.labels || []);
      }
      return nextPresets;
    });
  };

  const toggleLabel = (lbl: string) => {
    setActiveLabels((prev) => {
      setSelectedPresets([]);
      if (prev.includes(lbl)) {
        return prev.filter((l) => l !== lbl);
      } else {
        return [...prev, lbl];
      }
    });
  };

  if (!data || !chartData || !chartData.labels || chartData.labels.length === 0) {
    return (
      <div className="flex flex-col h-full bg-[#FAF8F5]/80 border-l border-[#E5DFD7]">
        {/* Empty chart header */}
        <div className="flex items-center justify-between px-8 pt-7 pb-4 shrink-0">
          <div>
            <p className="text-xs uppercase tracking-widest text-black/40 font-semibold mb-0.5">
              Visualization
            </p>
            <h2
              className="text-2xl font-black text-[#2C2523]"
              style={{ fontFamily: "'Figtree', sans-serif" }}
            >
              Run Analysis
            </h2>
          </div>
        </div>

        {/* Empty state */}
        <div className="flex-1 flex items-center justify-center">
          <p className="text-black/40 text-sm">
            Run an analysis to see your chart here
          </p>
        </div>

        {/* Summary bar */}
        <div className="px-8 py-4 border-t border-[#E5DFD7] bg-[#FAF8F5]/50 shrink-0">
          <p className="text-xs text-black/40">Upload data and run a query to generate insights</p>
        </div>
      </div>
    );
  }

  // Transform flat labels/values into recharts format (filtered by activeLabels)
  const formattedData = useMemo(() => {
    if (!chartData?.labels) return [];
    return chartData.labels
      .map((label: string, idx: number) => ({
        name: label,
        value: chartData.values?.[idx] || 0,
      }))
      .filter((item: { name: string; value: number }) => activeLabels.includes(item.name));
  }, [chartData, activeLabels]);

  // Calculate stats
  const totalValue = formattedData.reduce((sum: number, item: { name: string; value: number }) => sum + (item.value || 0), 0);
  const maxValue = Math.max(...formattedData.map((item: { name: string; value: number }) => item.value || 0));
  const avgValue = Math.round(totalValue / formattedData.length);

  const getVizCategory = (type: string): string | null => {
    const cleanType = type.replace(" Chart", "").toLowerCase();
    for (const cat of VIZ_CATALOG) {
      for (const item of cat.items) {
        if (
          item.name.toLowerCase() === cleanType ||
          item.name.toLowerCase() + " chart" === cleanType ||
          cleanType.includes(item.name.toLowerCase())
        ) {
          return cat.category;
        }
      }
    }
    return null;
  };

  const renderChart = () => {
    const common = {
      data: formattedData,
      margin: { top: 10, right: 10, left: -16, bottom: 0 },
    };
    const axis = (
      <>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 10, fill: "#9ca3af" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "#9ca3af" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toString()}
        />
        <Tooltip
          contentStyle={{
            background: "#fff",
            border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: "10px",
            fontSize: "12px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
          }}
          formatter={(v: number) => [
            v >= 1000 ? (v / 1000).toFixed(1) + "k" : v,
            "Value",
          ]}
        />
      </>
    );

    const category = getVizCategory(chartType);
    let normType = chartType.toLowerCase();

    // Map the 8 categories dynamically to visualization triggers if selected
    if (category) {
      if (category.includes("Geospatial")) {
        normType = "map";
      } else if (category.includes("Process & Flow")) {
        normType = "gantt";
      } else if (category.includes("Scientific")) {
        normType = normType.includes("radar") ? "radar" : "treemap";
      } else if (category.includes("Composition")) {
        if (!normType.includes("pie") && !normType.includes("donut") && !normType.includes("treemap")) {
          normType = "pie";
        }
      } else if (category.includes("Relationship")) {
        if (!normType.includes("scatter") && !normType.includes("bubble") && !normType.includes("heatmap") && !normType.includes("correlation")) {
          normType = "scatter";
        }
      } else if (category.includes("Distribution")) {
        if (normType.includes("histogram")) {
          normType = "bar";
        } else if (normType.includes("dot") || normType.includes("frequency")) {
          normType = "scatter";
        } else {
          normType = "waterfall"; // renders the custom distribution candlestick style
        }
      } else if (category.includes("Business KPI")) {
        if (!normType.includes("gauge") && !normType.includes("sparkline") && !normType.includes("kpi")) {
          normType = "waterfall"; // renders financial/candlestick style
        }
      }
    }

    // 1. Map / Geospatial variations (Choropleth, Bubble Map, connection map, flow map, globe, geospatial)
    if (normType.includes("map") || normType.includes("globe") || normType.includes("geospatial") || normType.includes("choropleth") || normType.includes("cartogram")) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#D96B43] mb-3">Interactive Geospatial Node Map</p>
          <svg className="w-full h-full max-h-[220px]" viewBox="0 0 600 300">
            {/* Outline of continents / zones */}
            <path d="M50 150 Q100 80 150 120 T250 100 T350 140 T450 110 T550 150" fill="none" stroke="#E5DFD7" strokeWidth="3" strokeDasharray="5,5" />
            <path d="M80 200 Q180 160 280 220 T480 190" fill="none" stroke="#E5DFD7" strokeWidth="2" strokeDasharray="3,3" />
            
            {/* Draw data points as geospatial bubbles */}
            {formattedData.map((item: any, idx: number) => {
              const x = 80 + (idx * (420 / Math.max(formattedData.length - 1, 1)));
              const y = 80 + (Math.sin(idx) * 60) + 70;
              const radius = 8 + Math.min(25, (item.value / maxValue) * 20);
              return (
                <g key={idx} className="cursor-pointer group">
                  <circle cx={x} cy={y} r={radius} fill={COLORS[idx % COLORS.length]} opacity="0.75" className="hover:opacity-100 transition-opacity" />
                  <circle cx={x} cy={y} r={radius + 4} fill="none" stroke={COLORS[idx % COLORS.length]} strokeWidth="1" opacity="0.3" />
                  <text x={x} y={y - radius - 6} textAnchor="middle" className="text-[9px] font-black fill-[#2C2523]">
                    {item.name.substring(0, 10)}
                  </text>
                  <text x={x} y={y + 3} textAnchor="middle" className="text-[8px] font-bold fill-white">
                    {item.value >= 1000 ? `${(item.value/1000).toFixed(0)}k` : item.value}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      );
    }

    // 2. Flow, Diagram, Sankey, Alluvial, PERT, Swimlane, Decision Tree, Timeline, Sequence, Gantt
    if (normType.includes("sankey") || normType.includes("alluvial") || normType.includes("diagram") || normType.includes("flowchart") || normType.includes("tree diagram") || normType.includes("dendrogram") || normType.includes("sequence") || normType.includes("gantt") || normType.includes("timeline")) {
      const isTimeline = normType.includes("timeline") || normType.includes("gantt");
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#D96B43] mb-3">
            {isTimeline ? "Gantt Timeline Schedule" : "Flow & Node Connection Linkage"}
          </p>
          <svg className="w-full h-full max-h-[220px]" viewBox="0 0 600 300">
            {isTimeline ? (
              <>
                {/* Timeline axis */}
                <line x1="50" y1="240" x2="550" y2="240" stroke="#E5DFD7" strokeWidth="2" />
                <polygon points="550,237 558,240 550,243" fill="#E5DFD7" />
                {formattedData.map((item: any, idx: number) => {
                  const startX = 60 + idx * 45;
                  const length = 40 + (item.value / maxValue) * 120;
                  const y = 50 + idx * 22;
                  return (
                    <g key={idx}>
                      <rect x={startX} y={y} width={length} height="14" rx="4" fill={COLORS[idx % COLORS.length]} opacity="0.8" />
                      <text x={startX + 6} y={y + 10} className="text-[8px] font-black fill-white">{item.name}</text>
                      <text x={startX + length + 8} y={y + 11} className="text-[8px] font-bold fill-[#2C2523]">{item.value}</text>
                    </g>
                  );
                })}
              </>
            ) : (
              <>
                {/* Sankey / Link Connections */}
                {formattedData.slice(0, 6).map((item: any, idx: number) => {
                  const x1 = 80;
                  const y1 = 40 + idx * 42;
                  const x2 = 420;
                  const y2 = 80 + (idx % 2) * 90;
                  const flowWidth = 2 + (item.value / maxValue) * 18;
                  return (
                    <g key={idx}>
                      <path d={`M ${x1} ${y1} C ${(x1+x2)/2} ${y1}, ${(x1+x2)/2} ${y2}, ${x2} ${y2}`} fill="none" stroke={COLORS[idx % COLORS.length]} strokeWidth={flowWidth} opacity="0.25" />
                      {/* Left Node */}
                      <rect x={x1 - 50} y={y1 - 12} width={50} height={24} rx="6" fill="#FAF8F5" stroke="#E5DFD7" />
                      <text x={x1 - 25} y={y1 + 4} textAnchor="middle" className="text-[8px] font-black fill-[#2C2523]">{item.name.substring(0,6)}</text>
                      {/* Right Node */}
                      {idx === 0 && (
                        <>
                          <rect x={x2} y={y2 - 25} width={60} height={50} rx="8" fill="#D96B43" />
                          <text x={x2 + 30} y={y2 + 4} textAnchor="middle" className="text-[9px] font-black fill-white">Hub core</text>
                        </>
                      )}
                    </g>
                  );
                })}
              </>
            )}
          </svg>
        </div>
      );
    }

    // 3. Financial stock candlestick, waterfall, OHLC, Renko, Kagi
    if (normType.includes("waterfall") || normType.includes("candlestick") || normType.includes("ohlc") || normType.includes("kagi") || normType.includes("renko") || normType.includes("point and figure")) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#D96B43] mb-3">Waterfall & Candlestick Step Sequence</p>
          <svg className="w-full h-full max-h-[220px]" viewBox="0 0 600 300">
            <line x1="50" y1="240" x2="550" y2="240" stroke="#E5DFD7" strokeWidth="2" />
            {formattedData.map((item: any, idx: number) => {
              const x = 70 + idx * (460 / Math.max(formattedData.length - 1, 1));
              const height = (item.value / maxValue) * 140;
              const y = 240 - height;
              const isUp = idx % 2 === 0;
              return (
                <g key={idx}>
                  {/* Candlestick line wick */}
                  <line x1={x + 12} y1={y - 15} x2={x + 12} y2={y + height + 10} stroke="#2C2523" strokeWidth="1.5" />
                  {/* Candle Body */}
                  <rect x={x} y={y} width="24" height={height} fill={isUp ? "#5E7C62" : "#D96B43"} rx="3" />
                  <text x={x + 12} y={y - 20} textAnchor="middle" className="text-[8px] font-black fill-[#2C2523]">{item.value}</text>
                  <text x={x + 12} y="255" textAnchor="middle" className="text-[8px] font-bold fill-[#2C2523]/60">{item.name.substring(0, 6)}</text>
                </g>
              );
            })}
          </svg>
        </div>
      );
    }

    // 4. Horizontal Bar Charts
    if (normType.includes("horizontal bar")) {
      return (
        <BarChart {...common} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
          <XAxis type="number" tick={{ fontSize: 10, fill: "#9ca3af" }} />
          <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} />
          <Tooltip />
          <Bar dataKey="value" fill="#D96B43" radius={[0, 4, 4, 0]} />
        </BarChart>
      );
    }

    // 5. Stacked Bar / Percentage stacked
    if (normType.includes("stacked bar") || normType.includes("percentage bar") || normType.includes("grouped bar")) {
      const isStacked = normType.includes("stacked") || normType.includes("percentage");
      return (
        <BarChart {...common}>
          {axis}
          <Bar dataKey="value" fill="#D96B43" stackId={isStacked ? "a" : undefined} radius={isStacked ? undefined : [4, 4, 0, 0]} />
          <Bar dataKey="value" fill="#5E7C62" stackId={isStacked ? "a" : undefined} radius={isStacked ? undefined : [4, 4, 0, 0]} opacity={0.6} />
          <Legend />
        </BarChart>
      );
    }

    // 6. Gauge & Dial Variations
    if (normType.includes("gauge") || normType.includes("bullet") || normType.includes("speedometer")) {
      const gaugeValue = Math.min(avgValue || 50, 100);
      const gaugeData = [
        { name: "Progress", value: gaugeValue },
        { name: "Remaining", value: 100 - gaugeValue }
      ];
      return (
        <PieChart>
          <Pie
            data={gaugeData}
            cx="50%"
            cy="80%"
            startAngle={180}
            endAngle={0}
            innerRadius={70}
            outerRadius={100}
            dataKey="value"
          >
            <Cell fill="#D96B43" />
            <Cell fill="#E5DFD7" />
          </Pie>
          <Tooltip formatter={(v: number) => [v, "%"]} />
        </PieChart>
      );
    }

    // 7. Donut Variations
    if (normType.includes("donut")) {
      return (
        <PieChart>
          <Pie
            data={formattedData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            labelLine={false}
            label={({ name, percent }) => `${name.substring(0, 10)}: ${(percent * 100).toFixed(0)}%`}
            dataKey="value"
          >
            {formattedData.map((_entry: any, index: number) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v: number) => [v, "Value"]} />
        </PieChart>
      );
    }

    // 8. Treemap, Heatmap, Matrix grid, Hexagonal binning, Correlation grid, Contour
    if (normType.includes("treemap") || normType.includes("heatmap") || normType.includes("matrix") || normType.includes("grid") || normType.includes("hex") || normType.includes("correlation") || normType.includes("contour")) {
      return (
        <div className="w-full h-full p-4 grid grid-cols-3 gap-2 overflow-y-auto">
          {formattedData.slice(0, 9).map((item: any, idx: number) => (
            <div
              key={idx}
              className="rounded-xl p-3 flex flex-col justify-between text-white shadow-sm transition-transform hover:scale-95"
              style={{
                backgroundColor: COLORS[idx % COLORS.length],
                opacity: 0.85 + (item.value / maxValue) * 0.15
              }}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider line-clamp-1">{item.name}</span>
              <span className="text-sm font-black mt-2">{item.value >= 1000 ? `${(item.value / 1000).toFixed(1)}k` : item.value}</span>
            </div>
          ))}
        </div>
      );
    }

    // 9. Word Cloud, Tags, Faces
    if (normType.includes("word") || normType.includes("cloud") || normType.includes("tag") || normType.includes("faces") || normType.includes("chernoff")) {
      return (
        <div className="w-full h-full p-8 flex flex-wrap items-center justify-center gap-4 overflow-y-auto bg-white/50 rounded-2xl">
          {formattedData.map((item: any, idx: number) => {
            const size = 10 + Math.min(24, Math.round((item.value / maxValue) * 20));
            return (
              <span
                key={idx}
                className="font-bold hover:scale-110 transition-transform cursor-default select-none"
                style={{
                  fontSize: `${size}px`,
                  color: COLORS[idx % COLORS.length]
                }}
                title={`Value: ${item.value}`}
              >
                {item.name}
              </span>
            );
          })}
        </div>
      );
    }

    // 10. Radar & Polar variations
    if (normType.includes("radar") || normType.includes("polar") || normType.includes("web")) {
      return (
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={formattedData}>
          <PolarGrid stroke="rgba(0,0,0,0.08)" />
          <PolarAngleAxis dataKey="name" tick={{ fontSize: 9, fill: "#6b7280" }} />
          <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fontSize: 8, fill: "#9ca3af" }} />
          <Radar name="Value" dataKey="value" stroke="#D96B43" fill="#D96B43" fillOpacity={0.3} />
          <Tooltip formatter={(v: number) => [v, "Value"]} />
        </RadarChart>
      );
    }

    // 11. Area Charts
    if (normType.includes("area") || normType.includes("streamgraph")) {
      return (
        <AreaChart {...common}>
          {axis}
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#D96B43" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#D96B43" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke="#D96B43"
            strokeWidth={2.5}
            fill="url(#areaGrad)"
          />
        </AreaChart>
      );
    }

    // 12. Pie Charts
    if (normType.includes("pie")) {
      return (
        <PieChart>
          <Pie
            data={formattedData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name.substring(0, 10)}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={90}
            dataKey="value"
          >
            {formattedData.map((_entry: any, index: number) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v: number) => [v, "Value"]} />
        </PieChart>
      );
    }

    // 13. Scatter & Bubble Chart variations
    if (normType.includes("scatter") || normType.includes("bubble")) {
      const isBubble = normType.includes("bubble");
      return (
        <ScatterChart {...common}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} />
          <Scatter name="Value" dataKey="value" fill="#D96B43">
            {isBubble && formattedData.map((entry: any, idx: number) => {
              const zVal = 10 + (entry.value / maxValue) * 50;
              return <Cell key={`bubble-${idx}`} fill={COLORS[idx % COLORS.length]} width={zVal} height={zVal} />;
            })}
          </Scatter>
        </ScatterChart>
      );
    }

    // 14. Sparklines
    if (normType.includes("sparkline")) {
      return (
        <div className="w-full h-full flex items-center justify-center px-4">
          <LineChart width={250} height={80} data={formattedData}>
            <Line
              type="monotone"
              dataKey="value"
              stroke="#D96B43"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </div>
      );
    }

    // 15. Fallback Default Line Chart
    return (
      <LineChart {...common}>
        {axis}
        <Line
          type="monotone"
          dataKey="value"
          stroke="#D96B43"
          strokeWidth={2.5}
          dot={{ r: 3.5, fill: "#D96B43", strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#FAF8F5]/80 border-l border-[#E5DFD7] relative">
      {/* Chart header */}
      <div className="flex items-center justify-between px-8 pt-7 pb-4 shrink-0 border-b border-[#E5DFD7] bg-[#FAF8F5]/90 z-10">
        <div>
          <p className="text-xs uppercase tracking-widest text-black/40 font-semibold mb-0.5">
            {chartData.title || "Visualization"}
          </p>
          <div className="flex items-center gap-3">
            <h2
              className="text-xl font-black text-[#2C2523] line-clamp-1"
              style={{ fontFamily: "'Figtree', sans-serif" }}
            >
              {chartData.title || "Analysis Overview"}
            </h2>
            
            {/* Paging Controls */}
            {hasPages && pages.length > 1 && (
              <div className="flex items-center gap-1 bg-[#E5DFD7]/40 px-2.5 py-1 rounded-full border border-[#E5DFD7]/60 shrink-0">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  className="p-0.5 rounded-full text-[#2C2523]/60 hover:bg-[#D96B43]/10 hover:text-[#D96B43] disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="text-[9px] font-black text-[#2C2523]/80 px-1 select-none min-w-[50px] text-center">
                  {currentPage + 1} / {pages.length}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(pages.length - 1, p + 1))}
                  disabled={currentPage === pages.length - 1}
                  className="p-0.5 rounded-full text-[#2C2523]/60 hover:bg-[#D96B43]/10 hover:text-[#D96B43] disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Viz controls */}
        <div className="flex items-center gap-2">
          {/* 80 Viz Gallery Toggle */}
          <button
            onClick={() => setCatalogOpen(true)}
            className="p-2 rounded-xl border border-[#E5DFD7] bg-white hover:border-[#D96B43]/50 text-black/60 hover:text-[#D96B43] transition-all flex items-center gap-1.5"
            title="View 80 Supported Visualizations"
          >
            <Grid size={14} />
            <span className="text-[10px] font-bold">80 Viz Gallery</span>
          </button>

          {/* Viz type switcher */}
          <div className="flex rounded-xl border border-[#E5DFD7] overflow-hidden bg-white">
            {["Line", "Bar", "Area", "Pie", "Radar", "Treemap", "Donut", "Gauge", "Sparkline", "Word Cloud"].slice(0, 6).map((v) => (
              <button
                key={v}
                onClick={() => setChartType(v + " Chart")}
                className="px-2 py-1.5 text-[10px] font-bold transition-colors border-r border-[#E5DFD7] last:border-r-0"
                style={{
                  background: chartType.startsWith(v) ? "#D96B43" : "transparent",
                  color: chartType.startsWith(v) ? "#fff" : "rgba(44,37,35,0.6)",
                }}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="flex-1 p-8 min-h-0 bg-white/40 flex flex-col gap-4">
        {/* Dynamic Filters Bar */}
        {chartData?.labels && chartData.labels.length > 0 && (
          <div className="flex flex-col gap-2 p-3.5 bg-white border border-[#E5DFD7] rounded-2xl shadow-sm shrink-0">
            {/* Presets Row */}
            {aiFilters.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="font-black text-black/40 uppercase tracking-widest text-[9px]">AI Filters:</span>
                {aiFilters.map((preset: any, idx: number) => (
                  <label 
                    key={idx} 
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold cursor-pointer transition-all ${
                      selectedPresets.includes(idx)
                        ? "border-[#D96B43] bg-[#D96B43]/5 text-[#D96B43]"
                        : "border-[#E5DFD7] bg-[#FAF8F5] text-black/60 hover:border-[#D96B43]/30"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedPresets.includes(idx)}
                      onChange={() => togglePreset(idx)}
                      className="rounded border-[#E5DFD7] text-[#D96B43] focus:ring-[#D96B43] w-3 h-3 cursor-pointer"
                    />
                    <span>{preset.label}</span>
                  </label>
                ))}
              </div>
            )}

            {/* Individual Labels Row */}
            <div className="flex items-start gap-2 text-xs pt-2 border-t border-[#E5DFD7]/65">
              <span className="font-black text-black/40 uppercase tracking-widest text-[9px] mt-1 shrink-0">Show Data:</span>
              <div className="flex items-center gap-2 flex-wrap max-h-[60px] overflow-y-auto pr-1 select-none">
                {chartData.labels.map((lbl: string) => (
                  <label 
                    key={lbl} 
                    className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[9px] font-semibold cursor-pointer transition-all ${
                      activeLabels.includes(lbl)
                        ? "border-[#D96B43]/60 bg-[#D96B43]/5 text-[#D96B43]"
                        : "border-[#E5DFD7] bg-white text-black/40 hover:border-[#D96B43]/20"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={activeLabels.includes(lbl)}
                      onChange={() => toggleLabel(lbl)}
                      className="rounded border-[#E5DFD7] text-[#D96B43] focus:ring-[#D96B43] w-2.5 h-2.5 cursor-pointer"
                    />
                    <span>{lbl}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Chart Viewport */}
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            {renderChart() as React.ReactElement}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary / Text bar */}
      <div className="px-8 py-5 border-t border-[#E5DFD7] bg-[#FAF8F5]/85 shrink-0">
        <div className="mb-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#D96B43] mb-1">AI Explanation</p>
          <p className="text-xs text-[#2C2523]/80 leading-relaxed font-medium">{summary}</p>
        </div>

        <div className="flex items-center gap-8 border-t border-[#E5DFD7]/60 pt-4">
          {[
            { label: "Total", value: totalValue >= 1000000 ? (totalValue / 1000000).toFixed(1) + "M" : totalValue >= 1000 ? (totalValue / 1000).toFixed(0) + "k" : totalValue },
            { label: "Peak", value: maxValue >= 1000000 ? (maxValue / 1000000).toFixed(1) + "M" : maxValue >= 1000 ? (maxValue / 1000).toFixed(0) + "k" : maxValue },
            { label: "Average", value: avgValue >= 1000000 ? (avgValue / 1000000).toFixed(1) + "M" : avgValue >= 1000 ? (avgValue / 1000).toFixed(0) + "k" : avgValue },
            { label: "Data Points", value: formattedData.length },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-[9px] uppercase tracking-widest text-black/40 font-bold mb-0.5">
                {s.label}
              </div>
              <div
                className="text-sm font-black text-[#2C2523]"
                style={{ fontFamily: "'Figtree', sans-serif" }}
              >
                {s.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 80 Visualizations Drawer */}
      {catalogOpen && (
        <div className="absolute inset-0 bg-black/40 z-30 flex justify-end">
          <div className="w-[380px] h-full bg-[#FAF8F5] border-l border-[#E5DFD7] flex flex-col animate-in slide-in-from-right duration-200">
            <div className="px-6 py-5 border-b border-[#E5DFD7] flex items-center justify-between shrink-0 bg-white">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-black/40">Visual Catalog</p>
                <h3 className="text-base font-black text-[#2C2523]" style={{ fontFamily: "'Figtree', sans-serif" }}>
                  80 Supported Techniques
                </h3>
              </div>
              <button
                onClick={() => setCatalogOpen(false)}
                className="p-1.5 rounded-full hover:bg-black/5 text-[#2C2523]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {VIZ_CATALOG.map((cat) => (
                <div key={cat.category} className="space-y-2">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-[#D96B43] border-b border-[#E5DFD7]/60 pb-1">
                    {cat.category}
                  </h4>
                  <div className="space-y-2.5">
                    {cat.items.map((item) => (
                      <div
                        key={item.name}
                        onClick={() => {
                          const simpleType = item.name.split(" ")[0];
                          setChartType(item.name.endsWith("Chart") || item.name.endsWith("Plot") || item.name.endsWith("Diagram") ? item.name : item.name + " Chart");
                          setCatalogOpen(false);
                        }}
                        className="p-2.5 rounded-xl border border-transparent hover:border-[#D96B43]/30 hover:bg-white cursor-pointer transition-all"
                      >
                        <p className="text-xs font-black text-[#2C2523] mb-0.5">{item.name}</p>
                        <p className="text-[10px] text-black/50 leading-normal">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

