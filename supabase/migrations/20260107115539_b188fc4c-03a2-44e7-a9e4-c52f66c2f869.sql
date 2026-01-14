-- Create function to sync assigned_to with task_assignees
CREATE OR REPLACE FUNCTION public.sync_task_assigned_to()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_task_id uuid;
  first_assignee_id uuid;
BEGIN
  -- Get the task_id based on operation type
  IF TG_OP = 'DELETE' THEN
    target_task_id := OLD.task_id;
  ELSE
    target_task_id := NEW.task_id;
  END IF;

  -- Get the first assignee for this task (oldest by created_at)
  SELECT employee_id INTO first_assignee_id
  FROM task_assignees
  WHERE task_id = target_task_id
  ORDER BY created_at ASC
  LIMIT 1;

  -- Update the tasks table
  UPDATE tasks
  SET assigned_to = first_assignee_id
  WHERE id = target_task_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Create trigger for INSERT on task_assignees
CREATE TRIGGER sync_assigned_to_on_insert
AFTER INSERT ON task_assignees
FOR EACH ROW
EXECUTE FUNCTION public.sync_task_assigned_to();

-- Create trigger for DELETE on task_assignees
CREATE TRIGGER sync_assigned_to_on_delete
AFTER DELETE ON task_assignees
FOR EACH ROW
EXECUTE FUNCTION public.sync_task_assigned_to();