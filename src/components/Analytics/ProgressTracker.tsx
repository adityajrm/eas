
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Clock, Target, TrendingUp } from 'lucide-react';

interface ProgressTrackerProps {
  completedTasks: number;
  totalTasks: number;
  deadlinesMet: number;
  totalDeadlines: number;
}

const ProgressTracker = ({
  completedTasks,
  totalTasks,
  deadlinesMet,
  totalDeadlines,
}: ProgressTrackerProps) => {
  const taskCompletionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const deadlineSuccessRate = totalDeadlines ? Math.round((deadlinesMet / totalDeadlines) * 100) : 0;
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="animate-fade-in">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="text-primary" size={16} />
              Task Completion
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Progress</span>
              <span className="font-medium">{taskCompletionRate}%</span>
            </div>
            <Progress value={taskCompletionRate} className="h-2" />
            <div className="text-xs text-muted-foreground">
              {completedTasks} of {totalTasks} tasks completed
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="text-primary" size={16} />
              Deadline Success
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Success Rate</span>
              <span className="font-medium">{deadlineSuccessRate}%</span>
            </div>
            <Progress value={deadlineSuccessRate} className="h-2" />
            <div className="text-xs text-muted-foreground">
              {deadlinesMet} of {totalDeadlines} deadlines met
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="text-primary" size={18} />
            Productivity Stats
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="flex flex-col items-center justify-center p-4 rounded-md bg-muted/50">
            <div className="text-2xl font-bold">{taskCompletionRate}%</div>
            <div className="text-sm text-muted-foreground">Task Completion</div>
          </div>
          <div className="flex flex-col items-center justify-center p-4 rounded-md bg-muted/50">
            <div className="text-2xl font-bold">{deadlineSuccessRate}%</div>
            <div className="text-sm text-muted-foreground">Deadline Success</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProgressTracker;
