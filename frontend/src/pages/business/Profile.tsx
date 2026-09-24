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
import { INDUSTRY_TYPES, COMPANY_SIZES, SERVICES_NEEDED, type CompanyProfile } from '../../types';
import { cn } from '../../lib/utils';

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

  // Feature 1: richer company profile state
  const [profileCompanyName, setProfileCompanyName] = useState('');
  const [industryType, setIndustryType] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [servicesNeeded, setServicesNeeded] = useState<string[]>([]);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setCompanyName(user.companyName || '');
      setBio(user.bio || '');
      setSkills(user.skills || '');
      setAvatarUrl(user.avatarUrl || '');
      const profile: CompanyProfile | null | undefined = user.companyProfile;
      setProfileCompanyName(profile?.companyName || '');
      setIndustryType(profile?.industryType || '');
      setWebsiteUrl(profile?.websiteUrl || '');
      setCompanySize(profile?.companySize || '');
      setServicesNeeded(profile?.servicesNeeded || []);
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
    setProfileError(null);

    // Validate the Feature 1 company profile if the user is editing it.
    let companyProfilePayload: CompanyProfile | undefined;
    if (profileCompanyName.trim() || industryType || companySize || servicesNeeded.length > 0) {
      if (!profileCompanyName.trim()) {
        setProfileError('Company name is required for your company profile.');
        setIsSaving(false);
        return;
      }
      if (!industryType) {
        setProfileError('Please select an industry type.');
        setIsSaving(false);
        return;
      }
      if (!companySize) {
        setProfileError('Please select your team size.');
        setIsSaving(false);
        return;
      }
      companyProfilePayload = {
        companyName: profileCompanyName.trim(),
        industryType,
        websiteUrl: websiteUrl.trim() || null,
        companySize,
        servicesNeeded: servicesNeeded.length > 0 ? servicesNeeded : ['Other'],
      };
    }

    try {
      const res = await authApi.updateProfile({
        name: name.trim(),
        companyName: companyName.trim() || undefined,
        bio: bio.trim() || undefined,
        skills: skills.trim() || undefined,
        avatarUrl: avatarUrl.trim() || undefined,
        companyProfile: companyProfilePayload,
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
        <h1 className="text-2xl font-extrabold text-ink-text">Business Organization Profile</h1>
        <p className="text-xs text-ink-muted">Manage company branding, administrative contact info, and poster credentials.</p>
      </div>

      <div className="p-6 sm:p-8 rounded-3xl bg-paper-bg border border-hairline shadow-sm space-y-6">
        {/* Header Preview */}
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-hairline">
          <div className="relative group">
            <img
              src={avatarUrl || user?.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(user?.email || 'business')}`}
              alt="Logo"
              className="w-24 h-24 rounded-2xl object-cover border-2 border-moss-primary/50 shadow-md bg-paper-bg"
            />
            <button
              type="button"
              onClick={handleGenerateLogo}
              title="Generate New Identicon"
              className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-moss-deep hover:bg-moss-primary text-white shadow-lg transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2 text-center sm:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-xl font-bold text-ink-text">{companyName || user?.companyName || user?.name}</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-moss-sage text-moss-deep border border-moss-sage text-[10px] font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Verified Poster
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-moss-sage text-moss-deep border border-moss-sage text-[10px] font-bold flex items-center gap-1">
                <Briefcase className="w-3 h-3" /> BUSINESS
              </span>
            </div>

            <p className="text-xs text-ink-muted flex items-center justify-center sm:justify-start gap-1">
              <UserIcon className="w-3.5 h-3.5 text-ink-muted" /> Representative: {name || user?.name}
            </p>

            <p className="text-xs text-ink-muted flex items-center justify-center sm:justify-start gap-1">
              <Mail className="w-3.5 h-3.5 text-ink-muted" /> {user?.email}
            </p>

            <p className="text-[11px] text-ink-muted flex items-center justify-center sm:justify-start gap-1">
              <Calendar className="w-3.5 h-3.5 text-ink-muted" /> Joined TaskHub on {formatDate(user?.createdAt || new Date().toISOString())}
            </p>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Company / Brand Name */}
            <div>
              <label className="block text-xs font-bold text-ink-text mb-1.5">
                Company / Organization Name <span className="text-moss-deep">*</span>
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted z-10 pointer-events-none" />
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
              <label className="block text-xs font-bold text-ink-text mb-1.5">
                Authorized Representative Name <span className="text-moss-deep">*</span>
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted z-10 pointer-events-none" />
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
            <label className="block text-xs font-bold text-ink-text mb-1.5">
              Account Email Address <span className="text-ink-muted text-[10px] font-normal">(Non-editable)</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted z-10 pointer-events-none" />
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full glass-input !pl-11 !pr-4 text-xs opacity-75 bg-paper-bg cursor-not-allowed text-ink-muted border border-hairline"
              />
            </div>
          </div>

          {/* Organization Bio */}
          <div>
            <label className="block text-xs font-bold text-ink-text mb-1.5">
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
            <label className="block text-xs font-bold text-ink-text mb-1.5">
              Primary Task Domain Skills <span className="text-ink-muted text-[10px] font-normal">(Comma-separated)</span>
            </label>
            <div className="relative">
              <Wrench className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted z-10 pointer-events-none" />
              <input
                type="text"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="Data Annotation, RLHF, Content Moderation, UX Research, Translation"
                className="w-full glass-input !pl-11 !pr-4 text-xs"
              />
            </div>
          </div>

          {/* Feature 1: Company Profile editor */}
          <div className="p-5 rounded-2xl bg-moss-sage/50 border border-moss-sage space-y-4">
            <div>
              <h3 className="text-sm font-extrabold text-moss-deep flex items-center gap-2">
                <Building2 className="w-4 h-4 text-moss-deep" /> Company Profile Details
              </h3>
              <p className="text-[11px] text-moss-deep/80 font-medium mt-0.5">
                Used for admin approval review and shown to workers on the marketplace.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-ink-text mb-1.5">
                  Legal / Brand Name <span className="text-moss-deep">*</span>
                </label>
                <input
                  type="text"
                  value={profileCompanyName}
                  onChange={(e) => setProfileCompanyName(e.target.value)}
                  placeholder="CyberNet AI Labs Inc."
                  className="w-full glass-input !px-4 text-xs font-semibold bg-paper-bg"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-ink-text mb-1.5">
                  Industry Type <span className="text-moss-deep">*</span>
                </label>
                <select
                  value={industryType}
                  onChange={(e) => setIndustryType(e.target.value)}
                  className="w-full glass-input !px-4 text-xs font-semibold bg-paper-bg"
                >
                  <option value="">Select industry...</option>
                  {INDUSTRY_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-ink-text mb-1.5">
                  Website URL <span className="text-ink-muted text-[10px] font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://company.com"
                  className="w-full glass-input !px-4 text-xs bg-paper-bg"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-ink-text mb-1.5">
                  Team Size <span className="text-moss-deep">*</span>
                </label>
                <select
                  value={companySize}
                  onChange={(e) => setCompanySize(e.target.value)}
                  className="w-full glass-input !px-4 text-xs font-semibold bg-paper-bg"
                >
                  <option value="">Select team size...</option>
                  {COMPANY_SIZES.map((s) => (
                    <option key={s} value={s}>{s} people</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <span className="block text-xs font-bold text-ink-text mb-1.5">Services You Need</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SERVICES_NEEDED.map((service) => {
                  const checked = servicesNeeded.includes(service);
                  return (
                    <label
                      key={service}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all',
                        checked
                          ? 'bg-moss-deep border-moss-primary text-white shadow-sm'
                          : 'bg-paper-bg border-moss-sage text-ink-text hover:bg-paper-bg'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setServicesNeeded(
                            checked
                              ? servicesNeeded.filter((x) => x !== service)
                              : [...servicesNeeded, service]
                          )
                        }
                        className="sr-only"
                      />
                      <CheckCircle2 className={cn('w-3.5 h-3.5', checked ? 'text-white' : 'text-ink-muted')} />
                      {service}
                    </label>
                  );
                })}
              </div>
            </div>

            {user?.approvalStatus && user.approvalStatus !== 'APPROVED' && (
              <p className="text-[11px] text-moss-deep/90 font-semibold flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" /> Updating this profile may re-trigger admin review of your account.
              </p>
            )}
            {profileError && (
              <p className="text-[11px] text-moss-deep font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> {profileError}
              </p>
            )}
          </div>

          {/* Live Skill Badges Preview */}
          <div className="bg-paper-bg/80 border border-hairline p-4 rounded-2xl space-y-2">
            <span className="text-ink-text font-bold text-xs uppercase tracking-wider block">
              Skill Badges Preview
            </span>
            <div className="flex flex-wrap gap-2 text-xs">
              {parsedSkills.map((skill) => (
                <span
                  key={skill}
                  className="bg-moss-sage border border-moss-sage text-moss-deep font-semibold px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-moss-deep" /> {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-3 rounded-xl bg-moss-deep hover:bg-moss-deep text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
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
