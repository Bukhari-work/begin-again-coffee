--
-- PostgreSQL database dump
--

\restrict eySUzVdgb8fFVyDSNtd98kfS6cjkS9xQ0gsknin0HV43cSZ98qhLfB7x0jEpAAf

-- Dumped from database version 18.3 (Homebrew)
-- Dumped by pg_dump version 18.3 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: order_item_status; Type: TYPE; Schema: public; Owner: ahmadbukhari
--

CREATE TYPE public.order_item_status AS ENUM (
    'active',
    'voided',
    'refunded'
);


ALTER TYPE public.order_item_status OWNER TO ahmadbukhari;

--
-- Name: order_kind; Type: TYPE; Schema: public; Owner: ahmadbukhari
--

CREATE TYPE public.order_kind AS ENUM (
    'sale',
    'refund'
);


ALTER TYPE public.order_kind OWNER TO ahmadbukhari;

--
-- Name: order_status; Type: TYPE; Schema: public; Owner: ahmadbukhari
--

CREATE TYPE public.order_status AS ENUM (
    'preparing',
    'served',
    'cancelled'
);


ALTER TYPE public.order_status OWNER TO ahmadbukhari;

--
-- Name: TYPE order_status; Type: COMMENT; Schema: public; Owner: ahmadbukhari
--

COMMENT ON TYPE public.order_status IS 'Current status of an order in the POS system.';


--
-- Name: payment_type; Type: TYPE; Schema: public; Owner: ahmadbukhari
--

CREATE TYPE public.payment_type AS ENUM (
    'cash',
    'qris'
);


ALTER TYPE public.payment_type OWNER TO ahmadbukhari;

--
-- Name: TYPE payment_type; Type: COMMENT; Schema: public; Owner: ahmadbukhari
--

COMMENT ON TYPE public.payment_type IS 'Supported payment methods in POS';


--
-- Name: shift_type; Type: TYPE; Schema: public; Owner: ahmadbukhari
--

CREATE TYPE public.shift_type AS ENUM (
    'day',
    'night'
);


ALTER TYPE public.shift_type OWNER TO ahmadbukhari;

--
-- Name: TYPE shift_type; Type: COMMENT; Schema: public; Owner: ahmadbukhari
--

COMMENT ON TYPE public.shift_type IS 'Type of work shift during which a transaction or activity occurs.';


--
-- Name: user_role; Type: TYPE; Schema: public; Owner: ahmadbukhari
--

CREATE TYPE public.user_role AS ENUM (
    'manager',
    'barista'
);


ALTER TYPE public.user_role OWNER TO ahmadbukhari;

--
-- Name: TYPE user_role; Type: COMMENT; Schema: public; Owner: ahmadbukhari
--

COMMENT ON TYPE public.user_role IS 'Role of a staff user in the POS system, defining access level and responsibilities.';


--
-- Name: variant_type; Type: TYPE; Schema: public; Owner: ahmadbukhari
--

CREATE TYPE public.variant_type AS ENUM (
    'bean',
    'syrup',
    'milk',
    'packaging'
);


ALTER TYPE public.variant_type OWNER TO ahmadbukhari;

--
-- Name: TYPE variant_type; Type: COMMENT; Schema: public; Owner: ahmadbukhari
--

COMMENT ON TYPE public.variant_type IS 'Category of product variation or modifier used in menu customization.';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: ahmadbukhari
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    name text NOT NULL
);


ALTER TABLE public.categories OWNER TO ahmadbukhari;

--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: ahmadbukhari
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categories_id_seq OWNER TO ahmadbukhari;

--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ahmadbukhari
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: ingredients; Type: TABLE; Schema: public; Owner: ahmadbukhari
--

CREATE TABLE public.ingredients (
    id integer NOT NULL,
    name text NOT NULL,
    unit text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    category text NOT NULL,
    brand text,
    type text
);


ALTER TABLE public.ingredients OWNER TO ahmadbukhari;

