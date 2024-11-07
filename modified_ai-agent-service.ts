// src/services/aiAgentService.ts

import { PrismaClient } from '@prisma/client';
import { OpenAI } from '@/utils/openai';
import { ElevenLabs } from '@/utils/elevenlabs';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

interface AgentScript {
  initialGreeting: string;
  nodes: {
    id: string;
    message: string;
    responses: {
      pattern: string;
      nextNode: string;
      action?: string;
    }[];
  }[];
}

export class AIAgentService {
  // Création d'un nouvel agent
  static async createAgent(userId: string, data: {
    name: string;
    voice: string;
    script: AgentScript;
  }) {
    try {
      // Validation du script
      this.validateScript(data.script);

      // Créer l'agent dans la base de données
      const agent = await prisma.aIAgent.create({
        data: {
          userId,
          name: data.name,
          voice: data.voice,
          script: data.script,
          status: 'draft'
        }
      });

      // Générer les échantillons vocaux
      await ElevenLabs.generateSamples(data.voice, [
        data.script.initialGreeting,
        // Échantillon des premiers messages...
        data.script.nodes[0].message
      ]);

      logger.info(`AI Agent created: ${agent.id}`);
      return agent;
    } catch (error) {
      logger.error('Agent creation error:', error);
      throw error;
    }
  }

  // Validation du script de conversation
  private static validateScript(script: AgentScript) {
    if (!script.initialGreeting) {
      throw new Error('Initial greeting is required');
    }

    if (!script.nodes || script.nodes.length === 0) {
      throw new Error('Script must contain at least one node');
    }

    // Vérifier que tous les nextNode existent
    const nodeIds = new Set(script.nodes.map(n => n.id));
    for (const node of script.nodes) {
      for (const response of node.responses) {
        if (response.nextNode !== 'END' && !nodeIds.has(response.nextNode)) {
          throw new Error(`Invalid nextNode reference: ${response.nextNode}`);
        }
      }
    }
  }

  // Test d'un agent
  static async testAgent(agentId: string, userId: string, testInput: string) {
    try {
      const agent = await prisma.aIAgent.findFirst({
        where: { id: agentId, userId }
      });

      if (!agent) {
        throw new Error('Agent not found');
      }

      // Simuler une réponse de l'agent
      const response = await OpenAI.createCompletion({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are an AI agent with the following script: ${JSON.stringify(agent.script)}`
          },
          {
            role: "user",
            content: testInput
          }
        ]
      });

      // Générer l'audio de la réponse
      const audioUrl = await ElevenLabs.textToSpeech(
        agent.voice,
        response.choices[0].message.content
      );

      return {
        text: response.choices[0].message.content,
        audioUrl
      };
    } catch (error) {
      logger.error('Agent test error:', error);
      throw error;
    }
  }

  // Récupération des agents d'un utilisateur
  static async getAgents(userId: string) {
    return prisma.aIAgent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }
}
