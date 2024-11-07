// src/services/campaignService.ts

import { PrismaClient } from '@prisma/client';
import { TwilioService } from '../utils/twilio';
import { AIAgentService } from './aiAgentService';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

interface CreateCampaignDTO {
  name: string;
  agentId: string;
  contactIds: string[];
  scheduleStart?: Date;
  scheduleEnd?: Date;
  callsPerDay?: number;
  timeWindow?: {
    start: string; // format: "HH:mm"
    end: string;   // format: "HH:mm"
  };
}

export class CampaignService {
  // Création d'une nouvelle campagne
  static async createCampaign(userId: string, data: CreateCampaignDTO) {
    try {
      // Vérification de l'agent
      const agent = await prisma.aIAgent.findFirst({
        where: { id: data.agentId, userId }
      });

      if (!agent) {
        throw new Error('Agent not found');
      }

      // Création de la campagne
      const campaign = await prisma.campaign.create({
        data: {
          userId,
          name: data.name,
          agentId: data.agentId,
          status: 'scheduled',
          startDate: data.scheduleStart || new Date(),
          endDate: data.scheduleEnd,
          settings: {
            callsPerDay: data.callsPerDay || 50,
            timeWindow: data.timeWindow || { start: "09:00", end: "17:00" }
          }
        }
      });

      // Association des contacts
      await prisma.campaignContact.createMany({
        data: data.contactIds.map(contactId => ({
          campaignId: campaign.id,
          contactId,
          status: 'pending'
        }))
      });

      // Initialisation de Twilio pour la campagne
      await TwilioService.setupCampaign(campaign.id);

      logger.info(`Campaign created: ${campaign.id}`);
      return campaign;
    } catch (error) {
      logger.error('Campaign creation error:', error);
      throw error;
    }
  }

  // Démarrage d'une campagne
  static async startCampaign(campaignId: string, userId: string) {
    try {
      const campaign = await prisma.campaign.findFirst({
        where: { id: campaignId, userId },
        include: {
          contacts: {
            include: { contact: true }
          },
          agent: true
        }
      });

      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Mise à jour du statut
      await prisma.campaign.update({
        where: { id: campaignId },
        data: { status: 'active' }
      });

      // Démarrage des appels
      this.processNextCalls(campaign);

      logger.info(`Campaign started: ${campaignId}`);
    } catch (error) {
      logger.error('Campaign start error:', error);
      throw error;
    }
  }

  // Traitement des appels
  private static async processNextCalls(campaign: any) {
    try {
      const pendingContacts = await prisma.campaignContact.findMany({
        where: {
          campaignId: campaign.id,
          status: 'pending'
        },
        take: campaign.settings.callsPerDay,
        include: {
          contact: true
        }
      });

      for (const campaignContact of pendingContacts) {
        // Création d'un appel dans la base de données
        const call = await prisma.call.create({
          data: {
            campaignId: campaign.id,
            contactId: campaignContact.contactId,
            status: 'queued',
            startTime: new Date()
          }
        });

        // Initiation de l'appel via Twilio
        await TwilioService.initiateCall({
          to: campaignContact.contact.phone,
          callId: call.id,
          agentScript: campaign.agent.script,
          agentVoice: campaign.agent.voice
        });

        // Mise à jour du statut du contact dans la campagne
        await prisma.campaignContact.update({
          where: {
            campaignId_contactId: {
              campaignId: campaign.id,
              contactId: campaignContact.contactId
            }
          },
          data: { status: 'in_progress' }
        });
      }
    } catch (error) {
      logger.error('Process calls error:', error);
      throw error;
    }
  }

  // Gestion des webhooks Twilio
  static async handleCallWebhook(callId: string, event: string, data: any) {
    try {
      switch (event) {
        case 'initiated':
          await this.updateCallStatus(callId, 'in_progress');
          break;
        case 'completed':
          await this.handleCallCompletion(callId, data);
          break;
        case 'failed':
          await this.handleCallFailure(callId, data);
          break;
      }
    } catch (error) {
      logger.error('Call webhook error:', error);
      throw error;
    }
  }
}
