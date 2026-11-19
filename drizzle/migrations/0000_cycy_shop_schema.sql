
create type public.app_role as enum ('gestionnaire','client');
create type public.order_status as enum ('en_attente','confirmee','en_preparation','expediee','livree','annulee');

create or replace function public.set_updated_at() returns trigger language plpgsql set search_path=public as $$
begin new.updated_at = now(); return new; end $$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text, email text, phone text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(user_id, role)
);
grant select, update on public.profiles to authenticated; grant all on public.profiles to service_role;
grant select on public.user_roles to authenticated; grant all on public.user_roles to service_role;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role) returns boolean
language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.user_roles where user_id=_user_id and role=_role) $$;

create policy "Own profile read" on public.profiles for select to authenticated using (id = auth.uid() or public.has_role(auth.uid(),'gestionnaire'));
create policy "Own profile update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "Own roles read" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'gestionnaire'));

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles(id, email, full_name) values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  insert into public.user_roles(user_id, role) values (new.id, 'client');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique, name text not null, description text, image_url text,
  is_public boolean not null default true, sort_order int not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null, slug text not null unique, description text,
  price integer not null check (price >= 0),
  compare_at_price integer check (compare_at_price is null or compare_at_price >= 0),
  stock integer not null default 0 check (stock >= 0),
  images text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.promotions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique, description text,
  discount_percent integer not null check (discount_percent between 1 and 90),
  is_active boolean not null default true, starts_at timestamptz, ends_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  full_name text not null, phone text not null, city text not null default 'Brazzaville',
  district text, line text not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete restrict,
  status public.order_status not null default 'en_attente',
  payment_method text not null default 'paiement_livraison',
  subtotal integer not null, discount integer not null default 0, total integer not null,
  promotion_code text,
  customer_name text not null, customer_phone text not null,
  shipping_city text not null, shipping_district text, shipping_line text not null, notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null, unit_price integer not null, quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(user_id, product_id)
);

grant select on public.categories, public.products, public.promotions to anon;
grant select, insert, update, delete on public.categories, public.products, public.promotions, public.addresses, public.orders, public.order_items, public.favorites to authenticated;
grant all on public.categories, public.products, public.promotions, public.addresses, public.orders, public.order_items, public.favorites to service_role;

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.promotions enable row level security;
alter table public.addresses enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.favorites enable row level security;

create policy "Public categories" on public.categories for select to anon, authenticated using (is_public or public.has_role(auth.uid(),'gestionnaire'));
create policy "Manage categories" on public.categories for all to authenticated using (public.has_role(auth.uid(),'gestionnaire')) with check (public.has_role(auth.uid(),'gestionnaire'));
create policy "Active products" on public.products for select to anon, authenticated using (is_active or public.has_role(auth.uid(),'gestionnaire'));
create policy "Manage products" on public.products for all to authenticated using (public.has_role(auth.uid(),'gestionnaire')) with check (public.has_role(auth.uid(),'gestionnaire'));
create policy "Active promotions" on public.promotions for select to anon, authenticated using ((is_active and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now())) or public.has_role(auth.uid(),'gestionnaire'));
create policy "Manage promotions" on public.promotions for all to authenticated using (public.has_role(auth.uid(),'gestionnaire')) with check (public.has_role(auth.uid(),'gestionnaire'));
create policy "Own addresses" on public.addresses for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Manager reads addresses" on public.addresses for select to authenticated using (public.has_role(auth.uid(),'gestionnaire'));
create policy "Own orders read" on public.orders for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'gestionnaire'));
create policy "Manager updates orders" on public.orders for update to authenticated using (public.has_role(auth.uid(),'gestionnaire')) with check (public.has_role(auth.uid(),'gestionnaire'));
create policy "Own order items read" on public.order_items for select to authenticated using (exists(select 1 from public.orders o where o.id=order_id and (o.user_id=auth.uid() or public.has_role(auth.uid(),'gestionnaire'))));
create policy "Own favorites" on public.favorites for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

do $$ declare t text; begin
  foreach t in array array['profiles','user_roles','categories','products','promotions','addresses','orders','order_items','favorites'] loop
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t);
  end loop; end $$;

-- Secure checkout: freezes prices, applies promotion, decrements stock atomically
create or replace function public.place_order(_items jsonb, _customer_name text, _customer_phone text, _city text, _district text, _line text, _notes text, _promo_code text)
returns uuid language plpgsql security definer set search_path=public as $$
declare uid uuid := auth.uid(); oid uuid; it jsonb; p record; q int; sub int := 0; disc int := 0; pct int;
begin
  if uid is null then raise exception 'Connexion requise'; end if;
  if jsonb_array_length(coalesce(_items,'[]'::jsonb)) = 0 then raise exception 'Panier vide'; end if;
  if coalesce(trim(_customer_name),'')='' or coalesce(trim(_customer_phone),'')='' or coalesce(trim(_line),'')='' then raise exception 'Coordonnées incomplètes'; end if;
  insert into public.orders(user_id, subtotal, total, customer_name, customer_phone, shipping_city, shipping_district, shipping_line, notes)
    values (uid, 0, 0, trim(_customer_name), trim(_customer_phone), coalesce(nullif(trim(_city),''),'Brazzaville'), _district, trim(_line), _notes) returning id into oid;
  for it in select * from jsonb_array_elements(_items) loop
    q := (it->>'quantity')::int;
    if q is null or q < 1 then raise exception 'Quantité invalide'; end if;
    select * into p from public.products where id = (it->>'product_id')::uuid and is_active for update;
    if not found then raise exception 'Produit indisponible'; end if;
    if p.stock < q then raise exception 'Stock insuffisant pour %', p.name; end if;
    update public.products set stock = stock - q where id = p.id;
    insert into public.order_items(order_id, product_id, product_name, unit_price, quantity) values (oid, p.id, p.name, p.price, q);
    sub := sub + p.price * q;
  end loop;
  if coalesce(trim(_promo_code),'') <> '' then
    select discount_percent into pct from public.promotions where upper(code)=upper(trim(_promo_code)) and is_active and (starts_at is null or starts_at<=now()) and (ends_at is null or ends_at>now());
    if pct is null then raise exception 'Code promo invalide'; end if;
    disc := (sub * pct) / 100;
  end if;
  update public.orders set subtotal=sub, discount=disc, total=sub-disc, promotion_code=case when pct is null then null else upper(trim(_promo_code)) end where id=oid;
  return oid;
end $$;
revoke execute on function public.place_order(jsonb,text,text,text,text,text,text,text) from public, anon;
grant execute on function public.place_order(jsonb,text,text,text,text,text,text,text) to authenticated;

insert into public.categories(slug,name,description,sort_order) values
 ('electronique','Électronique','La technologie au quotidien',1),
 ('vetements','Vêtements','Votre style, votre signature',2),
 ('chaussures','Chaussures','L’élégance à chaque pas',3),
 ('accessoires','Accessoires','Les détails qui font la différence',4);
