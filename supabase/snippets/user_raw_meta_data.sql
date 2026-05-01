-- Update a specific user by their ID
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data ||
    jsonb_build_object('username', 'Bukhari', 'role', 'manager')
WHERE id = 'ecbb349a-44ec-4176-b2d9-27fb5575525c';

-- -- Update a specific user by their ID
-- UPDATE auth.users
-- SET raw_user_meta_data = raw_user_meta_data ||
--     jsonb_build_object('username', 'Donn', 'role', 'barista')
-- WHERE id = 'ac5428b4-4500-45e1-b6ce-12c4bcd10baa';

-- -- Update a specific user by their ID
-- UPDATE auth.users
-- SET raw_user_meta_data = raw_user_meta_data ||
--     jsonb_build_object('username', 'Ahmad', 'role', 'barista')
-- WHERE id = 'abf433ee-4241-4a7c-a014-ddde5ecd4071';
