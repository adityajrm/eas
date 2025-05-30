import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarIcon, Clock, Plus, Search, Trash2, Circle, FileText } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { Task } from '@/types';
import AutoTaskReportDialog from './AutoTaskReportDialog';
import autoTaskService from '@/services/autoTaskService';
import { useToast } from '@/hooks/use-toast';
import { getNotionItems, createNotionItem } from '@/services/notionService';

const TasksPage = () => {
  const { tasks, addTask, toggleTaskCompletion, deleteTask, analytics, updateTask, notes, addNote } = useAppContext();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    completed: false,
    priority: 'medium' as 'low' | 'medium' | 'high' | 'autotask',
    dueDate: undefined as Date | undefined,
    notes: '',
  });
  const [activeTab, setActiveTab] = useState('all');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Partial<Task> | null>(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [currentReport, setCurrentReport] = useState<{
    taskId: string;
    title: string;
    content: string;
  } | null>(null);

  // Find any autotasks that need processing
  useEffect(() => {
    const processAutoTasks = async () => {
      const pendingTasks = tasks.filter(
        task => task.priority === 'autotask' && 
        !task.completed && 
        !task.isProcessing && 
        !task.linkedNoteId
      );
      
      for (const task of pendingTasks) {
        try {
          // Mark task as processing
          updateTask({
            ...task,
            isProcessing: true
          });
          
          toast({
            title: "Processing AutoTask",
            description: `Started AI processing for: ${task.title}`
          });
          
          // Process the task with AI
          const reportResult = await autoTaskService.processAutoTask(task);
          
          // Ensure "AutoTask" folder exists in NotionEditor
          let autoTaskFolder = (await getNotionItems(null)).find(item => item.title === 'AutoTask' && item.type === 'folder');
          if (!autoTaskFolder) {
            autoTaskFolder = await createNotionItem({
              title: 'AutoTask',
              type: 'folder',
              parent_id: null
            });
          }

          // Create a new page in the "AutoTask" folder with the report
          const newPage = await createNotionItem({
            title: reportResult.title,
            type: 'page',
            parent_id: autoTaskFolder.id,
            content: reportResult.content
          });

          // Update the task with the linked page ID and mark as completed
          updateTask({
            ...task,
            isProcessing: false,
            linkedNoteId: newPage.id, // Link to the Notion page ID
            completed: true // Automatically mark as completed
          });
          
          // Open the report dialog
          setCurrentReport({
            taskId: task.id,
            title: reportResult.title,
            content: reportResult.content
          });
          setReportDialogOpen(true);
          
          toast({
            title: "AutoTask Completed",
            description: `Report saved in NotionEditor for: ${task.title}`
          });
        } catch (error) {
          console.error(`Error processing AutoTask "${task.title}":`, error);
          
          // Reset the processing state on error
          updateTask({
            ...task,
            isProcessing: false
          });
          
          toast({
            title: "AutoTask Failed",
            description: `Failed to process: ${task.title}`,
            variant: "destructive"
          });
        }
      }
    };
    
    processAutoTasks();
  }, [tasks, updateTask, toast]);

  const filteredTasks = tasks.filter(
    (task) =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (activeTab === 'all' || 
       (activeTab === 'completed' && task.completed) || 
       (activeTab === 'pending' && !task.completed))
  );

  const handleSubmit = () => {
    if (newTask.title.trim()) {
      addTask(newTask);
      setNewTask({
        title: '',
        completed: false,
        priority: 'medium',
        dueDate: undefined,
        notes: '',
      });
      setIsDialogOpen(false);
    }
  };

  const handleEditSubmit = () => {
    if (taskToEdit && taskToEdit.title?.trim()) {
      if (taskToEdit?.id && taskToEdit.title && taskToEdit.priority && taskToEdit.completed !== undefined) {
        // Use updateTask instead of addTask
        updateTask({
          id: taskToEdit.id!,
          title: taskToEdit.title!,
          priority: taskToEdit.priority!,
          completed: taskToEdit.completed!,
          dueDate: taskToEdit.dueDate,
          notes: taskToEdit.notes || '',
          createdAt: taskToEdit.createdAt || new Date(), // Provide a fallback for createdAt
          linkedNoteId: taskToEdit.linkedNoteId,
          isProcessing: taskToEdit.isProcessing
        });
      }
      setTaskToEdit(null);
      setIsEditDialogOpen(false);
    }
  };
  
  const handleApproveReport = () => {
    if (currentReport) {
      const task = tasks.find(t => t.id === currentReport.taskId);
      if (task) {
        updateTask({
          ...task,
          completed: true
        });
        toast({
          title: "Task Approved",
          description: `Task "${task.title}" has been marked as complete`
        });
      }
      setReportDialogOpen(false);
      setCurrentReport(null);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'autotask':
        return 'bg-blue-500';
      default:
        return 'bg-green-500'; // low priority
    }
  };
  
  const viewTaskReport = (task: Task) => {
    if (task.linkedNoteId) {
      const linkedNote = notes.find(note => note.id === task.linkedNoteId);
      if (linkedNote) {
        setCurrentReport({
          taskId: task.id,
          title: linkedNote.title,
          content: linkedNote.content
        });
        setReportDialogOpen(true);
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="text-muted-foreground">Manage your to-do list</p>
        </div>
        <motion.div whileTap={{ scale: 0.95 }}>
          <Button 
            onClick={() => setIsDialogOpen(true)} 
            className="flex items-center gap-2 w-full md:w-auto"
          >
            <Plus size={16} />
            <span>New Task</span>
          </Button>
        </motion.div>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Task Completion</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{analytics.completedTasks} of {analytics.totalTasks} tasks completed</span>
            <span>{Math.round((analytics.completedTasks / Math.max(analytics.totalTasks, 1)) * 100)}%</span>
          </div>
          <motion.div 
            className="bg-muted rounded-full h-2 overflow-hidden"
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: '100%' }}
            transition={{ duration: 0.5 }}
          >
            <motion.div 
              className="bg-primary h-full"
              initial={{ width: '0%' }}
              animate={{ width: `${Math.round((analytics.completedTasks / Math.max(analytics.totalTasks, 1)) * 100)}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </motion.div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            className="pl-10 w-full"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {filteredTasks.length === 0 ? (
        <motion.div 
          className="text-center py-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h3 className="text-lg font-medium">No tasks found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery ? 'Try a different search term' : 'Create your first task to get started'}
          </p>
          {!searchQuery && (
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus size={16} className="mr-2" />
                Create Task
              </Button>
            </motion.div>
          )}
        </motion.div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Task List</CardTitle>
          </CardHeader>
          <CardContent>
            <motion.div 
              className="space-y-1"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.07
                  }
                }
              }}
            >
              <AnimatePresence>
                {filteredTasks.map((task) => (
                  <motion.div 
                    key={task.id} 
                    className="flex items-center justify-between p-3 border-b last:border-b-0 flex-wrap md:flex-nowrap gap-2"
                    variants={{
                      hidden: { y: 20, opacity: 0 },
                      visible: { y: 0, opacity: 1 }
                    }}
                    exit={{
                      opacity: 0,
                      x: -100,
                      transition: { duration: 0.3 }
                    }}
                    layout
                  >
                    <div className="flex items-center gap-3 w-full md:w-auto">
                      <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
                      <Checkbox 
                        checked={task.completed}
                        onCheckedChange={() => toggleTaskCompletion(task.id)}
                        id={`task-${task.id}`}
                        className="transition-all duration-200"
                        disabled={task.priority === 'autotask' && !task.linkedNoteId}
                      />
                      <label 
                        htmlFor={`task-${task.id}`}
                        className={`text-sm transition-all duration-300 ${task.completed ? 'line-through text-muted-foreground' : ''}`}
                      >
                        {task.title}
                        {task.isProcessing && (
                          <span className="ml-2 text-xs animate-pulse text-blue-500">
                            Processing...
                          </span>
                        )}
                      </label>
                    </div>
                    <div className="flex items-center gap-4 ml-auto">
                      {task.dueDate && (
                        <div className="flex items-center text-xs text-muted-foreground gap-1">
                          <Clock size={12} />
                          <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      <div className="flex gap-2">
                        {task.priority === 'autotask' && task.linkedNoteId && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => viewTaskReport(task)}
                            className="text-blue-500 hover:text-blue-700 transition-colors flex items-center gap-1"
                          >
                            <FileText size={16} />
                            <span>View Report</span>
                          </motion.button>
                        )}
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            setTaskToEdit({
                              ...task,
                              dueDate: task.dueDate || undefined,
                            });
                            setIsEditDialogOpen(true);
                          }}
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          Edit
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => deleteTask(task.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 size={16} />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </CardContent>
        </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md max-w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>Add a new task to your list</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Title
              </label>
              <Input
                id="title"
                placeholder="Task title"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="priority" className="text-sm font-medium">
                Priority
              </label>
              <Select
                value={newTask.priority}
                onValueChange={(value: 'low' | 'medium' | 'high' | 'autotask') => 
                  setNewTask({ ...newTask, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="autotask">
                    <div className="flex items-center gap-2">
                      <Circle className="h-3 w-3 fill-blue-500 text-blue-500" />
                      <span>AutoTask (AI assisted)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              
              {newTask.priority === 'autotask' && (
                <p className="text-xs text-muted-foreground mt-1">
                  AutoTask will use AI to automatically research and complete this task for you.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Due Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newTask.dueDate ? (
                      format(newTask.dueDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={newTask.dueDate}
                    onSelect={(date) => setNewTask({ ...newTask, dueDate: date })}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label htmlFor="notes" className="text-sm font-medium">
                Notes (optional)
              </label>
              <Textarea
                id="notes"
                placeholder="Add additional details..."
                rows={3}
                value={newTask.notes}
                onChange={(e) => setNewTask({ ...newTask, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="w-full sm:w-auto">Create Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md max-w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>Update task details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label htmlFor="edit-title" className="text-sm font-medium">
                Title
              </label>
              <Input
                id="edit-title"
                placeholder="Task title"
                value={taskToEdit?.title || ''}
                onChange={(e) => setTaskToEdit({ ...taskToEdit!, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="edit-priority" className="text-sm font-medium">
                Priority
              </label>
              <Select
                value={taskToEdit?.priority || 'medium'}
                onValueChange={(value: 'low' | 'medium' | 'high' | 'autotask') => 
                  setTaskToEdit({ ...taskToEdit!, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="autotask">
                    <div className="flex items-center gap-2">
                      <Circle className="h-3 w-3 fill-blue-500 text-blue-500" />
                      <span>AutoTask (AI assisted)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Due Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {taskToEdit?.dueDate ? (
                      format(taskToEdit.dueDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={taskToEdit?.dueDate}
                    onSelect={(date) => setTaskToEdit({ ...taskToEdit!, dueDate: date })}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <label htmlFor="edit-notes" className="text-sm font-medium">
                Notes (optional)
              </label>
              <Textarea
                id="edit-notes"
                placeholder="Add additional details..."
                rows={3}
                value={taskToEdit?.notes || ''}
                onChange={(e) => setTaskToEdit({ ...taskToEdit!, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={handleEditSubmit} className="w-full sm:w-auto">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* AutoTask Report Dialog */}
      <AutoTaskReportDialog 
        open={reportDialogOpen} 
        onOpenChange={setReportDialogOpen}
        title={currentReport?.title || ''}
        content={currentReport?.content || ''}
        onApprove={handleApproveReport}
      />
    </div>
  );
};

export default TasksPage;
