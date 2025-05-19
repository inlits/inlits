import React from 'react';
import { CreditCard, Shield, Zap } from 'lucide-react';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Basic features for individual learners',
    features: [
      'Access to public content',
      'Join up to 3 circles',
      'Basic reading tools',
      'Standard support'
    ],
    current: true
  },
  {
    name: 'Pro',
    price: '$9.99',
    period: 'per month',
    description: 'Advanced features for serious learners',
    features: [
      'Everything in Free',
      'Unlimited circles',
      'Advanced reading tools',
      'Priority support',
      'No ads',
      'Offline access'
    ],
    current: false
  }
];

export function BillingSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Billing & Subscription</h2>
        <p className="text-sm text-muted-foreground">
          Manage your subscription and payment methods
        </p>
      </div>

      {/* Current Plan */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Current Plan</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plans.map(plan => (
            <div
              key={plan.name}
              className={`relative rounded-lg border-2 p-6 ${
                plan.current
                  ? 'border-primary bg-primary/5'
                  : 'border-input hover:border-primary/50'
              }`}
            >
              {plan.current && (
                <div className="absolute top-4 right-4 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  Current Plan
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-semibold">{plan.name}</h4>
                  <div className="mt-1">
                    <span className="text-2xl font-bold">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">
                      /{plan.period}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {plan.description}
                  </p>
                </div>

                <ul className="space-y-2">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Zap className="w-4 h-4 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  className={`w-full rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    plan.current
                      ? 'bg-primary/10 text-primary cursor-default'
                      : 'bg-primary text-primary-foreground hover:bg-primary/90'
                  }`}
                  disabled={plan.current}
                >
                  {plan.current ? 'Current Plan' : 'Upgrade'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Methods */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Payment Methods</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">•••• 4242</p>
                <p className="text-sm text-muted-foreground">Expires 12/25</p>
              </div>
            </div>
            <button className="text-sm text-primary hover:underline">
               Edit</button>
          </div>

          <button className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-dashed hover:border-primary/50 transition-colors">
            <CreditCard className="w-4 h-4" />
            <span className="text-sm">Add payment method</span>
          </button>
        </div>
      </div>

      {/* Billing History */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Billing History</h3>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium">Pro Plan Subscription</p>
              <p className="text-sm text-muted-foreground">Mar 1, 2025</p>
            </div>
            <div className="text-right">
              <p className="font-medium">$9.99</p>
              <button className="text-sm text-primary hover:underline">
                Download
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium">Pro Plan Subscription</p>
              <p className="text-sm text-muted-foreground">Feb 1, 2025</p>
            </div>
            <div className="text-right">
              <p className="font-medium">$9.99</p>
              <button className="text-sm text-primary hover:underline">
                Download
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Security Note */}
      <div className="flex items-center gap-2 p-4 rounded-lg bg-muted/50">
        <Shield className="w-5 h-5 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Your payment information is securely processed and stored by our payment provider.
        </p>
      </div>
    </div>
  );
}