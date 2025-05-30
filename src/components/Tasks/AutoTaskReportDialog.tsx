import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, Check } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion } from 'framer-motion';

interface AutoTaskReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  content: string;
  onApprove: () => void;
}

const AutoTaskReportDialog = ({
  open,
  onOpenChange,
  title,
  content,
  onApprove
}: AutoTaskReportDialogProps) => {
  // Function to convert markdown headings and lists to basic HTML
  const formatContent = (text: string): string => {
    return text
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold my-4">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold my-3">$1</h2>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/^\* (.*$)/gim, '<ul><li class="ml-4 list-disc">$1</li></ul>')
      .replace(/\n\n/g, '<br /><br />');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <span>{title}</span>
          </DialogTitle>
          <DialogDescription>
            Review this AI-generated report and approve to complete the task
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] border rounded-md p-4 bg-secondary/20">
          <div 
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: formatContent(content) }}
          />
        </ScrollArea>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button onClick={onApprove} className="gap-2">
              <Check size={16} />
              Approve & Complete Task
            </Button>
          </motion.div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AutoTaskReportDialog;
