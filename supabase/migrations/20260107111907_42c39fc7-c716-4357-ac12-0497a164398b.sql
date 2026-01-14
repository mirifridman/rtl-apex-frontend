-- Add 'stuck' status to task_status enum
ALTER TYPE task_status ADD VALUE 'stuck' AFTER 'in_progress';