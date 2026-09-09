import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Mail,
  Calendar,
  User as UserIcon,
  Wrench,
  Save,
  Loader2,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { authApi } from '../../api/auth';
import { formatDate } from '../../lib/utils';

const DEFAULT_SKILLS = ['Computer Vision', 'Data Annotation', 'Python', 'UX Evaluation', 'REST API'];

const WorkerProfile: React.FC = () => {
  const { user, hydrateSession } = useAuth();
  const toast = useToast();

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setBio(user.bio || '');
      setSkills(user.skills || DEFAULT_SKILLS.join(', '));
      setAvatarUrl(user.avatarUrl || '');
    }
  }, [user]);

  const handleGenerateDicebear = () => {
    const seed = `${name || 'worker'}_${Date.now()}`;
    const newAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(seed)}`;
    setAvatarUrl(newAvatar);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name Required', 'Please enter your full name.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await authApi.updateProfile({
        name: name.trim(),
        bio: bio.trim(),
        skills: skills.trim(),
        avatarUrl: avatarUrl.trim() || undefined,
      });

      if (res.success) {
        toast.success('Profile Updated!', 'Your worker credentials and skills have been saved.');
        await hydrateSession();
      } else {
        toast.error('Update Failed', res.message || 'Unable to update profile.');
      }
    } catch {
      toast.error('Update Failed', 'An error occurred while saving your profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const parsedSkills = skills
    ? skills.split(',').map((s) => s.trim()).filter(Boolean)
    : DEFAULT_SKILLS;

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Worker Profile & Credentials</h1>
        <p className="text-xs text-slate-400">Manage your public worker identity, technical skill badges, and bio details.</p>
      </div>

      {/* Main Profile Card */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-slate-800 space-y-6">
        {/* Header Preview */}
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-800/80">
          <div className="relative group">
            <img
              src={avatarUrl || user?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user?.email || 'worker')}`}
              alt="Avatar"
              className="w-24 h-24 rounded-2xl object-cover border-2 border-emerald-500/50 shadow-xl bg-slate-900"
            />
            <button
              type="button"
              onClick={handleGenerateDicebear}
              title="Generate New Avatar"
              className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white shadow-lg transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2 text-center sm:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-xl font-bold text-white">{name || user?.name}</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> KYC Verified
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/30 text-[10px] font-bold">
                WORKER
              </span>
            </div>

            <p className="text-xs text-slate-400 flex items-center justify-center sm:justify-start gap-1">
              <Mail className="w-3.5 h-3.5 text-slate-500" /> {user?.email}
            </p>

            <p className="text-[11px] text-slate-500 flex items-center justify-center sm:justify-start gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" /> Joined TaskHub on {formatDate(user?.createdAt || new Date().toISOString())}
            </p>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Full Name <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 z-10 pointer-events-none" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Full Name"
                  required
                  className="w-full glass-input !pl-11 !pr-4 text-xs font-semibold"
                />
              </div>
            </div>

            {/* Email Address (Read-Only) */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Address <span className="text-slate-500 text-[10px] font-normal">(Account Identifier)</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 z-10 pointer-events-none" />
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full glass-input !pl-11 !pr-4 text-xs opacity-60 bg-slate-950 cursor-not-allowed text-slate-400"
                />
              </div>
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Professional Bio & Experience
            </label>
            <div className="relative">
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell task posters about your background, labeling accuracy, research experience, and availability..."
                className="w-full glass-input text-xs"
              />
            </div>
          </div>

          {/* Verified Skills */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Verified Technical Skills <span className="text-slate-500 text-[10px] font-normal">(Comma-separated)</span>
            </label>
            <div className="relative">
              <Wrench className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 z-10 pointer-events-none" />
              <input
                type="text"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="Computer Vision, Data Annotation, Python, React, English Native"
                className="w-full glass-input !pl-11 !pr-4 text-xs"
              />
            </div>
          </div>

          {/* Live Skill Badges Preview */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Skill Badges Preview
            </span>
            <div className="flex flex-wrap gap-2 text-xs">
              {parsedSkills.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1 rounded-xl bg-slate-900 border border-brand-500/30 text-brand-300 font-medium flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand-accent" /> {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:opacity-95 text-slate-950 font-bold text-xs shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving Changes...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save Profile Details
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WorkerProfile;
