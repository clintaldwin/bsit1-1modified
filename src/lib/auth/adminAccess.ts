import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

export interface AdminVerificationResult {
  success: boolean;
  error?: string;
}

export const LOCAL_ADMIN_STORAGE_KEY = 'section_lobby_admin_active';

/**
 * Checks whether the current client has an active Supabase authentication session.
 */
export async function getActiveAuthSession() {
  try {
    if (!isSupabaseConfigured) {
      return null;
    }
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
    } else {
      // In local mode without external Supabase credentials:
      return { user: { id: 'mock-local-user-id', email: 'admin@sectionlobby.local' } } as any;
    }
    return null;
  } catch (err) {
    console.warn('[AdminAuth] Error creating anonymous session:', err);
    return null;
  }
}

/**
 * Pipeline Step 6 & 7: members.role = 'admin' check
 * Checks whether the current authenticated user has already been assigned 'admin' role.
 */
export async function checkIsAdminMember(): Promise<boolean> {
  try {
    if (!isSupabaseConfigured) {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(LOCAL_ADMIN_STORAGE_KEY) === 'true';
      }
      return false;
    }

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
 * Clears local mock admin session state (e.g. when switching back to student view).
 */
export function clearLocalAdminSession(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem(LOCAL_ADMIN_STORAGE_KEY);
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
 * verify-admin-access (RPC, Edge Function, or local fallback matching 'admin_only')
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

  // Local fallback when Supabase backend is not configured:
  // Validate against default admin access code: 'admin_only'
  if (!isSupabaseConfigured) {
    if (trimmedCode === 'admin_only' || trimmedCode === 'admin') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(LOCAL_ADMIN_STORAGE_KEY, 'true');
      }
      return { success: true };
    }
    return {
      success: false,
      error: 'Invalid administrator access code. Enter "admin_only" for default local admin access.',
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
