import React from "react";
import ReactECharts from "echarts-for-react";
import { HeatmapItem } from "../lib/api";

interface DelayHeatmapProps {
  data: HeatmapItem[];
}

export const DelayHeatmap: React.FC<DelayHeatmapProps> = ({ data }) => {
  // Extract unique agencies and contract types
  const agencies = Array.from(new Set(data.map((item) => item.agency))).sort();
  const contractTypes = Array.from(new Set(data.map((item) => item.contract_type))).sort();

  // If no data, show empty state
  if (data.length === 0 || agencies.length === 0 || contractTypes.length === 0) {
    return (
      <div className="flex h-[350px] items-center justify-center rounded-xl border border-gray-800 bg-[#0F131E]/80 text-gray-400">
        <p className="text-sm">No delay hotspot data available for current filters.</p>
      </div>
    );
  }

  // Format data for ECharts Heatmap: list of [x_index, y_index, value]
  const heatmapData = data.map((item) => {
    const xIndex = contractTypes.indexOf(item.contract_type);
    const yIndex = agencies.indexOf(item.agency);
    return [xIndex, yIndex, item.avg_days, item.count];
  });

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      position: "top",
      backgroundColor: "#111827",
      borderColor: "#374151",
      borderWidth: 1,
      textStyle: {
        color: "#F9FAFB",
        fontSize: 12,
      },
      formatter: (params: any) => {
        const val = params.value;
        const contract = contractTypes[val[0]];
        const agency = agencies[val[1]];
        const avgDays = val[2];
        const count = val[3];
        return `
          <div class="p-1">
            <p class="font-semibold text-indigo-400">${agency}</p>
            <p class="text-gray-300 mt-1"><span class="text-gray-400">Contract:</span> ${contract}</p>
            <p class="text-gray-300"><span class="text-gray-400">Avg Processing:</span> <span class="font-bold text-white">${avgDays} days</span></p>
            <p class="text-gray-300"><span class="text-gray-400">Invoices Paid:</span> ${count}</p>
          </div>
        `;
      },
    },
    grid: {
      top: "8%",
      bottom: "20%",
      left: "22%", // Give enough room for long agency names
      right: "5%",
    },
    xAxis: {
      type: "category",
      data: contractTypes,
      splitArea: {
        show: true,
        areaStyle: {
          color: ["rgba(255,255,255,0.01)", "rgba(255,255,255,0.02)"],
        },
      },
      axisLabel: {
        color: "#9CA3AF",
        fontSize: 10,
        interval: 0,
        rotate: 15,
      },
      axisLine: {
        lineStyle: {
          color: "#374151",
        },
      },
    },
    yAxis: {
      type: "category",
      data: agencies,
      splitArea: {
        show: true,
        areaStyle: {
          color: ["rgba(255,255,255,0.01)", "rgba(255,255,255,0.02)"],
        },
      },
      axisLabel: {
        color: "#9CA3AF",
        fontSize: 10,
        width: 140,
        overflow: "truncate",
      },
      axisLine: {
        lineStyle: {
          color: "#374151",
        },
      },
    },
    visualMap: {
      min: 0,
      max: 60,
      calculable: true,
      orient: "horizontal",
      left: "center",
      bottom: "0%",
      text: ["High Delay (>60d)", "On-Time (<15d)"],
      textStyle: {
        color: "#9CA3AF",
        fontSize: 10,
      },
      // Color range: Deep Emerald -> Gold -> Dark Orange -> Vivid Red/Pink
      inRange: {
        color: ["#10B981", "#EAB308", "#F97316", "#EF4444"],
      },
    },
    series: [
      {
        name: "Avg Delay Days",
        type: "heatmap",
        data: heatmapData,
        label: {
          show: true,
          color: "#FFFFFF",
          fontWeight: "bold",
          fontSize: 11,
          formatter: (params: any) => `${params.value[2]}d`,
        },
        itemStyle: {
          borderColor: "#0F131E",
          borderWidth: 2,
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: "rgba(0, 0, 0, 0.7)",
          },
        },
      },
    ],
  };

  return (
    <div className="rounded-xl border border-gray-800 bg-[#0F131E]/80 p-5 shadow-lg backdrop-blur-md">
      <h4 className="mb-4 text-sm font-semibold tracking-wide text-gray-200">
        Payment Processing Delay Heatmap (Agency vs Contract Type)
      </h4>
      <div className="h-[350px]">
        <ReactECharts
          option={option}
          style={{ height: "100%", width: "100%" }}
          opts={{ renderer: "canvas" }}
        />
      </div>
    </div>
  );
};
