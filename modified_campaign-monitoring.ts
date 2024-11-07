// src/components/campaigns/CampaignDashboard.tsx

import React from 'react';
import { useCampaignStats } from '@/hooks/useCampaignStats';
import { 
  Chart, 
  CallsList, 
  StatusBadge 
} from '@/components/ui';

export const CampaignDashboard = ({ campaignId }: { campaignId: string }) => {
  const { stats, calls, isLoading } = useCampaignStats(campaignId);

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques principales */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="Appels Effectués"
          value={stats.totalCalls}
          trend={stats.callsTrend}
        />
        <StatCard
          title="Taux de Réponse"
          value={`${stats.answerRate}%`}
          trend={stats.answerRateTrend}
        />
        <StatCard
          title="Durée Moyenne"
          value={`${stats.avgDuration}m`}
          trend={stats.durationTrend}
        />
        <StatCard
          title="Conversions"
          value={stats.conversions}
          trend={stats.conversionTrend}
        />
      </div>

      {/* Graphiques de performance */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Performance Horaire</h3>
          <Chart
            type="line"
            data={stats.hourlyData}
            options={{
              xAxis: { dataKey: 'hour' },
              yAxis: { name: 'Appels' }
            }}
          />
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Statuts des Appels</h3>
          <Chart
            type="pie"
            data={stats.statusData}
            options={{
              dataKey: 'value',
              nameKey: 'status'
            }}
          />
        </div>
      </div>

      {/* Liste des derniers appels */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h3 className="text-lg font-medium">Derniers Appels</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Heure
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durée
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {calls.map((call) => (
                <tr key={call.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {call.contact.firstName[0]}{call.contact.lastName[0]}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {call.contact.firstName} {call.contact.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {call.contact.phone}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(call.startTime).toLocaleTimeString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {call.duration ? `${Math.round(call.duration / 60)}m ${call.duration % 60}s` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={call.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => openCallDetails(call.id)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Détails
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// src/components/campaigns/CallDetails.tsx
export const CallDetails = ({ callId }: { callId: string }) => {
  const { call, transcript, recording } = useCallDetails(callId);

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <h3 className="text-lg font-medium">Détails de l'appel</h3>
      </div>
      <div className="p-6 space-y-6">
        {/* Informations de base */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Contact
            </label>
            <p className="mt-1 text-sm text-gray-900">
              {call.contact.firstName} {call.contact.lastName}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Numéro
            </label>
            <p className="mt-1 text-sm text-gray-900">{call.contact.phone}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Date et heure
            </label>
            <p className="mt-1 text-sm text-gray-900">
              {new Date(call.startTime).toLocaleString()}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Durée
            </label>
            <p className="mt-1 text-sm text-gray-900">
              {call.duration ? `${Math.round(call.duration / 60)}m ${call.duration % 60}s` : '-'}
            </p>
          </div>
        </div>

        {/* Lecteur audio */}
        {recording && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enregistrement
            </label>
            <audio controls className="w-full">
              <source src={recording.url} type="audio/mpeg" />
            </audio>
          </div>
        )}

        {/* Transcription */}
        {transcript && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transcription
            </label>
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              {transcript.map((line, index) => (
                <div key={index} className="flex space-x-4">
                  <span className="font-medium text-gray-700 min-w-[80px]">
                    {line.speaker}:
                  </span>
                  <span className="text-gray-900">{line.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
