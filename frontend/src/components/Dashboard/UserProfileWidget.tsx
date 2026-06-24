import React from "react";
import type { User } from "../../types";
import { Map, Crown, MapPin } from "lucide-react";

interface Props {
  user: User;
  totalFields: number;
  totalAcres: number;
}

const getInitials = (name: string) => {
  if (!name) return "U";
  const parts = name.split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const UserProfileWidget: React.FC<Props> = ({ user, totalFields, totalAcres }) => {
  const stats = user.profileStats || {
    subscriptionTier: "Basic",
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 shadow-xl backdrop-blur-md flex flex-col sm:flex-row items-center gap-6">
      <div className="flex-shrink-0">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#0b637a] text-2xl font-bold text-white shadow-lg">
          {getInitials(user.name)}
        </div>
      </div>
      <div className="flex-1 text-center sm:text-left">
        <h2 className="text-2xl font-bold text-white">{user.name}</h2>
        <p className="text-sm text-slate-400">{user.email}</p>
        
        <div className="mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-4">
          <div className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-1.5 border border-emerald-500/20">
            <Map className="h-4 w-4 text-emerald-400" />
            <span className="text-sm font-medium text-emerald-100">
              {totalFields} Fields
            </span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-blue-500/10 px-3 py-1.5 border border-blue-500/20">
            <MapPin className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-medium text-blue-100">
              {totalAcres.toFixed(2)} Acres
            </span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-purple-500/10 px-3 py-1.5 border border-purple-500/20">
            <Crown className="h-4 w-4 text-purple-400" />
            <span className="text-sm font-medium text-purple-100">
              {stats.subscriptionTier}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileWidget;
