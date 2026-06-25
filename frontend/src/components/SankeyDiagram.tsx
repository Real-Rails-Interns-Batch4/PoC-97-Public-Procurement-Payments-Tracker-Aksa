import React from "react";
import ReactECharts from "echarts-for-react";
import { SankeyData } from "../lib/api";

interface SankeyDiagramProps {
  data: SankeyData;
}

export const SankeyDiagram: React.FC<SankeyDiagramProps> = ({ data }) => {
  if (!data || !data.nodes || data.nodes.length === 0 || !data.links || data.links.length === 0) {
    return (
      <div className="flex h-[350px] items-center justify-center rounded-xl border border-gray-800 bg-[#0B1117]/80 text-gray-400">
        <p className="text-sm">No procurement flow data available for current filters.</p>
      </div>
    );
  }

  // Format nodes to include custom styles (colors) based on naming conventions
  const styledNodes = data.nodes.map((node) => {
    let color = "#6366F1"; // Default Indigo for agencies/vendors
    
    if (node.name.startsWith("Invoice: Approved")) {
      color = "#10B981"; // Emerald
    } else if (node.name.startsWith("Invoice: Disputed")) {
      color = "#F59E0B"; // Amber
    } else if (node.name.startsWith("Invoice: Pending")) {
      color = "#4B5563"; // Gray
    } else if (node.name.startsWith("Payment: Completed")) {
      color = "#10B981"; // Emerald
    } else if (node.name.startsWith("Payment: Delayed")) {
      color = "#EF4444"; // Rose
    } else if (node.name.startsWith("Payment: In Progress")) {
      color = "#0EA5E9"; // Sky Blue
    } else if (node.name.includes("Unpaid") || node.name.includes("Pending")) {
      color = "#EAB308"; // Yellow/Amber
    }
    
    return {
      name: node.name,
      itemStyle: {
        color: color,
        borderColor: "#0B1117",
        borderWidth: 1,
      },
    };
  });

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "item",
      triggerOn: "mousemove",
      backgroundColor: "#111827",
      borderColor: "#374151",
      borderWidth: 1,
      textStyle: {
        color: "#F9FAFB",
        fontSize: 12,
      },
      formatter: (params: any) => {
        if (params.dataType === "edge") {
          const val = Number(params.data?.value ?? 0);
          return `
            <div class="p-1">
              <p class="font-semibold text-gray-400">${params.data.source} &rarr; ${params.data.target}</p>
              <p class="text-white font-bold mt-1">Amount: $${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          `;
        }
        const val = Number(params.value ?? 0);
        return `
          <div class="p-1">
            <p class="font-semibold text-indigo-400">${params.name}</p>
            <p class="text-white mt-1">Total Volume: $${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        `;
      },
    },
    series: [
      {
        type: "sankey",
        data: styledNodes,
        links: data.links,
        top: "5%",
        bottom: "5%",
        left: "5%",
        right: "20%", // More margin on right for status node names
        nodeWidth: 16,
        nodeGap: 18,
        focusNodeAdjacency: "allEdges",
        itemStyle: {
          borderWidth: 1,
          borderColor: "#374151",
        },
        lineStyle: {
          color: "gradient",
          curveness: 0.5,
          opacity: 0.25,
        },
        label: {
          position: "right",
          color: "#E5E7EB",
          fontSize: 10,
          fontWeight: "medium",
        },
      },
    ],
  };

  return (
    <div className="rounded-xl border border-gray-800 bg-[#0B1117]/80 p-5 shadow-lg backdrop-blur-md">
      <h4 className="mb-4 text-sm font-semibold tracking-wide text-gray-200">
        Procurement Flow Diagram (Award Funding &rarr; Invoice Status &rarr; Payment Outcome)
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
