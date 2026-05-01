-- ============================================================================
-- BEGIN AGAIN COFFEE - SEED DATA
-- ============================================================================

--
-- Data for Name: item_categories; Type: TABLE DATA; Schema: public
--
INSERT INTO public.item_categories (id, name) VALUES (1, 'Anteiku');
INSERT INTO public.item_categories (id, name) VALUES (2, 'Senandung Prayana');
INSERT INTO public.item_categories (id, name) VALUES (3, 'Labuh Asha');
INSERT INTO public.item_categories (id, name) VALUES (4, 'Wacana Klasik');
INSERT INTO public.item_categories (id, name) VALUES (5, 'Lain Kopi');
INSERT INTO public.item_categories (id, name) VALUES (6, 'Makanan Berat');
INSERT INTO public.item_categories (id, name) VALUES (7, 'Makanan Ringan');

--
-- Data for Name: ingredients; Type: TABLE DATA; Schema: public
--
INSERT INTO public.ingredients (id, name, unit, is_active, category, brand, type) VALUES (1, '75 Arabica / 25 Robusta', 'g', true, 'Beans', 'Space Roastery', 'Espresso');
INSERT INTO public.ingredients (id, name, unit, is_active, category, brand, type) VALUES (2, 'Fresh Milk (UHT/Pasteur)', 'g', true, 'Dairy', NULL, 'Milk');
INSERT INTO public.ingredients (id, name, unit, is_active, category, brand, type) VALUES (3, 'Kental Manis', 'g', true, 'Dairy', 'Indomilk', 'Condensed');
INSERT INTO public.ingredients (id, name, unit, is_active, category, brand, type) VALUES (4, 'Krimer', 'g', true, 'Dairy', NULL, 'Powder');
INSERT INTO public.ingredients (id, name, unit, is_active, category, brand, type) VALUES (5, 'Sirup Karamel', 'g', true, 'Syrup', 'Davinci', NULL);
INSERT INTO public.ingredients (id, name, unit, is_active, category, brand, type) VALUES (6, 'Sirup Butterscotch', 'g', true, 'Syrup', 'Dripp', NULL);
INSERT INTO public.ingredients (id, name, unit, is_active, category, brand, type) VALUES (7, 'Sirup Hazelnut', 'g', true, 'Syrup', 'Dripp', NULL);
INSERT INTO public.ingredients (id, name, unit, is_active, category, brand, type) VALUES (8, 'Sirup Tiramisu', 'g', true, 'Syrup', 'Dripp', NULL);
INSERT INTO public.ingredients (id, name, unit, is_active, category, brand, type) VALUES (9, 'Sirup Creme Brulee', 'g', true, 'Syrup', 'Monin', NULL);
INSERT INTO public.ingredients (id, name, unit, is_active, category, brand, type) VALUES (10, 'Sirup Popcorn', 'g', true, 'Syrup', 'Monin', NULL);
INSERT INTO public.ingredients (id, name, unit, is_active, category, brand, type) VALUES (11, 'Chocolate Blend', 'g', true, 'Powder', 'Arnav', NULL);
INSERT INTO public.ingredients (id, name, unit, is_active, category, brand, type) VALUES (12, 'Matcha', 'g', true, 'Powder', 'Arnav', NULL);
INSERT INTO public.ingredients (id, name, unit, is_active, category, brand, type) VALUES (13, 'Matcha Latte', 'g', true, 'Powder', 'Arnav', NULL);
INSERT INTO public.ingredients (id, name, unit, is_active, category, brand, type) VALUES (14, 'Gula Aren Bubuk', 'g', true, 'Sugar', 'Nutriology', NULL);
INSERT INTO public.ingredients (id, name, unit, is_active, category, brand, type) VALUES (15, 'Biscoff Biscuit', 'pcs', true, 'Condiment', 'Lotus', NULL);
INSERT INTO public.ingredients (id, name, unit, is_active, category, brand, type) VALUES (16, 'Gelas Plastik 12oz', 'pcs', true, 'Packaging', NULL, 'Cup');
INSERT INTO public.ingredients (id, name, unit, is_active, category, brand, type) VALUES (17, 'Botol Plastik 250ml', 'pcs', true, 'Packaging', NULL, 'Bottle');
INSERT INTO public.ingredients (id, name, unit, is_active, category, brand, type) VALUES (18, 'Kertas Filter V60', 'pcs', true, 'Packaging', NULL, 'Filter');
INSERT INTO public.ingredients (id, name, unit, is_active, category, brand, type) VALUES (19, 'Flower Power', 'g', true, 'Beans', 'Space Roastery', 'Espresso');
INSERT INTO public.ingredients (id, name, unit, is_active, category, brand, type) VALUES (20, 'Javanaise Quartet', 'g', true, 'Beans', 'Tones', 'Filter');
INSERT INTO public.ingredients (id, name, unit, is_active, category, brand, type) VALUES (21, 'Crimson Ballad', 'g', true, 'Beans', 'Tones', 'Filter');

