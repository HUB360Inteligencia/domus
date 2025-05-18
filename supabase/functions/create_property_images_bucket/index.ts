
// Follow this setup guide to integrate the Deno runtime into your project:
// https://docs.supabase.com/guides/functions/connect-to-supabase
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

console.log("Creating property_images bucket...");

serve(async (req) => {
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    {
      global: {
        headers: { Authorization: req.headers.get("Authorization")! },
      },
    }
  );

  const adminClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  // Check if the bucket already exists
  const { data: buckets, error: getBucketsError } = await adminClient.storage.listBuckets();
  if (getBucketsError) {
    console.log("Error getting buckets:", getBucketsError.message);
    return new Response(JSON.stringify({ error: getBucketsError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const bucketExists = buckets?.some(bucket => bucket.name === "property_images");
  
  if (bucketExists) {
    console.log("Bucket property_images already exists");
    return new Response(
      JSON.stringify({ 
        status: "success", 
        message: "Bucket property_images already exists",
        bucketName: "property_images" 
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  // Create the bucket if it doesn't exist
  const { data, error } = await adminClient.storage.createBucket("property_images", {
    public: true,
    fileSizeLimit: 5242880, // 5MB in bytes
    allowedMimeTypes: ["image/png", "image/jpeg", "image/jpg", "image/webp"]
  });

  if (error) {
    console.log("Error creating bucket:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Create a policy to allow public read access
  const { error: policyError } = await adminClient.storage.from("property_images").createPolicy({
    name: "Public Read Access",
    type: "storage.objects",
    definition: {
      statements: [
        {
          effect: "allow",
          action: "select",
          principal: "*"
        }
      ],
      resource: {
        paths: ["**"]
      }
    }
  });

  if (policyError) {
    console.log("Error creating policy:", policyError.message);
  }

  return new Response(
    JSON.stringify({ 
      status: "success", 
      message: "Bucket property_images created successfully",
      bucketName: "property_images"
    }),
    { headers: { "Content-Type": "application/json" } }
  );
});
