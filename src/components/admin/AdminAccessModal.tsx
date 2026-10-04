import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Eye, EyeOff, Loader2, AlertCircle, X } from 'lucide-react';
import { verifyAdminAccessDetailed, ensureAnonymousSession } from '@/lib/auth/adminAccess';
import { isSupabaseConfigured } from '@/lib/supabase/client';

interface AdminAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AdminAccessModal({
  isOpen,
  onClose,
  onSuccess,
}: AdminAccessModalProps) {
  const [accessCode, setAccessCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input and reset state on open
  useEffect(() => {
    if (isOpen) {
      setAccessCode('');
      setErrorMessage(null);
      setIsLoading(false);
      setShowPassword(false);

      // Ensure Supabase anonymous session is active
      ensureAnonymousSession().then((session) => {
        if (!isSupabaseConfigured) {
          setSessionNotice('Local mode active (Supabase credentials not configured). Enter default code "admin_only" to access the Admin Console.');
        } else if (!session) {
          setSessionNotice('Unable to establish Supabase session.');
        } else {
          setSessionNotice(null);
        }
      });

      // Defer focus slightly for smooth modal transition
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (!accessCode.trim()) {
      setErrorMessage('Please enter the administrator access code.');
      inputRef.current?.focus();
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await verifyAdminAccessDetailed(accessCode);

      if (result.success) {
        setAccessCode('');
        onSuccess();
      } else {
        setErrorMessage(result.error || 'Invalid administrator access code.');
        inputRef.current?.select();
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'An unexpected verification error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs transition-opacity"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onClose();
        }
      }}
    >
      <div
        className="bg-white w-full max-w-sm rounded-2xl shadow-xl border border-neutral-200 overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-access-title"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-neutral-100 text-neutral-800">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h2 id="admin-access-title" className="text-sm font-bold text-neutral-900">
              Admin Access
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors disabled:opacity-50"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1">
            <p className="text-xs text-neutral-600 leading-relaxed">
              Enter the administrator access code to continue.
            </p>
          </div>

          {/* Optional notice if session or backend is unconfigured */}
          {sessionNotice && !errorMessage && (
            <div className="flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[11px] leading-snug">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-600" />
              <span>{sessionNotice}</span>
            </div>
          )}

          {/* Password Input Field */}
          <div className="space-y-1.5">
            <label
              htmlFor="admin-access-code"
              className="block text-[11px] font-semibold text-neutral-700 tracking-tight"
            >
              Access Code
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                id="admin-access-code"
                type={showPassword ? 'text' : 'password'}
                value={accessCode}
                onChange={(e) => {
                  setAccessCode(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                disabled={isLoading}
                autoComplete="current-password"
                placeholder="••••••••••••"
                className="w-full px-3 py-2 pr-9 text-xs font-mono bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-neutral-900 focus:bg-white transition-all disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                tabIndex={-1}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 transition-colors p-0.5"
                title={showPassword ? 'Hide code' : 'Show code'}
                aria-label={showPassword ? 'Hide code' : 'Show code'}
              >
                {showPassword ? (
                  <EyeOff className="w-3.5 h-3.5" />
                ) : (
                  <Eye className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div
              className="flex items-start gap-2 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs leading-snug animate-in fade-in"
              role="alert"
            >
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Modal Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-3.5 py-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors border border-transparent disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !accessCode.trim()}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 active:bg-neutral-950 rounded-lg shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <span>Unlock</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
