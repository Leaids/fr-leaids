// src/components/agents/AgentBuilder.tsx

import React, { useState } from 'react';
import { useAgent } from '@/hooks/useAgent';
import { FlowEditor } from './FlowEditor';
import { VoiceSelector } from './VoiceSelector';
import { TestPanel } from './TestPanel';

export const AgentBuilder = () => {
  const [currentStep, setCurrentStep] = useState('info');
  const { createAgent, isLoading } = useAgent();
  const [agentData, setAgentData] = useState({
    name: '',
    voice: '',
    script: {
      initialGreeting: '',
      nodes: []
    }
  });

  const steps = [
    { id: 'info', name: 'Informations' },
    { id: 'voice', name: 'Voix' },
    { id: 'script', name: 'Script' },
    { id: 'test', name: 'Test' }
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Stepper */}
      <div className="mb-8">
        <nav aria-label="Progress">
          <ol className="flex items-center">
            {steps.map((step, stepIdx) => (
              <li
                key={step.id}
                className={`${
                  stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''
                } relative`}
              >
                <button
                  onClick={() => setCurrentStep(step.id)}
                  className={`${
                    currentStep === step.id
                      ? 'border-indigo-600 bg-indigo-600 text-white'
                      : 'border-gray-300 bg-white'
                  } flex h-10 w-10 items-center justify-center rounded-full border-2`}
                >
                  <span className="text-sm font-medium">
                    {stepIdx + 1}
                  </span>
                </button>
                <div className="mt-2 text-sm font-medium text-gray-900">
                  {step.name}
                </div>
              </li>
            ))}
          </ol>
        </nav>
      </div>

      {/* Contenu des étapes */}
      {currentStep === 'info' && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">
            Informations de l'agent
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nom de l'agent
              </label>
              <input
                type="text"
                value={agentData.name}
                onChange={(e) => 
                  setAgentData({ ...agentData, name: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>
          </div>
        </div>
      )}

      {currentStep === 'voice' && (
        <VoiceSelector
          selectedVoice={agentData.voice}
          onSelect={(voice) => 
            setAgentData({ ...agentData, voice })
          }
        />
      )}

      {currentStep === 'script' && (
        <FlowEditor
          value={agentData.script}
          onChange={(script) => 
            setAgentData({ ...agentData, script })
          }
        />
      )}

      {currentStep === 'test' && (
        <TestPanel
          agentData={agentData}
          onTest={(input) => {
            // Logique de test
          }}
        />
      )}

      {/* Actions */}
      <div className="mt-6 flex justify-between">
        <button
          onClick={() => {
            const currentIndex = steps.findIndex(s => s.id === currentStep);
            if (currentIndex > 0) {
              setCurrentStep(steps[currentIndex - 1].id);
            }
          }}
          className="px-4 py-2 border rounded-md"
        >
          Précédent
        </button>
        
        {currentStep === steps[steps.length - 1].id ? (
          <button
            onClick={async () => {
              try {
                await createAgent(agentData);
                // Redirection vers la liste des agents
              } catch (error) {
                console.error('Error creating agent:', error);
              }
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md"
            disabled={isLoading}
          >
            {isLoading ? 'Création...' : 'Créer l'agent'}
          </button>
        ) : (
          <button
            onClick={() => {
              const currentIndex = steps.findIndex(s => s.id === currentStep);
              if (currentIndex < steps.length - 1) {
                setCurrentStep(steps[currentIndex + 1].id);
              }
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md"
          >
            Suivant
          </button>
        )}
      </div>
    </div>
  );
};
