import React, { useState } from 'react';
import { motion } from 'motion/react';
import { RotateCw, Plus, Calendar, Clock, Pause, Play, Trash2 } from 'lucide-react';
import { ScheduledTask, ModelInfo, Agent } from '../../types';
import { CreateTaskModal } from './CreateTaskModal';

interface TasksViewProps {
  tasks: ScheduledTask[];
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onCreateTask: (task: Partial<ScheduledTask>) => void;
  availableModels: ModelInfo[];
  availableAgents: Agent[];
}

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  onToggleTask,
  onDeleteTask,
  onCreateTask,
  availableModels,
  availableAgents,
}) => {
  const [filter, setFilter] = useState<string>('Active');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const filterOptions = [
    'Active',
    'Needs approval',
    'Paused',
    'Failed provisioning',
    'Completed one-time',
    'All',
  ];

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'All') return true;
    return t.status === filter;
  });

  return (
    <div className="flex-1 flex flex-col h-full w-full min-w-0 overflow-y-auto overflow-x-hidden bg-transparent text-slate-900 dark:text-white px-4 sm:px-6 lg:px-8 py-4 sm:py-5 select-none transition-colors">
      <div className="max-w-[1400px] w-full min-w-0 mx-auto space-y-5">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Tasks</h1>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full liquid-glass-subtle text-violet-600 dark:text-violet-300 text-xs font-semibold">
                <Calendar className="w-3.5 h-3.5" />
                <span>Scheduled</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Run an agent or model automatically at the time you choose.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5 shrink-0">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              className="flex items-center gap-1.5 px-3.5 py-2 liquid-glass-orb text-slate-700 dark:text-slate-200 rounded-full text-xs font-semibold transition-colors cursor-pointer"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-violet-600 dark:text-violet-400' : ''}`} />
              <span>Refresh</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 liquid-glass-cta rounded-full text-xs font-semibold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New task</span>
            </motion.button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="inline-flex items-center gap-1 p-1 rounded-full liquid-glass-subtle overflow-x-auto max-w-full scrollbar-none">
          {filterOptions.map((opt) => {
            const active = filter === opt;
            return (
              <motion.button
                key={opt}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilter(opt)}
                className={`relative px-3.5 py-1.5 rounded-full text-xs transition-colors shrink-0 cursor-pointer ${
                  active
                    ? 'text-slate-950 dark:text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="tasks-filter-droplet"
                    layout="position"
                    transition={{ type: 'spring', stiffness: 760, damping: 42, mass: 0.42 }}
                    className="absolute inset-0 rounded-full liquid-glass-droplet overflow-hidden"
                  >
                    <span className="absolute inset-x-2 top-0.5 h-1/2 rounded-full bg-gradient-to-b from-white/55 to-transparent dark:from-white/25 pointer-events-none" />
                  </motion.span>
                )}
                <span className="relative z-10">{opt}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredTasks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full liquid-glass-card rounded-[28px] sm:rounded-[32px] p-8 sm:p-16 text-center my-4 flex flex-col items-center justify-center min-h-[300px] sm:min-h-[380px]"
          >
            <div className="w-14 h-14 rounded-2xl liquid-glass-orb text-violet-600 dark:text-violet-300 flex items-center justify-center mb-5">
              <Calendar className="w-6 h-6 stroke-[1.8]" />
            </div>

            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-2">
              Create a task to run while you're away
            </h3>

            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md leading-relaxed mb-6">
              Create a task with an instruction, agent or model target, and run time. Automate AI will start the chat automatically.
            </p>

            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => setIsCreateOpen(true)}
              className="px-5 py-2.5 liquid-glass-cta rounded-full text-xs font-semibold cursor-pointer"
            >
              New task
            </motion.button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task) => (
              <motion.div
                key={task.id}
                whileHover={{ y: -1 }}
                className="p-4 rounded-[24px] liquid-glass-card flex items-center justify-between gap-3 min-w-0"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm truncate">{task.name}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      task.status === 'Active'
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/25'
                        : 'liquid-glass-subtle text-slate-500 dark:text-slate-300'
                    }`}>
                      {task.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{task.description}</p>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2 text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {task.schedule}
                    </span>
                    <span>•</span>
                    <span className="text-violet-600 dark:text-violet-400 font-medium">{task.targetAgent}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onToggleTask(task.id)}
                    title={task.status === 'Paused' ? 'Resume task' : 'Pause task'}
                    className="w-8 h-8 rounded-full liquid-glass-orb flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    {task.status === 'Paused' ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onDeleteTask(task.id)}
                    title="Delete task"
                    className="w-8 h-8 rounded-full liquid-glass-orb flex items-center justify-center text-slate-500 dark:text-slate-300 hover:text-red-500 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <CreateTaskModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreateTask={onCreateTask}
        availableModels={availableModels}
        availableAgents={availableAgents}
      />
    </div>
  );
};
