/**
 * Authentication Cleanup Utility
 * Provides robust auth state cleanup to prevent limbo states
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from './logger';

/**
 * Comprehensive cleanup of all auth-related storage
 * Removes all Supabase auth keys from localStorage and sessionStorage
 */
export const cleanupAuthState = (): void => {
  try {
    logger.debug('Starting auth state cleanup');
    
    // Remove standard auth tokens
    localStorage.removeItem('supabase.auth.token');
    
    // Remove all Supabase auth keys from localStorage
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
        logger.debug('Removed from localStorage', { metadata: { key } });
      }
    });
    
    // Remove from sessionStorage if available
    if (typeof sessionStorage !== 'undefined') {
      Object.keys(sessionStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          sessionStorage.removeItem(key);
          logger.debug('Removed from sessionStorage', { metadata: { key } });
        }
      });
    }
    
    logger.info('Auth state cleanup completed successfully');
  } catch (error) {
    logger.error('Failed to cleanup auth state', { component: 'AuthCleanup' }, error as Error);
  }
};

/**
 * Robust sign out with cleanup
 * Performs cleanup, attempts global sign out, and forces page refresh
 */
export const robustSignOut = async (): Promise<void> => {
  try {
    logger.authEvent('Starting robust sign out');
    
    // Clean up auth state first
    cleanupAuthState();
    
    // Attempt global sign out (fallback if it fails)
    try {
      await supabase.auth.signOut({ scope: 'global' });
      logger.authEvent('Global sign out successful');
    } catch (signOutError) {
      logger.warn('Global sign out failed, continuing with cleanup', 
        { component: 'AuthCleanup' }, signOutError as Error);
    }
    
    // Force page reload for clean state
    logger.authEvent('Redirecting to auth page');
    window.location.href = '/auth';
  } catch (error) {
    logger.error('Robust sign out failed', { component: 'AuthCleanup' }, error as Error);
    // Force redirect even if cleanup fails
    window.location.href = '/auth';
  }
};

/**
 * Robust sign in with pre-cleanup
 * Cleans up existing state before attempting sign in
 */
export const robustSignIn = async (email: string, password: string): Promise<any> => {
  try {
    logger.authEvent('Starting robust sign in', { metadata: { email } });
    
    // Clean up existing state
    cleanupAuthState();
    
    // Attempt global sign out first
    try {
      await supabase.auth.signOut({ scope: 'global' });
    } catch (err) {
      logger.warn('Pre-signin cleanup sign out failed, continuing', 
        { component: 'AuthCleanup' }, err as Error);
    }
    
    // Sign in with email/password
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      logger.error('Sign in failed', { component: 'Auth', metadata: { email } }, error);
      throw error;
    }
    
    if (data.user) {
      logger.authEvent('Sign in successful, redirecting', { 
        userId: data.user.id,
        metadata: { email }
      });
      
      // Force page reload for clean state
      window.location.href = '/';
    }
    
    return data;
  } catch (error) {
    logger.error('Robust sign in failed', { 
      component: 'AuthCleanup',
      metadata: { email }
    }, error as Error);
    throw error;
  }
};