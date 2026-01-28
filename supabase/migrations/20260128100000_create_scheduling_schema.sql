-- Scheduling Module Database Migration
-- Creates app_schedule_tasks, app_schedule_dependencies, app_schedule_deadlines tables
-- Based on Procore scheduling crawl data and PRP specifications

-- =============================================================================
-- SCHEDULE TASKS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS app_schedule_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    parent_task_id UUID REFERENCES app_schedule_tasks(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    start_date DATE,
    finish_date DATE,
    duration_days INTEGER,
    percent_complete INTEGER DEFAULT 0 CHECK (percent_complete >= 0 AND percent_complete <= 100),
    status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'complete')),
    is_milestone BOOLEAN DEFAULT false,
    constraint_type TEXT CHECK (constraint_type IN ('none', 'start_no_earlier_than', 'finish_no_later_than', 'must_start_on', 'must_finish_on')),
    constraint_date DATE,
    wbs_code TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Indexes for schedule tasks
CREATE INDEX IF NOT EXISTS idx_schedule_tasks_project ON app_schedule_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_schedule_tasks_parent ON app_schedule_tasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_schedule_tasks_status ON app_schedule_tasks(status);
CREATE INDEX IF NOT EXISTS idx_schedule_tasks_dates ON app_schedule_tasks(start_date, finish_date);
CREATE INDEX IF NOT EXISTS idx_schedule_tasks_milestone ON app_schedule_tasks(is_milestone) WHERE is_milestone = true;
CREATE INDEX IF NOT EXISTS idx_schedule_tasks_sort ON app_schedule_tasks(project_id, sort_order);

-- =============================================================================
-- SCHEDULE DEPENDENCIES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS app_schedule_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    predecessor_task_id UUID NOT NULL REFERENCES app_schedule_tasks(id) ON DELETE CASCADE,
    successor_task_id UUID NOT NULL REFERENCES app_schedule_tasks(id) ON DELETE CASCADE,
    dependency_type TEXT NOT NULL DEFAULT 'FS' CHECK (dependency_type IN ('FS', 'SS', 'FF', 'SF')),
    lag_days INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    -- Prevent self-referencing dependencies
    CONSTRAINT chk_no_self_dependency CHECK (predecessor_task_id != successor_task_id),
    -- Prevent duplicate dependencies
    CONSTRAINT uq_dependency UNIQUE (predecessor_task_id, successor_task_id)
);

-- Indexes for schedule dependencies
CREATE INDEX IF NOT EXISTS idx_schedule_deps_predecessor ON app_schedule_dependencies(predecessor_task_id);
CREATE INDEX IF NOT EXISTS idx_schedule_deps_successor ON app_schedule_dependencies(successor_task_id);

-- =============================================================================
-- SCHEDULE DEADLINES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS app_schedule_deadlines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES app_schedule_tasks(id) ON DELETE CASCADE,
    deadline_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    -- One deadline per task
    CONSTRAINT uq_task_deadline UNIQUE (task_id)
);

-- Indexes for schedule deadlines
CREATE INDEX IF NOT EXISTS idx_schedule_deadlines_task ON app_schedule_deadlines(task_id);
CREATE INDEX IF NOT EXISTS idx_schedule_deadlines_date ON app_schedule_deadlines(deadline_date);

-- =============================================================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- Enable RLS
ALTER TABLE app_schedule_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_schedule_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_schedule_deadlines ENABLE ROW LEVEL SECURITY;

-- Tasks: Users can access tasks for projects they belong to
CREATE POLICY schedule_tasks_select_policy ON app_schedule_tasks
    FOR SELECT USING (
        project_id IN (
            SELECT project_id FROM project_users WHERE user_id = auth.uid()
        )
    );

CREATE POLICY schedule_tasks_insert_policy ON app_schedule_tasks
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT project_id FROM project_users WHERE user_id = auth.uid()
        )
    );

CREATE POLICY schedule_tasks_update_policy ON app_schedule_tasks
    FOR UPDATE USING (
        project_id IN (
            SELECT project_id FROM project_users WHERE user_id = auth.uid()
        )
    );

CREATE POLICY schedule_tasks_delete_policy ON app_schedule_tasks
    FOR DELETE USING (
        project_id IN (
            SELECT project_id FROM project_users WHERE user_id = auth.uid()
        )
    );

