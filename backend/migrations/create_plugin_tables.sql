-- Plugin system tables for Alleato-Procore
-- This migration creates the necessary tables for the plugin architecture

-- Create enum for plugin status
CREATE TYPE plugin_status AS ENUM (
  'installed',
  'enabled',
  'disabled',
  'error',
  'updating'
);

-- Main plugins table
CREATE TABLE IF NOT EXISTS plugins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manifest_url TEXT,
  manifest JSONB NOT NULL,
  status plugin_status NOT NULL DEFAULT 'installed',
  installed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  enabled_at TIMESTAMPTZ,
  disabled_at TIMESTAMPTZ,
  settings JSONB DEFAULT '{}',
  error_message TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Extracted from manifest for easier querying
  name TEXT GENERATED ALWAYS AS (manifest->>'name') STORED,
  version TEXT GENERATED ALWAYS AS (manifest->>'version') STORED,
  author_name TEXT GENERATED ALWAYS AS (manifest->'author'->>'name') STORED
);

-- Plugin permissions table
CREATE TABLE IF NOT EXISTS plugin_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plugin_id UUID NOT NULL REFERENCES plugins(id) ON DELETE CASCADE,
  permission TEXT NOT NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  UNIQUE(plugin_id, permission)
);

-- Plugin hooks table (for tracking registered hooks)
CREATE TABLE IF NOT EXISTS plugin_hooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plugin_id UUID NOT NULL REFERENCES plugins(id) ON DELETE CASCADE,
  hook_type TEXT NOT NULL,
  priority INTEGER DEFAULT 0,
  enabled BOOLEAN DEFAULT true,
  
  UNIQUE(plugin_id, hook_type)
);

-- Plugin storage table (key-value storage for plugins)
CREATE TABLE IF NOT EXISTS plugin_storage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plugin_id UUID NOT NULL REFERENCES plugins(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(plugin_id, key)
);

-- Plugin logs table (for debugging and audit)
CREATE TABLE IF NOT EXISTS plugin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plugin_id UUID NOT NULL REFERENCES plugins(id) ON DELETE CASCADE,
  level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warning', 'error')),
  message TEXT NOT NULL,
  context JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Plugin marketplace table (for future marketplace integration)
CREATE TABLE IF NOT EXISTS plugin_marketplace (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plugin_id TEXT NOT NULL UNIQUE, -- External marketplace ID
  name TEXT NOT NULL,
  description TEXT,
  author JSONB,
  version TEXT NOT NULL,
  manifest_url TEXT NOT NULL,
  homepage TEXT,
  repository TEXT,
  downloads INTEGER DEFAULT 0,
  rating DECIMAL(2,1),
  tags TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_plugins_status ON plugins(status);
CREATE INDEX idx_plugins_name ON plugins(name);
CREATE INDEX idx_plugin_hooks_type ON plugin_hooks(hook_type);
CREATE INDEX idx_plugin_logs_level ON plugin_logs(level);
CREATE INDEX idx_plugin_logs_created ON plugin_logs(created_at);
CREATE INDEX idx_plugin_marketplace_tags ON plugin_marketplace USING GIN(tags);

-- Row Level Security (RLS) policies
ALTER TABLE plugins ENABLE ROW LEVEL SECURITY;
ALTER TABLE plugin_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE plugin_hooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE plugin_storage ENABLE ROW LEVEL SECURITY;
ALTER TABLE plugin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE plugin_marketplace ENABLE ROW LEVEL SECURITY;

-- Plugins table policies
CREATE POLICY "Admins can manage all plugins"
  ON plugins FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can view enabled plugins"
  ON plugins FOR SELECT
  TO authenticated
  USING (status = 'enabled');

-- Plugin permissions policies
CREATE POLICY "Admins can manage plugin permissions"
  ON plugin_permissions FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Plugin hooks policies
CREATE POLICY "Admins can manage plugin hooks"
  ON plugin_hooks FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Plugins can read their own hooks"
  ON plugin_hooks FOR SELECT
  TO authenticated
  USING (
    plugin_id IN (
      SELECT id FROM plugins WHERE status = 'enabled'
    )
  );

-- Plugin storage policies
CREATE POLICY "Plugins can manage their own storage"
  ON plugin_storage FOR ALL
  TO authenticated
  USING (
    plugin_id IN (
      SELECT id FROM plugins WHERE status = 'enabled'
    )
  );

-- Plugin logs policies
CREATE POLICY "Admins can read all logs"
  ON plugin_logs FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Plugins can write their own logs"
  ON plugin_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    plugin_id IN (
      SELECT id FROM plugins WHERE status = 'enabled'
    )
  );

-- Marketplace policies
CREATE POLICY "Everyone can view marketplace"
  ON plugin_marketplace FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage marketplace"
  ON plugin_marketplace FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Functions for plugin management
CREATE OR REPLACE FUNCTION update_plugin_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_plugins_timestamp
  BEFORE UPDATE ON plugins
  FOR EACH ROW
  EXECUTE FUNCTION update_plugin_timestamp();

CREATE TRIGGER update_plugin_storage_timestamp
  BEFORE UPDATE ON plugin_storage
  FOR EACH ROW
  EXECUTE FUNCTION update_plugin_timestamp();

-- Function to enable a plugin
CREATE OR REPLACE FUNCTION enable_plugin(plugin_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE plugins
  SET status = 'enabled', enabled_at = NOW(), disabled_at = NULL
  WHERE id = plugin_id AND status IN ('installed', 'disabled');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to disable a plugin
CREATE OR REPLACE FUNCTION disable_plugin(plugin_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE plugins
  SET status = 'disabled', disabled_at = NOW()
  WHERE id = plugin_id AND status = 'enabled';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add helpful comments
COMMENT ON TABLE plugins IS 'Main table for installed plugins in the system';
COMMENT ON TABLE plugin_permissions IS 'Tracks permissions granted to each plugin';
COMMENT ON TABLE plugin_hooks IS 'Registered hooks for each plugin';
COMMENT ON TABLE plugin_storage IS 'Key-value storage for plugin data';
COMMENT ON TABLE plugin_logs IS 'Audit and debug logs for plugins';
COMMENT ON TABLE plugin_marketplace IS 'Cache of available plugins from marketplace';