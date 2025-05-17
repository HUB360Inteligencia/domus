
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0';

// Get Supabase credentials from environment variables
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// Create a Supabase client with the service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

Deno.serve(async (req) => {
  try {
    // Check if the bucket already exists
    const { data: existingBuckets, error: listError } = await supabase
      .storage
      .listBuckets();

    if (listError) {
      return new Response(JSON.stringify({
        error: 'Failed to list buckets',
        details: listError
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const bucketExists = existingBuckets.some(bucket => bucket.name === 'property_images');
    
    if (!bucketExists) {
      // Create the property_images bucket
      const { error: createError } = await supabase
        .storage
        .createBucket('property_images', {
          public: true,
          fileSizeLimit: 5242880, // 5MB in bytes
          allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
        });

      if (createError) {
        return new Response(JSON.stringify({
          error: 'Failed to create bucket',
          details: createError
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: bucketExists ? 'Bucket already exists' : 'Bucket created successfully'
      }), 
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Server error', details: err.message }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});
