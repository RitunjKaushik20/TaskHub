import React from 'react';
import { Save } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const Settings: React.FC = () => {
  const toast = useToast();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('System Settings Saved!', 'Marketplace settlement parameters updated.');
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-extrabold text-ink-text">Platform System Settings</h1>
        <p className="text-xs text-ink-muted">Configure global marketplace governance, auto-approval thresholds, and security flags.</p>
      </div>

      <div className="p-8 rounded-3xl glass-panel border border-hairline space-y-6">
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1">Max Submissions per Worker / Day</label>
              <input type="number" defaultValue="25" className="w-full glass-input text-xs" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1">Submission Review Window (Days)</label>
              <input type="number" defaultValue="3" className="w-full glass-input text-xs" />
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-hairline">
            <h4 className="text-xs font-bold text-ink-muted uppercase tracking-wider">System Toggles</h4>
            <label className="flex items-center gap-3 text-xs text-ink-muted cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded bg-moss-light/40 border-hairline text-moss-deep focus:ring-moss-primary" />
              Require Worker Identity KYC before first paid submission
            </label>
            <label className="flex items-center gap-3 text-xs text-ink-muted cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded bg-moss-light/40 border-hairline text-moss-deep focus:ring-moss-primary" />
              Enable Automatic 401 JWT Token Refresh Interceptor
            </label>
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-moss-primary hover:bg-moss-deep text-white font-bold text-xs shadow-lg flex items-center gap-2 transition-all"
          >
            <Save className="w-4 h-4" /> Save System Parameters
          </button>
        </form>
      </div>
    </div>
  );
};

export default Settings;
