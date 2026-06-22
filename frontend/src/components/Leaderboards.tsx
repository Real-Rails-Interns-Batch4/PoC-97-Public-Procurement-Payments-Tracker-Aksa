import React from "react";
import { Leaderboards as LeaderboardsData, LeaderboardEntity } from "../lib/api";

interface LeaderboardsProps {
  data: LeaderboardsData;
}

const formatCurrency = (val: number) => {
  if (val >= 1e9) return `$${(val / 1e9).toFixed(1)}B`;
  if (val >= 1e6) return `$${(val / 1e6).toFixed(1)}M`;
  if (val >= 1e3) return `$${(val / 1e3).toFixed(0)}K`;
  return `$${val.toFixed(0)}`;
};

export const Leaderboards: React.FC<LeaderboardsProps> = ({ data }) => {
  const renderList = (entities: LeaderboardEntity[], title: string, sub: string) => {
    return (
      <div className="flex flex-col rounded-xl border border-gray-800 bg-[#0F131E]/80 p-5 shadow-lg backdrop-blur-md">
        <h4 className="text-sm font-semibold tracking-wide text-gray-200">
          {title}
        </h4>
        <p className="text-xs text-gray-500 font-medium mt-1 mb-4">
          {sub}
        </p>
        <div className="flex-1 overflow-y-auto max-h-[350px] space-y-4 pr-1">
          {entities.length === 0 ? (
            <p className="text-xs text-gray-400 py-4 text-center">No records matching filters.</p>
          ) : (
            entities.map((entity, idx) => {
              // Delay rate coloring
              let delayColor = "bg-emerald-500";
              let delayTextColor = "text-emerald-400";
              if (entity.avg_delay > 35) {
                delayColor = "bg-rose-500";
                delayTextColor = "text-rose-400";
              } else if (entity.avg_delay > 20) {
                delayColor = "bg-amber-500";
                delayTextColor = "text-amber-400";
              }

              return (
                <div key={entity.name} className="group border-b border-gray-800/40 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-300 truncate max-w-[190px] group-hover:text-indigo-400 transition-colors duration-200">
                      {idx + 1}. {entity.name}
                    </span>
                    <span className="font-bold text-white">
                      {formatCurrency(entity.payments_amount)}
                    </span>
                  </div>
                  
                  <div className="mt-2 flex items-center justify-between text-[10px] text-gray-500">
                    <span>{entity.awards} Awards</span>
                    <span className={`font-semibold ${delayTextColor}`}>
                      Avg delay: {entity.avg_delay.toFixed(1)}d ({entity.delay_rate.toFixed(0)}% delayed)
                    </span>
                  </div>
                  
                  {/* Progress bar representing average delay */}
                  <div className="mt-1 h-1 w-full rounded-full bg-gray-900 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${delayColor} transition-all duration-500`}
                      style={{ width: `${Math.min(100, (entity.avg_delay / 60) * 100)}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 gap-6">
      {renderList(
        data.agencies, 
        "Agency Performance Leaderboard", 
        "Ranked by longest average payment processing time"
      )}
      {renderList(
        data.vendors, 
        "Vendor Payment Performance", 
        "Ranked by average days to receive payment"
      )}
    </div>
  );
};
