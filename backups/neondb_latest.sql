--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5
-- Dumped by pg_dump version 17.5 (Debian 17.5-1.pgdg120+1)

-- Started on 2025-06-03 05:46:42 UTC

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

ALTER TABLE ONLY public.user_saved_properties DROP CONSTRAINT user_saved_properties_property_id_fkey;
ALTER TABLE ONLY public.property_feature_assignments DROP CONSTRAINT property_feature_assignments_property_id_fkey;
ALTER TABLE ONLY public.property_feature_assignments DROP CONSTRAINT property_feature_assignments_feature_id_fkey;
ALTER TABLE ONLY public.properties DROP CONSTRAINT properties_operation_status_id_fkey;
DROP INDEX public.idx_properties_operation_status;
DROP INDEX neon_auth.users_sync_deleted_at_idx;
ALTER TABLE ONLY public.user_saved_properties DROP CONSTRAINT user_saved_properties_user_id_property_id_key;
ALTER TABLE ONLY public.user_saved_properties DROP CONSTRAINT user_saved_properties_pkey;
ALTER TABLE ONLY public.property_types DROP CONSTRAINT property_types_pkey;
ALTER TABLE ONLY public.property_types DROP CONSTRAINT property_types_name_key;
ALTER TABLE ONLY public.property_statuses DROP CONSTRAINT property_statuses_pkey;
ALTER TABLE ONLY public.property_statuses DROP CONSTRAINT property_statuses_name_key;
ALTER TABLE ONLY public.property_operation_statuses DROP CONSTRAINT property_operation_statuses_pkey;
ALTER TABLE ONLY public.property_operation_statuses DROP CONSTRAINT property_operation_statuses_name_key;
ALTER TABLE ONLY public.property_features DROP CONSTRAINT property_features_pkey;
ALTER TABLE ONLY public.property_features DROP CONSTRAINT property_features_name_key;
ALTER TABLE ONLY public.property_feature_assignments DROP CONSTRAINT property_feature_assignments_property_id_feature_id_key;
ALTER TABLE ONLY public.property_feature_assignments DROP CONSTRAINT property_feature_assignments_pkey;
ALTER TABLE ONLY public.properties DROP CONSTRAINT properties_pkey;
ALTER TABLE ONLY public.neighborhoods DROP CONSTRAINT neighborhoods_pkey;
ALTER TABLE ONLY neon_auth.users_sync DROP CONSTRAINT users_sync_pkey;
ALTER TABLE public.user_saved_properties ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.property_types ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.property_statuses ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.property_features ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.property_feature_assignments ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.properties ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.neighborhoods ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE public.user_saved_properties_id_seq;
DROP TABLE public.user_saved_properties;
DROP SEQUENCE public.property_types_id_seq;
DROP TABLE public.property_types;
DROP SEQUENCE public.property_statuses_id_seq;
DROP TABLE public.property_statuses;
DROP TABLE public.property_operation_statuses;
DROP SEQUENCE public.property_features_id_seq;
DROP TABLE public.property_features;
DROP SEQUENCE public.property_feature_assignments_id_seq;
DROP TABLE public.property_feature_assignments;
DROP SEQUENCE public.properties_id_seq;
DROP TABLE public.properties;
DROP SEQUENCE public.neighborhoods_id_seq;
DROP TABLE public.neighborhoods;
DROP TABLE neon_auth.users_sync;
DROP SCHEMA neon_auth;
--
-- TOC entry 6 (class 2615 OID 16478)
-- Name: neon_auth; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA neon_auth;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 218 (class 1259 OID 16479)
-- Name: users_sync; Type: TABLE; Schema: neon_auth; Owner: -
--

CREATE TABLE neon_auth.users_sync (
    raw_json jsonb NOT NULL,
    id text GENERATED ALWAYS AS ((raw_json ->> 'id'::text)) STORED NOT NULL,
    name text GENERATED ALWAYS AS ((raw_json ->> 'display_name'::text)) STORED,
    email text GENERATED ALWAYS AS ((raw_json ->> 'primary_email'::text)) STORED,
    created_at timestamp with time zone GENERATED ALWAYS AS (to_timestamp((trunc((((raw_json ->> 'signed_up_at_millis'::text))::bigint)::double precision) / (1000)::double precision))) STORED,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone
);


