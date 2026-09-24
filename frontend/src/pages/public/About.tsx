import React from 'react';

const About: React.FC = () => {
  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-10">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-extrabold text-ink-text">About TaskHub</h1>
        <p className="text-ink-muted text-sm max-w-2xl mx-auto">
          We are on a mission to democratize global human work through transparent reward technology and modern RESTful architecture.
        </p>
      </div>

      <div className="p-8 rounded-3xl glass-panel border border-hairline space-y-6">
        <h2 className="text-2xl font-bold text-ink-text">Built for Reliability & Trust</h2>
        <p className="text-xs text-ink-muted leading-relaxed">
          TaskHub was architected from the ground up to solve micro-tasking friction: slow worker payouts, opaque dispute resolution, and bad data quality for companies. Our platform integrates state-of-the-art role-based security, HTTPOnly JWT session control, and instant direct settlement.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-hairline">
          <div>
            <span className="text-2xl font-extrabold text-moss-deep">120+</span>
            <p className="text-xs text-ink-muted mt-1">Countries Served</p>
          </div>
          <div>
            <span className="text-2xl font-extrabold text-moss-deep">500,000+</span>
            <p className="text-xs text-ink-muted mt-1">Submissions Verified</p>
          </div>
          <div>
            <span className="text-2xl font-extrabold text-moss-deep">99.9%</span>
            <p className="text-xs text-ink-muted mt-1">Platform Uptime</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
