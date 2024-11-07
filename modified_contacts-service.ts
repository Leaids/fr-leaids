// src/services/contactService.ts

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

interface CreateContactDto {
  firstName: string;
  lastName?: string;
  phone: string;
  email?: string;
  tags?: string[];
  notes?: string;
  userId: string;
}

export class ContactService {
  // Création d'un contact
  static async createContact(data: CreateContactDto) {
    try {
      // Vérification si le numéro existe déjà pour cet utilisateur
      const existingContact = await prisma.contact.findFirst({
        where: {
          userId: data.userId,
          phone: data.phone
        }
      });

      if (existingContact) {
        throw new Error('Ce numéro existe déjà dans vos contacts');
      }

      // Création du contact
      const contact = await prisma.contact.create({
        data: {
          ...data,
          tags: data.tags || [],
          status: 'active'
        }
      });

      logger.info(`Contact created: ${contact.id}`);
      return contact;
    } catch (error) {
      logger.error('Contact creation error:', error);
      throw error;
    }
  }

  // Import de contacts en masse
  static async bulkImport(contacts: CreateContactDto[], userId: string) {
    try {
      const importedContacts = await prisma.$transaction(async (prisma) => {
        const results = [];
        
        for (const contact of contacts) {
          const result = await prisma.contact.create({
            data: {
              ...contact,
              userId,
              tags: contact.tags || [],
              status: 'active'
            }
          });
          results.push(result);
        }
        
        return results;
      });

      logger.info(`Bulk imported ${importedContacts.length} contacts`);
      return importedContacts;
    } catch (error) {
      logger.error('Bulk import error:', error);
      throw error;
    }
  }

  // Récupération des contacts avec pagination
  static async getContacts(userId: string, page = 1, limit = 10, search?: string) {
    try {
      const where = {
        userId,
        ...(search ? {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search } }
          ]
        } : {})
      };

      const [contacts, total] = await Promise.all([
        prisma.contact.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            calls: {
              select: {
                id: true,
                status: true,
                duration: true,
                createdAt: true
              }
            }
          }
        }),
        prisma.contact.count({ where })
      ]);

      return {
        contacts,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          current: page
        }
      };
    } catch (error) {
      logger.error('Get contacts error:', error);
      throw error;
    }
  }

  // Mise à jour d'un contact
  static async updateContact(id: string, userId: string, data: Partial<CreateContactDto>) {
    try {
      const contact = await prisma.contact.findFirst({
        where: { id, userId }
      });

      if (!contact) {
        throw new Error('Contact not found');
      }

      const updated = await prisma.contact.update({
        where: { id },
        data
      });

      logger.info(`Contact updated: ${id}`);
      return updated;
    } catch (error) {
      logger.error('Update contact error:', error);
      throw error;
    }
  }
}
