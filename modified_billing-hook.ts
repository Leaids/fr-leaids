// src/hooks/useBilling.ts

import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '@/utils/api';

export const useBilling = () => {
  const queryClient = useQueryClient();

  // Récupération des informations d'abonnement
  const { data: subscription } = useQuery('subscription', () =>
    api.get('/billing/subscription').then(res => res.data)
  );

  // Récupération des statistiques d'utilisation
  const { data: usage } = useQuery('usage', () =>
    api.get('/billing/usage').then(res => res.data)
  );

  // Création d'un abonnement
  const createSubscription = useMutation(
    (priceId: string) => api.post('/billing/subscribe', { priceId }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('subscription');
      }
    }
  );

  // Annulation d'un abonnement