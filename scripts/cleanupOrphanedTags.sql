-- Cleanup orphaned blog tags
-- This script removes tags that have no approved posts associated with them

-- First, let's see which tags are orphaned (no approved posts)
SELECT 
  t.id,
  t.name,
  t.slug,
  COUNT(CASE WHEN p.status = 'approved' THEN 1 END) as approved_posts,
  COUNT(pt.post_id) as total_posts
FROM tags t
LEFT JOIN post_tags pt ON t.id = pt.tag_id
LEFT JOIN posts p ON pt.post_id = p.id
GROUP BY t.id, t.name, t.slug
HAVING COUNT(CASE WHEN p.status = 'approved' THEN 1 END) = 0
ORDER BY t.name;

-- Remove post_tags entries that reference non-approved posts
-- This will clean up associations to deleted/rejected posts
DELETE FROM post_tags 
WHERE post_id IN (
  SELECT id 
  FROM posts 
  WHERE status NOT IN ('approved')
);

-- Remove tags that now have no post associations at all
-- These are the orphaned tags that will show 0 counts
DELETE FROM tags 
WHERE id NOT IN (
  SELECT DISTINCT tag_id 
  FROM post_tags 
  WHERE tag_id IS NOT NULL
);

-- Verify cleanup - check remaining tags and their approved post counts
SELECT 
  t.id,
  t.name,
  t.slug,
  COUNT(CASE WHEN p.status = 'approved' THEN 1 END) as approved_posts_count
FROM tags t
LEFT JOIN post_tags pt ON t.id = pt.tag_id
LEFT JOIN posts p ON pt.post_id = p.id AND p.status = 'approved'
GROUP BY t.id, t.name, t.slug
ORDER BY approved_posts_count DESC, t.name;

-- Alternative more conservative approach: Only remove tags with 0 approved posts
-- Uncomment this if you want to be more careful:
/*
WITH orphaned_tags AS (
  SELECT t.id
  FROM tags t
  LEFT JOIN post_tags pt ON t.id = pt.tag_id
  LEFT JOIN posts p ON pt.post_id = p.id AND p.status = 'approved'
  GROUP BY t.id
  HAVING COUNT(p.id) = 0
)
DELETE FROM tags 
WHERE id IN (SELECT id FROM orphaned_tags);
*/