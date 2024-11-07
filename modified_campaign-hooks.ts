// src/hooks/useCampaignStats.ts

import { useQuery } from 'react-query';
import api from '@/utils/api';

export const useCampaignStats = (campaignId: string) => {
  const { data: stats, isLoading: statsLoading } = useQuery(
    ['campaign-stats', campaignId],
    () => api.get(`/campaigns/${campaignId}/stats`).then(res => res.data),
    {
      refetchInterval: 30000 // Rafraîchir toutes les 30 secondes
    }
  );

  const { data: calls, isLoading: callsLoading } = useQuery(
    ['campaign-calls', campaignId],
    () => api.get(`/campaigns/${campaignId}/calls`).then(res => res.data),
    {
      refetchInterval: 30000
    }
  );

  return {
    stats,
    calls,
    isLoading: statsLoading || callsLoading
  };
};

// src/hooks/useCallDetails.ts
export const useCallDetails = (callId: string) => {
  const { data, isLoading } = useQuery(
    ['call-details', callId],
    () => api.get(`/calls/${callId}`).then(res => res.data)
  );

  return {
    call: data?.call,
    transcript: data?.transcript,
    recording: data?.recording,
    isLoading
  };
};
