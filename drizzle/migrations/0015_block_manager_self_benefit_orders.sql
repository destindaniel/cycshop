CREATE OR REPLACE FUNCTION public.guard_order_integrity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'gestionnaire') THEN
    IF TG_OP = 'INSERT' THEN
      RAISE EXCEPTION 'Le compte gestionnaire ne peut pas passer de commande.';
    END IF;
    IF NEW.user_id = auth.uid() THEN
      RAISE EXCEPTION 'Modification non autorisée.';
    END IF;
  END IF;
  IF TG_OP = 'UPDATE' AND auth.uid() IS NOT NULL AND (
    NEW.subtotal IS DISTINCT FROM OLD.subtotal OR NEW.discount IS DISTINCT FROM OLD.discount OR
    NEW.total IS DISTINCT FROM OLD.total OR NEW.promotion_code IS DISTINCT FROM OLD.promotion_code OR
    NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.payment_method IS DISTINCT FROM OLD.payment_method) THEN
    RAISE EXCEPTION 'Seul le statut d''une commande peut être modifié.';
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.guard_order_integrity() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS guard_order_integrity ON public.orders;
CREATE TRIGGER guard_order_integrity BEFORE INSERT OR UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.guard_order_integrity();