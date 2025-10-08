-- Cleanup duplicate reactions from legacy system
-- This script removes duplicate reactions, keeping only the most recent one per postId+reactionType

-- First, let's see what duplicates exist
SELECT 
  target_id,
  COUNT(*) as duplicate_count,
  MIN(created_at) as first_created,
  MAX(created_at) as last_created
FROM reactions 
WHERE target_type = 'post' 
  AND kind = 'like' 
  AND user_id IS NULL
GROUP BY target_id
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Remove duplicates, keeping only the most recent reaction for each target_id
-- This uses a window function to identify which rows to keep
WITH duplicates_to_remove AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY target_id 
      ORDER BY created_at DESC
    ) as row_num
  FROM reactions 
  WHERE target_type = 'post' 
    AND kind = 'like' 
    AND user_id IS NULL
)
DELETE FROM reactions 
WHERE id IN (
  SELECT id 
  FROM duplicates_to_remove 
  WHERE row_num > 1
);

-- Verify cleanup - this should return no rows with count > 1
SELECT 
  target_id,
  COUNT(*) as count_after_cleanup
FROM reactions 
WHERE target_type = 'post' 
  AND kind = 'like' 
  AND user_id IS NULL
GROUP BY target_id
HAVING COUNT(*) > 1;