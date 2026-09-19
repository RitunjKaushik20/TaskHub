import { z } from 'zod';

// Feature 1 — Enhanced Business Onboarding
// Single source of truth for the richer company-profile fields collected at
// Business signup. Used by the registration API, Google OAuth paths and the
// business dashboard "complete your profile" flow.

export const INDUSTRY_TYPES = ['E-commerce', 'SaaS', 'EdTech', 'Other'] as const;

export const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '500+'] as const;

export const SERVICES_NEEDED = [
  'AI Data Labeling',
  'App QA',
  'Content Moderation',
  'UX Feedback',
  'Other',
] as const;

export interface CompanyProfile {
  companyName: string;
  industryType: (typeof INDUSTRY_TYPES)[number] | string;
  websiteUrl?: string | null;
  companySize: (typeof COMPANY_SIZES)[number] | string;
  servicesNeeded: string[];
}

// Server-side validation schema. websiteUrl is optional but must be a valid URL
// when provided. servicesNeeded must contain at least one entry.
export const companyProfileSchema = z
  .object({
    companyName: z
      .string()
      .trim()
      .min(1, 'Company name is required')
      .max(120, 'Company name must be 120 characters or fewer'),
    industryType: z.enum(INDUSTRY_TYPES, {
      errorMap: () => ({ message: 'Please select a valid industry type' }),
    }),
    websiteUrl: z
      .union([
        z.string().url('Please provide a valid website URL (e.g. https://company.com)').max(200),
        z.literal(''),
        z.null(),
        z.undefined(),
      ])
      .optional(),
    companySize: z.enum(COMPANY_SIZES, {
      errorMap: () => ({ message: 'Please select a valid company size' }),
    }),
    servicesNeeded: z
      .array(
        z.enum(SERVICES_NEEDED, {
          errorMap: () => ({ message: 'Please select valid services needed' }),
        })
      )
      .min(1, 'Select at least one service you need'),
  })
  .transform((data) => ({
    ...data,
    websiteUrl: data.websiteUrl && data.websiteUrl.trim() !== '' ? data.websiteUrl.trim() : null,
  }));

export function isCompleteCompanyProfile(profile: CompanyProfile | null | undefined): boolean {
  return !!(
    profile &&
    typeof profile === 'object' &&
    typeof profile.companyName === 'string' &&
    profile.companyName.trim() !== '' &&
    typeof profile.industryType === 'string' &&
    profile.industryType.trim() !== '' &&
    typeof profile.companySize === 'string' &&
    profile.companySize.trim() !== '' &&
    Array.isArray(profile.servicesNeeded) &&
    profile.servicesNeeded.length > 0
  );
}

// Safe helper to coerce an arbitrary value (from Json column) into a normalized
// companyProfile shape or null, mirroring the API default for legacy oauth accounts.
export function normalizeCompanyProfile(raw: unknown): CompanyProfile | null {
  if (!raw || typeof raw !== 'object') return null;
  const candidate = raw as Record<string, unknown>;
  if (
    typeof candidate.companyName !== 'string' ||
    typeof candidate.industryType !== 'string' ||
    typeof candidate.companySize !== 'string' ||
    !Array.isArray(candidate.servicesNeeded)
  ) {
    return null;
  }
  const parsed = companyProfileSchema.safeParse({
    companyName: (candidate.companyName as string) || null,
    industryType: (candidate.industryType as string) || '',
    websiteUrl: typeof candidate.websiteUrl === 'string' ? candidate.websiteUrl : null,
    companySize: (candidate.companySize as string) || '',
    servicesNeeded: candidate.servicesNeeded as string[],
  });
  return parsed.success ? (parsed.data as CompanyProfile) : null;
}