-- Add image fields to rooms table
ALTER TABLE `rooms` 
ADD COLUMN `image` TEXT AFTER `amenities`,
ADD COLUMN `gallery` TEXT AFTER `image`;

-- Update existing rooms with sample images from Unsplash
UPDATE `rooms` SET 
    `image` = 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&q=80',
    `gallery` = 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80,https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80'
WHERE `id` = '101';

UPDATE `rooms` SET 
    `image` = 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&q=80',
    `gallery` = 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&q=80,https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&q=80'
WHERE `id` = '102';

UPDATE `rooms` SET 
    `image` = 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&q=80',
    `gallery` = 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80,https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80'
WHERE `id` = '103';

UPDATE `rooms` SET 
    `image` = 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80',
    `gallery` = 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&q=80,https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&q=80'
WHERE `id` = '201';

UPDATE `rooms` SET 
    `image` = 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&q=80',
    `gallery` = 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80,https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80'
WHERE `id` = '202';

UPDATE `rooms` SET 
    `image` = 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80',
    `gallery` = 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&q=80,https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&q=80,https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&q=80'
WHERE `id` = '301';
