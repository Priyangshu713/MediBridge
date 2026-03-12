
export interface Doctor {
  id: string;
  auth_user_id?: string;
  firstName: string;
  lastName: string;
  email?: string;
  specialty: string;
  subspecialties?: string[];
  hospital: string;
  location: string;
  experience: number;
  rating: number;
  reviewCount: number;
  patients: number;
  bio: string;
  education?: string[];
  certifications?: string[];
  specializations?: string[];
  availability_days?: string[];
  is_approved?: boolean;
  proof_document?: string;
  availability_hours?: string;
  contact_email?: string;
  contact_phone?: string;
  imageUrl?: string;
  created_at?: string;
  updated_at?: string;

  // Legacy compat helpers (computed, not in DB)
  _id?: string;
  availability?: {
    days: string[];
    hours: string;
  };
  contactInfo?: {
    email: string;
    phone: string;
  };
}

/**
 * Convert a raw Supabase row into a Doctor with legacy compat fields.
 * This lets existing UI code that reads doctor.availability.days or doctor.contactInfo.email
 * keep working without changes to every single component.
 */
export function mapSupabaseDoctorRow(row: any): Doctor {
  return {
    ...row,
    id: row.id,
    _id: row.id, // legacy compat
    firstName: row.first_name,
    lastName: row.last_name,
    specialty: row.specialty || '',
    subspecialties: row.subspecialties || [],
    hospital: row.hospital || '',
    location: row.location || '',
    experience: row.experience || 0,
    rating: Number(row.rating) || 0,
    reviewCount: row.review_count || 0,
    patients: row.patients || 0,
    bio: row.bio || '',
    education: row.education || [],
    certifications: row.certifications || [],
    specializations: row.specializations || [],
    availability_days: row.availability_days || [],
    availability_hours: row.availability_hours || '9:00 AM - 5:00 PM',
    contact_email: row.contact_email || '',
    contact_phone: row.contact_phone || '',
    // Legacy nested objects for UI compat
    availability: {
      days: row.availability_days || [],
      hours: row.availability_hours || '9:00 AM - 5:00 PM',
    },
    contactInfo: {
      email: row.contact_email || row.email || '',
      phone: row.contact_phone || '',
    },
  };
}
