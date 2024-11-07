// src/services/billingService.ts

import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});

const prisma = new PrismaClient();

const PLANS = {
  STARTER: {
    id: 'price_starter',
    name: 'Starter',
    credits: 1000,
    features: ['100 appels/mois', '1 agent AI', 'Support email']
  },
  PRO: {
    id: 'price_pro',
    name: 'Professional',
    credits: 5000,
    features: ['500 appels/mois', '3 agents AI', 'Support prioritaire']
  },
  ENTERPRISE: {
    id: 'price_enterprise',
    name: 'Enterprise',
    credits: 20000,
    features: ['Appels illimités', 'Agents AI illimités', 'Support dédié']
  }
};

export class BillingService {
  // Création d'un abonnement
  static async createSubscription(userId: string, planId: string) {
    try {
      // Récupération de l'utilisateur
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true }
      });

      if (!user) throw new Error('User not found');

      // Création ou récupération du client Stripe
      let stripeCustomerId = user.stripeCustomerId;
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: { userId }
        });
        stripeCustomerId = customer.id;

        await prisma.user.update({
          where: { id: userId },
          data: { stripeCustomerId }
        });
      }

      // Création de l'abonnement Stripe
      const subscription = await stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [{ price: planId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent']
      });

      // Mise à jour de la base de données
      await prisma.subscription.upsert({
        where: { userId },
        create: {
          userId,
          stripeSubscriptionId: subscription.id,
          plan: PLANS[planId as keyof typeof PLANS].name,
          status: subscription.status,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000)
        },
        update: {
          stripeSubscriptionId: subscription.id,
          plan: PLANS[planId as keyof typeof PLANS].name,
          status: subscription.status,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000)
        }
      });

      return {
        subscriptionId: subscription.id,
        clientSecret: (subscription.latest_invoice as any).payment_intent.client_secret
      };
    } catch (error) {
      logger.error('Subscription creation error:', error);
      throw error;
    }
  }

  // Gestion des webhooks Stripe
  static async handleWebhook(event: Stripe.Event) {
    try {
      switch (event.type) {
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
          const subscription = event.data.object as Stripe.Subscription;
          await this.updateSubscriptionStatus(subscription);
          break;

        case 'invoice.payment_succeeded':
          const invoice = event.data.object as Stripe.Invoice;
          await this.handleSuccessfulPayment(invoice);
          break;

        case 'invoice.payment_failed':
          const failedInvoice = event.data.object as Stripe.Invoice;
          await this.handleFailedPayment(failedInvoice);
          break;
      }
    } catch (error) {
      logger.error('Webhook handling error:', error);
      throw error;
    }
  }

  // Mise à jour du statut d'abonnement
  private static async updateSubscriptionStatus(stripeSubscription: Stripe.Subscription) {
    const subscription = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: stripeSubscription.id }
    });

    if (subscription) {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: stripeSubscription.status,
          currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000)
        }
      });
    }
  }

  // Gestion des paiements réussis
  private static async handleSuccessfulPayment(invoice: Stripe.Invoice) {
    const subscription = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: invoice.subscription as string }
    });

    if (subscription) {
      // Ajout des crédits selon le plan
      const plan = PLANS[subscription.plan as keyof typeof PLANS];
      await this.addCredits(subscription.userId, plan.credits);

      // Création de la facture dans notre système
      await prisma.invoice.create({
        data: {
          userId: subscription.userId,
          stripeInvoiceId: invoice.id,
          amount: invoice.amount_paid,
          status: 'paid',
          date: new Date(invoice.created * 1000)
        }
      });
    }
  }

  // Ajout de crédits
  static async addCredits(userId: string, amount: number) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        credits: {
          increment: amount
        }
      }
    });
  }

  // Utilisation des crédits
  static async useCredits(userId: string, amount: number) {
    const user = await prisma.user.findUnique({ 
      where: { id: userId } 
    });

    if (!user || user.credits < amount) {
      throw new Error('Insufficient credits');
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        credits: {
          decrement: amount
        }
      }
    });

    return true;
  }

  // Vérification de l'éligibilité d'utilisation
  static async checkUsageEligibility(userId: string, feature: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true }
    });

    if (!user?.subscription || user.subscription.status !== 'active') {
      throw new Error('No active subscription');
    }

    const plan = PLANS[user.subscription.plan as keyof typeof PLANS];
    if (!plan) {
      throw new Error('Invalid subscription plan');
    }

    // Vérification des limites selon le plan
    switch (feature) {
      case 'calls':
        const monthlyCallCount = await this.getMonthlyCallCount(userId);
        return monthlyCallCount < plan.maxCalls;
      
      case 'agents':
        const activeAgents = await this.getActiveAgentCount(userId);
        return activeAgents < plan.maxAgents;
      
      default:
        return true;
    }
  }
}
