export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role?: "STUDENT" | "RECRUITER" | "ADMIN";
  company?: string;
  industry?: string;
  registrationNumber?: string;
  proofDocUrl?: string;
}

export interface VerifyEmailPayload {
  email: string;
  code: string;
}

export interface ResendVerificationPayload {
  email: string;
}

export interface RecruiterOnboardingPayload {
  company?: string;
  industry?: string;
  companyWebsite?: string;
  companySize?: string;
  companyDescription?: string;
  companyAddress?: string;
  country?: string;
  city?: string;
  registrationNumber?: string;
  taxId?: string;
  proofDocUrl?: string;
  hrName?: string;
  hrEmail?: string;
  hrPhone?: string;
  hrTitle?: string;
}
