
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Clock, Target, TrendingUp } from 'lucide-react';

interface CompactProgressTrackerProps {
  completedTasks: number;
  totalTasks: number;
  deadlinesMet: number;
  totalDeadlines: number;
}

const CompactProgressTracker = ({
  completedTasks,
  totalTasks,
  deadlinesMet,
  totalDeadlines,
}: CompactProgressTrackerProps) => {
  const taskCompletionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const deadlineSuccessRate = totalDeadlines ? Math.round((deadlinesMet / totalDeadlines) * 100) : 0;
  
  const stats = [
    {
      title: "Task Completion",
      icon: <Target className="text-primary" size={16} />,
      value: `${taskCompletionRate}%`,
      progress: taskCompletionRate,
      detail: `${completedTasks} of ${totalTasks} tasks`
    },
    {
      title: "Deadline Success",
      icon: <Clock className="text-primary" size={16} />,
      value: `${deadlineSuccessRate}%`,
      progress: deadlineSuccessRate,
      detail: `${deadlinesMet} of ${totalDeadlines} deadlines`
    },
    {
      title: "Completed Tasks",
      icon: <CheckCircle className="text-success" size={16} />,
      value: completedTasks,
      detail: "Total tasks completed"
    },
    {
      title: "Productivity",
      icon: <TrendingUp className="text-primary" size={16} />,
      value: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      detail: "Overall productivity"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6 animate-fade-in">
      {stats.map((stat, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2 font-medium text-sm">
              {stat.icon}
              <span>{stat.title}</span>
            </div>
            <div className="text-2xl font-semibold mb-1">
              {typeof stat.value === 'number' ? stat.value : stat.value}
              {typeof stat.value === 'string' && stat.value.includes('%') ? '' : ''}
            </div>
            <div className="text-xs text-muted-foreground">{stat.detail}</div>
            {stat.progress !== undefined && (
              <Progress value={stat.progress} className="h-1 mt-2" />
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default CompactProgressTracker;