-- Dependencies: Access based on tasks the user can see
CREATE POLICY schedule_deps_select_policy ON app_schedule_dependencies
    FOR SELECT USING (
        predecessor_task_id IN (
            SELECT id FROM app_schedule_tasks WHERE project_id IN (
                SELECT project_id FROM project_users WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY schedule_deps_insert_policy ON app_schedule_dependencies
    FOR INSERT WITH CHECK (
        predecessor_task_id IN (
            SELECT id FROM app_schedule_tasks WHERE project_id IN (
                SELECT project_id FROM project_users WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY schedule_deps_update_policy ON app_schedule_dependencies
    FOR UPDATE USING (
        predecessor_task_id IN (
            SELECT id FROM app_schedule_tasks WHERE project_id IN (
                SELECT project_id FROM project_users WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY schedule_deps_delete_policy ON app_schedule_dependencies
    FOR DELETE USING (
        predecessor_task_id IN (
            SELECT id FROM app_schedule_tasks WHERE project_id IN (
                SELECT project_id FROM project_users WHERE user_id = auth.uid()
            )
        )
    );

-- Deadlines: Access based on tasks the user can see
CREATE POLICY schedule_deadlines_select_policy ON app_schedule_deadlines
    FOR SELECT USING (
        task_id IN (
            SELECT id FROM app_schedule_tasks WHERE project_id IN (
                SELECT project_id FROM project_users WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY schedule_deadlines_insert_policy ON app_schedule_deadlines
    FOR INSERT WITH CHECK (
        task_id IN (
            SELECT id FROM app_schedule_tasks WHERE project_id IN (
                SELECT project_id FROM project_users WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY schedule_deadlines_update_policy ON app_schedule_deadlines
    FOR UPDATE USING (
        task_id IN (
            SELECT id FROM app_schedule_tasks WHERE project_id IN (
                SELECT project_id FROM project_users WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY schedule_deadlines_delete_policy ON app_schedule_deadlines
    FOR DELETE USING (
        task_id IN (
            SELECT id FROM app_schedule_tasks WHERE project_id IN (
                SELECT project_id FROM project_users WHERE user_id = auth.uid()
            )
        )
    );

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_schedule_task_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER trg_schedule_task_updated
    BEFORE UPDATE ON app_schedule_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_schedule_task_timestamp();

-- Function to calculate duration from dates
CREATE OR REPLACE FUNCTION calculate_task_duration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.start_date IS NOT NULL AND NEW.finish_date IS NOT NULL THEN
        NEW.duration_days = NEW.finish_date - NEW.start_date;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate duration
CREATE TRIGGER trg_schedule_task_duration
    BEFORE INSERT OR UPDATE ON app_schedule_tasks
    FOR EACH ROW
    WHEN (NEW.start_date IS NOT NULL AND NEW.finish_date IS NOT NULL)
    EXECUTE FUNCTION calculate_task_duration();

-- Function to check for circular dependencies
CREATE OR REPLACE FUNCTION check_circular_dependency()
RETURNS TRIGGER AS $$
DECLARE
    has_cycle BOOLEAN;
BEGIN
    -- Check if adding this dependency creates a cycle
    WITH RECURSIVE dependency_chain AS (
        -- Base case: start from the successor of the new dependency
        SELECT successor_task_id AS task_id, 1 AS depth
        FROM app_schedule_dependencies
        WHERE predecessor_task_id = NEW.successor_task_id

        UNION ALL

        -- Recursive case: follow the dependency chain
        SELECT d.successor_task_id, dc.depth + 1
        FROM app_schedule_dependencies d
        JOIN dependency_chain dc ON d.predecessor_task_id = dc.task_id
        WHERE dc.depth < 100  -- Prevent infinite loops in case of data issues
    )
    SELECT EXISTS (
        SELECT 1 FROM dependency_chain WHERE task_id = NEW.predecessor_task_id
    ) INTO has_cycle;

    IF has_cycle THEN
        RAISE EXCEPTION 'Cannot create dependency: would create a circular dependency chain';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to prevent circular dependencies
CREATE TRIGGER trg_check_circular_dependency
    BEFORE INSERT ON app_schedule_dependencies
    FOR EACH ROW
    EXECUTE FUNCTION check_circular_dependency();

-- =============================================================================
-- VIEWS
-- =============================================================================

-- View for tasks with their dependencies and deadlines
CREATE OR REPLACE VIEW schedule_tasks_with_details AS
SELECT
    t.*,
    d.deadline_date,
    CASE
        WHEN d.deadline_date IS NOT NULL AND t.finish_date > d.deadline_date THEN true
        ELSE false
    END AS is_overdue,
    (
        SELECT COUNT(*)
        FROM app_schedule_tasks child
        WHERE child.parent_task_id = t.id
    ) AS child_count,
    (
        SELECT json_agg(json_build_object(
            'id', dep.id,
            'predecessor_task_id', dep.predecessor_task_id,
            'dependency_type', dep.dependency_type,
            'lag_days', dep.lag_days
        ))
        FROM app_schedule_dependencies dep
        WHERE dep.successor_task_id = t.id
    ) AS predecessors,
    (
        SELECT json_agg(json_build_object(
            'id', dep.id,
            'successor_task_id', dep.successor_task_id,
            'dependency_type', dep.dependency_type,
            'lag_days', dep.lag_days
        ))
        FROM app_schedule_dependencies dep
        WHERE dep.predecessor_task_id = t.id
    ) AS successors
FROM app_schedule_tasks t
LEFT JOIN app_schedule_deadlines d ON d.task_id = t.id;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE app_schedule_tasks IS 'Project schedule tasks with hierarchy support';
COMMENT ON TABLE app_schedule_dependencies IS 'Task dependency relationships (FS, SS, FF, SF)';
COMMENT ON TABLE app_schedule_deadlines IS 'Task deadline dates';
COMMENT ON COLUMN app_schedule_tasks.dependency_type IS 'FS=Finish-to-Start, SS=Start-to-Start, FF=Finish-to-Finish, SF=Start-to-Finish';
COMMENT ON COLUMN app_schedule_tasks.constraint_type IS 'Schedule constraint applied to the task';
COMMENT ON COLUMN app_schedule_tasks.wbs_code IS 'Work Breakdown Structure code for hierarchical organization';
