import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

export interface AdminVerificationResult {
  success: boolean;
  error?: string;
}

/**
 * Checks whether the current client has an active Supabase authentication session.
 */
export async function getActiveAuthSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.warn('[AdminAuth] Error checking active session:', error.message);
      return null;
    }
    return session;
  } catch (err) {
    console.warn('[AdminAuth] Unexpected error checking session:', err);
    return null;
  }
}

/**
 * Pipeline Step 1 & 2: Browser -> Supabase anonymous session
 * Ensures the browser has an active Supabase session (initiating anonymous session if needed).
 */
export async function ensureAnonymousSession() {
  try {
    const existing = await getActiveAuthSession();
    if (existing?.user) {
      return existing;
    }

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signInAnonymously();
      if (!error && data?.session) {
        return data.session;
      }
    }
    return null;
  } catch (err) {
    console.warn('[AdminAuth] Error creating anonymous session:', err);
    return null;
  }
}

/**
 * Pipeline Step 6 & 7: members.role = 'admin' check
 * Checks whether the current authenticated user has already been assigned 'admin' role in public.members.
 */
export async function checkIsAdminMember(): Promise<boolean> {
  try {
    const session = await getActiveAuthSession();
    if (!session?.user?.id) return false;

    const { data, error } = await supabase
      .from('members')
      .select('role, status')
      .eq('user_id', session.user.id)
      .eq('role', 'admin')
      .eq('status', 'active')
      .maybeSingle();

    if (error) {
      return false;
    }

    return Boolean(data);
  } catch {
    return false;
  }
}

/**
 * Full Pipeline Execution:
 * Browser
 *   ↓
 * Supabase anonymous session (ensureAnonymousSession)
 *   ↓
 * Admin Access modal (user submits code)
 *   ↓
 * verify-admin-access (RPC or Edge Function)
 *   ↓
 * SHA-256(admin_only) [Server-side database / function hashing]
 *   ↓
 * Supabase credential record [public.admin_credentials matching]
 *   ↓
 * members.role = admin [Database elevates authenticated user]
 *   ↓
 * Admin Console
 */
export async function verifyAdminAccessDetailed(accessCode: string): Promise<AdminVerificationResult> {
  const trimmedCode = accessCode?.trim();
  if (!trimmedCode) {
    return {
      success: false,
      error: 'Please enter the administrator access code.',
    };
  }

  // Ensure Supabase environment credentials are present
  if (!isSupabaseConfigured) {
    return {
      success: false,
      error: 'Supabase backend is not configured. Please supply VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
    };
  }

  // Step 1: Ensure valid Supabase session (anonymous or authenticated)
  let session = await getActiveAuthSession();
  if (!session || !session.user) {
    session = await ensureAnonymousSession();
  }

  if (!session || !session.user) {
    return {
      success: false,
      error: 'Authentication session required. Unable to establish Supabase session.',
    };
  }

  // Fast check: If current user is already an admin in members table
  const alreadyAdmin = await checkIsAdminMember();
  if (alreadyAdmin) {
    return { success: true };
  }

  // Step 2: Invoke verify-admin-access server-side endpoint
  // Primary endpoint: Supabase RPC 'verify_admin_access'
  try {
    const { data, error } = await supabase.rpc('verify_admin_access', {
      access_code: trimmedCode,
    });

    if (!error) {
      if (data === true) {
        return { success: true };
      }
      return {
        success: false,
        error: 'Invalid administrator access code.',
      };
    }

    // If RPC procedure was not found, attempt Edge Function endpoint 'verify-admin-access'
    if (
      error.code === 'PGRST202' ||
      error.message?.includes('function') ||
      error.message?.includes('does not exist')
    ) {
      const { data: edgeData, error: edgeError } = await supabase.functions.invoke(
        'verify-admin-access',
        { body: { access_code: trimmedCode } }
      );

      if (!edgeError && edgeData?.success === true) {
        return { success: true };
      }

      if (edgeError) {
        return {
          success: false,
          error: 'Verification service error: Endpoint "verify-admin-access" not found on Supabase backend.',
        };
      }

      return {
        success: false,
        error: edgeData?.error || 'Invalid administrator access code.',
      };
    }

    return {
      success: false,
      error: error.message || 'Server error occurred during administrator verification.',
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Network error communicating with authentication service.',
    };
  }
}

/**
 * Standard verification contract returning a Promise<boolean>.
 * Evaluates the full server-side verification pipeline.
 */
export async function verifyAdminAccess(accessCode: string): Promise<boolean> {
  const result = await verifyAdminAccessDetailed(accessCode);
  return result.success;
}
