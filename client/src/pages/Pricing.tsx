import React from 'react';
import { Check, ArrowLeft } from 'lucide-react';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';

const Pricing: React.FC = () => {
  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for getting started with resume optimization",
      features: [
        "3 resume analyses per month",
        "Basic ATS scoring",
        "Keyword suggestions",
        "Standard optimization",
        "Email support"
      ],
      cta: "Get Started Free",
      popular: false,
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      name: "Pro",
      price: "$19",
      period: "per month",
      description: "Best for active job seekers",
      features: [
        "Unlimited resume analyses",
        "Advanced ATS scoring with breakdown",
        "AI-powered optimization",
        "Multiple resume versions",
        "Job description matching",
        "Priority email support",
        "Resume templates",
        "Career insights"
      ],
      cta: "Start Pro Trial",
      popular: true,
      gradient: "from-purple-500 to-pink-500"
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "contact us",
      description: "For teams and organizations",
      features: [
        "Everything in Pro",
        "Team collaboration tools",
        "Custom branding",
        "API access",
        "Dedicated account manager",
        "Custom integrations",
        "Training & onboarding",
        "SLA guarantee"
      ],
      cta: "Contact Sales",
      popular: false,
      gradient: "from-yellow-500 to-orange-500"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-16 max-w-7xl">
        {/* Back to Home Button */}
        <div className="mb-8">
          <Link
            to="/app"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg font-semibold transition-all duration-300 shadow-md hover:shadow-lg group"
          >
            <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-2 mb-4">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Pricing Plans
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose the perfect plan for your career journey. All plans include our core AI-powered features.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 ${
                plan.popular ? 'border-purple-500 relative' : 'border-gray-100'
              } hover:-translate-y-2`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              <h3 className="text-2xl font-bold text-gray-800 mb-2">{plan.name}</h3>

              <div className="mb-4">
                <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                {plan.price !== "Custom" && <span className="text-gray-600"> / {plan.period}</span>}
                {plan.price === "Custom" && <span className="text-gray-600 text-lg"> - {plan.period}</span>}
              </div>

              <p className="text-gray-600 mb-6">{plan.description}</p>

              <button
                className={`w-full py-3 rounded-full font-semibold mb-6 transition-all duration-300 ${
                  plan.popular
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-xl hover:scale-105'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                {plan.cta}
              </button>

              <ul className="space-y-3">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-2xl p-12 shadow-xl mb-16">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Can I cancel anytime?</h4>
              <p className="text-gray-600">Yes! You can cancel your subscription at any time with no penalties.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Do you offer refunds?</h4>
              <p className="text-gray-600">We offer a 14-day money-back guarantee if you're not satisfied.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Is my data secure?</h4>
              <p className="text-gray-600">Absolutely. We use enterprise-grade encryption and never share your data.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Can I upgrade later?</h4>
              <p className="text-gray-600">Yes, you can upgrade or downgrade your plan at any time.</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="text-gray-600 mb-4">Not sure which plan is right for you?</p>
          <a
            href="mailto:support@mycareerlab.ai"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-2xl transition-all duration-300 hover:scale-105"
          >
            Contact Us for Help
          </a>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Pricing;
