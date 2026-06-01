import { useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Badge } from '@/components/ui/badge';
import { GripVertical, AlertCircle, Clock, CheckCircle2, Circle } from 'lucide-react';

export interface KanbanTask {
  id: string;
  title: string;
  status: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assignee?: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
  tasks: KanbanTask[];
  color?: string; // tailwind color class for header
}

interface KanbanBoardProps {
  columns: KanbanColumn[];
  onTaskMove: (taskId: string, fromColumn: string, toColumn: string) => void;
  onTaskClick?: (task: KanbanTask) => void;
}

const PRIORITY_COLORS = {
  urgent: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-amber-500',
  low: 'bg-gray-400',
};

const COLUMN_HEADER_COLORS: Record<string, string> = {
  backlog: 'bg-gray-500',
  'in_progress': 'bg-blue-500',
  in_review: 'bg-amber-500',
  done: 'bg-emerald-500',
  closed: 'bg-gray-400',
};

function SortableTask({ task, onClick }: { task: KanbanTask; onClick?: (task: KanbanTask) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onClick?.(task)}
    >
      <div className="flex items-start gap-2">
        <button {...attributes} {...listeners} className="mt-0.5 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing">
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">{task.title}</p>
          <div className="flex items-center gap-2 mt-2">
            {task.priority && (
              <span className={`inline-block w-2 h-2 rounded-full ${PRIORITY_COLORS[task.priority] || 'bg-gray-400'}`} />
            )}
            {task.assignee && (
              <span className="text-[10px] text-gray-400">{task.assignee}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function KanbanColumnView({ column, onTaskClick }: { column: KanbanColumn; onTaskClick?: (task: KanbanTask) => void }) {
  const headerColor = COLUMN_HEADER_COLORS[column.id] || 'bg-gray-500';

  return (
    <div className="flex-1 min-w-[240px] max-w-[320px] bg-gray-50/80 rounded-xl p-3 flex flex-col">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${headerColor}`} />
          <h3 className="text-sm font-semibold text-gray-700">{column.title}</h3>
        </div>
        <Badge variant="outline" className="text-[10px] h-5 px-1.5 rounded-full bg-white">
          {column.tasks.length}
        </Badge>
      </div>
      <SortableContext items={column.tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2 flex-1">
          {column.tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-300">
              <Circle className="h-6 w-6 mb-1" />
              <span className="text-xs">فارغ</span>
            </div>
          ) : (
            column.tasks.map(task => (
              <SortableTask key={task.id} task={task} onClick={onTaskClick} />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export function KanbanBoard({ columns, onTaskMove, onTaskClick }: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<KanbanTask | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const tasksMap = useMemo(() => {
    const map = new Map<string, KanbanTask>();
    columns.forEach(col => col.tasks.forEach(t => map.set(t.id, t)));
    return map;
  }, [columns]);

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasksMap.get(String(event.active.id));
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = String(active.id);
    const overId = String(over.id);

    // Find source and target columns
    const sourceCol = columns.find(c => c.tasks.some(t => t.id === taskId));
    const targetCol = columns.find(c => c.tasks.some(t => t.id === overId)) ||
                      columns.find(c => c.id === overId);

    if (!sourceCol || !targetCol) return;
    if (sourceCol.id === targetCol.id) return;

    onTaskMove(taskId, sourceCol.id, targetCol.id);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4" dir="rtl">
        {columns.map(col => (
          <KanbanColumnView key={col.id} column={col} onTaskClick={onTaskClick} />
        ))}
      </div>
      <DragOverlay>
        {activeTask && (
          <div className="bg-white rounded-lg p-3 shadow-lg border border-blue-200 rotate-2">
            <p className="text-sm font-medium text-gray-800">{activeTask.title}</p>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
