-- SQL Script to Fix Existing Statement PDF URLs
-- This converts full file system paths to relative paths

-- View current paths (before update)
SELECT id, owner_type, owner_id, year, month, pdf_url 
FROM monthly_statements 
WHERE pdf_url IS NOT NULL;

-- Update all existing statements with full paths to relative paths
UPDATE monthly_statements
SET pdf_url = CONCAT('uploads/statements/', SUBSTRING(pdf_url FROM '([^/]+)$'))
WHERE pdf_url IS NOT NULL 
  AND pdf_url LIKE '%/uploads/statements/%'
  AND pdf_url NOT LIKE 'uploads/statements/%';

-- Verify the update
SELECT id, owner_type, owner_id, year, month, pdf_url 
FROM monthly_statements 
WHERE pdf_url IS NOT NULL;

-- Alternative more specific update (if the above doesn't work):
-- This extracts the filename from the full path and creates the correct relative path
UPDATE monthly_statements
SET pdf_url = 'uploads/statements/' || REGEXP_REPLACE(pdf_url, '^.*/([^/]+)$', '\1')
WHERE pdf_url IS NOT NULL 
  AND pdf_url LIKE '%/var/www/%'
  AND pdf_url LIKE '%/uploads/statements/%';
