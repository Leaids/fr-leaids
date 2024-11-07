// src/middleware/auth.ts

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

// Extension de l'interface Request pour inclure l'utilisateur
declare module 'express' {
  interface Request {
    user?: {
      id: string;
      email: string;
      role: string;
    }
  }
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Récupération du token dans le header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Vérification du token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      email: string;
    };

    // Récupération des infos utilisateur
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { subscription: true }
    });

    if (!user) {
      return res.status(403).json({ message: 'User not found' });
    }

    // Vérification de l'abonnement
    if (user.subscription?.status === 'inactive') {
      logger.warn(`Inactive subscription access attempt: ${user.email}`);
      return res.status(403).json({ message: 'Subscription inactive' });
    }

    // Ajout des infos utilisateur à la requête
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(403).json({ message: 'Invalid token' });
  }
};

// Middleware pour vérifier les droits admin
export const isAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};
