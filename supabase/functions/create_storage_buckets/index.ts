
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  try {
    // Create a Supabase client with the Auth context of the logged in user.
    const supabaseClient = createClient(
      // Supabase API URL - env var exported by default.
      Deno.env.get('SUPABASE_URL') ?? '',
      // Supabase API ANON KEY - env var exported by default.
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );
    
    // Create property_images bucket (public)
    const { error: propertyImagesError } = await supabaseClient
      .storage
      .createBucket('property_images', { 
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp']
      });
      
    if (propertyImagesError) {
      console.error('Error creating property_images bucket:', propertyImagesError);
      return new Response(JSON.stringify({ error: propertyImagesError.message }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      });
    }
    
    // Create investment_receipts bucket (public)
    const { error: receiptsError } = await supabaseClient
      .storage
      .createBucket('investment_receipts', { 
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
      });
      
    if (receiptsError) {
      console.error('Error creating investment_receipts bucket:', receiptsError);
      return new Response(JSON.stringify({ error: receiptsError.message }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Create or update bucket policies
    // Property images bucket policy
    const { error: propertyImagesPolicyError } = await supabaseClient
      .storage
      .from('property_images')
      .createSignedUploadUrl('dummy-path');

    if (propertyImagesPolicyError) {
      console.error('Error with property_images policy:', propertyImagesPolicyError);
    }

    // Investment receipts bucket policy
    const { error: receiptsPolicyError } = await supabaseClient
      .storage
      .from('investment_receipts')
      .createSignedUploadUrl('dummy-path');

    if (receiptsPolicyError) {
      console.error('Error with investment_receipts policy:', receiptsPolicyError);
    }

    return new Response(
      JSON.stringify({ 
        message: 'Storage buckets created successfully',
        buckets: ['property_images', 'investment_receipts']
      }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
