import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify the requesting user is an admin
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    
    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !requestingUser) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if requesting user is admin or CEO
    const { data: isAdmin } = await supabaseAdmin.rpc("is_admin", { _user_id: requestingUser.id });
    const { data: isCeo } = await supabaseAdmin.rpc("is_ceo", { _user_id: requestingUser.id });
    
    if (!isAdmin && !isCeo) {
      return new Response(
        JSON.stringify({ error: "Insufficient permissions" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { email, full_name, role } = await req.json();

    if (!email || !full_name) {
      return new Response(
        JSON.stringify({ error: "Email and full_name are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate a secure random password
    const tempPassword = crypto.randomUUID().slice(0, 16);

    // Create the user using admin API
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name,
      },
    });

    if (createError) {
      console.error("Error creating user:", createError);
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create profile for the new user
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: newUser.user.id,
        full_name,
      });

    if (profileError) {
      console.error("Error creating profile:", profileError);
    }

    // Assign role if provided
    if (role) {
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .insert({
          user_id: newUser.user.id,
          role,
        });

      if (roleError) {
        console.error("Error assigning role:", roleError);
      }
    }

    // Send password reset email so user can set their own password
    const { error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
    });

    if (resetError) {
      console.error("Error sending reset email:", resetError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: { 
          id: newUser.user.id, 
          email: newUser.user.email,
          full_name,
        },
        message: "המשתמש נוצר בהצלחה. הזמנה נשלחה לאימייל."
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