--
-- Data for Name: items; Type: TABLE DATA; Schema: public
--
INSERT INTO public.items (id, name, price, category_id, description, featured_rank, is_available, image_url) VALUES (15, 'Labuh Hitam', 15000, 3, 'Kopi hitam yang kompleks (Americano atau Long Black) dengan double shot espresso.', 10, true, NULL);
INSERT INTO public.items (id, name, price, category_id, description, featured_rank, is_available, image_url) VALUES (1, 'Anteiku Aren', 20000, 1, 'Kopi susu botolan premium dengan manis legit gula aren asli.', 0, true, NULL);
INSERT INTO public.items (id, name, price, category_id, description, featured_rank, is_available, image_url) VALUES (2, 'Anteiku Butterscotch', 20000, 1, 'Kopi susu botolan premium berpadu saus butterscotch yang gurih dan creamy.', 0, true, NULL);
INSERT INTO public.items (id, name, price, category_id, description, featured_rank, is_available, image_url) VALUES (3, 'Anteiku Caramel', 20000, 1, 'Kopi susu botolan premium dengan sentuhan sirup karamel klasik.', 0, true, NULL);
INSERT INTO public.items (id, name, price, category_id, description, featured_rank, is_available, image_url) VALUES (4, 'Anteiku Creme Brulee', 20000, 1, 'Kopi susu botolan creamy dengan rasa karamel gosong khas creme brulee.', 0, true, NULL);
INSERT INTO public.items (id, name, price, category_id, description, featured_rank, is_available, image_url) VALUES (5, 'Anteiku Hazelnut', 20000, 1, 'Kopi susu botolan premium dengan aroma kacang hazelnut yang khas.', 0, true, NULL);
INSERT INTO public.items (id, name, price, category_id, description, featured_rank, is_available, image_url) VALUES (6, 'Anteiku Popcorn', 20000, 1, 'Kopi susu botolan premium dengan rasa popcorn bioskop yang unik dan buttery.', 0, true, NULL);
INSERT INTO public.items (id, name, price, category_id, description, featured_rank, is_available, image_url) VALUES (7, 'Anteiku Tiramisu', 20000, 1, 'Kopi susu botolan premium dengan nuansa dessert tiramisu yang lembut.', 0, true, NULL);
INSERT INTO public.items (id, name, price, category_id, description, featured_rank, is_available, image_url) VALUES (9, 'Senandung Butterscotch', 15000, 2, 'Es kopi susu creamy dengan sentuhan rasa butterscotch yang milky.', 0, true, NULL);
INSERT INTO public.items (id, name, price, category_id, description, featured_rank, is_available, image_url) VALUES (10, 'Senandung Caramel', 15000, 2, 'Es kopi susu dengan tambahan sirup karamel manis dan harum.', 0, true, NULL);
INSERT INTO public.items (id, name, price, category_id, description, featured_rank, is_available, image_url) VALUES (11, 'Senandung Creme Brulee', 15000, 2, 'Es kopi susu dengan flavor creme brulee yang lembut dan creamy.', 0, true, NULL);
INSERT INTO public.items (id, name, price, category_id, description, featured_rank, is_available, image_url) VALUES (12, 'Senandung Hazelnut', 15000, 2, 'Es kopi susu favorit dengan aroma kacang hazelnut yang khas.', 0, true, NULL);
INSERT INTO public.items (id, name, price, category_id, description, featured_rank, is_available, image_url) VALUES (13, 'Senandung Popcorn', 15000, 2, 'Es kopi susu dengan sentuhan rasa popcorn bioskop yang unik dan buttery.', 0, true, NULL);
INSERT INTO public.items (id, name, price, category_id, description, featured_rank, is_available, image_url) VALUES (14, 'Senandung Tiramisu', 15000, 2, 'Es kopi susu dengan rasa kue tiramisu yang lembut dan creamy.', 0, true, NULL);
INSERT INTO public.items (id, name, price, category_id, description, featured_rank, is_available, image_url) VALUES (17, 'Japanese', 15000, 4, 'Kopi diseduh manual metode Japanese Iced Coffee dengan karakter fruity.', 5, true, NULL);
INSERT INTO public.items (id, name, price, category_id, description, featured_rank, is_available, image_url) VALUES (18, 'V60', 15000, 4, 'Kopi diseduh manual metode pour-over untuk rasa yang bersih dan kompleks.', 5, true, NULL);
INSERT INTO public.items (id, name, price, category_id, description, featured_rank, is_available, image_url) VALUES (19, 'Kopi Tubruk', 10000, 4, 'Kopi hitam tradisional Indonesia yang diseduh langsung tanpa saring.', 0, true, NULL);
INSERT INTO public.items (id, name, price, category_id, description, featured_rank, is_available, image_url) VALUES (20, 'Vietnam Drip', 15000, 4, 'Kopi diseduh manual khas Vietnam disajikan dengan susu kental manis.', 0, true, NULL);
INSERT INTO public.items (id, name, price, category_id, description, featured_rank, is_available, image_url) VALUES (21, 'Chocolatte', 15000, 5, 'Minuman cokelat creamy favorit semua umur dengan rasa manis seimbang.', 8, true, NULL);
INSERT INTO public.items (id, name, price, category_id, description, featured_rank, is_available, image_url) VALUES (22, 'Matcha Latte', 15000, 5, 'Teh hijau Jepang (matcha) berpadu susu segar yang creamy dan lembut.', 0, true, NULL);
INSERT INTO public.items (id, name, price, category_id, description, featured_rank, is_available, image_url) VALUES (23, 'Fresh Milk', 10000, 5, 'Susu sapi segar murni—simple, sehat, dan menyegarkan.', 0, true, NULL);
INSERT INTO public.items (id, name, price, category_id, description, featured_rank, is_available, image_url) VALUES (8, 'Senandung Aren', 10000, 2, 'Es kopi susu gula aren signatur kami! Manis, creamy, dan ramah di kantong.', 9, true, NULL);
INSERT INTO public.items (id, name, price, category_id, description, featured_rank, is_available, image_url) VALUES (16, 'Labuh Latte', 20000, 3, 'Kopi hitam dipadukan dengan susu (Latte atau Cappuccino) dengan double shot espresso.', 0, true, NULL);

