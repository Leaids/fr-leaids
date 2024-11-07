// src/utils/twilio.ts

import twilio from 'twilio';
import { OpenAI } from './openai';
import { ElevenLabs } from './elevenlabs';
import { logger } from './logger';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

interface CallOptions {
  to: string;
  callId: string;
  agentScript: any;
  agentVoice: string;
}

export class TwilioService {
  // Configuration initiale pour une campagne
  static async setupCampaign(campaignId: string) {
    try {
      // Création d'un TwiML App pour la campagne
      const app = await client.applications.create({
        voiceUrl: `${process.env.BASE_URL}/api/twilio/voice/${campaignId}`,
        voiceMethod: 'POST',
        statusCallback: `${process.env.BASE_URL}/api/twilio/status/${campaignId}`,
        statusCallbackMethod: 'POST'
      });

      return app;
    } catch (error) {
      logger.error('Twilio setup error:', error);
      throw error;
    }
  }

  // Initiation d'un appel
  static async initiateCall(options: CallOptions) {
    try {
      const call = await client.calls.create({
        to: options.to,
        from: process.env.TWILIO_PHONE_NUMBER,
        url: `${process.env.BASE_URL}/api/twilio/voice/${options.callId}`,
        statusCallback: `${process.env.BASE_URL}/api/twilio/status/${options.callId}`,
        statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
        statusCallbackMethod: 'POST',
        record: true
      });

      logger.info(`Call initiated: ${call.sid}`);
      return call;
    } catch (error) {
      logger.error('Call initiation error:', error);
      throw error;
    }
  }

  // Gestion des réponses vocales
  static async handleVoiceWebhook(callId: string, userInput: string) {
    try {
      // Traitement de l'entrée utilisateur avec GPT
      const response = await OpenAI.createCompletion({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an AI phone agent..."
          },
          {
            role: "user",
            content: userInput
          }
        ]
      });

      // Conversion du texte en parole
      const audioUrl = await ElevenLabs.textToSpeech(
        "voice-id",
        response.choices[0].message.content
      );

      // Création de la réponse TwiML
      const twiml = new twilio.twiml.VoiceResponse();
      twiml.play(audioUrl);
      twiml.gather({
        input: 'speech',
        action: `/api/twilio/gather/${callId}`,
        method: 'POST'
      });

      return twiml.toString();
    } catch (error) {
      logger.error('Voice webhook error:', error);
      throw error;
    }
  }

  // Téléchargement de l'enregistrement
  static async downloadRecording(recordingSid: string) {
    try {
      const recording = await client.recordings(recordingSid)
                             .fetch();
      
      // Téléchargement et stockage de l'enregistrement
      const response = await fetch(recording.mediaUrl);
      const buffer = await response.buffer();

      // Ici, vous pouvez ajouter la logique pour stocker le fichier
      // par exemple dans S3 ou un autre système de stockage

      return buffer;
    } catch (error) {
      logger.error('Recording download error:', error);
      throw error;
    }
  }
}