--
-- Name: ingredients_id_seq; Type: SEQUENCE; Schema: public; Owner: ahmadbukhari
--

CREATE SEQUENCE public.ingredients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ingredients_id_seq OWNER TO ahmadbukhari;

--
-- Name: ingredients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ahmadbukhari
--

ALTER SEQUENCE public.ingredients_id_seq OWNED BY public.ingredients.id;


--
-- Name: items; Type: TABLE; Schema: public; Owner: ahmadbukhari
--

CREATE TABLE public.items (
    id integer NOT NULL,
    name text NOT NULL,
    price integer NOT NULL,
    category_id integer NOT NULL,
    description text,
    featured_rank smallint DEFAULT 0 NOT NULL,
    is_available boolean DEFAULT true NOT NULL,
    image_url text
);


ALTER TABLE public.items OWNER TO ahmadbukhari;

--
-- Name: modifier_group_rules; Type: TABLE; Schema: public; Owner: ahmadbukhari
--

CREATE TABLE public.modifier_group_rules (
    id integer NOT NULL,
    group_id integer NOT NULL,
    category_id integer,
    item_id integer
);


ALTER TABLE public.modifier_group_rules OWNER TO ahmadbukhari;

--
-- Name: modifier_groups; Type: TABLE; Schema: public; Owner: ahmadbukhari
--

CREATE TABLE public.modifier_groups (
    id integer NOT NULL,
    name text NOT NULL,
    min_selections integer DEFAULT 0 NOT NULL,
    max_selections integer
);


ALTER TABLE public.modifier_groups OWNER TO ahmadbukhari;

--
-- Name: modifiers; Type: TABLE; Schema: public; Owner: ahmadbukhari
--

CREATE TABLE public.modifiers (
    id integer NOT NULL,
    group_id integer NOT NULL,
    name text NOT NULL,
    price_adjustment integer DEFAULT 0 NOT NULL,
    ingredient_id integer,
    quantity numeric DEFAULT 1 NOT NULL,
    behavior text DEFAULT 'STATIC'::text NOT NULL,
    is_available boolean DEFAULT true NOT NULL
);


ALTER TABLE public.modifiers OWNER TO ahmadbukhari;

--
-- Name: purchases; Type: TABLE; Schema: public; Owner: ahmadbukhari
--