--
-- TOC entry 230 (class 1259 OID 24656)
-- Name: neighborhoods; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.neighborhoods (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    city character varying(100) NOT NULL,
    state character varying(100),
    country character varying(100) NOT NULL,
    description text,
    subway_access text,
    dining_options text,
    schools_info text,
    shopping_info text,
    parks_recreation text,
    safety_rating integer,
    walkability_score integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT neighborhoods_safety_rating_check CHECK (((safety_rating >= 1) AND (safety_rating <= 5))),
    CONSTRAINT neighborhoods_walkability_score_check CHECK (((walkability_score >= 0) AND (walkability_score <= 100)))
);


--
-- TOC entry 229 (class 1259 OID 24655)
-- Name: neighborhoods_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.neighborhoods_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3454 (class 0 OID 0)
-- Dependencies: 229
-- Name: neighborhoods_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.neighborhoods_id_seq OWNED BY public.neighborhoods.id;


--
-- TOC entry 222 (class 1259 OID 24601)
-- Name: properties; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.properties (
    id integer NOT NULL,
    title text,
    description text,
    price text,
    address text,
    city text,
    state text,
    country text,
    zip_code text,
    type text,
    room integer,
    bathrooms integer,
    area integer,
    image_url text,
    status text,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    geocode json,
    year_built integer,
    seller_id text DEFAULT 'seller123'::text,
    operation_status_id integer DEFAULT 1
);


--
-- TOC entry 221 (class 1259 OID 24600)
-- Name: properties_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.properties_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3455 (class 0 OID 0)
-- Dependencies: 221
-- Name: properties_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.properties_id_seq OWNED BY public.properties.id;


