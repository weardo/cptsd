import mongoose, { Schema, Document, Model } from 'mongoose';

export enum ProfessionalType {
  INDIVIDUAL = 'INDIVIDUAL', // Individual therapist/professional
  NGO = 'NGO', // Non-governmental organization
  CLINIC = 'CLINIC', // Clinic or practice
  HOSPITAL = 'HOSPITAL', // Hospital department
}

export enum Designation {
  THERAPIST = 'THERAPIST',
  PSYCHOTHERAPIST = 'PSYCHOTHERAPIST',
  PSYCHOLOGIST = 'PSYCHOLOGIST',
  PSYCHIATRIST = 'PSYCHIATRIST',
  COUNSELOR = 'COUNSELOR',
  SOCIAL_WORKER = 'SOCIAL_WORKER',
  LIFE_COACH = 'LIFE_COACH',
  MENTAL_HEALTH_COUNSELOR = 'MENTAL_HEALTH_COUNSELOR',
  CLINICAL_PSYCHOLOGIST = 'CLINICAL_PSYCHOLOGIST',
  LICENSED_PROFESSIONAL_COUNSELOR = 'LICENSED_PROFESSIONAL_COUNSELOR',
  MARRIAGE_FAMILY_THERAPIST = 'MARRIAGE_FAMILY_THERAPIST',
  OTHER = 'OTHER',
}

export enum ModeOfDelivery {
  OFFLINE = 'OFFLINE', // In-person only
  ONLINE = 'ONLINE', // Online only
  BOTH = 'BOTH', // Both offline and online
}

export enum Specialization {
  TRAUMA = 'TRAUMA',
  PTSD = 'PTSD',
  CPTSD = 'CPTSD',
  ANXIETY = 'ANXIETY',
  DEPRESSION = 'DEPRESSION',
  GRIEF = 'GRIEF',
  ADDICTION = 'ADDICTION',
  EATING_DISORDERS = 'EATING_DISORDERS',
  BIPOLAR = 'BIPOLAR',
  SCHIZOPHRENIA = 'SCHIZOPHRENIA',
  OCD = 'OCD',
  BORDERLINE_PERSONALITY = 'BORDERLINE_PERSONALITY',
  DISSOCIATIVE_DISORDERS = 'DISSOCIATIVE_DISORDERS',
  CHILD_THERAPY = 'CHILD_THERAPY',
  ADOLESCENT_THERAPY = 'ADOLESCENT_THERAPY',
  FAMILY_THERAPY = 'FAMILY_THERAPY',
  COUPLE_THERAPY = 'COUPLE_THERAPY',
  GROUP_THERAPY = 'GROUP_THERAPY',
  MINDFULNESS = 'MINDFULNESS',
  CBT = 'CBT', // Cognitive Behavioral Therapy
  DBT = 'DBT', // Dialectical Behavior Therapy
  EMDR = 'EMDR', // Eye Movement Desensitization and Reprocessing
  PSYCHOANALYSIS = 'PSYCHOANALYSIS',
  GESTALT = 'GESTALT',
  HUMANISTIC = 'HUMANISTIC',
  EXISTENTIAL = 'EXISTENTIAL',
  SOMATIC = 'SOMATIC',
  ART_THERAPY = 'ART_THERAPY',
  MUSIC_THERAPY = 'MUSIC_THERAPY',
  LGBTQ_PLUS = 'LGBTQ_PLUS',
  DOMESTIC_VIOLENCE = 'DOMESTIC_VIOLENCE',
  SEXUAL_ABUSE = 'SEXUAL_ABUSE',
  WORKPLACE_STRESS = 'WORKPLACE_STRESS',
  CHRONIC_ILLNESS = 'CHRONIC_ILLNESS',
  DISABILITY = 'DISABILITY',
  OTHER = 'OTHER',
}

export interface ILocation {
  city?: string;
  state?: string;
  country?: string;
  address?: string;
  pincode?: string;
  coordinates?: {
    latitude?: number;
    longitude?: number;
  };
}

export interface IContactInfo {
  phone?: string;
  helpline?: string;
  email?: string;
  website?: string;
  whatsapp?: string;
  emergency?: string;
}

export interface IQualification {
  degree?: string; // e.g., "M.A in Applied Psychology (Counselling Psychology)"
  institution?: string;
  year?: number;
  licenseNumber?: string;
  licenseIssuingAuthority?: string;
  certifications?: string[]; // Additional certifications
}

export interface IMentalHealthProfessional extends Document {
  // Basic Information
  type: ProfessionalType;
  name: string; // For individuals, or organization name for NGOs
  designation?: Designation; // Only for individuals
  designationOther?: string; // Custom designation if Designation.OTHER
  profilePicture?: string; // URL to profile picture/icon
  about?: string; // About section/bio
  
  // Location
  location: ILocation;
  
  // Qualification (for individuals)
  qualification?: IQualification;
  
  // Contact Information
  contact: IContactInfo;
  
  // Services
  modeOfDelivery: ModeOfDelivery;
  specializations: Specialization[];
  specializationOther?: string[]; // Custom specializations if Specialization.OTHER
  languages: string[]; // Languages spoken, e.g., ["English", "Hindi"]
  
