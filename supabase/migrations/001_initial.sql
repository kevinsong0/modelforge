-- ModelForge 数据库迁移
-- 初始化用户表和模型表

-- 用户表（扩展 Supabase auth.users）
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 模型表
CREATE TABLE IF NOT EXISTS models (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  nodes JSONB DEFAULT '[]'::jsonb,
  edges JSONB DEFAULT '[]'::jsonb,
  variables JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 审计日志表
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  model_id UUID REFERENCES models(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_models_user_id ON models(user_id);
CREATE INDEX IF NOT EXISTS idx_models_status ON models(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_model_id ON audit_logs(model_id);

-- RLS (Row Level Security)
ALTER TABLE models ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 策略：用户只能访问自己的模型
CREATE POLICY "Users can view their own models" ON models
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own models" ON models
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own models" ON models
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own models" ON models
  FOR DELETE USING (auth.uid() = user_id);

-- 策略：用户只能访问自己模型的审计日志
CREATE POLICY "Users can view audit logs for their models" ON audit_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM models WHERE models.id = audit_logs.model_id AND models.user_id = auth.uid())
  );

-- 触发器：自动更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_models_updated_at
  BEFORE UPDATE ON models
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();