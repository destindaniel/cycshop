CREATE UNIQUE INDEX IF NOT EXISTS one_boutique_manager ON public.user_roles (role) WHERE role='gestionnaire';
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT _user_id=auth.uid() AND EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role)
 AND (_role<>'gestionnaire' OR (coalesce(auth.jwt()->>'aal','')='aal2' AND EXISTS(
 SELECT 1 FROM public.admin_mfa_enforcement e JOIN auth.sessions s ON s.factor_id=e.factor_id AND s.user_id=e.user_id JOIN auth.mfa_factors f ON f.id=e.factor_id AND f.user_id=e.user_id
 WHERE e.user_id=_user_id AND s.id::text=auth.jwt()->>'session_id' AND s.created_at>now()-interval '7 days' AND f.status='verified' AND f.factor_type='totp')))
$$;
REVOKE ALL ON FUNCTION public.has_role(uuid,public.app_role) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid,public.app_role) TO authenticated,service_role;
REVOKE INSERT,UPDATE,DELETE ON public.user_roles FROM anon,authenticated;
CREATE TABLE public.admin_audit_log (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, resource text NOT NULL, operation text NOT NULL, record_id text, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.admin_audit_log TO authenticated;
GRANT ALL ON public.admin_audit_log TO service_role;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Manager reads audit" ON public.admin_audit_log FOR SELECT TO authenticated USING(public.has_role(auth.uid(),'gestionnaire'));
CREATE OR REPLACE FUNCTION public.audit_admin_change() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF public.has_role(auth.uid(),'gestionnaire') THEN
 INSERT INTO public.admin_audit_log(user_id,resource,operation,record_id) VALUES(auth.uid(),TG_TABLE_NAME,TG_OP,CASE WHEN TG_OP='DELETE' THEN OLD.id::text ELSE NEW.id::text END);
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.audit_admin_change() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER audit_products AFTER INSERT OR UPDATE OR DELETE ON public.products FOR EACH ROW EXECUTE FUNCTION public.audit_admin_change();
CREATE TRIGGER audit_categories AFTER INSERT OR UPDATE OR DELETE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.audit_admin_change();
CREATE TRIGGER audit_promotions AFTER INSERT OR UPDATE OR DELETE ON public.promotions FOR EACH ROW EXECUTE FUNCTION public.audit_admin_change();
CREATE TRIGGER audit_orders AFTER UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.audit_admin_change();
CREATE OR REPLACE FUNCTION public.record_admin_image_action(_operation text,_path text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NOT public.has_role(auth.uid(),'gestionnaire') OR _operation NOT IN ('UPLOAD','DELETE') OR length(_path)>250 THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501'; END IF;
 INSERT INTO public.admin_audit_log(user_id,resource,operation,record_id) VALUES(auth.uid(),'products-images',_operation,_path);
END $$;
REVOKE ALL ON FUNCTION public.record_admin_image_action(text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.record_admin_image_action(text,text) TO authenticated;
CREATE TABLE public.admin_login_windows (ip_hash text PRIMARY KEY, attempts integer NOT NULL DEFAULT 0, window_started_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.admin_login_windows TO service_role;
ALTER TABLE public.admin_login_windows ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.consume_admin_login_attempt(_ip_hash text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE n integer;
BEGIN
 INSERT INTO public.admin_login_windows(ip_hash,attempts) VALUES(_ip_hash,1)
 ON CONFLICT(ip_hash) DO UPDATE SET attempts=CASE WHEN admin_login_windows.window_started_at<=now()-interval '15 minutes' THEN 1 ELSE least(admin_login_windows.attempts+1,6) END,
 window_started_at=CASE WHEN admin_login_windows.window_started_at<=now()-interval '15 minutes' THEN now() ELSE admin_login_windows.window_started_at END RETURNING attempts INTO n;
 RETURN n<=5;
END $$;
REVOKE ALL ON FUNCTION public.consume_admin_login_attempt(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.consume_admin_login_attempt(text) TO service_role;
CREATE OR REPLACE FUNCTION public.place_order(_items jsonb,_customer_name text,_customer_phone text,_city text,_district text,_line text,_notes text,_promo_code text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid:=auth.uid(); oid uuid; it jsonb; p record; q integer; sub integer:=0; disc integer:=0; pct integer;
BEGIN
 IF jsonb_typeof(_items) IS DISTINCT FROM 'array' OR jsonb_array_length(_items)=0 OR jsonb_array_length(_items)>100 THEN RAISE EXCEPTION 'Panier invalide'; END IF;
 IF coalesce(trim(_customer_name),'')='' OR coalesce(trim(_customer_phone),'')='' OR coalesce(trim(_line),'')='' THEN RAISE EXCEPTION 'Coordonnées incomplètes'; END IF;
 INSERT INTO public.orders(user_id,subtotal,total,customer_name,customer_phone,shipping_city,shipping_district,shipping_line,notes) VALUES(uid,0,0,trim(_customer_name),trim(_customer_phone),coalesce(nullif(trim(_city),''),'Brazzaville'),_district,trim(_line),_notes) RETURNING id INTO oid;
 FOR it IN SELECT * FROM jsonb_array_elements(_items) ORDER BY value->>'product_id' LOOP
 q:=(it->>'quantity')::integer; IF q IS NULL OR q<1 OR q>10000 THEN RAISE EXCEPTION 'Quantité invalide'; END IF;
 SELECT * INTO p FROM public.products WHERE id=(it->>'product_id')::uuid AND is_active FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Produit indisponible'; END IF;
 IF p.stock<q THEN RAISE EXCEPTION 'Stock insuffisant pour %',p.name; END IF;
 UPDATE public.products SET stock=stock-q WHERE id=p.id;
 INSERT INTO public.order_items(order_id,product_id,product_name,unit_price,quantity) VALUES(oid,p.id,p.name,p.price,q);
 sub:=sub+p.price*q;
 END LOOP;
 IF coalesce(trim(_promo_code),'')<>'' THEN
 SELECT discount_percent INTO pct FROM public.promotions WHERE upper(code)=upper(trim(_promo_code)) AND is_active AND (starts_at IS NULL OR starts_at<=now()) AND (ends_at IS NULL OR ends_at>now());
 IF pct IS NULL THEN RAISE EXCEPTION 'Code promo invalide'; END IF; disc:=(sub*pct)/100;
 END IF;
 UPDATE public.orders SET subtotal=sub,discount=disc,total=sub-disc,promotion_code=CASE WHEN pct IS NULL THEN NULL ELSE upper(trim(_promo_code)) END WHERE id=oid;
 RETURN oid;
END $$;
REVOKE ALL ON FUNCTION public.place_order(jsonb,text,text,text,text,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.place_order(jsonb,text,text,text,text,text,text,text) TO anon,authenticated;
COMMENT ON FUNCTION public.place_order(jsonb,text,text,text,text,text,text,text) IS 'Public checkout only through atomic price and stock validation; direct order INSERT intentionally denied.';