// src/components/dashboard/DashboardStats.tsx

import { Card, Metric, Text, AreaChart } from '@tremor/react';

interface StatsProps {
  stats: {
    totalCalls: number;
    successRate: number;
    activeCampaigns: number;
    callsToday: number[];
  };
}

export const DashboardStats = ({ stats }: StatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total des appels */}
      <Card decoration="top" decorationColor="indigo">
        <Text>Total des appels</Text>
        <Metric>{stats.totalCalls}</Metric>
        <AreaChart
          className="mt-4 h-28"
          data={stats.callsToday}
          categories={['Appels']}
          index="heure"
          colors={['indigo']}
          showXAxis={false}
          showGridLines={false}
        />
      </Card>

      {/* Autres statistiques similaires... */}
    </div>
  );
};

// src/components/dashboard/RecentCalls.tsx
export const RecentCalls = () => {
  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
        <Text>Appels Récents</Text>
        <button className="text-indigo-600 text-sm">Voir tout</button>
      </div>
      <div className="divide-y">
        {/* Liste des appels récents */}
        {recentCalls.map((call) => (
          <div key={call.id} className="py-3">
            {/* Détails de l'appel */}
          </div>
        ))}
      </div>
    </Card>
  );
};

// Autres composants...
