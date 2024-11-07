// src/services/reportingService.ts

import { PrismaClient } from '@prisma/client';
import { ExcelJS } from 'exceljs';
import { format } from 'date-fns';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

interface ReportOptions {
  startDate: Date;
  endDate: Date;
  campaignId?: string;
  userId?: string;
  groupBy?: 'day' | 'week' | 'month';
  metrics?: string[];
}

export class ReportingService {
  // Génération de rapports détaillés
  static async generateReport(options: ReportOptions) {
    try {
      // Construction de la requête
      const where = {
        createdAt: {
          gte: options.startDate,
          lte: options.endDate
        },
        ...(options.campaignId && { campaignId: options.campaignId }),
        ...(options.userId && { userId: options.userId })
      };

      // Récupération des données
      const [calls, contacts, conversions] = await Promise.all([
        this.getCallMetrics(where, options.groupBy),
        this.getContactMetrics(where),
        this.getConversionMetrics(where)
      ]);

      // Création du workbook Excel
      const workbook = new ExcelJS.Workbook();
      
      // Feuille de synthèse
      const summarySheet = workbook.addWorksheet('Synthèse');
      this.addSummarySheet(summarySheet, { calls, contacts, conversions });

      // Feuille détaillée des appels
      const callsSheet = workbook.addWorksheet('Détails des appels');
      this.addCallDetailsSheet(callsSheet, calls);

      // Feuille d'analyse des conversations
      const analysisSheet = workbook.addWorksheet('Analyse conversations');
      this.addConversationAnalysisSheet(analysisSheet, calls);

      return workbook;
    } catch (error) {
      logger.error('Report generation error:', error);
      throw error;
    }
  }

  // Métriques des appels
  private static async getCallMetrics(where: any, groupBy?: string) {
    const groupByClause = groupBy ? {
      _count: true,
      _avg: {
        duration: true
      },
      _sum: {
        duration: true
      },
      by: [groupBy]
    } : {};

    return prisma.call.groupBy({
      by: ['status'],
      where,
      ...groupByClause
    });
  }

  // Métriques des contacts
  private static async getContactMetrics(where: any) {
    return prisma.contact.aggregate({
      where,
      _count: {
        id: true
      },
      _avg: {
        calls: true
      }
    });
  }

  // Métriques de conversion
  private static async getConversionMetrics(where: any) {
    return prisma.call.groupBy({
      by: ['outcome'],
      where: {
        ...where,
        outcome: {
          not: null
        }
      },
      _count: true
    });
  }

  // Ajout de la feuille de synthèse
  private static addSummarySheet(sheet: ExcelJS.Worksheet, data: any) {
    sheet.addRow(['Période du rapport', `${format(data.startDate, 'dd/MM/yyyy')} au ${format(data.endDate, 'dd/MM/yyyy')}`]);
    sheet.addRow(['Total des appels', data.calls.length]);
    sheet.addRow(['Taux de réponse', `${(data.calls.filter(c => c.status === 'answered').length / data.calls.length * 100).toFixed(2)}%`]);
    // ... autres métriques
  }

  // Ajout de la feuille détaillée des appels
  private static addCallDetailsSheet(sheet: ExcelJS.Worksheet, calls: any[]) {
    sheet.addRow(['Date', 'Contact', 'Durée', 'Statut', 'Résultat']);
    calls.forEach(call => {
      sheet.addRow([
        format(call.createdAt, 'dd/MM/yyyy HH:mm'),
        call.contact.phone,
        call.duration,
        call.status,
        call.outcome
      ]);
    });
  }

  // Ajout de la feuille d'analyse des conversations
  private static addConversationAnalysisSheet(sheet: ExcelJS.Worksheet, calls: any[]) {
    sheet.addRow(['ID Appel', 'Sentiment', 'Mots-clés', 'Intentions détectées']);
    calls.forEach(call => {
      if (call.analysis) {
        sheet.addRow([
          call.id,
          call.analysis.sentiment,
          call.analysis.keywords.join(', '),
          call.analysis.intentions.join(', ')
        ]);
      }
    });
  }
}
