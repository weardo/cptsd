'use server';

import connectDB from '@/lib/mongodb';
import {
  MentalHealthProfessional,
  ProfessionalType,
  Designation,
  ModeOfDelivery,
  Specialization,
} from '@cptsd/db';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const professionalSchema = z.object({
  type: z.nativeEnum(ProfessionalType),
  name: z.string().min(1, 'Name is required'),
  designation: z.nativeEnum(Designation).optional(),
  designationOther: z.string().optional(),
  profilePicture: z.string().optional(),
  about: z.string().optional(),
  modeOfDelivery: z.nativeEnum(ModeOfDelivery),
  featured: z.boolean().optional(),
  verified: z.boolean().optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED', 'DRAFT']).optional(),
});

export async function createMentalHealthProfessional(formData: FormData) {
  try {
    await connectDB();

    // Parse location
    const location = {
      city: formData.get('location.city') as string | null,
      state: formData.get('location.state') as string | null,
      country: formData.get('location.country') as string | null || 'India',
      address: formData.get('location.address') as string | null,
      pincode: formData.get('location.pincode') as string | null,
      coordinates: {
        latitude: formData.get('location.latitude') ? parseFloat(formData.get('location.latitude') as string) : undefined,
        longitude: formData.get('location.longitude') ? parseFloat(formData.get('location.longitude') as string) : undefined,
      },
    };

    // Parse contact
    const contact = {
      phone: formData.get('contact.phone') as string | null,
      helpline: formData.get('contact.helpline') as string | null,
      email: formData.get('contact.email') as string | null,
      website: formData.get('contact.website') as string | null,
      whatsapp: formData.get('contact.whatsapp') as string | null,
      emergency: formData.get('contact.emergency') as string | null,
    };

    // Parse qualification
    const qualification = formData.get('qualification.degree') ? {
      degree: formData.get('qualification.degree') as string,
      institution: formData.get('qualification.institution') as string | null,
      year: formData.get('qualification.year') ? parseInt(formData.get('qualification.year') as string) : undefined,
      licenseNumber: formData.get('qualification.licenseNumber') as string | null,
      licenseIssuingAuthority: formData.get('qualification.licenseIssuingAuthority') as string | null,
      certifications: formData.get('qualification.certifications') ? (formData.get('qualification.certifications') as string).split(',').map(c => c.trim()).filter(Boolean) : undefined,
    } : undefined;

    // Parse specializations (handle both multiple select and comma-separated string)
    let specializations: Specialization[] = [];
    const specializationsValue = formData.get('specializations');
    if (specializationsValue) {
      if (typeof specializationsValue === 'string') {
        // Comma-separated string
        specializations = specializationsValue.split(',').map(s => s.trim()).filter(Boolean) as Specialization[];
      } else {
        // Multiple select returns array
        const allValues = formData.getAll('specializations');
        specializations = allValues.map(v => v.toString().trim()).filter(Boolean) as Specialization[];
      }
    }
    const specializationOther = formData.get('specializationOther') ? (formData.get('specializationOther') as string).split(',').map(s => s.trim()).filter(Boolean) : [];

    // Parse languages
    const languages = formData.get('languages') ? (formData.get('languages') as string).split(',').map(l => l.trim()).filter(Boolean) : [];

    // Parse session fee
    const sessionFee = formData.get('sessionFee.amount') ? {
      amount: parseFloat(formData.get('sessionFee.amount') as string),
      currency: (formData.get('sessionFee.currency') as string) || 'INR',
      notes: formData.get('sessionFee.notes') as string | null,
    } : undefined;

    // Parse availability
    const availability = (formData.get('availability.days') || formData.get('availability.timeSlots')) ? {
      days: formData.get('availability.days') ? (formData.get('availability.days') as string).split(',').map(d => d.trim()).filter(Boolean) : undefined,
      timeSlots: formData.get('availability.timeSlots') ? (formData.get('availability.timeSlots') as string).split(',').map(t => t.trim()).filter(Boolean) : undefined,
      timezone: formData.get('availability.timezone') as string | null,
    } : undefined;

    // Parse organization info (for NGOs)
    const organizationInfo = formData.get('organizationInfo.foundedYear') ? {
      foundedYear: parseInt(formData.get('organizationInfo.foundedYear') as string),
      registrationNumber: formData.get('organizationInfo.registrationNumber') as string | null,
      services: formData.get('organizationInfo.services') ? (formData.get('organizationInfo.services') as string).split(',').map(s => s.trim()).filter(Boolean) : undefined,
      targetAudience: formData.get('organizationInfo.targetAudience') ? (formData.get('organizationInfo.targetAudience') as string).split(',').map(a => a.trim()).filter(Boolean) : undefined,
      funding: formData.get('organizationInfo.funding') as string | null,
    } : undefined;

    const data = {
      type: formData.get('type') as ProfessionalType,
      name: formData.get('name') as string,
      designation: formData.get('designation') ? (formData.get('designation') as Designation) : undefined,
      designationOther: formData.get('designationOther') as string | null,
      profilePicture: formData.get('profilePicture') as string | null,
      about: formData.get('about') as string | null,
      location,
      qualification,
      contact,
      modeOfDelivery: formData.get('modeOfDelivery') as ModeOfDelivery,
      specializations,
      specializationOther,
      languages,
      experienceYears: formData.get('experienceYears') ? parseInt(formData.get('experienceYears') as string) : undefined,
      ageGroups: formData.get('ageGroups') ? (formData.get('ageGroups') as string).split(',').map(a => a.trim()).filter(Boolean) : undefined,
      sessionDuration: formData.get('sessionDuration') ? parseInt(formData.get('sessionDuration') as string) : undefined,
      sessionFee,
      insuranceAccepted: formData.get('insuranceAccepted') === 'true',
      insuranceProviders: formData.get('insuranceProviders') ? (formData.get('insuranceProviders') as string).split(',').map(p => p.trim()).filter(Boolean) : undefined,
      availability,
      organizationInfo,
      featured: formData.get('featured') === 'true',
      verified: formData.get('verified') === 'true',
      status: (formData.get('status') as 'ACTIVE' | 'ARCHIVED' | 'DRAFT') || 'ACTIVE',
      tags: formData.get('tags') ? (formData.get('tags') as string).split(',').map(t => t.trim()).filter(Boolean) : [],
      notes: formData.get('notes') as string | null,
      metaDescription: formData.get('metaDescription') as string | null,
    };

    const validated = professionalSchema.parse(data);

    const professional = await MentalHealthProfessional.create({
      ...validated,
      location,
      contact,
      qualification,
      specializations,
      specializationOther,
      languages,
      sessionFee,
      availability,
      organizationInfo,
      experienceYears: data.experienceYears,
      ageGroups: data.ageGroups,
      sessionDuration: data.sessionDuration,
      insuranceAccepted: data.insuranceAccepted,
      insuranceProviders: data.insuranceProviders,
      tags: data.tags,
      notes: data.notes,
      metaDescription: data.metaDescription,
    });

    revalidatePath('/mental-health-professionals');
    revalidatePath('/');

    return {
      success: true,
      professional: await transformProfessional(String(professional._id)),
    };
  } catch (error) {
    console.error('Error creating mental health professional:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create mental health professional',
    };
  }
}

