CREATE OR REPLACE FUNCTION public.record_admin_action(_resource text,_operation text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NOT public.has_role(auth.uid(),'gestionnaire') OR _resource NOT IN ('admin-snapshot','account') OR _operation NOT IN ('READ','PASSWORD_CHANGE_REQUEST','PASSWORD_CHANGE') THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501'; END IF;
 INSERT INTO public.admin_audit_log(user_id,resource,operation) VALUES(auth.uid(),_resource,_operation);
END $$;
REVOKE ALL ON FUNCTION public.record_admin_action(text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.record_admin_action(text,text) TO authenticated;