--
-- TOC entry 224 (class 1259 OID 24611)
-- Name: property_feature_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.property_feature_assignments (
    id integer NOT NULL,
    property_id integer,
    feature_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 223 (class 1259 OID 24610)
-- Name: property_feature_assignments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.property_feature_assignments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3456 (class 0 OID 0)
-- Dependencies: 223
-- Name: property_feature_assignments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.property_feature_assignments_id_seq OWNED BY public.property_feature_assignments.id;


--
-- TOC entry 220 (class 1259 OID 24577)
-- Name: property_features; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.property_features (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    category character varying(50) DEFAULT 'general'::character varying,
    description text,
    icon character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 219 (class 1259 OID 24576)
-- Name: property_features_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.property_features_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3457 (class 0 OID 0)
-- Dependencies: 219
-- Name: property_features_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.property_features_id_seq OWNED BY public.property_features.id;


--
-- TOC entry 233 (class 1259 OID 32768)
-- Name: property_operation_statuses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.property_operation_statuses (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    display_name character varying(100) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 228 (class 1259 OID 24643)
-- Name: property_statuses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.property_statuses (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    display_name character varying(100) NOT NULL,
    description text,
    color character varying(7) DEFAULT '#000000'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 227 (class 1259 OID 24642)
-- Name: property_statuses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.property_statuses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3458 (class 0 OID 0)
-- Dependencies: 227
-- Name: property_statuses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.property_statuses_id_seq OWNED BY public.property_statuses.id;


--
-- TOC entry 226 (class 1259 OID 24631)
-- Name: property_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.property_types (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    display_name character varying(100) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 225 (class 1259 OID 24630)
-- Name: property_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.property_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3459 (class 0 OID 0)
-- Dependencies: 225
-- Name: property_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.property_types_id_seq OWNED BY public.property_types.id;


--
-- TOC entry 232 (class 1259 OID 24669)
-- Name: user_saved_properties; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_saved_properties (
    id integer NOT NULL,
    user_id character varying(255) NOT NULL,
    property_id integer,
    saved_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 231 (class 1259 OID 24668)
-- Name: user_saved_properties_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_saved_properties_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3460 (class 0 OID 0)
-- Dependencies: 231
-- Name: user_saved_properties_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_saved_properties_id_seq OWNED BY public.user_saved_properties.id;


--
-- TOC entry 3244 (class 2604 OID 24659)
-- Name: neighborhoods id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.neighborhoods ALTER COLUMN id SET DEFAULT nextval('public.neighborhoods_id_seq'::regclass);


--
-- TOC entry 3234 (class 2604 OID 24604)
-- Name: properties id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.properties ALTER COLUMN id SET DEFAULT nextval('public.properties_id_seq'::regclass);


--
-- TOC entry 3237 (class 2604 OID 24614)
-- Name: property_feature_assignments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.property_feature_assignments ALTER COLUMN id SET DEFAULT nextval('public.property_feature_assignments_id_seq'::regclass);


--
-- TOC entry 3230 (class 2604 OID 24580)
-- Name: property_features id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.property_features ALTER COLUMN id SET DEFAULT nextval('public.property_features_id_seq'::regclass);


--
-- TOC entry 3241 (class 2604 OID 24646)
-- Name: property_statuses id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.property_statuses ALTER COLUMN id SET DEFAULT nextval('public.property_statuses_id_seq'::regclass);


--
-- TOC entry 3239 (class 2604 OID 24634)
-- Name: property_types id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.property_types ALTER COLUMN id SET DEFAULT nextval('public.property_types_id_seq'::regclass);


--
-- TOC entry 3247 (class 2604 OID 24672)
-- Name: user_saved_properties id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_saved_properties ALTER COLUMN id SET DEFAULT nextval('public.user_saved_properties_id_seq'::regclass);


--
-- TOC entry 3433 (class 0 OID 16479)
-- Dependencies: 218
-- Data for Name: users_sync; Type: TABLE DATA; Schema: neon_auth; Owner: -
--

COPY neon_auth.users_sync (raw_json, updated_at, deleted_at) FROM stdin;
\.


--
-- TOC entry 3445 (class 0 OID 24656)
-- Dependencies: 230
-- Data for Name: neighborhoods; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.neighborhoods (id, name, city, state, country, description, subway_access, dining_options, schools_info, shopping_info, parks_recreation, safety_rating, walkability_score, created_at, updated_at) FROM stdin;
1	Palermo	Buenos Aires	\N	Argentina	Trendy neighborhood known for its parks, restaurants, and nightlife.	5 minute walk to nearest subway station	Variety of dining options within walking distance	Excellent schools in the area	Shopping centers and boutiques nearby	Close to parks and recreational areas	4	85	2025-06-03 00:00:00.253964	2025-06-03 00:00:00.253964
2	Recoleta	Buenos Aires	\N	Argentina	Upscale neighborhood with museums, cafes, and historic architecture.	3 minute walk to nearest subway station	Fine dining and traditional cafes	Top-rated educational institutions	Luxury shopping and local markets	Beautiful plazas and green spaces	5	90	2025-06-03 00:00:00.443837	2025-06-03 00:00:00.443837
3	San Telmo	Buenos Aires	\N	Argentina	Historic neighborhood famous for tango, antiques, and colonial architecture.	8 minute walk to nearest subway station	Traditional restaurants and local eateries	Good schools in the vicinity	Antique shops and weekend markets	Historic plazas and cultural centers	3	75	2025-06-03 00:00:00.615523	2025-06-03 00:00:00.615523
\.


--
-- TOC entry 3437 (class 0 OID 24601)
-- Dependencies: 222
-- Data for Name: properties; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.properties (id, title, description, price, address, city, state, country, zip_code, type, room, bathrooms, area, image_url, status, created_at, updated_at, geocode, year_built, seller_id, operation_status_id) FROM stdin;
3	\N	Cabaña acogedora en el bosque, ideal para desconectar.	$150,000	Torre Bella - Guatemala 5100, Palermo Soho, Buenos Aires	Unknown city	Unknown state	Unknown country	\N	Apartment	3	1	\N	/properties/cabana-bosque.jpg	available	2025-06-02 20:59:26.102	2025-06-02 20:59:26.102	{"lat":0,"lng":0}	\N	seller123	1
4	\N	Cabaña en la montaña con vistas panorámicas.	$200,000	Paraguay al 4300, Palermo Soho, Palermo	Unknown city	Unknown state	Unknown country	\N	Townhouse	1	2	\N	/properties/cabana-montana.jpg	available	2025-06-02 20:59:26.27	2025-06-02 20:59:26.27	{"lat":0,"lng":0}	\N	seller123	1
11	\N	Departamento familiar con áreas comunes y seguridad 24/7.	$400,000	Scalabrini Ortiz 1564, Palermo Soho, Palermo	Unknown city	Unknown state	Unknown country	\N	Townhouse	2	3	\N	/properties/departamento-familiar.jpg	available	2025-06-02 20:59:27.439	2025-06-02 20:59:27.439	{"lat":0,"lng":0}	\N	seller123	1
12	\N	Dúplex moderno con jardín privado.	$450,000	Honduras 5348, Palermo, Capital Federal	Unknown city	Unknown state	Unknown country	\N	Condo	3	2	\N	/properties/duplex-moderno.jpg	available	2025-06-02 20:59:27.603	2025-06-02 20:59:27.603	{"lat":0,"lng":0}	\N	seller123	1
13	\N	Loft urbano con diseño industrial.	$300,000	Charcas al 4700, Palermo Soho, Palermo	Unknown city	Unknown state	Unknown country	\N	Condo	1	1	\N	/properties/loft-urbano.jpg	available	2025-06-02 20:59:27.767	2025-06-02 20:59:27.767	{"lat":0,"lng":0}	\N	seller123	1
14	\N	Penthouse de lujo con vistas espectaculares de la ciudad.	$1,200,000	Av. Scalabrini Ortiz 2069, Palermo Soho, Palermo	Unknown city	Unknown state	Unknown country	\N	Condo	2	3	\N	/properties/penthouse-lujo.jpg	available	2025-06-02 20:59:27.936	2025-06-02 20:59:27.936	{"lat":0,"lng":0}	\N	seller123	1
15	\N	Villa de lujo con piscina y amplios jardines.	$2,000,000	Scalabrini Ortiz al 1700, Palermo Soho, Palermo	Unknown city	Unknown state	Unknown country	\N	House	3	5	\N	/properties/villa-lujo.jpg	available	2025-06-02 20:59:28.103	2025-06-03 00:33:44.444	{"lat":0,"lng":0}	\N	seller123	2
17	Test Unavailable Property	Property currently not available	$500,000	Reserved Street 456	Buenos Aires	Buenos Aires	Argentina		House	3	3	\N	/properties/test-unavailable.jpg	available	2025-06-03 00:32:55.99	2025-06-03 00:32:55.99	\N	\N	seller123	3
16	Test Rental Property	Beautiful apartment for rent in downtown	$1,200	Downtown Main Street 123	Buenos Aires	Buenos Aires	Argentina		Apartment	2	2	\N	/properties/test-rent.jpg	available	2025-06-03 00:32:11.466	2025-06-03 00:32:11.466	\N	\N	seller123	2
5	\N	Cabaña frente al mar con acceso privado a la playa.	$250,000	Santa María. De Oro al 1900, Palermo Soho, Palermo	Unknown city	Unknown state	Unknown country	\N	Condo	2	1	\N	/properties/cabana-playa.jpg	available	2025-06-02 20:59:26.437	2025-06-02 20:59:26.437	{"lat":0,"lng":0}	\N	seller123	1
1	\N	Apartamento en la ciudad con diseño moderno y vistas espectaculares.	$300,000	Costa Rica al 5400, Palermo Soho, Palermo	Unknown city	Unknown state	Unknown country	\N	House	1	1	\N	/properties/apartamento-ciudad.jpg	available	2025-06-02 20:59:25.754	2025-06-02 20:59:25.754	{"lat":0,"lng":0}	\N	seller123	1
2	\N	Apartamento moderno con acabados de lujo.	$350,000	Guemes 4400, Palermo Soho, Buenos Aires	Unknown city	Unknown state	Unknown country	\N	House	2	2	\N	/properties/apartamento-moderno.jpg	available	2025-06-02 20:59:25.934	2025-06-02 20:59:25.934	{"lat":0,"lng":0}	\N	seller123	1
6	\N	Casa rústica en el campo con amplios jardines.	$400,000	Fray Justo Santamaria De Oro 2400, Palermo, Capital Federal	Unknown city	Unknown state	Unknown country	\N	Apartment	3	3	\N	/properties/casa-campo.jpg	available	2025-06-02 20:59:26.604	2025-06-02 20:59:26.604	{"lat":0,"lng":0}	\N	seller123	1
7	\N	Casa colonial con detalles arquitectónicos únicos.	$500,000	Guatemala 5100, Palermo Soho, Palermo	Unknown city	Unknown state	Unknown country	\N	Apartment	1	4	\N	/properties/casa-colonial.jpg	available	2025-06-02 20:59:26.77	2025-06-02 20:59:26.77	{"lat":0,"lng":0}	\N	seller123	1
8	\N	Casa junto al lago con muelle privado.	$600,000	Pasaje Soria 5000, Palermo Soho, Palermo	Unknown city	Unknown state	Unknown country	\N	Apartment	2	3	\N	/properties/casa-lago.jpg	available	2025-06-02 20:59:26.936	2025-06-02 20:59:26.936	{"lat":0,"lng":0}	\N	seller123	1
9	\N	Casa moderna con diseño minimalista y amplios espacios.	$700,000	Armenia 1200, Palermo Soho, Palermo	Unknown city	Unknown state	Unknown country	\N	Apartment	3	4	\N	/properties/casa-moderna.jpg	available	2025-06-02 20:59:27.101	2025-06-02 20:59:27.101	{"lat":0,"lng":0}	\N	seller123	1
10	\N	Casa frente al mar con acceso privado a la playa.	$850,000	José A. Cabrera al 3900, Palermo Soho, Palermo	Unknown city	Unknown state	Unknown country	\N	Townhouse	1	4	\N	/properties/casa-playa.jpg	available	2025-06-02 20:59:27.272	2025-06-02 20:59:27.272	{"lat":0,"lng":0}	\N	seller123	1
\.


--
-- TOC entry 3439 (class 0 OID 24611)
-- Dependencies: 224
-- Data for Name: property_feature_assignments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.property_feature_assignments (id, property_id, feature_id, created_at) FROM stdin;
1	1	5	2025-06-03 00:00:16.616737
2	1	1	2025-06-03 00:00:16.819175
3	1	2	2025-06-03 00:00:16.985157
4	1	16	2025-06-03 00:00:17.15455
5	2	4	2025-06-03 00:00:17.328119
6	2	18	2025-06-03 00:00:17.499192
7	2	5	2025-06-03 00:00:17.713292
8	3	4	2025-06-03 00:00:17.957439
9	3	14	2025-06-03 00:00:18.202927
10	3	8	2025-06-03 00:00:18.375387
11	4	3	2025-06-03 00:00:18.546658
12	4	13	2025-06-03 00:00:19.219199
13	4	8	2025-06-03 00:00:19.388287
14	5	8	2025-06-03 00:00:19.561094
15	5	18	2025-06-03 00:00:19.797489
16	5	15	2025-06-03 00:00:20.056095
17	5	2	2025-06-03 00:00:20.238458
18	5	13	2025-06-03 00:00:20.40976
19	6	5	2025-06-03 00:00:20.57877
20	6	15	2025-06-03 00:00:20.785454
21	6	2	2025-06-03 00:00:20.969454
22	7	2	2025-06-03 00:00:21.144397
23	7	9	2025-06-03 00:00:21.317861
24	7	1	2025-06-03 00:00:21.504961
25	8	5	2025-06-03 00:00:21.680237
26	8	16	2025-06-03 00:00:21.859931
27	8	1	2025-06-03 00:00:22.026921
28	9	1	2025-06-03 00:00:22.214236
29	9	2	2025-06-03 00:00:22.381381
30	9	18	2025-06-03 00:00:22.567008
31	9	16	2025-06-03 00:00:22.739035
32	10	14	2025-06-03 00:00:22.906723
33	10	16	2025-06-03 00:00:23.07677
34	10	1	2025-06-03 00:00:23.267053
35	10	2	2025-06-03 00:00:23.450996
36	10	6	2025-06-03 00:00:23.624189
37	11	1	2025-06-03 00:00:23.806845
38	11	6	2025-06-03 00:00:23.980407
39	11	16	2025-06-03 00:00:24.16496
40	11	9	2025-06-03 00:00:24.342811
41	12	11	2025-06-03 00:00:24.513581
42	12	10	2025-06-03 00:00:24.692989
43	12	8	2025-06-03 00:00:24.865733
44	13	18	2025-06-03 00:00:25.035935
45	13	16	2025-06-03 00:00:25.2235
46	13	1	2025-06-03 00:00:25.394185
47	13	14	2025-06-03 00:00:25.586872
48	14	1	2025-06-03 00:00:25.758467
49	14	2	2025-06-03 00:00:25.973954
50	14	17	2025-06-03 00:00:26.163604
51	14	9	2025-06-03 00:00:26.341457
52	15	1	2025-06-03 00:00:26.513207
53	15	6	2025-06-03 00:00:26.690022
54	15	2	2025-06-03 00:00:26.867757
55	15	19	2025-06-03 00:00:27.059821
\.


--
-- TOC entry 3435 (class 0 OID 24577)
-- Dependencies: 220
-- Data for Name: property_features; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.property_features (id, name, category, description, icon, created_at, updated_at) FROM stdin;
1	Air Conditioning	climate	\N	snowflake	2025-06-02 23:59:54.616445	2025-06-02 23:59:54.616445
2	Heating	climate	\N	fire	2025-06-02 23:59:54.77815	2025-06-02 23:59:54.77815
3	Swimming Pool	recreation	\N	waves	2025-06-02 23:59:54.944892	2025-06-02 23:59:54.944892
4	Garden	outdoor	\N	tree	2025-06-02 23:59:55.10835	2025-06-02 23:59:55.10835
5	Balcony	outdoor	\N	home	2025-06-02 23:59:55.270244	2025-06-02 23:59:55.270244
6	Fireplace	interior	\N	fire	2025-06-02 23:59:55.428435	2025-06-02 23:59:55.428435
7	Hardwood Floor	flooring	\N	square	2025-06-02 23:59:55.593157	2025-06-02 23:59:55.593157
8	Tile Floor	flooring	\N	grid	2025-06-02 23:59:55.756492	2025-06-02 23:59:55.756492
9	Carpet	flooring	\N	square	2025-06-02 23:59:55.920383	2025-06-02 23:59:55.920383
10	Laminate Floor	flooring	\N	square	2025-06-02 23:59:56.08864	2025-06-02 23:59:56.08864
11	Granite Countertops	kitchen	\N	square	2025-06-02 23:59:56.253071	2025-06-02 23:59:56.253071
12	Stainless Steel Appliances	kitchen	\N	zap	2025-06-02 23:59:56.4163	2025-06-02 23:59:56.4163
13	Walk-in Closet	storage	\N	home	2025-06-02 23:59:56.583067	2025-06-02 23:59:56.583067
14	Laundry Room	utility	\N	home	2025-06-02 23:59:56.750992	2025-06-02 23:59:56.750992
15	Garage	parking	\N	car	2025-06-02 23:59:56.915523	2025-06-02 23:59:56.915523
16	Parking	parking	\N	car	2025-06-02 23:59:57.085431	2025-06-02 23:59:57.085431
17	Security System	security	\N	shield	2025-06-02 23:59:57.246992	2025-06-02 23:59:57.246992
18	Modern Kitchen	kitchen	\N	home	2025-06-02 23:59:57.409069	2025-06-02 23:59:57.409069
19	Central Air	climate	\N	wind	2025-06-02 23:59:57.580288	2025-06-02 23:59:57.580288
\.


--
-- TOC entry 3448 (class 0 OID 32768)
-- Dependencies: 233
-- Data for Name: property_operation_statuses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.property_operation_statuses (id, name, display_name, description, created_at) FROM stdin;
1	sale	Venta	Property is available for sale	2025-06-03 00:22:34.630516
2	rent	Alquiler	Property is available for rent	2025-06-03 00:22:34.81334
3	not_available	No Disponible	Property is not available	2025-06-03 00:22:34.984204
\.


--
-- TOC entry 3443 (class 0 OID 24643)
-- Dependencies: 228
-- Data for Name: property_statuses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.property_statuses (id, name, display_name, description, color, created_at) FROM stdin;
1	available	Disponible	Available for sale/rent	#22c55e	2025-06-02 23:59:59.412561
2	sold	Vendido	Property has been sold	#ef4444	2025-06-02 23:59:59.580397
3	rented	Alquilado	Property has been rented	#f59e0b	2025-06-02 23:59:59.752483
4	pending	Pendiente	Sale/rental in progress	#3b82f6	2025-06-02 23:59:59.924192
5	off_market	Fuera del Mercado	Temporarily off market	#6b7280	2025-06-03 00:00:00.093092
\.


--
-- TOC entry 3441 (class 0 OID 24631)
-- Dependencies: 226
-- Data for Name: property_types; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.property_types (id, name, display_name, description, created_at) FROM stdin;
1	casa	Casa	Single family house	2025-06-02 23:59:57.74368
2	apartamento	Apartamento	Apartment unit	2025-06-02 23:59:57.914128
3	duplex	Dúplex	Two-level apartment	2025-06-02 23:59:58.074358
4	loft	Loft	Open-plan living space	2025-06-02 23:59:58.238952
5	penthouse	Penthouse	Luxury top-floor apartment	2025-06-02 23:59:58.400933
6	villa	Villa	Luxury house	2025-06-02 23:59:58.564341
7	cabana	Cabaña	Cabin or cottage	2025-06-02 23:59:58.72966
8	terreno	Terreno	Land plot	2025-06-02 23:59:58.911926
9	oficina	Oficina	Office space	2025-06-02 23:59:59.07843
10	local_comercial	Local Comercial	Commercial space	2025-06-02 23:59:59.242492
\.


--
-- TOC entry 3447 (class 0 OID 24669)
-- Dependencies: 232
-- Data for Name: user_saved_properties; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_saved_properties (id, user_id, property_id, saved_at) FROM stdin;
21	google-oauth2|106792838405737364934	15	2025-06-03 01:35:58.368697
23	google-oauth2|106792838405737364934	14	2025-06-03 01:35:59.59307
28	auth0|683e31e3178565e43998f7c7	16	2025-06-03 01:42:32.300635
37	auth0|683e31e3178565e43998f7c7	13	2025-06-03 01:50:53.346043
\.


--
-- TOC entry 3461 (class 0 OID 0)
-- Dependencies: 229
-- Name: neighborhoods_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.neighborhoods_id_seq', 3, true);


--
-- TOC entry 3462 (class 0 OID 0)
-- Dependencies: 221
-- Name: properties_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.properties_id_seq', 17, true);


--
-- TOC entry 3463 (class 0 OID 0)
-- Dependencies: 223
-- Name: property_feature_assignments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.property_feature_assignments_id_seq', 55, true);


--
-- TOC entry 3464 (class 0 OID 0)
-- Dependencies: 219
-- Name: property_features_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.property_features_id_seq', 19, true);


--
-- TOC entry 3465 (class 0 OID 0)
-- Dependencies: 227
-- Name: property_statuses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.property_statuses_id_seq', 5, true);


--
-- TOC entry 3466 (class 0 OID 0)
-- Dependencies: 225
-- Name: property_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.property_types_id_seq', 10, true);


--
-- TOC entry 3467 (class 0 OID 0)
-- Dependencies: 231
-- Name: user_saved_properties_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_saved_properties_id_seq', 37, true);


--
-- TOC entry 3254 (class 2606 OID 16489)
-- Name: users_sync users_sync_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.users_sync
    ADD CONSTRAINT users_sync_pkey PRIMARY KEY (id);


--
-- TOC entry 3275 (class 2606 OID 24667)
-- Name: neighborhoods neighborhoods_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.neighborhoods
    ADD CONSTRAINT neighborhoods_pkey PRIMARY KEY (id);


--
-- TOC entry 3261 (class 2606 OID 24609)
-- Name: properties properties_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_pkey PRIMARY KEY (id);


--
-- TOC entry 3263 (class 2606 OID 24617)
-- Name: property_feature_assignments property_feature_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.property_feature_assignments
    ADD CONSTRAINT property_feature_assignments_pkey PRIMARY KEY (id);


--
-- TOC entry 3265 (class 2606 OID 24619)
-- Name: property_feature_assignments property_feature_assignments_property_id_feature_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.property_feature_assignments
    ADD CONSTRAINT property_feature_assignments_property_id_feature_id_key UNIQUE (property_id, feature_id);


--
-- TOC entry 3256 (class 2606 OID 24589)
-- Name: property_features property_features_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.property_features
    ADD CONSTRAINT property_features_name_key UNIQUE (name);


--
-- TOC entry 3258 (class 2606 OID 24587)
-- Name: property_features property_features_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.property_features
    ADD CONSTRAINT property_features_pkey PRIMARY KEY (id);


--
-- TOC entry 3281 (class 2606 OID 32777)
-- Name: property_operation_statuses property_operation_statuses_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.property_operation_statuses
    ADD CONSTRAINT property_operation_statuses_name_key UNIQUE (name);


--
-- TOC entry 3283 (class 2606 OID 32775)
-- Name: property_operation_statuses property_operation_statuses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.property_operation_statuses
    ADD CONSTRAINT property_operation_statuses_pkey PRIMARY KEY (id);


--
-- TOC entry 3271 (class 2606 OID 24654)
-- Name: property_statuses property_statuses_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.property_statuses
    ADD CONSTRAINT property_statuses_name_key UNIQUE (name);


--
-- TOC entry 3273 (class 2606 OID 24652)
-- Name: property_statuses property_statuses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.property_statuses
    ADD CONSTRAINT property_statuses_pkey PRIMARY KEY (id);


--
-- TOC entry 3267 (class 2606 OID 24641)
-- Name: property_types property_types_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.property_types
    ADD CONSTRAINT property_types_name_key UNIQUE (name);


--
-- TOC entry 3269 (class 2606 OID 24639)
-- Name: property_types property_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.property_types
    ADD CONSTRAINT property_types_pkey PRIMARY KEY (id);


--
-- TOC entry 3277 (class 2606 OID 24675)
-- Name: user_saved_properties user_saved_properties_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_saved_properties
    ADD CONSTRAINT user_saved_properties_pkey PRIMARY KEY (id);


--
-- TOC entry 3279 (class 2606 OID 24677)
-- Name: user_saved_properties user_saved_properties_user_id_property_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_saved_properties
    ADD CONSTRAINT user_saved_properties_user_id_property_id_key UNIQUE (user_id, property_id);


--
-- TOC entry 3252 (class 1259 OID 16490)
-- Name: users_sync_deleted_at_idx; Type: INDEX; Schema: neon_auth; Owner: -
--

CREATE INDEX users_sync_deleted_at_idx ON neon_auth.users_sync USING btree (deleted_at);


--
-- TOC entry 3259 (class 1259 OID 32784)
-- Name: idx_properties_operation_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_properties_operation_status ON public.properties USING btree (operation_status_id);


--
-- TOC entry 3284 (class 2606 OID 32779)
-- Name: properties properties_operation_status_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_operation_status_id_fkey FOREIGN KEY (operation_status_id) REFERENCES public.property_operation_statuses(id);


--
-- TOC entry 3285 (class 2606 OID 24625)
-- Name: property_feature_assignments property_feature_assignments_feature_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.property_feature_assignments
    ADD CONSTRAINT property_feature_assignments_feature_id_fkey FOREIGN KEY (feature_id) REFERENCES public.property_features(id) ON DELETE CASCADE;


--
-- TOC entry 3286 (class 2606 OID 24620)
-- Name: property_feature_assignments property_feature_assignments_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.property_feature_assignments
    ADD CONSTRAINT property_feature_assignments_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;


--
-- TOC entry 3287 (class 2606 OID 24678)
-- Name: user_saved_properties user_saved_properties_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_saved_properties
    ADD CONSTRAINT user_saved_properties_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;


-- Completed on 2025-06-03 05:46:58 UTC

--
-- PostgreSQL database dump complete
--