export async function updateMentalHealthProfessional(id: string, formData: FormData) {
  try {
    await connectDB();

    const updateData: any = {};

    // Basic fields
    const name = formData.get('name') as string | null;
    const type = formData.get('type') as string | null;
    const designation = formData.get('designation') as string | null;
    const designationOther = formData.get('designationOther') as string | null;
    const profilePicture = formData.get('profilePicture') as string | null;
    const about = formData.get('about') as string | null;
    const modeOfDelivery = formData.get('modeOfDelivery') as string | null;
    const status = formData.get('status') as string | null;
    const featured = formData.get('featured') as string | null;
    const verified = formData.get('verified') as string | null;
    const notes = formData.get('notes') as string | null;
    const metaDescription = formData.get('metaDescription') as string | null;

    if (name !== null) updateData.name = name;
    if (type !== null) updateData.type = type;
    if (designation !== null) updateData.designation = designation || undefined;
    if (designationOther !== null) updateData.designationOther = designationOther || undefined;
    if (profilePicture !== null) updateData.profilePicture = profilePicture || undefined;
    if (about !== null) updateData.about = about || undefined;
    if (modeOfDelivery !== null) updateData.modeOfDelivery = modeOfDelivery;
    if (status !== null) updateData.status = status;
    if (featured !== null) updateData.featured = featured === 'true';
    if (verified !== null) updateData.verified = verified === 'true';
    if (notes !== null) updateData.notes = notes || undefined;
    if (metaDescription !== null) updateData.metaDescription = metaDescription || undefined;

    // Location
    if (formData.has('location.city')) {
      updateData.location = {
        city: formData.get('location.city') as string | null || undefined,
        state: formData.get('location.state') as string | null || undefined,
        country: formData.get('location.country') as string | null || 'India',
        address: formData.get('location.address') as string | null || undefined,
        pincode: formData.get('location.pincode') as string | null || undefined,
        coordinates: {
          latitude: formData.get('location.latitude') ? parseFloat(formData.get('location.latitude') as string) : undefined,
          longitude: formData.get('location.longitude') ? parseFloat(formData.get('location.longitude') as string) : undefined,
        },
      };
    }

    // Contact
    if (formData.has('contact.phone')) {
      updateData.contact = {
        phone: formData.get('contact.phone') as string | null || undefined,
        helpline: formData.get('contact.helpline') as string | null || undefined,
        email: formData.get('contact.email') as string | null || undefined,
        website: formData.get('contact.website') as string | null || undefined,
        whatsapp: formData.get('contact.whatsapp') as string | null || undefined,
        emergency: formData.get('contact.emergency') as string | null || undefined,
      };
    }

    // Qualification
    if (formData.has('qualification.degree')) {
      updateData.qualification = {
        degree: formData.get('qualification.degree') as string | null || undefined,
        institution: formData.get('qualification.institution') as string | null || undefined,
        year: formData.get('qualification.year') ? parseInt(formData.get('qualification.year') as string) : undefined,
        licenseNumber: formData.get('qualification.licenseNumber') as string | null || undefined,
        licenseIssuingAuthority: formData.get('qualification.licenseIssuingAuthority') as string | null || undefined,
        certifications: formData.get('qualification.certifications') ? (formData.get('qualification.certifications') as string).split(',').map(c => c.trim()).filter(Boolean) : undefined,
      };
    }

    // Specializations (handle both multiple select and comma-separated string)
    if (formData.has('specializations')) {
      const specializationsValue = formData.get('specializations');
      if (typeof specializationsValue === 'string') {
        updateData.specializations = specializationsValue.split(',').map(s => s.trim()).filter(Boolean);
      } else {
        const allValues = formData.getAll('specializations');
        updateData.specializations = allValues.map(v => v.toString().trim()).filter(Boolean);
      }
    }
    if (formData.has('specializationOther')) {
      updateData.specializationOther = (formData.get('specializationOther') as string).split(',').map(s => s.trim()).filter(Boolean);
    }

    // Languages
    if (formData.has('languages')) {
      updateData.languages = (formData.get('languages') as string).split(',').map(l => l.trim()).filter(Boolean);
    }

    // Tags
    if (formData.has('tags')) {
      updateData.tags = (formData.get('tags') as string).split(',').map(t => t.trim()).filter(Boolean);
    }

    // Other fields
    if (formData.has('experienceYears')) {
      updateData.experienceYears = formData.get('experienceYears') ? parseInt(formData.get('experienceYears') as string) : undefined;
    }
    if (formData.has('ageGroups')) {
      updateData.ageGroups = formData.get('ageGroups') ? (formData.get('ageGroups') as string).split(',').map(a => a.trim()).filter(Boolean) : undefined;
    }
    if (formData.has('sessionDuration')) {
      updateData.sessionDuration = formData.get('sessionDuration') ? parseInt(formData.get('sessionDuration') as string) : undefined;
    }
    if (formData.has('sessionFee.amount')) {
      updateData.sessionFee = {
        amount: parseFloat(formData.get('sessionFee.amount') as string),
        currency: (formData.get('sessionFee.currency') as string) || 'INR',
        notes: formData.get('sessionFee.notes') as string | null || undefined,
      };
    }
    if (formData.has('insuranceAccepted')) {
      updateData.insuranceAccepted = formData.get('insuranceAccepted') === 'true';
    }
    if (formData.has('insuranceProviders')) {
      updateData.insuranceProviders = formData.get('insuranceProviders') ? (formData.get('insuranceProviders') as string).split(',').map(p => p.trim()).filter(Boolean) : undefined;
    }
    if (formData.has('availability.days')) {
      updateData.availability = {
        days: formData.get('availability.days') ? (formData.get('availability.days') as string).split(',').map(d => d.trim()).filter(Boolean) : undefined,
        timeSlots: formData.get('availability.timeSlots') ? (formData.get('availability.timeSlots') as string).split(',').map(t => t.trim()).filter(Boolean) : undefined,
        timezone: formData.get('availability.timezone') as string | null || undefined,
      };
    }
    if (formData.has('organizationInfo.foundedYear')) {
      updateData.organizationInfo = {
        foundedYear: parseInt(formData.get('organizationInfo.foundedYear') as string),
        registrationNumber: formData.get('organizationInfo.registrationNumber') as string | null || undefined,
        services: formData.get('organizationInfo.services') ? (formData.get('organizationInfo.services') as string).split(',').map(s => s.trim()).filter(Boolean) : undefined,
        targetAudience: formData.get('organizationInfo.targetAudience') ? (formData.get('organizationInfo.targetAudience') as string).split(',').map(a => a.trim()).filter(Boolean) : undefined,
        funding: formData.get('organizationInfo.funding') as string | null || undefined,
      };
    }

    await MentalHealthProfessional.findByIdAndUpdate(id, updateData);

    revalidatePath('/mental-health-professionals');
    revalidatePath(`/mental-health-professionals/${id}`);
    revalidatePath('/');

    return {
      success: true,
      professional: await transformProfessional(id),
    };
  } catch (error) {
    console.error('Error updating mental health professional:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update mental health professional',
    };
  }
}

