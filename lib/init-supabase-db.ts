import { createSupabaseAdmin } from "./supabase-client"

export async function initializeDatabase() {
  try {
    console.log("Starting database initialization...")
    const supabase = createSupabaseAdmin()

    if (!supabase) {
      console.error("Failed to create Supabase admin client")
      return
    }

    // Check if profiles table exists
    const { data: tableExists, error: tableCheckError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_name", "profiles")
      .eq("table_schema", "public")
      .single()

    if (tableCheckError && tableCheckError.code !== "PGRST116") {
      console.error("Error checking if profiles table exists:", tableCheckError)
      return
    }

    // If profiles table doesn't exist, run the initialization script
    if (!tableExists) {
      console.log("Profiles table not found, running initialization script...")

      // Execute the SQL script directly
      const { error: sqlError } = await supabase.rpc("exec_sql", {
        sql_string: `
          -- Create profiles table
          CREATE TABLE IF NOT EXISTS public.profiles (
            id UUID PRIMARY KEY,
            email TEXT NOT NULL,
            display_name TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            avatar_url TEXT
          );
          
          -- Add foreign key constraint
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_constraint WHERE conname = 'profiles_id_fkey'
            ) THEN
              ALTER TABLE public.profiles
              ADD CONSTRAINT profiles_id_fkey
              FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
            END IF;
          END
          $$;
          
          -- Create index
          CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);
          
          -- Enable RLS
          ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
          
          -- Create policies
          CREATE POLICY "Users can view any profile"
            ON public.profiles
            FOR SELECT
            USING (true);
          
          CREATE POLICY "Users can update their own profile"
            ON public.profiles
            FOR UPDATE
            USING (auth.uid() = id);
          
          CREATE POLICY "Users can insert their own profile"
            ON public.profiles
            FOR INSERT
            WITH CHECK (auth.uid() = id);
          
          -- Create handle_new_user function
          CREATE OR REPLACE FUNCTION public.handle_new_user()
          RETURNS TRIGGER AS $$
          DECLARE
            retries INTEGER := 0;
            max_retries CONSTANT INTEGER := 3;
            success BOOLEAN := FALSE;
          BEGIN
            WHILE retries < max_retries AND NOT success LOOP
              BEGIN
                PERFORM pg_sleep(0.1 * retries);
                
                INSERT INTO public.profiles (
                  id, 
                  email, 
                  display_name, 
                  created_at,
                  updated_at
                )
                VALUES (
                  NEW.id,
                  COALESCE(NEW.email, ''),
                  COALESCE(
                    NEW.raw_user_meta_data->>'display_name', 
                    split_part(COALESCE(NEW.email, ''), '@', 1),
                    'user_' || substr(NEW.id::text, 1, 8)
                  ),
                  NOW(),
                  NOW()
                )
                ON CONFLICT (id) DO UPDATE SET
                  email = EXCLUDED.email,
                  display_name = EXCLUDED.display_name,
                  updated_at = NOW();
                  
                success := TRUE;
                EXIT;
              EXCEPTION
                WHEN OTHERS THEN
                  retries := retries + 1;
              END;
            END LOOP;
            
            RETURN NEW;
          END;
          $$ LANGUAGE plpgsql SECURITY DEFINER;
          
          -- Create trigger
          DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
          CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW
            EXECUTE FUNCTION public.handle_new_user();
        `,
      })

      if (sqlError) {
        console.error("Error executing SQL initialization:", sqlError)
        return
      }

      console.log("Database initialization script executed successfully")
    } else {
      console.log("Profiles table already exists, checking for trigger function...")

      // Check if the trigger function exists and update it if needed
      const { data: triggerExists, error: triggerCheckError } = await supabase
        .from("information_schema.routines")
        .select("routine_name")
        .eq("routine_name", "handle_new_user")
        .eq("routine_schema", "public")
        .single()

      if (triggerCheckError && triggerCheckError.code !== "PGRST116") {
        console.error("Error checking trigger function:", triggerCheckError)
      }

      // If trigger doesn't exist or we want to update it
      if (!triggerExists || true) {
        // Always update to ensure latest version
        console.log("Updating trigger function...")

        const { error: updateTriggerError } = await supabase.rpc("exec_sql", {
          sql_string: `
            -- Drop existing function if it exists
            DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
            
            -- Create improved function
            CREATE OR REPLACE FUNCTION public.handle_new_user()
            RETURNS TRIGGER AS $$
            DECLARE
              retries INTEGER := 0;
              max_retries CONSTANT INTEGER := 3;
              success BOOLEAN := FALSE;
            BEGIN
              WHILE retries < max_retries AND NOT success LOOP
                BEGIN
                  PERFORM pg_sleep(0.1 * retries);
                  
                  INSERT INTO public.profiles (
                    id, 
                    email, 
                    display_name, 
                    created_at,
                    updated_at
                  )
                  VALUES (
                    NEW.id,
                    COALESCE(NEW.email, ''),
                    COALESCE(
                      NEW.raw_user_meta_data->>'display_name', 
                      split_part(COALESCE(NEW.email, ''), '@', 1),
                      'user_' || substr(NEW.id::text, 1, 8)
                    ),
                    NOW(),
                    NOW()
                  )
                  ON CONFLICT (id) DO UPDATE SET
                    email = EXCLUDED.email,
                    display_name = EXCLUDED.display_name,
                    updated_at = NOW();
                    
                  success := TRUE;
                  EXIT;
                EXCEPTION
                  WHEN OTHERS THEN
                    retries := retries + 1;
                END;
              END LOOP;
              
              RETURN NEW;
            END;
            $$ LANGUAGE plpgsql SECURITY DEFINER;
            
            -- Create trigger
            DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
            CREATE TRIGGER on_auth_user_created
              AFTER INSERT ON auth.users
              FOR EACH ROW
              EXECUTE FUNCTION public.handle_new_user();
          `,
        })

        if (updateTriggerError) {
          console.error("Error updating trigger function:", updateTriggerError)
        } else {
          console.log("Trigger function updated successfully")
        }
      }
    }

    // Verify the profiles table structure
    const { data: profileColumns, error: columnsError } = await supabase
      .from("information_schema.columns")
      .select("column_name")
      .eq("table_name", "profiles")
      .eq("table_schema", "public")

    if (columnsError) {
      console.error("Error checking profiles table columns:", columnsError)
    } else {
      console.log("Profiles table columns:", profileColumns.map((col) => col.column_name).join(", "))
    }

    console.log("Database initialization completed")
  } catch (error) {
    console.error("Error initializing database:", error)
  }
}
