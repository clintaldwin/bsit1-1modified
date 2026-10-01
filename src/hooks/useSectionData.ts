import { useState, useEffect, useCallback } from 'react';
import { databaseRepository } from '@/lib/database/mockStore';
import { 
  Section, 
  Member, 
  Announcement, 
  Assignment, 
  Task, 
  Note, 
  Event, 
  Resource,
  AssignmentStatus,
  TaskStatus
} from '@/types/database';

export function useSectionData() {
  const [section, setSection] = useState<Section | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    try {
      setError(null);
      const [
        secData,
        annData,
        asgData,
        tskData,
        notData,
        evtData,
        resData,
        memData
      ] = await Promise.all([
        databaseRepository.getSection(),
        databaseRepository.getAnnouncements(false),
        databaseRepository.getAssignments(false),
        databaseRepository.getTasks(false),
        databaseRepository.getNotes(false),
        databaseRepository.getEvents(),
        databaseRepository.getResources(false),
        databaseRepository.getMembers(),
      ]);

      setSection(secData);
      setAnnouncements(annData);
      setAssignments(asgData);
      setTasks(tskData);
      setNotes(notData);
      setEvents(evtData);
      setResources(resData);
      setMembers(memData);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch section records from database.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
    // Subscribe to repository updates
    const unsubscribe = databaseRepository.subscribe(() => {
      refreshData();
    });
    return () => unsubscribe();
  }, [refreshData]);

  // Convenience mutations
  const updateTaskStatus = useCallback(async (taskId: string, newStatus: TaskStatus) => {
    try {
      await databaseRepository.updateTask(taskId, { status: newStatus });
    } catch (err: any) {
      console.error('Failed to update task status:', err);
    }
  }, []);

  const updateAssignmentStatus = useCallback(async (assignmentId: string, newStatus: AssignmentStatus) => {
    try {
      await databaseRepository.updateAssignment(assignmentId, { status: newStatus });
    } catch (err: any) {
      console.error('Failed to update assignment status:', err);
    }
  }, []);

  const resetAllData = useCallback(async () => {
    try {
      setLoading(true);
      await databaseRepository.resetToDefault();
      await refreshData();
    } catch (err: any) {
      setError('Failed to reset section database.');
    } finally {
      setLoading(false);
    }
  }, [refreshData]);

  return {
    section,
    announcements,
    assignments,
    tasks,
    notes,
    events,
    resources,
    members,
    loading,
    error,
    refreshData,
    updateTaskStatus,
    updateAssignmentStatus,
    resetAllData,
  };
}
