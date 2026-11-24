ALTER TABLE public.admin_mfa_enforcement ADD COLUMN factor_id uuid;
CREATE OR REPLACE FUNCTION public.activate_admin_mfa() RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE verified_factor uuid;
BEGIN
 IF auth.uid() IS NULL OR coalesce(auth.jwt()->>'aal','') <> 'aal2' OR NOT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=auth.uid() AND role='gestionnaire') THEN
 RAISE EXCEPTION 'Second factor and manager role required' USING ERRCODE='42501';
 END IF;
 SELECT s.factor_id INTO verified_factor FROM auth.sessions s JOIN auth.mfa_factors f ON f.id=s.factor_id AND f.user_id=s.user_id WHERE s.user_id=auth.uid() AND s.id::text=auth.jwt()->>'session_id' AND f.status='verified' AND f.factor_type='totp';
 IF verified_factor IS NULL THEN RAISE EXCEPTION 'Verified authenticator session required' USING ERRCODE='42501'; END IF;
 IF EXISTS(SELECT 1 FROM public.admin_mfa_enforcement WHERE user_id=auth.uid() AND factor_id IS DISTINCT FROM verified_factor) THEN RAISE EXCEPTION 'Owner-controlled recovery required' USING ERRCODE='42501'; END IF;
 INSERT INTO public.admin_mfa_enforcement(user_id,factor_id) VALUES(auth.uid(),verified_factor) ON CONFLICT(user_id) DO NOTHING;
 RETURN true;
END;
$$;
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid,_role public.app_role) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT _user_id=auth.uid() AND EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role)
 AND (_role<>'gestionnaire' OR NOT EXISTS(SELECT 1 FROM public.admin_mfa_enforcement WHERE user_id=_user_id) OR
 (coalesce(auth.jwt()->>'aal','')='aal2' AND EXISTS(SELECT 1 FROM public.admin_mfa_enforcement e JOIN auth.sessions s ON s.factor_id=e.factor_id AND s.user_id=e.user_id JOIN auth.mfa_factors f ON f.id=e.factor_id AND f.user_id=e.user_id WHERE e.user_id=_user_id AND s.id::text=auth.jwt()->>'session_id' AND f.status='verified' AND f.factor_type='totp')))
$$;
REVOKE ALL ON FUNCTION public.has_role(uuid,public.app_role) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid,public.app_role) TO authenticated,service_role;
REVOKE ALL ON FUNCTION public.activate_admin_mfa() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.activate_admin_mfa() TO authenticated;
COMMENT ON COLUMN public.admin_mfa_enforcement.factor_id IS 'Pinned verified TOTP factor. Only owner-controlled recovery may rebind this; browser clients never have write privileges.';