CREATE TABLE public.purchases (
    id integer NOT NULL,
    ingredient_id integer,
    purchase_date date DEFAULT CURRENT_DATE,
    quantity numeric(10,2) NOT NULL,
    total_cost integer NOT NULL,
    supplier text,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.purchases OWNER TO ahmadbukhari;

--
-- Name: recipes; Type: TABLE; Schema: public; Owner: ahmadbukhari
--

CREATE TABLE public.recipes (
    item_variation_id integer CONSTRAINT recipes_item_id_not_null NOT NULL,
    ingredient_id integer NOT NULL,
    amount numeric(10,2) NOT NULL
);


ALTER TABLE public.recipes OWNER TO ahmadbukhari;

--
-- Name: view_ingredient_costs; Type: VIEW; Schema: public; Owner: ahmadbukhari
--

CREATE VIEW public.view_ingredient_costs AS
 SELECT DISTINCT ON (ingredient_id) ingredient_id,
    purchase_date,
    ((total_cost)::numeric / NULLIF(quantity, (0)::numeric)) AS cost_per_unit
   FROM public.purchases
  ORDER BY ingredient_id, purchase_date DESC, id DESC;


ALTER VIEW public.view_ingredient_costs OWNER TO ahmadbukhari;

--
-- Name: item_cogs; Type: VIEW; Schema: public; Owner: ahmadbukhari
--

CREATE VIEW public.item_cogs AS
 WITH base_costs AS (
         SELECT i_1.id AS item_id,
            COALESCE(sum((r.amount * vic.cost_per_unit)), (0)::numeric) AS base_cogs
           FROM ((public.items i_1
             LEFT JOIN public.recipes r ON ((i_1.id = r.item_variation_id)))
             LEFT JOIN public.view_ingredient_costs vic ON ((r.ingredient_id = vic.ingredient_id)))
          GROUP BY i_1.id
        ), mandatory_group_averages AS (
         SELECT i_1.id AS item_id,
            mg.id AS group_id,
            COALESCE(avg((m.quantity * vic.cost_per_unit)), (0)::numeric) AS avg_group_cogs,
            COALESCE(avg(m.price_adjustment), (0)::numeric) AS avg_group_price_adj
           FROM ((((public.items i_1
             JOIN public.modifier_group_rules mgr ON (((mgr.item_id = i_1.id) OR (mgr.category_id = i_1.category_id))))
             JOIN public.modifier_groups mg ON ((mgr.group_id = mg.id)))
             JOIN public.modifiers m ON (((mg.id = m.group_id) AND (m.is_available = true))))
             LEFT JOIN public.view_ingredient_costs vic ON ((m.ingredient_id = vic.ingredient_id)))
          WHERE ((mg.min_selections >= 1) AND (m.behavior = 'STATIC'::text))
          GROUP BY i_1.id, mg.id
        ), modifier_costs AS (
         SELECT mandatory_group_averages.item_id,
            sum(mandatory_group_averages.avg_group_cogs) AS total_avg_modifier_cogs,
            sum(mandatory_group_averages.avg_group_price_adj) AS total_avg_modifier_price_adj
           FROM mandatory_group_averages
          GROUP BY mandatory_group_averages.item_id
        )
 SELECT i.id AS item_id,
    i.name AS item_name,
    i.price AS base_price,
    ((i.price)::numeric + COALESCE(mc.total_avg_modifier_price_adj, (0)::numeric)) AS selling_price,
    bc.base_cogs,
    COALESCE(mc.total_avg_modifier_cogs, (0)::numeric) AS variant_cogs,
    (bc.base_cogs + COALESCE(mc.total_avg_modifier_cogs, (0)::numeric)) AS total_cogs,
    (((i.price)::numeric + COALESCE(mc.total_avg_modifier_price_adj, (0)::numeric)) - (bc.base_cogs + COALESCE(mc.total_avg_modifier_cogs, (0)::numeric))) AS gross_profit,
        CASE
            WHEN (((i.price)::numeric + COALESCE(mc.total_avg_modifier_price_adj, (0)::numeric)) = (0)::numeric) THEN (0)::numeric
            ELSE round((((1)::numeric - ((bc.base_cogs + COALESCE(mc.total_avg_modifier_cogs, (0)::numeric)) / ((i.price)::numeric + COALESCE(mc.total_avg_modifier_price_adj, (0)::numeric)))) * (100)::numeric), 1)
        END AS margin_percent
   FROM ((public.items i
     LEFT JOIN base_costs bc ON ((i.id = bc.item_id)))
     LEFT JOIN modifier_costs mc ON ((i.id = mc.item_id)));


ALTER VIEW public.item_cogs OWNER TO ahmadbukhari;

--
-- Name: item_variations; Type: TABLE; Schema: public; Owner: ahmadbukhari
--

CREATE TABLE public.item_variations (
    id integer NOT NULL,
    item_id integer NOT NULL,
    name text NOT NULL,
    price integer NOT NULL,
    is_available boolean DEFAULT true
);


ALTER TABLE public.item_variations OWNER TO ahmadbukhari;

--
-- Name: item_variations_id_seq; Type: SEQUENCE; Schema: public; Owner: ahmadbukhari
--

CREATE SEQUENCE public.item_variations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.item_variations_id_seq OWNER TO ahmadbukhari;

--
-- Name: item_variations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ahmadbukhari
--

ALTER SEQUENCE public.item_variations_id_seq OWNED BY public.item_variations.id;


--
-- Name: items_id_seq; Type: SEQUENCE; Schema: public; Owner: ahmadbukhari
--

CREATE SEQUENCE public.items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.items_id_seq OWNER TO ahmadbukhari;

--
-- Name: items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ahmadbukhari
--

ALTER SEQUENCE public.items_id_seq OWNED BY public.items.id;


--
-- Name: modifier_group_rules_id_seq; Type: SEQUENCE; Schema: public; Owner: ahmadbukhari
--

CREATE SEQUENCE public.modifier_group_rules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.modifier_group_rules_id_seq OWNER TO ahmadbukhari;

--
-- Name: modifier_group_rules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ahmadbukhari
--

ALTER SEQUENCE public.modifier_group_rules_id_seq OWNED BY public.modifier_group_rules.id;


--
-- Name: modifier_groups_id_seq; Type: SEQUENCE; Schema: public; Owner: ahmadbukhari
--

CREATE SEQUENCE public.modifier_groups_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.modifier_groups_id_seq OWNER TO ahmadbukhari;

--
-- Name: modifier_groups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ahmadbukhari
--

ALTER SEQUENCE public.modifier_groups_id_seq OWNED BY public.modifier_groups.id;


--
-- Name: modifiers_id_seq; Type: SEQUENCE; Schema: public; Owner: ahmadbukhari
--

CREATE SEQUENCE public.modifiers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.modifiers_id_seq OWNER TO ahmadbukhari;

--
-- Name: modifiers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ahmadbukhari
--

ALTER SEQUENCE public.modifiers_id_seq OWNED BY public.modifiers.id;


--
-- Name: order_item_modifiers; Type: TABLE; Schema: public; Owner: ahmadbukhari
--

CREATE TABLE public.order_item_modifiers (
    id integer NOT NULL,
    order_item_id integer NOT NULL,
    modifier_id integer NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    price_base integer CONSTRAINT order_item_modifiers_price_at_purchase_not_null NOT NULL,
    cogs_base numeric
);


ALTER TABLE public.order_item_modifiers OWNER TO ahmadbukhari;

--
-- Name: order_item_modifiers_id_seq; Type: SEQUENCE; Schema: public; Owner: ahmadbukhari
--

CREATE SEQUENCE public.order_item_modifiers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.order_item_modifiers_id_seq OWNER TO ahmadbukhari;

--
-- Name: order_item_modifiers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ahmadbukhari
--

ALTER SEQUENCE public.order_item_modifiers_id_seq OWNED BY public.order_item_modifiers.id;


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: ahmadbukhari
--

CREATE TABLE public.order_items (
    id integer NOT NULL,
    order_id integer NOT NULL,
    item_id integer NOT NULL,
    price_base integer CONSTRAINT order_items_price_at_purchase_not_null NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    cogs_base numeric DEFAULT 0,
    price_total integer DEFAULT 0,
    cogs_total numeric DEFAULT 0,
    status public.order_item_status DEFAULT 'active'::public.order_item_status
);


ALTER TABLE public.order_items OWNER TO ahmadbukhari;

--
-- Name: order_items_id_seq; Type: SEQUENCE; Schema: public; Owner: ahmadbukhari
--

CREATE SEQUENCE public.order_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.order_items_id_seq OWNER TO ahmadbukhari;

--
-- Name: order_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ahmadbukhari
--

ALTER SEQUENCE public.order_items_id_seq OWNED BY public.order_items.id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: ahmadbukhari
--

CREATE TABLE public.orders (
    id integer NOT NULL,
    customer_name text,
    payment_method public.payment_type,
    shift public.shift_type DEFAULT 'day'::public.shift_type NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    price_total integer DEFAULT 0,
    cogs_total numeric DEFAULT 0,
    status public.order_status DEFAULT 'preparing'::public.order_status NOT NULL,
    user_id integer,
    kind public.order_kind DEFAULT 'sale'::public.order_kind,
    parent_order_id integer
);


ALTER TABLE public.orders OWNER TO ahmadbukhari;

--
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: ahmadbukhari
--

CREATE SEQUENCE public.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.orders_id_seq OWNER TO ahmadbukhari;

--
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ahmadbukhari
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- Name: purchases_id_seq; Type: SEQUENCE; Schema: public; Owner: ahmadbukhari
--

CREATE SEQUENCE public.purchases_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.purchases_id_seq OWNER TO ahmadbukhari;

--
-- Name: purchases_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ahmadbukhari
--

ALTER SEQUENCE public.purchases_id_seq OWNED BY public.purchases.id;


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: ahmadbukhari
--

CREATE TABLE public.sessions (
    id text NOT NULL,
    user_id integer,
    expires_at timestamp without time zone NOT NULL
);


ALTER TABLE public.sessions OWNER TO ahmadbukhari;

--
-- Name: users; Type: TABLE; Schema: public; Owner: ahmadbukhari
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username text NOT NULL,
    password_hash text NOT NULL,
    role public.user_role DEFAULT 'barista'::public.user_role NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO ahmadbukhari;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: ahmadbukhari
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO ahmadbukhari;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ahmadbukhari
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: ahmadbukhari
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: ingredients id; Type: DEFAULT; Schema: public; Owner: ahmadbukhari
--

ALTER TABLE ONLY public.ingredients ALTER COLUMN id SET DEFAULT nextval('public.ingredients_id_seq'::regclass);


--
-- Name: item_variations id; Type: DEFAULT; Schema: public; Owner: ahmadbukhari
--

ALTER TABLE ONLY public.item_variations ALTER COLUMN id SET DEFAULT nextval('public.item_variations_id_seq'::regclass);


--
-- Name: items id; Type: DEFAULT; Schema: public; Owner: ahmadbukhari
--

ALTER TABLE ONLY public.items ALTER COLUMN id SET DEFAULT nextval('public.items_id_seq'::regclass);


--
-- Name: modifier_group_rules id; Type: DEFAULT; Schema: public; Owner: ahmadbukhari
--

ALTER TABLE ONLY public.modifier_group_rules ALTER COLUMN id SET DEFAULT nextval('public.modifier_group_rules_id_seq'::regclass);


--
-- Name: modifier_groups id; Type: DEFAULT; Schema: public; Owner: ahmadbukhari
--

ALTER TABLE ONLY public.modifier_groups ALTER COLUMN id SET DEFAULT nextval('public.modifier_groups_id_seq'::regclass);


--
-- Name: modifiers id; Type: DEFAULT; Schema: public; Owner: ahmadbukhari
--

ALTER TABLE ONLY public.modifiers ALTER COLUMN id SET DEFAULT nextval('public.modifiers_id_seq'::regclass);


--
-- Name: order_item_modifiers id; Type: DEFAULT; Schema: public; Owner: ahmadbukhari
--

ALTER TABLE ONLY public.order_item_modifiers ALTER COLUMN id SET DEFAULT nextval('public.order_item_modifiers_id_seq'::regclass);


--
-- Name: order_items id; Type: DEFAULT; Schema: public; Owner: ahmadbukhari
--

ALTER TABLE ONLY public.order_items ALTER COLUMN id SET DEFAULT nextval('public.order_items_id_seq'::regclass);


--
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: ahmadbukhari
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- Name: purchases id; Type: DEFAULT; Schema: public; Owner: ahmadbukhari
--

ALTER TABLE ONLY public.purchases ALTER COLUMN id SET DEFAULT nextval('public.purchases_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: ahmadbukhari
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: ahmadbukhari
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: ingredients ingredients_pkey; Type: CONSTRAINT; Schema: public; Owner: ahmadbukhari
--

ALTER TABLE ONLY public.ingredients
    ADD CONSTRAINT ingredients_pkey PRIMARY KEY (id);


--
-- Name: item_variations item_variations_pkey; Type: CONSTRAINT; Schema: public; Owner: ahmadbukhari
--

ALTER TABLE ONLY public.item_variations
    ADD CONSTRAINT item_variations_pkey PRIMARY KEY (id);


--
-- Name: items items_pkey; Type: CONSTRAINT; Schema: public; Owner: ahmadbukhari
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_pkey PRIMARY KEY (id);


--
-- Name: modifier_group_rules modifier_group_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: ahmadbukhari
--

ALTER TABLE ONLY public.modifier_group_rules
    ADD CONSTRAINT modifier_group_rules_pkey PRIMARY KEY (id);


--
-- Name: modifier_groups modifier_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: ahmadbukhari
--

ALTER TABLE ONLY public.modifier_groups
    ADD CONSTRAINT modifier_groups_pkey PRIMARY KEY (id);


--
-- Name: modifiers modifiers_pkey; Type: CONSTRAINT; Schema: public; Owner: ahmadbukhari
--

ALTER TABLE ONLY public.modifiers
    ADD CONSTRAINT modifiers_pkey PRIMARY KEY (id);


--
-- Name: order_item_modifiers order_item_modifiers_pkey; Type: CONSTRAINT; Schema: public; Owner: ahmadbukhari
--

ALTER TABLE ONLY public.order_item_modifiers
    ADD CONSTRAINT order_item_modifiers_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: ahmadbukhari
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: ahmadbukhari
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: purchases purchases_pkey; Type: CONSTRAINT; Schema: public; Owner: ahmadbukhari
--

ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT purchases_pkey PRIMARY KEY (id);


--
-- Name: recipes recipes_pkey; Type: CONSTRAINT; Schema: public; Owner: ahmadbukhari
--

ALTER TABLE ONLY public.recipes
    ADD CONSTRAINT recipes_pkey PRIMARY KEY (item_variation_id, ingredient_id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: ahmadbukhari
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: ahmadbukhari
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: ahmadbukhari
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: idx_order_items_status; Type: INDEX; Schema: public; Owner: ahmadbukhari
--

CREATE INDEX idx_order_items_status ON public.order_items USING btree (status);


--
-- Name: idx_orders_active_tabs; Type: INDEX; Schema: public; Owner: ahmadbukhari
--

CREATE INDEX idx_orders_active_tabs ON public.orders USING btree (created_at) WHERE ((payment_method IS NULL) OR (status = 'preparing'::public.order_status));


--
-- Name: idx_orders_created_at; Type: INDEX; Schema: public; Owner: ahmadbukhari
--

CREATE INDEX idx_orders_created_at ON public.orders USING btree (created_at DESC);


--
-- Name: idx_orders_parent_id; Type: INDEX; Schema: public; Owner: ahmadbukhari
--

CREATE INDEX idx_orders_parent_id ON public.orders USING btree (parent_order_id);


--
-- Name: idx_orders_user_id; Type: INDEX; Schema: public; Owner: ahmadbukhari
--

CREATE INDEX idx_orders_user_id ON public.orders USING btree (user_id);


--
-- Name: item_variations item_variations_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ahmadbukhari
--

ALTER TABLE ONLY public.item_variations
    ADD CONSTRAINT item_variations_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id) ON DELETE CASCADE;


--
-- Name: items items_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ahmadbukhari
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- Name: modifier_group_rules modifier_group_rules_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ahmadbukhari
--

ALTER TABLE ONLY public.modifier_group_rules
    ADD CONSTRAINT modifier_group_rules_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.modifier_groups(id) ON DELETE CASCADE;


--
-- Name: modifiers modifiers_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ahmadbukhari
--

ALTER TABLE ONLY public.modifiers
    ADD CONSTRAINT modifiers_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.modifier_groups(id) ON DELETE CASCADE;


--
-- Name: modifiers modifiers_ingredient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ahmadbukhari
--

ALTER TABLE ONLY public.modifiers
    ADD CONSTRAINT modifiers_ingredient_id_fkey FOREIGN KEY (ingredient_id) REFERENCES public.ingredients(id);


--
-- Name: order_item_modifiers order_item_modifiers_modifier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ahmadbukhari
--

ALTER TABLE ONLY public.order_item_modifiers
    ADD CONSTRAINT order_item_modifiers_modifier_id_fkey FOREIGN KEY (modifier_id) REFERENCES public.modifiers(id);


--
-- Name: order_item_modifiers order_item_modifiers_order_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ahmadbukhari
--

ALTER TABLE ONLY public.order_item_modifiers
    ADD CONSTRAINT order_item_modifiers_order_item_id_fkey FOREIGN KEY (order_item_id) REFERENCES public.order_items(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ahmadbukhari
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id) ON DELETE SET NULL;


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ahmadbukhari
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: orders orders_parent_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ahmadbukhari
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_parent_order_id_fkey FOREIGN KEY (parent_order_id) REFERENCES public.orders(id) ON DELETE RESTRICT;


--
-- Name: orders orders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ahmadbukhari
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: purchases purchases_ingredient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ahmadbukhari
--

ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT purchases_ingredient_id_fkey FOREIGN KEY (ingredient_id) REFERENCES public.ingredients(id) ON DELETE CASCADE;


--
-- Name: recipes recipes_ingredient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ahmadbukhari
--

ALTER TABLE ONLY public.recipes
    ADD CONSTRAINT recipes_ingredient_id_fkey FOREIGN KEY (ingredient_id) REFERENCES public.ingredients(id) ON DELETE CASCADE;


--
-- Name: recipes recipes_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ahmadbukhari
--

ALTER TABLE ONLY public.recipes
    ADD CONSTRAINT recipes_item_id_fkey FOREIGN KEY (item_variation_id) REFERENCES public.items(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ahmadbukhari
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: TABLE categories; Type: ACL; Schema: public; Owner: ahmadbukhari
--

GRANT ALL ON TABLE public.categories TO coffee_admin;


--
-- Name: SEQUENCE categories_id_seq; Type: ACL; Schema: public; Owner: ahmadbukhari
--

GRANT ALL ON SEQUENCE public.categories_id_seq TO coffee_admin;


--
-- Name: TABLE ingredients; Type: ACL; Schema: public; Owner: ahmadbukhari
--

GRANT ALL ON TABLE public.ingredients TO coffee_admin;


--
-- Name: SEQUENCE ingredients_id_seq; Type: ACL; Schema: public; Owner: ahmadbukhari
--

GRANT ALL ON SEQUENCE public.ingredients_id_seq TO coffee_admin;


--
-- Name: TABLE items; Type: ACL; Schema: public; Owner: ahmadbukhari
--

GRANT ALL ON TABLE public.items TO coffee_admin;


--
-- Name: TABLE modifier_group_rules; Type: ACL; Schema: public; Owner: ahmadbukhari
--

GRANT ALL ON TABLE public.modifier_group_rules TO coffee_admin;


--
-- Name: TABLE modifier_groups; Type: ACL; Schema: public; Owner: ahmadbukhari
--

GRANT ALL ON TABLE public.modifier_groups TO coffee_admin;


--
-- Name: TABLE modifiers; Type: ACL; Schema: public; Owner: ahmadbukhari
--

GRANT ALL ON TABLE public.modifiers TO coffee_admin;


--
-- Name: TABLE purchases; Type: ACL; Schema: public; Owner: ahmadbukhari
--

GRANT ALL ON TABLE public.purchases TO coffee_admin;


--
-- Name: TABLE recipes; Type: ACL; Schema: public; Owner: ahmadbukhari
--

GRANT ALL ON TABLE public.recipes TO coffee_admin;


--
-- Name: TABLE view_ingredient_costs; Type: ACL; Schema: public; Owner: ahmadbukhari
--

GRANT ALL ON TABLE public.view_ingredient_costs TO coffee_admin;


--
-- Name: TABLE item_cogs; Type: ACL; Schema: public; Owner: ahmadbukhari
--

GRANT ALL ON TABLE public.item_cogs TO coffee_admin;


--
-- Name: TABLE item_variations; Type: ACL; Schema: public; Owner: ahmadbukhari
--

GRANT ALL ON TABLE public.item_variations TO coffee_admin;


--
-- Name: SEQUENCE item_variations_id_seq; Type: ACL; Schema: public; Owner: ahmadbukhari
--

GRANT ALL ON SEQUENCE public.item_variations_id_seq TO coffee_admin;


--
-- Name: SEQUENCE items_id_seq; Type: ACL; Schema: public; Owner: ahmadbukhari
--

GRANT ALL ON SEQUENCE public.items_id_seq TO coffee_admin;


--
-- Name: SEQUENCE modifier_group_rules_id_seq; Type: ACL; Schema: public; Owner: ahmadbukhari
--

GRANT ALL ON SEQUENCE public.modifier_group_rules_id_seq TO coffee_admin;


--
-- Name: SEQUENCE modifier_groups_id_seq; Type: ACL; Schema: public; Owner: ahmadbukhari
--

GRANT ALL ON SEQUENCE public.modifier_groups_id_seq TO coffee_admin;


--
-- Name: SEQUENCE modifiers_id_seq; Type: ACL; Schema: public; Owner: ahmadbukhari
--

GRANT ALL ON SEQUENCE public.modifiers_id_seq TO coffee_admin;


--
-- Name: TABLE order_item_modifiers; Type: ACL; Schema: public; Owner: ahmadbukhari
--

GRANT ALL ON TABLE public.order_item_modifiers TO coffee_admin;


--
-- Name: SEQUENCE order_item_modifiers_id_seq; Type: ACL; Schema: public; Owner: ahmadbukhari
--

GRANT ALL ON SEQUENCE public.order_item_modifiers_id_seq TO coffee_admin;


--
-- Name: TABLE order_items; Type: ACL; Schema: public; Owner: ahmadbukhari
--

GRANT ALL ON TABLE public.order_items TO coffee_admin;


--
-- Name: SEQUENCE order_items_id_seq; Type: ACL; Schema: public; Owner: ahmadbukhari
--

GRANT ALL ON SEQUENCE public.order_items_id_seq TO coffee_admin;


--
-- Name: TABLE orders; Type: ACL; Schema: public; Owner: ahmadbukhari
--

GRANT ALL ON TABLE public.orders TO coffee_admin;


--
-- Name: SEQUENCE orders_id_seq; Type: ACL; Schema: public; Owner: ahmadbukhari
--

GRANT ALL ON SEQUENCE public.orders_id_seq TO coffee_admin;


--
-- Name: SEQUENCE purchases_id_seq; Type: ACL; Schema: public; Owner: ahmadbukhari
--

GRANT ALL ON SEQUENCE public.purchases_id_seq TO coffee_admin;


--
-- Name: TABLE sessions; Type: ACL; Schema: public; Owner: ahmadbukhari
--

GRANT ALL ON TABLE public.sessions TO coffee_admin;


--
-- Name: TABLE users; Type: ACL; Schema: public; Owner: ahmadbukhari
--

GRANT ALL ON TABLE public.users TO coffee_admin;


--
-- Name: SEQUENCE users_id_seq; Type: ACL; Schema: public; Owner: ahmadbukhari
--

GRANT ALL ON SEQUENCE public.users_id_seq TO coffee_admin;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: ahmadbukhari
--

ALTER DEFAULT PRIVILEGES FOR ROLE ahmadbukhari IN SCHEMA public GRANT ALL ON SEQUENCES TO coffee_admin;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: ahmadbukhari
--

ALTER DEFAULT PRIVILEGES FOR ROLE ahmadbukhari IN SCHEMA public GRANT ALL ON TABLES TO coffee_admin;


--
-- PostgreSQL database dump complete
--

\unrestrict eySUzVdgb8fFVyDSNtd98kfS6cjkS9xQ0gsknin0HV43cSZ98qhLfB7x0jEpAAf

