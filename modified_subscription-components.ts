// src/components/billing/PricingPlans.tsx

import React from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { useBilling } from '@/hooks/useBilling';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY!);

export const PricingPlans = () => {
  const { createSubscription, isLoading } = useBilling();
  
  const plans = [
    {
      name: 'Starter',
      price: '49',
      features: [
        '100 appels/mois',
        '1 agent AI',
        'Support email',
        'Analyses basiques'
      ],
      priceId: 'price_starter'
    },
    {
      name: 'Professional',
      price: '199',
      features: [
        '500 appels/mois',
        '3 agents AI',
        'Support prioritaire',
        'Analyses avancées',
        'API access'
      ],
      priceId: 'price_pro'
    },
    {
      name: 'Enterprise',
      price: '499',
      features: [
        'Appels illimités',
        'Agents AI illimités',
        'Support dédié',
        'Analyses personnalisées',
        'API illimitée',
        'Intégrations sur mesure'
      ],
      priceId: 'price_enterprise'
    }
  ];

  const handleSubscribe = async (priceId: string) => {
    try {
      const { clientSecret } = await createSubscription(priceId);
      const stripe = await stripePromise;
      
      await stripe?.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement('card')!,
          billing_details: {
            name: 'Jenny Rosen',
          },
        }
      });
    } catch (error) {
      console.error('Subscription error:', error);
    }
  };

  return (
    <div className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-base font-semibold leading-7 text-indigo-600">Tarification</h2>
          <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Choisissez votre plan
          </p>
        </div>
        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className="rounded-3xl p-8 ring-1 ring-gray-200 hover:shadow-lg transition-all duration-300"
            >
              <h3 className="text-lg font-semibold leading-8 text-gray-900">
                {plan.name}
              </h3>
              <p className="mt-4 flex items-baseline gap-x-2">
                <span className="text-4xl font-bold tracking-tight text-gray-900">
                  {plan.price}€
                </span>
                <span className="text-sm font-semibold leading-6 text-gray-600">
                  /mois
                </span>
              </p>
              <ul className="mt-8 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-x-3">
                    <svg
                      className="h-6 w-5 flex-none text-indigo-600"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-sm leading-6 text-gray-600">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSubscribe(plan.priceId)}
                disabled={isLoading}
                className="mt-8 w-full rounded-md bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
              >
                {isLoading ? 'Chargement...' : 'Commencer'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// src/components/billing/UsageStats.tsx
export const UsageStats = () => {
  const { usage, subscription } = useBilling();

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900">
        Utilisation du compte
      </h3>
      <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="px-4 py-5 bg-gray-50 shadow rounded-lg overflow-hidden sm:p-6">
          <dt className="text-sm font-medium text-gray-500 truncate">
            Appels ce mois
          </dt>
          <dd className="mt-1 text-3xl font-semibold text-gray-900">
            {usage.monthlyCalls} / {subscription.maxCalls}
          </dd>
        </div>
        <div className="px-4 py-5 bg-gray-50 shadow rounded-lg overflow-hidden sm:p-6">
          <dt className="text-sm font-medium text-gray-500 truncate">
            Crédits restants
          </dt>
          <dd className="mt-1 text-3xl font-semibold text-gray-900">
            {usage.credits}
          </dd>
        </div>
      </dl>
    </div>
  );
};
