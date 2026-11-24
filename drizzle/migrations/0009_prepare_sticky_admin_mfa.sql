CREATE TABLE public.admin_mfa_enforcement (user_id uuid PRIMARY KEY, activated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.admin_mfa_enforcement TO authenticated;
GRANT ALL ON public.admin_mfa_enforcement TO service_role;
ALTER TABLE public.admin_mfa_enforcement ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own MFA activation" ON public.admin_mfa_enforcement FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE OR REPLACE FUNCTION public.activate_admin_mfa() RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF auth.uid() IS NULL OR coalesce(auth.jwt()->>'aal','') <> 'aal2' OR NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=auth.uid() AND role='gestionnaire') OR NOT EXISTS (SELECT 1 FROM auth.mfa_factors WHERE user_id=auth.uid() AND status='verified' AND factor_type='totp') THEN
 RAISE EXCEPTION 'Second factor and manager role required' USING ERRCODE='42501';
 END IF;
 INSERT INTO public.admin_mfa_enforcement(user_id) VALUES(auth.uid()) ON CONFLICT (user_id) DO NOTHING;
 RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.activate_admin_mfa() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.activate_admin_mfa() TO authenticated;
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT _user_id=auth.uid() AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role)
 AND (_role <> 'gestionnaire' OR NOT EXISTS (SELECT 1 FROM public.admin_mfa_enforcement WHERE user_id=_user_id) OR coalesce(auth.jwt()->>'aal','')='aal2')
$$;
REVOKE ALL ON FUNCTION public.has_role(uuid,public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid,public.app_role) TO authenticated, service_role;
COMMENT ON TABLE public.admin_mfa_enforcement IS 'Sticky MFA rollout: only activate after the manager verifies a TOTP code. Never remove activation from browser code; owner-controlled recovery is required.';