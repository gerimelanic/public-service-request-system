'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  CATEGORIES,
  RequestCategory,
  MAX_IMAGE_BYTES,
  ALLOWED_IMAGE_TYPES,
} from '@/lib/constants';

export interface SubmitRequestState {
  error?: string | null;
  fieldErrors?: {
    category?: string;
    location?: string;
    description?: string;
    image?: string;
  };
}

export async function submitRequest(
  _prevState: SubmitRequestState,
  formData: FormData
): Promise<SubmitRequestState> {
  const supabase = await createClient();

  // 1. Authenticate user server-side
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to submit a service request.' };
  }

  // 2. Extract and sanitize inputs
  const category = String(formData.get('category') || '').trim() as RequestCategory;
  const customCategory = String(formData.get('custom_category') || '').trim();
  const location = String(formData.get('location') || '').trim();
  let description = String(formData.get('description') || '').trim();

  // If citizen selected 'other', combine custom category into description header
  if (category === 'other' && customCategory) {
    description = `[Service: ${customCategory}]\n\n${description}`;
  }
  const imageFile = formData.get('image') as File | null;

  const fieldErrors: SubmitRequestState['fieldErrors'] = {};

  // Validate Category against allowed list
  const validCategories = CATEGORIES.map((c) => c.value);
  if (!category || !validCategories.includes(category)) {
    fieldErrors.category = 'Please select a valid service category.';
  } else if (category === 'other' && !customCategory) {
    fieldErrors.category = 'Please specify the service not captured in the category list.';
  }

  // Validate Location
  if (!location || location.length < 3) {
    fieldErrors.location = 'Please provide a specific location (at least 3 characters).';
  } else if (location.length > 200) {
    fieldErrors.location = 'Location description is too long (maximum 200 characters).';
  }

  // Validate Description
  if (!description || description.length < 10) {
    fieldErrors.description = 'Please describe the issue in detail (at least 10 characters).';
  } else if (description.length > 2000) {
    fieldErrors.description = 'Description is too long (maximum 2000 characters).';
  }

  // 3. Validate Optional Image Upload
  let imageUrl: string | null = null;

  if (imageFile && imageFile.size > 0) {
    if (imageFile.size > MAX_IMAGE_BYTES) {
      fieldErrors.image = 'Image file size exceeds the 2 MB limit.';
    } else if (
      !ALLOWED_IMAGE_TYPES.includes(imageFile.type as (typeof ALLOWED_IMAGE_TYPES)[number])
    ) {
      fieldErrors.image = 'Only JPEG, PNG, and WebP image formats are allowed.';
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  // 4. Handle Storage Upload (images only, max 2MB, stored under {user_id}/{timestamp}-{clean_filename})
  if (imageFile && imageFile.size > 0) {
    const timestamp = Date.now();
    // Sanitize filename to avoid directory traversal or special character issues
    const sanitizedName = imageFile.name
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .toLowerCase();
    const filePath = `${user.id}/${timestamp}-${sanitizedName}`;

    const { error: uploadError } = await supabase.storage
      .from('request-images')
      .upload(filePath, imageFile, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      return {
        error: 'Failed to upload photo. Please verify your connection or try again.',
      };
    }

    const { data: publicUrlData } = supabase.storage
      .from('request-images')
      .getPublicUrl(filePath);

    imageUrl = publicUrlData.publicUrl;
  }

  // 5. Ensure citizen profile row exists to satisfy foreign key constraint
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) {
    // Self-heal: insert missing profile row for users created before trigger
    await supabase.from('profiles').insert({
      id: user.id,
      full_name:
        user.user_metadata?.full_name ||
        user.email?.split('@')[0] ||
        'Citizen',
      phone: user.user_metadata?.phone || null,
      id_number: user.user_metadata?.id_number || null,
      date_of_birth: user.user_metadata?.date_of_birth || null,
      role: 'citizen',
    });
  }

  // 6. Database Insertion (Protected by PostgreSQL RLS: citizen_id = auth.uid() and status = 'pending')
  const { error: insertError } = await supabase.from('service_requests').insert({
    citizen_id: user.id,
    category,
    location,
    description,
    image_url: imageUrl,
    status: 'pending', // Strictly enforced by RLS WITH CHECK policy
  });

  if (insertError) {
    console.error('Service request insert error details:', insertError);
    return {
      error: `Failed to submit service request: ${insertError.message || 'Please check your inputs and try again.'}`,
    };
  }

  // 6. Revalidate cache and redirect citizen back to their request list
  revalidatePath('/requests');
  redirect('/requests');
}
