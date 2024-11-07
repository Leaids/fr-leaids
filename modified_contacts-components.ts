// src/components/contacts/ContactList.tsx

import React from 'react';
import { useContacts } from '@/hooks/useContacts';
import { Table, Badge, Button } from '@/components/ui';
import { Contact } from '@/types';

export const ContactList: React.FC = () => {
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState('');
  const { contacts, isLoading, pagination } = useContacts({ page, search });

  const columns = [
    {
      header: 'Nom',
      cell: (contact: Contact) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
              <span className="text-indigo-600 font-medium">
                {contact.firstName[0]}{contact.lastName?.[0]}
              </span>
            </div>
          </div>
          <div>
            <div className="font-medium text-gray-900">
              {contact.firstName} {contact.lastName}
            </div>
            <div className="text-gray-500 text-sm">
              {contact.email}
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Téléphone',
      cell: (contact: Contact) => contact.phone
    },
    {
      header: 'Statut',
      cell: (contact: Contact) => (
        <Badge
          color={contact.status === 'active' ? 'green' : 'gray'}
        >
          {contact.status}
        </Badge>
      )
    },
    {
      header: 'Tags',
      cell: (contact: Contact) => (
        <div className="flex gap-1">
          {contact.tags.map(tag => (
            <Badge key={tag} color="blue" size="sm">
              {tag}
            </Badge>
          ))}
        </div>
      )
    }
  ];

  return (
    <div>
      {/* Barre de recherche et filtres */}
      <div className="mb-4 flex justify-between items-center">
        <input
          type="text"
          placeholder="Rechercher..."
          className="px-4 py-2 border rounded-lg"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button onClick={() => {}}>
          Importer des contacts
        </Button>
      </div>

      {/* Table des contacts */}
      <Table
        data={contacts}
        columns={columns}
        isLoading={isLoading}
        pagination={pagination}
        onPageChange={setPage}
      />
    </div>
  );
};

// src/components/contacts/ContactForm.tsx
export const ContactForm: React.FC<{
  initialData?: Contact;
  onSubmit: (data: any) => void;
}> = ({ initialData, onSubmit }) => {
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Prénom
          </label>
          <input
            type="text"
            {...register('firstName')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Nom
          </label>
          <input
            type="text"
            {...register('lastName')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        </div>
        {/* Autres champs... */}
      </div>
    </form>
  );
};
