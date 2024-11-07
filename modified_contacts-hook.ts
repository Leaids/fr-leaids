// src/hooks/useContacts.ts

import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '@/utils/api';
import { Contact } from '@/types';

interface UseContactsOptions {
  page?: number;
  search?: string;
}

export const useContacts = (options: UseContactsOptions = {}) => {
  const queryClient = useQueryClient();
  const { page = 1, search = '' } = options;

  // Récupération des contacts
  const { data, isLoading, error } = useQuery(
    ['contacts', page, search],
    async () => {
      const response = await api.get('/contacts', {
        params: { page, search }
      });
      return response.data;
    }
  );

  // Création d'un contact
  const createContact = useMutation(
    (newContact: Partial<Contact>) => 
      api.post('/contacts', newContact),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('contacts');
      }
    }
  );

  // Import en masse
  const importContacts = useMutation(
    (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.post('/contacts/import', formData);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('contacts');
      }
    }
  );

  // Mise à jour d'un contact
  const updateContact = useMutation(
    ({ id, data }: { id: string; data: Partial<Contact> }) =>
      api.put(`/contacts/${id}`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('contacts');
      }
    }
  );

  return {
    contacts: data?.contacts || [],
    pagination: data?.pagination,
    isLoading,
    error,
    createContact,
    updateContact,
    importContacts
  };
};
