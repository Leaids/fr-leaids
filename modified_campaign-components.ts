// src/components/campaigns/CampaignCreator.tsx

import React, { useState } from 'react';
import { useCampaign } from '@/hooks/useCampaign';
import { useContacts } from '@/hooks/useContacts';
import { useAgents } from '@/hooks/useAgents';
import { DateRangePicker } from '@/components/ui/DateRangePicker';

export const CampaignCreator = () => {
  const { createCampaign, isLoading } = useCampaign();
  const { contacts } = useContacts();
  const { agents } = useAgents();

  const [campaignData, setCampaignData] = useState({
    name: '',
    agentId: '',
    contactIds: [] as string[],
    scheduleStart: null,
    scheduleEnd: null,
    timeWindow: {
      start: '09:00',
      end: '17:00'
    },
    callsPerDay: 50
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCampaign(campaignData);
      // Redirection ou notification de succès
    } catch (error) {
      console.error('Campaign creation error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        {/* Informations de base */}
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nom de la campagne
            </label>
            <input
              type="text"
              value={campaignData.name}
              onChange={(e) => 
                setCampaignData({ ...campaignData, name: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>

          {/* Sélection de l'agent */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Agent IA
            </label>
            <select
              value={campaignData.agentId}
              onChange={(e) => 
                setCampaignData({ ...campaignData, agentId: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            >
              <option value="">Sélectionner un agent</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sélection des contacts */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Contacts
            </label>
            <div className="mt-1 max-h-60 overflow-y-auto border rounded-md">
              {contacts.map((contact) => (
                <label
                  key={contact.id}
                  className="flex items-center p-3 hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={campaignData.contactIds.includes(contact.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setCampaignData({
                          ...campaignData,
                          contactIds: [...campaignData.contactIds, contact.id]
                        });
                      } else {
                        setCampaignData({
                          ...campaignData,
                          contactIds: campaignData.contactIds.filter(
                            id => id !== contact.id
                          )
                        });
                      }
                    }}
                    className="h-4 w-4 text-indigo-600 rounded"
                  />
                  <span className="ml-3">
                    {contact.firstName} {contact.lastName}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Configuration de la planification */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Période de la campagne
            </label>
            <DateRangePicker
              startDate={campaignData.scheduleStart}
              endDate={campaignData.scheduleEnd}
              onChange={({ startDate, endDate }) => 
                setCampaignData({
                  ...campaignData,
                  scheduleStart: startDate,
                  scheduleEnd: endDate
                })
              }
            />
          </div>

          {/* Configuration des appels */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Appels par jour
              </label>
              <input
                type="number"
                value={campaignData.callsPerDay}
                onChange={(e) => 
                  setCampaignData({
                    ...campaignData,
                    callsPerDay: parseInt(e.target.value)
                  })
                }
                min="1"
                max="1000"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Plage horaire
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="time"
                  value={campaignData.timeWindow.start}
                  onChange={(e) => 
                    setCampaignData({
                      ...campaignData,
                      timeWindow: {
                        