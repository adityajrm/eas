import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Book, Calendar, Clock, FileText, ListTodo, Plus } from 'lucide-react';
import CompactProgressTracker from './Analytics/CompactProgressTracker';
import { motion } from 'framer-motion';
const Dashboard = () => {
  const {
    notes,
    tasks,
    knowledgeItems,
    events,
    setCurrentView,
    analytics
  } = useAppContext();
  const incompleteTasks = tasks.filter(task => !task.completed);
  // Fix: Get actual upcoming events based on start date
  const upcomingEvents = events.filter(event => new Date(event.start) > new Date()).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()).slice(0, 3);
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };
  const container = {
    hidden: {
      opacity: 0
    },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  const item = {
    hidden: {
      opacity: 0,
      y: 20
    },
    show: {
      opacity: 1,
      y: 0
    }
  };
  return <motion.div className="space-y-6" initial="hidden" animate="show" variants={container}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{getGreeting()}</h1>
          <p className="text-muted-foreground">Here's an overview of your workspace</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setCurrentView('tasks')} className="flex items-center gap-1">
            <Plus size={16} />
            <span>New Task</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentView('notes')} className="flex items-center gap-1">
            <Plus size={16} />
            <span>New Note</span>
          </Button>
        </div>
      </div>

      {/* Compact Analytics Section */}
      <CompactProgressTracker completedTasks={analytics.completedTasks} totalTasks={analytics.totalTasks} deadlinesMet={analytics.deadlinesMet} totalDeadlines={analytics.totalDeadlines} />

      <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" variants={item}>
        <motion.div variants={item} whileHover={{
        scale: 1.02
      }} transition={{
        type: "spring",
        stiffness: 300
      }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText size={16} className="text-assistant-primary" />
                Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{notes.length}</div>
              <p className="text-xs text-muted-foreground">Total Notes</p>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div variants={item} whileHover={{
        scale: 1.02
      }} transition={{
        type: "spring",
        stiffness: 300
      }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ListTodo size={16} className="text-assistant-primary" />
                Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{incompleteTasks.length}</div>
              <p className="text-xs text-muted-foreground">
                {incompleteTasks.length === 1 ? 'Task' : 'Tasks'} to complete
              </p>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div variants={item} whileHover={{
        scale: 1.02
      }} transition={{
        type: "spring",
        stiffness: 300
      }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Book size={16} className="text-assistant-primary" />
                Knowledge Base
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{knowledgeItems.length}</div>
              <p className="text-xs text-muted-foreground">Saved items</p>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div variants={item} whileHover={{
        scale: 1.02
      }} transition={{
        type: "spring",
        stiffness: 300
      }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar size={16} className="text-assistant-primary" />
                Calendar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcomingEvents.length}</div>
              <p className="text-xs text-muted-foreground">Upcoming events</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-6" variants={item}>
        <Card className="col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Upcoming Tasks</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setCurrentView('tasks')}>
                View all
              </Button>
            </div>
            <CardDescription>Your most urgent tasks</CardDescription>
          </CardHeader>
          <CardContent>
            {incompleteTasks.length === 0 ? <div className="text-center py-8 text-muted-foreground">
                <p>No tasks to complete</p>
                <Button variant="link" className="mt-2" onClick={() => setCurrentView('tasks')}>
                  Create a task
                </Button>
              </div> : <div className="space-y-1">
                {incompleteTasks.slice(0, 5).map(task => <motion.div key={task.id} initial={{
              opacity: 0,
              x: -20
            }} animate={{
              opacity: 1,
              x: 0
            }} transition={{
              duration: 0.3
            }} whileHover={{
              backgroundColor: "var(--muted)"
            }} className="task-item flex flex-row gap-3 items-center\n">
                    <div className={`w-2 h-2 rounded-full ${task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`} />
                    <div className="flex-1 text-sm">{task.title}</div>
                    {task.dueDate && <div className="flex items-center text-xs text-muted-foreground gap-1">
                        <Clock size={12} />
                        <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                      </div>}
                  </motion.div>)}
              </div>}
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Recent Notes</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setCurrentView('notes')}>
                View all
              </Button>
            </div>
            <CardDescription>Your latest notes</CardDescription>
          </CardHeader>
          <CardContent>
            {notes.length === 0 ? <div className="text-center py-8 text-muted-foreground">
                <p>No notes yet</p>
                <Button variant="link" className="mt-2" onClick={() => setCurrentView('notes')}>
                  Create a note
                </Button>
              </div> : <div className="space-y-3">
                {notes.slice(0, 3).map(note => <motion.div key={note.id} className="p-3 rounded-md border bg-card/50 hover:bg-card transition-colors" initial={{
              opacity: 0,
              y: 20
            }} animate={{
              opacity: 1,
              y: 0
            }} transition={{
              duration: 0.3
            }} whileHover={{
              scale: 1.01
            }}>
                    <h3 className="font-medium">{note.title}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {note.content.substring(0, 60)}
                      {note.content.length > 60 ? '...' : ''}
                    </p>
                    <div className="flex gap-2 mt-2">
                      {note.tags.slice(0, 2).map(tag => <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-assistant-accent text-assistant-primary">
                          {tag}
                        </span>)}
                    </div>
                  </motion.div>)}
              </div>}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Upcoming Events</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setCurrentView('calendar')}>
                View calendar
              </Button>
            </div>
            <CardDescription>Your scheduled events</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length === 0 ? <div className="text-center py-8 text-muted-foreground">
                <p>No upcoming events</p>
                <Button variant="link" className="mt-2" onClick={() => setCurrentView('calendar')}>
                  Schedule an event
                </Button>
              </div> : <div className="space-y-3">
                {upcomingEvents.map(event => <motion.div key={event.id} className="flex items-center gap-4 p-3 rounded-md border" initial={{
              opacity: 0,
              y: 10
            }} animate={{
              opacity: 1,
              y: 0
            }} transition={{
              duration: 0.3
            }} whileHover={{
              backgroundColor: "var(--muted)"
            }}>
                    <div className="w-12 h-12 rounded-md bg-assistant-muted flex flex-col items-center justify-center text-assistant-primary">
                      <span className="text-xs font-medium">
                        {new Date(event.start).toLocaleString('default', {
                    month: 'short'
                  })}
                      </span>
                      <span className="text-lg font-bold">
                        {new Date(event.start).getDate()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{event.title}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock size={14} />
                        <span>
                          {new Date(event.start).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                          {' - '}
                          {new Date(event.end).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                        </span>
                      </div>
                    </div>
                    {event.category && <span className="text-xs px-2 py-1 rounded-full bg-assistant-muted text-assistant-primary">
                        {event.category}
                      </span>}
                  </motion.div>)}
              </div>}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>;
};
export default Dashboard;