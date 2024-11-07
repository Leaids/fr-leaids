// src/services/authService.ts

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

interface RegisterData {
  email: string;
  password: string;
  name: string;
  company?: string;
}

interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  }
}

export class AuthService {
  // Création d'un nouvel utilisateur
  static async register(data: RegisterData): Promise<LoginResponse> {
    try {
      // Vérification si l'email existe déjà
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email }
      });

      if (existingUser) {
        throw new Error('Email already exists');
      }

      // Hashage du mot de passe
      const hashedPassword = await bcrypt.hash(data.password, 10);

      // Création de l'utilisateur
      const user = await prisma.user.create({
        data: {
          ...data,
          password: hashedPassword,
          // Création d'un abonnement gratuit par défaut
          subscription: {
            create: {
              plan: 'FREE',
              status: 'active',
              endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 jours
            }
          }
        }
      });

      // Génération du token JWT
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );

      logger.info(`New user registered: ${user.email}`);

      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      };
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  // Connexion d'un utilisateur
  static async login(email: string, password: string): Promise<LoginResponse> {
    try {
      // Recherche de l'utilisateur
      const user = await prisma.user.findUnique({
        where: { email },
        include: { subscription: true }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Vérification du mot de passe
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        throw new Error('Invalid password');
      }

      // Vérification de l'abonnement
      if (user.subscription?.status === 'inactive') {
        logger.warn(`Inactive subscription for user: ${user.email}`);
      }

      // Génération du token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );

      logger.info(`User logged in: ${user.email}`);

      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }
}
