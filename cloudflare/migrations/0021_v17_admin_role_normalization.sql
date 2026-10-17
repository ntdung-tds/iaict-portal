PRAGMA foreign_keys = ON;

-- `admin` is the canonical super-role. Remove redundant role mappings from
-- administrators so the stored assignment matches the UI and authorization model.
DELETE FROM admin_user_roles
WHERE user_id IN (
  SELECT ur.user_id
  FROM admin_user_roles ur
  JOIN roles r ON r.id = ur.role_id
  WHERE r.code = 'admin'
)
AND role_id NOT IN (
  SELECT id FROM roles WHERE code = 'admin'
);