--
-- Data for Name: item_variations; Type: TABLE DATA; Schema: public
--
INSERT INTO public.item_variations (id, item_id, name, price, is_available) VALUES (15, 15, 'Regular', 15000, true);
INSERT INTO public.item_variations (id, item_id, name, price, is_available) VALUES (1, 1, 'Regular', 20000, true);
INSERT INTO public.item_variations (id, item_id, name, price, is_available) VALUES (2, 2, 'Regular', 20000, true);
INSERT INTO public.item_variations (id, item_id, name, price, is_available) VALUES (3, 3, 'Regular', 20000, true);
INSERT INTO public.item_variations (id, item_id, name, price, is_available) VALUES (4, 4, 'Regular', 20000, true);
INSERT INTO public.item_variations (id, item_id, name, price, is_available) VALUES (5, 5, 'Regular', 20000, true);
INSERT INTO public.item_variations (id, item_id, name, price, is_available) VALUES (6, 6, 'Regular', 20000, true);
INSERT INTO public.item_variations (id, item_id, name, price, is_available) VALUES (7, 7, 'Regular', 20000, true);
INSERT INTO public.item_variations (id, item_id, name, price, is_available) VALUES (9, 9, 'Regular', 15000, true);
INSERT INTO public.item_variations (id, item_id, name, price, is_available) VALUES (10, 10, 'Regular', 15000, true);
INSERT INTO public.item_variations (id, item_id, name, price, is_available) VALUES (11, 11, 'Regular', 15000, true);
INSERT INTO public.item_variations (id, item_id, name, price, is_available) VALUES (12, 12, 'Regular', 15000, true);
INSERT INTO public.item_variations (id, item_id, name, price, is_available) VALUES (13, 13, 'Regular', 15000, true);
INSERT INTO public.item_variations (id, item_id, name, price, is_available) VALUES (14, 14, 'Regular', 15000, true);
INSERT INTO public.item_variations (id, item_id, name, price, is_available) VALUES (17, 17, 'Regular', 15000, true);
INSERT INTO public.item_variations (id, item_id, name, price, is_available) VALUES (18, 18, 'Regular', 15000, true);
INSERT INTO public.item_variations (id, item_id, name, price, is_available) VALUES (19, 19, 'Regular', 10000, true);
INSERT INTO public.item_variations (id, item_id, name, price, is_available) VALUES (20, 20, 'Regular', 15000, true);
INSERT INTO public.item_variations (id, item_id, name, price, is_available) VALUES (21, 21, 'Regular', 15000, true);
INSERT INTO public.item_variations (id, item_id, name, price, is_available) VALUES (22, 22, 'Regular', 15000, true);
INSERT INTO public.item_variations (id, item_id, name, price, is_available) VALUES (23, 23, 'Regular', 10000, true);
INSERT INTO public.item_variations (id, item_id, name, price, is_available) VALUES (8, 8, 'Regular', 10000, true);
INSERT INTO public.item_variations (id, item_id, name, price, is_available) VALUES (16, 16, 'Regular', 20000, true);

