-- 1. Fix the quantity constraint to allow negative values (refunds)
ALTER TABLE public.order_item_modifiers 
DROP CONSTRAINT chk_oim_qty_positive;

ALTER TABLE public.order_item_modifiers 
ADD CONSTRAINT chk_oim_qty_not_zero CHECK (quantity != 0);

-- 2. Relax the base price constraint to allow discount modifiers in the future
ALTER TABLE public.order_item_modifiers 
DROP CONSTRAINT chk_oim_base_positive;

ALTER TABLE public.order_item_modifiers 
ADD CONSTRAINT chk_oim_cogs_positive CHECK (cogs_base >= 0);