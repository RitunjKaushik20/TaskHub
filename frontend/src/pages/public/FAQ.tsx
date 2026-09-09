import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How does direct reward protection work on TaskHub?',
      a: 'When a business posts a task, the total reward budget is committed on TaskHub. Once a worker completes the work and the business approves the submission proof, funds automatically transfer to the worker earnings.',
    },
    {
      q: 'What happens if a business rejects my submission?',
      a: 'The business must provide a valid rejection reason and optional feedback. If you feel a rejection was unfair, you can request an Admin Audit where TaskHub moderators review your submitted proof.',
    },
    {
      q: 'How do task payouts work on TaskHub?',
      a: 'When a business approves your submitted proof, task rewards are automatically released directly into your worker earnings.',
    },
    {
      q: 'Can I switch between Worker and Business roles?',
      a: 'Each account has a primary role selected during registration. However, you can register secondary worker or business profiles using distinct emails.',
    },
    {
      q: 'What file formats can be uploaded as task proof?',
      a: 'Workers can submit text summaries, external URLs (GitHub, Google Docs, Loom), or file attachments up to 50MB.',
    },
  ];

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-extrabold text-white">Frequently Asked Questions</h1>
        <p className="text-slate-400 text-sm">
          Everything you need to know about task payouts, payment security, and role permissions.
        </p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={index}
              className="p-5 rounded-2xl glass-panel border border-slate-800 transition-all cursor-pointer"
              onClick={() => setOpenIndex(isOpen ? null : index)}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-brand-accent" /> {faq.q}
                </h3>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </div>
              {isOpen && (
                <p className="mt-3 text-xs text-slate-300 leading-relaxed pl-6 border-l border-brand-500/30">
                  {faq.a}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FAQ;