--
-- Data for Name: modifier_groups; Type: TABLE DATA; Schema: public
--
INSERT INTO public.modifier_groups (id, name, min_selections, max_selections) VALUES (3, 'Add-ons', 0, 1);
INSERT INTO public.modifier_groups (id, name, min_selections, max_selections) VALUES (1, 'Pilih Biji Kopi (Espresso)', 1, 1);
INSERT INTO public.modifier_groups (id, name, min_selections, max_selections) VALUES (2, 'Pilih Biji Kopi (Filter)', 1, 1);

--
-- Data for Name: modifier_group_rules; Type: TABLE DATA; Schema: public
--
INSERT INTO public.modifier_group_rules (id, group_id, category_id, item_id) VALUES (1, 1, 3, NULL);
INSERT INTO public.modifier_group_rules (id, group_id, category_id, item_id) VALUES (2, 2, 4, NULL);
INSERT INTO public.modifier_group_rules (id, group_id, category_id, item_id) VALUES (3, 3, 3, NULL);
INSERT INTO public.modifier_group_rules (id, group_id, category_id, item_id) VALUES (4, 3, 2, NULL);
INSERT INTO public.modifier_group_rules (id, group_id, category_id, item_id) VALUES (5, 3, 1, NULL);

--
-- Data for Name: modifiers; Type: TABLE DATA; Schema: public
--
-- Note: Changed 'DYNAMIC_BASE' to 'DYNAMIC', removed decimals from quantity.
INSERT INTO public.modifiers (id, group_id, name, price_adjustment, ingredient_id, quantity, behavior, is_available, dependency_source) VALUES (5, 3, 'Extra Espresso Shot', 5000, NULL, 8, 'DYNAMIC', true, 2);
INSERT INTO public.modifiers (id, group_id, name, price_adjustment, ingredient_id, quantity, behavior, is_available, dependency_source) VALUES (1, 1, 'Space - Flower Power', 0, 19, 15, 'STATIC', true, NULL);
INSERT INTO public.modifiers (id, group_id, name, price_adjustment, ingredient_id, quantity, behavior, is_available, dependency_source) VALUES (4, 1, 'Space - 75 Arabica / 25 Robusta', 0, 19, 15, 'STATIC', true, NULL);
INSERT INTO public.modifiers (id, group_id, name, price_adjustment, ingredient_id, quantity, behavior, is_available, dependency_source) VALUES (2, 2, 'Tones - Javanaise Quartet', 5000, 20, 15, 'STATIC', true, NULL);
INSERT INTO public.modifiers (id, group_id, name, price_adjustment, ingredient_id, quantity, behavior, is_available, dependency_source) VALUES (3, 2, 'Tones - Crimson Ballad', 5000, 21, 15, 'STATIC', true, NULL);

