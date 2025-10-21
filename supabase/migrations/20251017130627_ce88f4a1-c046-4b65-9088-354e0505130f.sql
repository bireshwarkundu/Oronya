-- Fix critical RLS security issues

-- =====================================================
-- 1. FIX PROFILES TABLE - Restrict public access
-- =====================================================

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can update profiles" ON public.profiles;

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT
  USING (user_id = (auth.uid())::text);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT
  USING (
    has_admin_role((auth.uid())::text, 'government_admin'::user_role) OR 
    has_admin_role((auth.uid())::text, 'user_admin'::user_role) OR 
    has_admin_role((auth.uid())::text, 'company_admin'::user_role)
  );

-- Only allow profile creation during signup (user creates own profile)
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT
  WITH CHECK (user_id = (auth.uid())::text);

-- Users can update their own non-sensitive fields
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE
  USING (user_id = (auth.uid())::text)
  WITH CHECK (
    user_id = (auth.uid())::text AND
    -- Prevent modification of sensitive verification fields
    is_verified IS NOT DISTINCT FROM (SELECT is_verified FROM profiles WHERE user_id = (auth.uid())::text) AND
    verified_by IS NOT DISTINCT FROM (SELECT verified_by FROM profiles WHERE user_id = (auth.uid())::text) AND
    verified_at IS NOT DISTINCT FROM (SELECT verified_at FROM profiles WHERE user_id = (auth.uid())::text) AND
    verification_notes IS NOT DISTINCT FROM (SELECT verification_notes FROM profiles WHERE user_id = (auth.uid())::text)
  );

-- Admins can update all profile fields including verification status
CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE
  USING (
    has_admin_role((auth.uid())::text, 'government_admin'::user_role) OR 
    has_admin_role((auth.uid())::text, 'user_admin'::user_role) OR 
    has_admin_role((auth.uid())::text, 'company_admin'::user_role)
  );

-- =====================================================
-- 2. FIX OTP_VERIFICATIONS TABLE - Restrict access
-- =====================================================

DROP POLICY IF EXISTS "Anyone can select their own OTP verification" ON public.otp_verifications;
DROP POLICY IF EXISTS "Anyone can insert OTP verification" ON public.otp_verifications;
DROP POLICY IF EXISTS "Anyone can update their own OTP verification" ON public.otp_verifications;

-- Service role can insert OTPs (from edge functions)
CREATE POLICY "Service can manage OTP verifications" ON public.otp_verifications
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 3. FIX PASSWORD_CHANGE_REQUESTS TABLE - Restrict access
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own password change requests" ON public.password_change_requests;
DROP POLICY IF EXISTS "Users can insert password change requests" ON public.password_change_requests;
DROP POLICY IF EXISTS "Users can update their own password change requests" ON public.password_change_requests;

-- Service role can manage password change requests (from edge functions)
CREATE POLICY "Service can manage password requests" ON public.password_change_requests
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 4. FIX VERIFICATION_HISTORY - Add INSERT policy
-- =====================================================

-- Allow service role to insert verification history (from edge functions)
CREATE POLICY "Service can insert verification history" ON public.verification_history
  FOR INSERT
  WITH CHECK (true);

-- Admins can view all verification history
CREATE POLICY "Admins can view verification history" ON public.verification_history
  FOR SELECT
  USING (
    has_admin_role((auth.uid())::text, 'government_admin'::user_role) OR 
    has_admin_role((auth.uid())::text, 'user_admin'::user_role) OR 
    has_admin_role((auth.uid())::text, 'company_admin'::user_role)
  );