  // Additional Information
  experienceYears?: number;
  ageGroups?: string[]; // e.g., ["Children", "Adolescents", "Adults", "Elderly"]
  sessionDuration?: number; // In minutes
  sessionFee?: {
    amount?: number;
    currency?: string; // e.g., "INR", "USD"
    notes?: string; // e.g., "Sliding scale available"
  };
  insuranceAccepted?: boolean;
  insuranceProviders?: string[];
  availability?: {
    days?: string[]; // e.g., ["Monday", "Wednesday", "Friday"]
    timeSlots?: string[]; // e.g., ["Morning", "Afternoon", "Evening"]
    timezone?: string;
  };
  
  // For NGOs/Organizations
  organizationInfo?: {
    foundedYear?: number;
    registrationNumber?: string;
    services?: string[]; // List of services offered
    targetAudience?: string[];
    funding?: string; // e.g., "Government", "Private", "Donations"
  };
  
  // Metadata
  featured: boolean;
  verified: boolean; // Whether credentials have been verified
  status: 'ACTIVE' | 'ARCHIVED' | 'DRAFT';
  tags: string[];
  notes?: string; // Admin notes
  
  // SEO and Display
  slug?: string; // URL-friendly identifier
  metaDescription?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const LocationSchema = new Schema<ILocation>(
  {
    city: { type: String },
    state: { type: String },
    country: { type: String, default: 'India' },
    address: { type: String },
    pincode: { type: String },
    coordinates: {
      latitude: { type: Number },
      longitude: { type: Number },
    },
  },
  { _id: false }
);

const ContactInfoSchema = new Schema<IContactInfo>(
  {
    phone: { type: String },
    helpline: { type: String },
    email: { type: String },
    website: { type: String },
    whatsapp: { type: String },
    emergency: { type: String },
  },
  { _id: false }
);

const QualificationSchema = new Schema<IQualification>(
  {
    degree: { type: String },
    institution: { type: String },
    year: { type: Number },
    licenseNumber: { type: String },
    licenseIssuingAuthority: { type: String },
    certifications: [{ type: String }],
  },
  { _id: false }
);

const MentalHealthProfessionalSchema = new Schema<IMentalHealthProfessional>(
  {
    type: {
      type: String,
      enum: Object.values(ProfessionalType),
      required: true,
    },
    name: { type: String, required: true },
    designation: {
      type: String,
      enum: Object.values(Designation),
    },
    designationOther: { type: String },
    profilePicture: { type: String },
    about: { type: String },
    location: { type: LocationSchema, required: true },
    qualification: { type: QualificationSchema },
    contact: { type: ContactInfoSchema, required: true },
    modeOfDelivery: {
      type: String,
      enum: Object.values(ModeOfDelivery),
      required: true,
    },
    specializations: [{
      type: String,
      enum: Object.values(Specialization),
    }],
    specializationOther: [{ type: String }],
    languages: [{ type: String }],
    experienceYears: { type: Number },
    ageGroups: [{ type: String }],
    sessionDuration: { type: Number },
    sessionFee: {
      amount: { type: Number },
      currency: { type: String, default: 'INR' },
      notes: { type: String },
    },
    insuranceAccepted: { type: Boolean },
    insuranceProviders: [{ type: String }],
    availability: {
      days: [{ type: String }],
      timeSlots: [{ type: String }],
      timezone: { type: String },
    },
    organizationInfo: {
      foundedYear: { type: Number },
      registrationNumber: { type: String },
      services: [{ type: String }],
      targetAudience: [{ type: String }],
      funding: { type: String },
    },
    featured: { type: Boolean, default: false },
    verified: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['ACTIVE', 'ARCHIVED', 'DRAFT'],
      default: 'ACTIVE',
    },
    tags: [{ type: String }],
    notes: { type: String },
    slug: { type: String },
    metaDescription: { type: String },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
MentalHealthProfessionalSchema.index({ type: 1 });
MentalHealthProfessionalSchema.index({ designation: 1 });
MentalHealthProfessionalSchema.index({ 'location.city': 1 });
MentalHealthProfessionalSchema.index({ 'location.state': 1 });
MentalHealthProfessionalSchema.index({ modeOfDelivery: 1 });
MentalHealthProfessionalSchema.index({ specializations: 1 });
MentalHealthProfessionalSchema.index({ languages: 1 });
MentalHealthProfessionalSchema.index({ status: 1 });
MentalHealthProfessionalSchema.index({ featured: 1 });
MentalHealthProfessionalSchema.index({ verified: 1 });
MentalHealthProfessionalSchema.index({ tags: 1 });
MentalHealthProfessionalSchema.index({ slug: 1 });
MentalHealthProfessionalSchema.index({ name: 'text', about: 'text' }); // Text search index
MentalHealthProfessionalSchema.index({ createdAt: -1 });

// Generate slug from name before saving
MentalHealthProfessionalSchema.pre('save', function(next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// Safely get or create the model
const MentalHealthProfessional: Model<IMentalHealthProfessional> =
  (mongoose.models && mongoose.models.MentalHealthProfessional) ||
  mongoose.model<IMentalHealthProfessional>('MentalHealthProfessional', MentalHealthProfessionalSchema);

export default MentalHealthProfessional;

