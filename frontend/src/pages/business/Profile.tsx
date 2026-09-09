import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Mail,
  Calendar,
  User as UserIcon,
  Building2,
  Save,
  Loader2,
  Sparkles,
  Briefcase,
  Wrench,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { authApi } from '../../api/auth';
import { formatDate } from '../../lib/utils';

const DEFAULT_BUSINESS_SKILLS = [
  'Data Annotation',
  'RLHF',
  'Content Moderation',
  'UX Research',
  'Translation',
];

const BusinessProfile: React.FC = () => {
  const { user, hydrateSession } = useAuth();
  const toast = useToast();

  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setCompanyName(user.companyName || '');
      setBio(user.bio || '');
      setSkills(user.skills || '');
      setAvatarUrl(user.avatarUrl || '');
    }
  }, [user]);

  const handleGenerateLogo = () => {
    const seed = `${companyName || name || 'business'}_${Date.now()}`;
    const newAvatar = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(seed)}`;
    setAvatarUrl(newAvatar);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Contact Name Required', 'Please enter your full contact name.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await authApi.updateProfile({
        name: name.trim(),
        companyName: companyName.trim() || undefined,
        bio: bio.trim() || undefined,
        skills: skills.trim() || undefined,
        avatarUrl: avatarUrl.trim() || undefined,
      });

      if (res.success) {
        toast.success('Business Profile Saved!', 'Your company details and bio have been updated.');
        await hydrateSession();
      } else {
        toast.error('Update Failed', res.message || 'Unable to update profile.');
      }
    } catch {
      toast.error('Update Failed', 'An error occurred while saving your business profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const parsedSkills = skills
    ? skills.split(',').map((s) => s.trim()).filter(Boolean)
    : DEFAULT_BUSINESS_SKILLS;

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Business Organization Profile</h1>
        <p className="text-xs text-slate-600">Manage company branding, administrative contact info, and poster credentials.</p>
      </div>

      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
        {/* Header Preview */}
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-200">
          <div className="relative group">
            <img
              src={avatarUrl || user?.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(user?.email || 'business')}`}
              alt="Logo"
              className="w-24 h-24 rounded-2xl object-cover border-2 border-indigo-500/50 shadow-md bg-white"
            />
            <button
              type="button"
              onClick={handleGenerateLogo}
              title="Generate New Identicon"
              className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2 text-center sm:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-xl font-bold text-slate-900">{companyName || user?.companyName || user?.name}</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Verified Poster
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold flex items-center gap-1">
                <Briefcase className="w-3 h-3" /> BUSINESS
              </span>
            </div>

            <p className="text-xs text-slate-600 flex items-center justify-center sm:justify-start gap-1">
              <UserIcon className="w-3.5 h-3.5 text-slate-400" /> Representative: {name || user?.name}
            </p>

            <p className="text-xs text-slate-600 flex items-center justify-center sm:justify-start gap-1">
              <Mail className="w-3.5 h-3.5 text-slate-400" /> {user?.email}
            </p>

            <p className="text-[11px] text-slate-500 flex items-center justify-center sm:justify-start gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" /> Joined TaskHub on {formatDate(user?.createdAt || new Date().toISOString())}
            </p>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Company / Brand Name */}
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1.5">
                Company / Organization Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none" />
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. CyberNet AI Labs Inc."
                  required
                  className="w-full glass-input !pl-11 !pr-4 text-xs font-semibold"
                />
              </div>
            </div>

            {/* Representative Name */}
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1.5">
                Authorized Representative Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Smith"
                  required
                  className="w-full glass-input !pl-11 !pr-4 text-xs font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Email Address (Read-Only) */}
          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1.5">
              Account Email Address <span className="text-slate-500 text-[10px] font-normal">(Non-editable)</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none" />
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full glass-input !pl-11 !pr-4 text-xs opacity-75 bg-slate-50 cursor-not-allowed text-slate-600 border border-slate-200"
              />
            </div>
          </div>

          {/* Organization Bio */}
          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1.5">
              Company Overview & Project Focus
            </label>
            <div className="relative">
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Describe your organization, types of tasks you typically post (RLHF, UX, translation), and quality standards..."
                className="w-full glass-input text-xs"
              />
            </div>
          </div>

          {/* Target / Required Technical Skills */}
          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1.5">
              Primary Task Domain Skills <span className="text-slate-500 text-[10px] font-normal">(Comma-separated)</span>
            </label>
            <div className="relative">
              <Wrench className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none" />
              <input
                type="text"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="Data Annotation, RLHF, Content Moderation, UX Research, Translation"
                className="w-full glass-input !pl-11 !pr-4 text-xs"
              />
            </div>
          </div>

          {/* Live Skill Badges Preview */}
          <div className="bg-slate-100/80 border border-slate-200 p-4 rounded-2xl space-y-2">
            <span className="text-slate-700 font-bold text-xs uppercase tracking-wider block">
              Skill Badges Preview
            </span>
            <div className="flex flex-wrap gap-2 text-xs">
              {parsedSkills.map((skill) => (
                <span
                  key={skill}
                  className="bg-brand-50 border border-brand-200 text-brand-700 font-semibold px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand-600" /> {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving Details...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save Business Profile
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BusinessProfile;