--
-- Data for Name: purchases; Type: TABLE DATA; Schema: public
--
-- Note: Renamed total_cost to cost_total, removed decimals from quantity to fit INTEGER.
INSERT INTO public.purchases (id, ingredient_id, purchase_date, quantity, cost_total, supplier, notes, created_at) VALUES (1, 1, '2026-02-28', 2000, 291120, 'Space Roastery', 'Initial Seed', '2026-02-28 21:51:05.486526');
INSERT INTO public.purchases (id, ingredient_id, purchase_date, quantity, cost_total, supplier, notes, created_at) VALUES (2, 2, '2026-02-28', 12000, 255000, 'Frisian Flag', 'Using Frisian Flag for the 1st time', '2026-02-28 21:51:05.486526');
INSERT INTO public.purchases (id, ingredient_id, purchase_date, quantity, cost_total, supplier, notes, created_at) VALUES (3, 3, '2026-02-28', 545, 17000, 'Indomilk', 'Initial Seed', '2026-02-28 21:51:05.486526');
INSERT INTO public.purchases (id, ingredient_id, purchase_date, quantity, cost_total, supplier, notes, created_at) VALUES (4, 4, '2026-02-28', 1000, 42000, 'Market', 'Initial Seed', '2026-02-28 21:51:05.486526');
INSERT INTO public.purchases (id, ingredient_id, purchase_date, quantity, cost_total, supplier, notes, created_at) VALUES (5, 5, '2026-02-28', 2753, 341200, 'Davinci', 'Initial Seed', '2026-02-28 21:51:05.486526');
INSERT INTO public.purchases (id, ingredient_id, purchase_date, quantity, cost_total, supplier, notes, created_at) VALUES (6, 6, '2026-02-28', 3800, 333425, 'Dripp', 'Initial Seed', '2026-02-28 21:51:05.486526');
INSERT INTO public.purchases (id, ingredient_id, purchase_date, quantity, cost_total, supplier, notes, created_at) VALUES (7, 7, '2026-02-28', 2850, 286319, 'Dripp', 'Initial Seed', '2026-02-28 21:51:05.486526');
INSERT INTO public.purchases (id, ingredient_id, purchase_date, quantity, cost_total, supplier, notes, created_at) VALUES (8, 8, '2026-02-28', 1900, 180847, 'Dripp', 'Initial Seed', '2026-02-28 21:51:05.486526');
INSERT INTO public.purchases (id, ingredient_id, purchase_date, quantity, cost_total, supplier, notes, created_at) VALUES (10, 10, '2026-02-28', 914, 147000, 'Monin', 'Initial Seed', '2026-02-28 21:51:05.486526');
INSERT INTO public.purchases (id, ingredient_id, purchase_date, quantity, cost_total, supplier, notes, created_at) VALUES (11, 11, '2026-02-28', 1000, 112700, 'Arnav', 'Initial Seed', '2026-02-28 21:51:05.486526');
INSERT INTO public.purchases (id, ingredient_id, purchase_date, quantity, cost_total, supplier, notes, created_at) VALUES (12, 12, '2026-02-28', 1000, 180775, 'Arnav', 'Initial Seed', '2026-02-28 21:51:05.486526');
INSERT INTO public.purchases (id, ingredient_id, purchase_date, quantity, cost_total, supplier, notes, created_at) VALUES (13, 13, '2026-02-28', 1000, 117280, 'Arnav', 'Initial Seed', '2026-02-28 21:51:05.486526');
INSERT INTO public.purchases (id, ingredient_id, purchase_date, quantity, cost_total, supplier, notes, created_at) VALUES (14, 14, '2026-02-28', 500, 31988, 'Nutriology', 'Initial Seed', '2026-02-28 21:51:05.486526');
INSERT INTO public.purchases (id, ingredient_id, purchase_date, quantity, cost_total, supplier, notes, created_at) VALUES (17, 17, '2026-02-28', 100, 73660, 'Packaging Supplier', 'Initial Seed', '2026-02-28 21:51:05.486526');
INSERT INTO public.purchases (id, ingredient_id, purchase_date, quantity, cost_total, supplier, notes, created_at) VALUES (18, 18, '2026-02-28', 100, 90000, 'Packaging Supplier', 'Initial Seed', '2026-02-28 21:51:05.486526');
INSERT INTO public.purchases (id, ingredient_id, purchase_date, quantity, cost_total, supplier, notes, created_at) VALUES (19, 19, '2026-02-28', 1000, 276500, 'Space Roastery', 'Guest Espresso', '2026-02-28 21:51:05.486526');
INSERT INTO public.purchases (id, ingredient_id, purchase_date, quantity, cost_total, supplier, notes, created_at) VALUES (20, 20, '2026-02-28', 200, 81428, 'Tones', 'Guest Filter 1', '2026-02-28 21:51:05.486526');
INSERT INTO public.purchases (id, ingredient_id, purchase_date, quantity, cost_total, supplier, notes, created_at) VALUES (21, 21, '2026-02-28', 200, 81428, 'Tones', 'Guest Filter 2', '2026-02-28 21:51:05.486526');
INSERT INTO public.purchases (id, ingredient_id, purchase_date, quantity, cost_total, supplier, notes, created_at) VALUES (16, 16, '2026-02-28', 500, 575000, 'Sablon Cup Kalimantan', 'Cup Jujutsu Kaisen', '2026-02-28 21:51:05.486526');
INSERT INTO public.purchases (id, ingredient_id, purchase_date, quantity, cost_total, supplier, notes, created_at) VALUES (15, 15, '2026-02-28', 50, 68000, 'Lotus', 'Initial Seed', '2026-02-28 21:51:05.486526');
INSERT INTO public.purchases (id, ingredient_id, purchase_date, quantity, cost_total, supplier, notes, created_at) VALUES (9, 9, '2026-02-28', 2741, 384259, 'Monin', 'Initial Seed', '2026-02-28 21:51:05.486526');