export async function deleteMentalHealthProfessional(id: string) {
  try {
    await connectDB();
    await MentalHealthProfessional.findByIdAndDelete(id);

    revalidatePath('/mental-health-professionals');
    revalidatePath('/');

    return { success: true };
  } catch (error) {
    console.error('Error deleting mental health professional:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete mental health professional',
    };
  }
}

export async function getMentalHealthProfessionals(filters?: {
  type?: ProfessionalType;
  designation?: Designation;
  city?: string;
  state?: string;
  modeOfDelivery?: ModeOfDelivery;
  specialization?: Specialization;
  language?: string;
  status?: string;
  featured?: boolean;
  verified?: boolean;
  search?: string;
}) {
  try {
    await connectDB();

    const query: any = {};

    if (filters?.type) {
      query.type = filters.type;
    }

    if (filters?.designation) {
      query.designation = filters.designation;
    }

    if (filters?.city) {
      query['location.city'] = { $regex: filters.city, $options: 'i' };
    }

    if (filters?.state) {
      query['location.state'] = { $regex: filters.state, $options: 'i' };
    }

    if (filters?.modeOfDelivery) {
      query.modeOfDelivery = filters.modeOfDelivery;
    }

    if (filters?.specialization) {
      query.specializations = filters.specialization;
    }

    if (filters?.language) {
      query.languages = { $in: [filters.language] };
    }

    if (filters?.status) {
      query.status = filters.status;
    } else {
      query.status = 'ACTIVE'; // Default to active only
    }

    if (filters?.featured !== undefined) {
      query.featured = filters.featured;
    }

    if (filters?.verified !== undefined) {
      query.verified = filters.verified;
    }

    if (filters?.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { about: { $regex: filters.search, $options: 'i' } },
        { 'location.city': { $regex: filters.search, $options: 'i' } },
        { 'location.state': { $regex: filters.search, $options: 'i' } },
        { tags: { $regex: filters.search, $options: 'i' } },
      ];
    }

    const professionals = await MentalHealthProfessional.find(query)
      .sort({ featured: -1, verified: -1, createdAt: -1 })
      .lean();

    return {
      success: true,
      professionals: professionals.map((professional) => transformProfessionalFromDoc(professional)),
    };
  } catch (error) {
    console.error('Error fetching mental health professionals:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch mental health professionals',
      professionals: [],
    };
  }
}

