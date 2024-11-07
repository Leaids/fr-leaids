// src/server.ts

import express from 'express';
import axios from 'axios';
import cors from 'cors';
import helmet from 'helmet';
import { PrismaClient } from '@prisma/client';
import { configureRoutes } from './routes';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

// Initialisation de Prisma pour la base de données
const prisma = new PrismaClient();

// Création de l'application Express
const app = express();

// Configuration des middleware de sécurité
app.use(helmet());  // Protection contre les vulnérabilités web courantes
app.use(cors({      // Configuration CORS pour permettre les requêtes du frontend
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Middleware pour parser le JSON
app.use(express.json());

// Middleware pour logger les requêtes
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Configuration des routes
configureRoutes(app);

// Middleware de gestion d'erreurs
app.use(errorHandler);

// Port d'écoute du serveur
const PORT = process.env.PORT || 3001;

// Démarrage du serveur
const startServer = async () => {
  try {
    await prisma.$connect();
    logger.info('Connected to database successfully');

    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
