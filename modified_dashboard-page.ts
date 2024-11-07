// src/pages/dashboard/index.tsx

import { useEffect, useState } from 'react';
import MainLayout from '@/layouts/MainLayout';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { RecentCalls } from '@/components/dashboard/RecentCalls';
import { ActiveCampaigns } from '@/components/dashboard/ActiveCampaigns';
import { useStats } from '@/hooks/useStats';

const DashboardPage = () => {
  const { stats, isLoading, error } = useStats();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error} />;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* En-tête du Dashboard */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">
            Tableau de bord
          </h1>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
            Nouvelle Campagne
          </button>
        </div>

        {/* Statistiques */}
        <DashboardStats stats={stats} />

        {/* Contenu principal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentCalls />
          <ActiveCampaigns />
        </div>
      </div>
    </MainLayout>
  );
};

export default DashboardPage;