export async function getMentalHealthProfessional(id: string) {
  try {
    await connectDB();

    const professional = await MentalHealthProfessional.findById(id).lean();

    if (!professional) {
      return { success: false, error: 'Mental health professional not found' };
    }

    return {
      success: true,
      professional: transformProfessionalFromDoc(professional),
    };
  } catch (error) {
    console.error('Error fetching mental health professional:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch mental health professional',
    };
  }
}

export async function getMentalHealthProfessionalBySlug(slug: string) {
  try {
    await connectDB();

    const professional = await MentalHealthProfessional.findOne({ slug, status: 'ACTIVE' }).lean();

    if (!professional) {
      return { success: false, error: 'Mental health professional not found' };
    }

    return {
      success: true,
      professional: transformProfessionalFromDoc(professional),
    };
  } catch (error) {
    console.error('Error fetching mental health professional by slug:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch mental health professional',
    };
  }
}

// Helper functions
async function transformProfessional(id: string) {
  const professional = await MentalHealthProfessional.findById(id).lean();
  if (!professional) throw new Error('Mental health professional not found');
  return transformProfessionalFromDoc(professional);
}

function transformProfessionalFromDoc(professional: any) {
  return {
    id: String(professional._id),
    _id: String(professional._id),
    type: professional.type,
    name: professional.name,
    designation: professional.designation || null,
    designationOther: professional.designationOther || null,
    profilePicture: professional.profilePicture || null,
    about: professional.about || null,
    location: professional.location || {},
    qualification: professional.qualification || null,
    contact: professional.contact || {},
    modeOfDelivery: professional.modeOfDelivery,
    specializations: professional.specializations || [],
    specializationOther: professional.specializationOther || [],
    languages: professional.languages || [],
    experienceYears: professional.experienceYears || null,
    ageGroups: professional.ageGroups || [],
    sessionDuration: professional.sessionDuration || null,
    sessionFee: professional.sessionFee || null,
    insuranceAccepted: professional.insuranceAccepted || false,
    insuranceProviders: professional.insuranceProviders || [],
    availability: professional.availability || null,
    organizationInfo: professional.organizationInfo || null,
    featured: professional.featured || false,
    verified: professional.verified || false,
    status: professional.status,
    tags: professional.tags || [],
    notes: professional.notes || null,
    slug: professional.slug || null,
    metaDescription: professional.metaDescription || null,
    createdAt: professional.createdAt,
    updatedAt: professional.updatedAt,
  };
}

