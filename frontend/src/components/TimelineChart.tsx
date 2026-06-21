import React from "react";
import ReactECharts from "echarts-for-react";
import { TimelineItem } from "../lib/api";

interface TimelineChartProps {
  data: TimelineItem[];
}

export const TimelineChart: React.FC<TimelineChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[350px] items-center justify-center rounded-xl border border-gray-800 bg-[#0F131E]/80 text-gray-400">
        <p className="text-sm">No timeline trend data available for current filters.</p>
      </div>
    );
  }

  const months = data.map((item) => item.month);
  const daysToInvoice = data.map((item) => item.days_to_invoice);
  const daysToPayment = data.map((item) => item.days_to_payment);
  const awardCounts = data.map((item) => item.count);

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      backgroundColor: "#111827",
      borderColor: "#374151",
      borderWidth: 1,
      textStyle: {
        color: "#F9FAFB",
        fontSize: 12,
      },
      axisPointer: {
        type: "shadow",
      },
    },
    legend: {
      data: ["Days to Invoice", "Days to Payment", "Contract Awards"],
      textStyle: {
        color: "#9CA3AF",
        fontSize: 11,
      },
      top: "0%",
      right: "0%",
    },
    grid: {
      top: "15%",
      bottom: "12%",
      left: "6%",
      right: "6%",
    },
    xAxis: [
      {
        type: "category",
        data: months,
        axisPointer: {
          type: "shadow",
        },
        axisLabel: {
          color: "#9CA3AF",
          fontSize: 10,
        },
        axisLine: {
          lineStyle: {
            color: "#374151",
          },
        },
      },
    ],
    yAxis: [
      {
        type: "value",
        name: "Days",
        min: 0,
        axisLabel: {
          formatter: "{value} d",
          color: "#9CA3AF",
          fontSize: 10,
        },
        nameTextStyle: {
          color: "#9CA3AF",
          fontSize: 10,
        },
        splitLine: {
          lineStyle: {
            color: "rgba(55, 65, 81, 0.2)",
          },
        },
      },
      {
        type: "value",
        name: "Awards",
        min: 0,
        axisLabel: {
          formatter: "{value}",
          color: "#9CA3AF",
          fontSize: 10,
        },
        nameTextStyle: {
          color: "#9CA3AF",
          fontSize: 10,
        },
        splitLine: {
          show: false,
        },
      },
    ],
    series: [
      {
        name: "Days to Invoice",
        type: "line",
        smooth: true,
        data: daysToInvoice,
        itemStyle: {
          color: "#6366F1", // Indigo
        },
        lineStyle: {
          width: 3,
        },
      },
      {
        name: "Days to Payment",
        type: "line",
        smooth: true,
        data: daysToPayment,
        itemStyle: {
          color: "#EF4444", // Rose
        },
        lineStyle: {
          width: 3,
        },
      },
      {
        name: "Contract Awards",
        type: "bar",
        yAxisIndex: 1,
        data: awardCounts,
        itemStyle: {
          color: "rgba(16, 185, 129, 0.15)", // Subtle Emerald Bar
          borderColor: "rgba(16, 185, 129, 0.4)",
          borderWidth: 1,
          borderRadius: [4, 4, 0, 0],
        },
      },
    ],
  };

  return (
    <div className="rounded-xl border border-gray-800 bg-[#0F131E]/80 p-5 shadow-lg backdrop-blur-md">
      <h4 className="mb-4 text-sm font-semibold tracking-wide text-gray-200">
        Award-to-Payment Timeline Trends (By Month)
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
