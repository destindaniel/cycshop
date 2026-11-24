REVOKE ALL ON FUNCTION public.grant_manager_if_owner() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION public.record_admin_image_action(_operation text,_path text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NOT public.has_role(auth.uid(),'gestionnaire') OR _operation NOT IN ('UPLOAD_REQUEST','UPLOAD','DELETE_REQUEST','DELETE') OR length(_path)>250 THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501'; END IF;
 INSERT INTO public.admin_audit_log(user_id,resource,operation,record_id) VALUES(auth.uid(),'products-images',_operation,_path);
END $$;
REVOKE ALL ON FUNCTION public.record_admin_image_action(text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.record_admin_image_action(text,text) TO authenticated;