--
-- Data for Name: recipes; Type: TABLE DATA; Schema: public
--
-- Note: Rounded decimals to match the INTEGER requirement of the amount column.
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (1, 17, 1);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (1, 14, 20);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (1, 3, 10);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (1, 4, 10);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (1, 1, 8);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (1, 2, 150);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (2, 17, 1);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (2, 6, 15);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (2, 3, 10);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (2, 4, 10);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (2, 1, 8);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (2, 2, 150);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (3, 17, 1);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (3, 5, 15);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (3, 3, 10);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (3, 4, 10);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (3, 1, 8);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (3, 2, 150);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (4, 17, 1);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (4, 9, 15);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (4, 3, 10);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (4, 4, 10);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (4, 1, 8);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (4, 2, 150);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (5, 17, 1);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (5, 7, 15);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (5, 3, 10);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (5, 4, 10);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (5, 1, 8);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (5, 2, 150);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (6, 17, 1);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (6, 10, 15);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (6, 3, 10);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (6, 4, 10);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (6, 1, 8);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (6, 2, 150);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (7, 17, 1);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (7, 8, 15);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (7, 3, 10);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (7, 4, 10);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (7, 1, 8);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (7, 2, 150);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (8, 14, 20);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (8, 3, 7);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (8, 4, 7);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (8, 1, 6);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (8, 2, 100);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (9, 6, 15);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (9, 3, 8);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (9, 4, 8);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (9, 1, 6);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (9, 2, 100);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (10, 5, 15);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (10, 3, 8);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (10, 4, 8);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (10, 1, 6);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (10, 2, 100);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (11, 9, 15);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (11, 3, 8);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (11, 4, 8);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (11, 1, 6);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (11, 2, 100);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (12, 7, 15);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (12, 3, 8);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (12, 4, 8);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (12, 1, 6);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (12, 2, 100);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (13, 10, 15);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (13, 3, 8);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (13, 4, 8);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (13, 1, 6);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (13, 2, 100);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (14, 8, 15);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (14, 3, 8);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (14, 4, 8);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (14, 1, 6);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (14, 2, 100);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (15, 15, 1);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (16, 15, 1);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (16, 2, 150);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (17, 15, 1);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (17, 18, 1);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (18, 15, 1);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (18, 18, 1);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (19, 15, 1);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (20, 15, 1);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (20, 3, 30);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (21, 11, 15);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (21, 9, 15);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (21, 3, 8);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (21, 4, 8);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (21, 2, 100);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (22, 12, 10);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (22, 13, 10);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (22, 3, 7);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (22, 4, 7);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (22, 2, 100);
INSERT INTO public.recipes (item_variation_id, ingredient_id, amount) VALUES (23, 2, 150);

--
-- Sequences Reset
--
SELECT pg_catalog.setval('public.item_categories_id_seq', 7, true);
SELECT pg_catalog.setval('public.ingredients_id_seq', 21, true);
SELECT pg_catalog.setval('public.item_variations_id_seq', 23, true);
SELECT pg_catalog.setval('public.items_id_seq', 23, true);
SELECT pg_catalog.setval('public.modifier_group_rules_id_seq', 5, true);
SELECT pg_catalog.setval('public.modifier_groups_id_seq', 3, true);
SELECT pg_catalog.setval('public.modifiers_id_seq', 5, true);
SELECT pg_catalog.setval('public.purchases_id_seq', 21, true);
