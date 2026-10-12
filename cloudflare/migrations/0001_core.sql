PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS site_settings (
  id TEXT PRIMARY KEY,
  organization_name TEXT NOT NULL,
  settings_json TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY,
  access_subject TEXT,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_user_roles (
  user_id TEXT NOT NULL,
  role_id TEXT NOT NULL,
  PRIMARY KEY (user_id, role_id),
  FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS media (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  storage_key TEXT NOT NULL UNIQUE,
  visibility TEXT NOT NULL DEFAULT 'private',
  filename TEXT,
  mime_type TEXT,
  size_bytes INTEGER,
  alt TEXT,
  caption TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  summary TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  category TEXT,
  features_json TEXT NOT NULL DEFAULT '[]',
  technologies_json TEXT NOT NULL DEFAULT '[]',
  benefits_json TEXT NOT NULL DEFAULT '[]',
  integration_notes TEXT,
  seo_json TEXT NOT NULL DEFAULT '{}',
  featured INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  published_at TEXT
);

CREATE TABLE IF NOT EXISTS solutions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  summary TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  problem TEXT,
  scope_json TEXT NOT NULL DEFAULT '[]',
  process_json TEXT NOT NULL DEFAULT '[]',
  deliverables_json TEXT NOT NULL DEFAULT '[]',
  technologies_json TEXT NOT NULL DEFAULT '[]',
  seo_json TEXT NOT NULL DEFAULT '{}',
  featured INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  published_at TEXT
);

CREATE TABLE IF NOT EXISTS experts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'draft',
  title TEXT,
  bio TEXT,
  expertise_json TEXT NOT NULL DEFAULT '[]',
  photo_media_id TEXT,
  public_contacts_json TEXT NOT NULL DEFAULT '{}',
  seo_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (photo_media_id) REFERENCES media(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  summary TEXT NOT NULL,
  audiences_json TEXT NOT NULL DEFAULT '[]',
  topics_json TEXT NOT NULL DEFAULT '[]',
  objectives_json TEXT NOT NULL DEFAULT '[]',
  modules_json TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'draft',
  duration TEXT,
  delivery_modes_json TEXT NOT NULL DEFAULT '[]',
  level TEXT,
  class_size TEXT,
  materials_json TEXT NOT NULL DEFAULT '[]',
  certificate_note TEXT,
  featured INTEGER NOT NULL DEFAULT 0,
  seo_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  published_at TEXT
);

CREATE TABLE IF NOT EXISTS course_sessions (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  start_at TEXT,
  end_at TEXT,
  registration_open_at TEXT,
  registration_close_at TEXT,
  location TEXT,
  online_url_private TEXT,
  capacity INTEGER,
  notes_public TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  summary TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  context TEXT,
  solution TEXT,
  scope_json TEXT NOT NULL DEFAULT '[]',
  technologies_json TEXT NOT NULL DEFAULT '[]',
  results_json TEXT NOT NULL DEFAULT '[]',
  replication_potential TEXT,
  seo_json TEXT NOT NULL DEFAULT '{}',
  featured INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  published_at TEXT
);

CREATE TABLE IF NOT EXISTS partners (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  logo_media_id TEXT,
  summary TEXT,
  website TEXT,
  public_note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (logo_media_id) REFERENCES media(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS article_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS articles (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  category_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  body TEXT NOT NULL,
  excerpt TEXT,
  tags_json TEXT NOT NULL DEFAULT '[]',
  author_user_id TEXT,
  hero_media_id TEXT,
  published_at TEXT,
  attachments_json TEXT NOT NULL DEFAULT '[]',
  seo_json TEXT NOT NULL DEFAULT '{}',
  featured INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(category_id, slug),
  FOREIGN KEY (category_id) REFERENCES article_categories(id),
  FOREIGN KEY (author_user_id) REFERENCES admin_users(id) ON DELETE SET NULL,
  FOREIGN KEY (hero_media_id) REFERENCES media(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'draft',
  summary TEXT,
  start_at TEXT,
  end_at TEXT,
  location TEXT,
  registration_url TEXT,
  body TEXT,
  seo_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  source_url TEXT NOT NULL,
  source_entity_type TEXT,
  source_entity_id TEXT,
  contact_name TEXT NOT NULL,
  organization TEXT,
  job_title TEXT,
  phone TEXT,
  email TEXT,
  message TEXT,
  consent_at TEXT NOT NULL,
  owner_id TEXT,
  internal_notes TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  attachment_refs_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (owner_id) REFERENCES admin_users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS course_registrations (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL,
  session_id TEXT,
  status TEXT NOT NULL DEFAULT 'submitted',
  contact_name TEXT NOT NULL,
  organization TEXT,
  job_title TEXT,
  phone TEXT,
  email TEXT,
  delivery_preference TEXT,
  notes TEXT,
  consent_at TEXT NOT NULL,
  lead_id TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (course_id) REFERENCES courses(id),
  FOREIGN KEY (session_id) REFERENCES course_sessions(id) ON DELETE SET NULL,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS lead_history (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL,
  actor_user_id TEXT,
  action TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT,
  note TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  FOREIGN KEY (actor_user_id) REFERENCES admin_users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS content_relations (
  from_type TEXT NOT NULL,
  from_id TEXT NOT NULL,
  to_type TEXT NOT NULL,
  to_id TEXT NOT NULL,
  relation_type TEXT NOT NULL DEFAULT 'related',
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (from_type, from_id, to_type, to_id, relation_type)
);

CREATE TABLE IF NOT EXISTS redirects (
  id TEXT PRIMARY KEY,
  source_path TEXT NOT NULL UNIQUE,
  destination_path TEXT NOT NULL,
  status_code INTEGER NOT NULL DEFAULT 308,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  actor_user_id TEXT,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  FOREIGN KEY (actor_user_id) REFERENCES admin_users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_products_status_featured ON products(status, featured);
CREATE INDEX IF NOT EXISTS idx_solutions_status_featured ON solutions(status, featured);
CREATE INDEX IF NOT EXISTS idx_courses_status_featured ON courses(status, featured);
CREATE INDEX IF NOT EXISTS idx_sessions_course_status ON course_sessions(course_id, status);
CREATE INDEX IF NOT EXISTS idx_projects_status_featured ON projects(status, featured);
CREATE INDEX IF NOT EXISTS idx_articles_category_status_published ON articles(category_id, status, published_at);
CREATE INDEX IF NOT EXISTS idx_events_status_start ON events(status, start_at);
CREATE INDEX IF NOT EXISTS idx_leads_status_type_created ON leads(status, type, created_at);
CREATE INDEX IF NOT EXISTS idx_leads_owner_status ON leads(owner_id, status);
CREATE INDEX IF NOT EXISTS idx_registrations_course_status ON course_registrations(course_id, status);
CREATE INDEX IF NOT EXISTS idx_registrations_session_status ON course_registrations(session_id, status);
CREATE INDEX IF NOT EXISTS idx_lead_history_lead_created ON lead_history(lead_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_actor_created ON audit_logs(actor_user_id, created_at);
