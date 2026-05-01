-- 1. Secure the Standard View
ALTER VIEW public.view_ingredient_costs SET (security_invoker = true);

-- 2. Secure the Materialized View (The Hard Lockdown)
REVOKE ALL ON public.item_variation_cogs FROM PUBLIC, anon, authenticated; -- revoke all access from public API roles
GRANT SELECT ON public.item_variation_cogs TO service_role; -- grant access ONLY to the specific database roles that need it.

-- Revoke access from the frontend clients
-- 3. Secure the Function to refresh the Materialized View
REVOKE EXECUTE ON FUNCTION public.refresh_item_variation_cogs() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_item_variation_cogs() TO service_role;

-- 4. Lock down all tables by enabling Row Level Security
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modifier_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modifier_group_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_item_modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STORAGE RLS POLICIES FOR 'menu_images' BUCKET
-- ============================================================================

-- 1. READ ACCESS: Anyone can view the images
-- Even though the bucket is public, it's good practice to have a read policy.
CREATE POLICY "Public Menu Images Viewable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'menu_images');

-- 2. INSERT ACCESS: Only managers can upload new images
CREATE POLICY "Managers can upload menu images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'menu_images' AND
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role = 'manager'
    )
);

-- 3. UPDATE ACCESS: Only managers can update existing images
CREATE POLICY "Managers can update menu images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'menu_images' AND
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role = 'manager'
    )
);

-- 4. DELETE ACCESS: Only managers can delete images
CREATE POLICY "Managers can delete menu images"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'menu_images' AND
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role = 'manager'
    )
);
