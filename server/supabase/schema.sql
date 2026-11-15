create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shops (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references public.users(id) on delete cascade,
  slug text not null unique,
  name text not null,
  category text,
  whatsapp text not null,
  tagline text,
  logo text,
  theme jsonb not null default '{"primary":"#0f766e","accent":"#f5b82e","font":"sans","layout":"grid"}'::jsonb,
  languages text[] not null default array['English'],
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  name text not null,
  description text,
  price numeric(12,2) not null check (price >= 0),
  stock integer check (stock is null or stock >= 0),
  images text[] not null default '{}',
  category text,
  tags text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  items jsonb not null,
  customer_name text not null,
  phone text not null,
  address text,
  note text,
  total numeric(12,2) not null check (total >= 0),
  status text not null default 'new' check (status in ('new','confirmed','delivered','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  type text not null check (type in ('view','add_to_cart','checkout_click')),
  product_id uuid references public.products(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.suggestions (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  type text not null,
  payload jsonb,
  reason text,
  status text not null default 'new' check (status in ('new','done','dismissed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_shop_created_idx on public.products(shop_id, created_at desc);
create index if not exists orders_shop_created_idx on public.orders(shop_id, created_at desc);
create index if not exists events_shop_created_idx on public.events(shop_id, created_at desc);
create index if not exists suggestions_shop_status_created_idx on public.suggestions(shop_id, status, created_at desc);

alter table public.users enable row level security;
alter table public.shops enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.events enable row level security;
alter table public.suggestions enable row level security;

create or replace function public.place_order(
  p_shop_id uuid,
  p_customer_name text,
  p_phone text,
  p_address text,
  p_note text,
  p_items jsonb
)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_item jsonb;
  v_product public.products%rowtype;
  v_product_id uuid;
  v_qty integer;
  v_items jsonb := '[]'::jsonb;
  v_total numeric(12,2) := 0;
  v_order public.orders%rowtype;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'Your cart is empty';
  end if;
  if jsonb_array_length(p_items) = 0 then
    raise exception 'Your cart is empty';
  end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_product_id := (v_item->>'productId')::uuid;
    v_qty := (v_item->>'qty')::integer;
    if v_qty < 1 then
      raise exception 'Invalid item quantity';
    end if;

    select * into v_product
    from public.products
    where id = v_product_id and shop_id = p_shop_id and active
    for update;

    if not found then
      raise exception 'An item in your cart is no longer available';
    end if;
    if v_product.stock is not null and v_product.stock < v_qty then
      raise exception 'Only % left of %', v_product.stock, v_product.name;
    end if;

    if v_product.stock is not null then
      update public.products
      set stock = stock - v_qty, updated_at = now()
      where id = v_product.id;
    end if;

    v_items := v_items || jsonb_build_array(jsonb_build_object(
      'productId', v_product.id,
      'name', v_product.name,
      'price', v_product.price,
      'qty', v_qty
    ));
    v_total := v_total + v_product.price * v_qty;
  end loop;

  insert into public.orders(shop_id, items, customer_name, phone, address, note, total)
  values (p_shop_id, v_items, p_customer_name, p_phone, p_address, p_note, v_total)
  returning * into v_order;

  return to_jsonb(v_order);
end;
$$;

revoke all on function public.place_order(uuid, text, text, text, text, jsonb) from public;
grant execute on function public.place_order(uuid, text, text, text, text, jsonb) to service_role;
