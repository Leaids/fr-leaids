// src/controllers/twilioWebhookController.ts

import { Request, Response } from 'express';
import { TwilioService } from '../utils/twilio';
import { OpenAIService } from '../utils/openai';
import { CallService } from '../services/callService';
import { logger } from '../utils/logger';

export class TwilioWebhookController {
  // Gestion de l'appel entrant
  static async handleVoiceWebhook(req: Request, res: Response) {
    try {
      const { callId } = req.params;
      const { CallSid, CallStatus, SpeechResult } = req.body;

      logger.info(`Received voice webhook for call ${CallSid}`, {
        status: CallStatus,
        speechResult: SpeechResult
      });

      // Mise à jour du statut de l'appel
      await CallService.updateCallStatus(callId, CallStatus);

      if (SpeechResult) {
        // Analyse du sentiment et de l'intention
        const analysis = await OpenAIService.analyzeConversation(SpeechResult);

        // Génération de la réponse de l'agent
        const agentResponse = await TwilioService.handleVoiceResponse(
          callId,
          SpeechResult,
          analysis
        );

        res.type('text/xml').send(agentResponse);
      } else {
        // Premier message de l'agent
        const initialResponse = await TwilioService.getInitialGreeting(callId);
        res.type('text/xml').send(initialResponse);
      }
    } catch (error) {
      logger.error('Voice webhook error:', error);
      res.status(500).send('Error processing voice webhook');
    }
  }

  // Gestion des événements d'état
  static async handleStatusWebhook(req: Request, res: Response) {
    try {
      const { callId } = req.params;
      const {
        CallSid,
        CallStatus,
        CallDuration,
        RecordingUrl,
        RecordingSid
      } = req.body;

      logger.info(`Received status webhook for call ${CallSid}`, {
        status: CallStatus,
        duration: CallDuration
      });

      // Traitement selon le statut
      switch (CallStatus) {
        case 'completed':
          await CallService.handleCallCompletion(callId, {
            duration: parseInt(CallDuration),
            recordingUrl: RecordingUrl,
            recordingSid: RecordingSid
          });
          break;

        case 'failed':
        case 'busy':
        case 'no-answer':
          await CallService.handleCallFailure(callId, CallStatus);
          break;

        default:
          await CallService.updateCallStatus(callId, CallStatus);
      }

      res.status(200).send('Webhook processed');
    } catch (error) {
      logger.error('Status webhook error:', error);
      res.status(500).send('Error processing status webhook');
    }
  }

  // Gestion des transcriptions
  static async handleTranscriptionWebhook(req: Request, res: Response) {
    try {
      const { callId } = req.params;
      const { TranscriptionText, TranscriptionStatus } = req.body;

      if (TranscriptionStatus === 'completed') {
        await CallService.saveTranscription(callId, TranscriptionText);
        
        // Analyse de la conversation
        const analysis = await OpenAIService.analyzeTranscription(TranscriptionText);
        await CallService.saveAnalysis(callId, analysis);
      }

      res.status(200).send('Transcription processed');
    } catch (error) {
      logger.error('Transcription webhook error:', error);
      res.status(500).send('Error processing transcription');
    }
  }
}
