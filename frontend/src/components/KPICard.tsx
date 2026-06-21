import React from "react";
import { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  subtext: string;
  icon: LucideIcon;
  colorClass: string; // Tailwind color class for hover/border
  iconColorClass: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtext,
  icon: Icon,
  colorClass,
  iconColorClass,
}) => {
  return (
    <div className={`relative overflow-hidden rounded-xl border border-gray-800 bg-[#0F131E]/80 p-6 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-gray-700 hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)] group`}>
      {/* Decorative background glow */}
      <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-5 blur-xl transition-all duration-500 group-hover:scale-150 ${colorClass}`} />
      
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
            {title}
          </p>
          <h3 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {value}
          </h3>
        </div>
        <div className={`rounded-lg p-3 bg-gray-900/60 border border-gray-800 group-hover:scale-110 transition-transform duration-300`}>
          <Icon className={`h-6 w-6 ${iconColorClass}`} />
        </div>
      </div>
      
      <p className="mt-4 text-xs text-gray-500 font-medium">
        {subtext}
      </p>
    </div>
  );
};
