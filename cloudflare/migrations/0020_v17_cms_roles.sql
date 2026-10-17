PRAGMA foreign_keys = ON;

INSERT OR IGNORE INTO roles(id, code, name) VALUES
  ('role-admin', 'admin', 'CMS Administrator'),
  ('role-editor', 'editor', 'CMS Editor'),
  ('role-reviewer', 'reviewer', 'CMS Reviewer'),
  ('role-viewer', 'viewer', 'CMS Viewer');

UPDATE roles SET name = 'Newsroom Administrator' WHERE code = 'news_admin';
UPDATE roles SET name = 'Newsroom Editor' WHERE code = 'news_editor';
UPDATE roles SET name = 'Newsroom Reviewer' WHERE code = 'news_reviewer';

-- Bootstrap exactly one active global administrator when upgrading an installation
-- that previously only had the V16 Newsroom role model. This prevents CMS lockout
-- while keeping news_admin scoped to Newsroom after V17 authorization hardening.
INSERT OR IGNORE INTO admin_user_roles(user_id, role_id)
SELECT u.id, 'role-admin'
FROM admin_users u
JOIN admin_user_roles ur ON ur.user_id = u.id
JOIN roles nr ON nr.id = ur.role_id AND nr.code = 'news_admin'
WHERE u.is_active = 1
  AND NOT EXISTS (
    SELECT 1
    FROM admin_users au
    JOIN admin_user_roles aur ON aur.user_id = au.id
    JOIN roles ar ON ar.id = aur.role_id
    WHERE au.is_active = 1 AND ar.code = 'admin'
  )
ORDER BY u.created_at ASC
LIMIT 1;
