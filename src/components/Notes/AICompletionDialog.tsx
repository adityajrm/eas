
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AICompletionRequest } from '@/types/notes';
import { Loader2, Sparkles } from 'lucide-react';

interface AICompletionDialogProps {
  open: boolean;
  onClose: () => void;
  onComplete: (content: string) => void;
  context?: string;
}

const AICompletionDialog: React.FC<AICompletionDialogProps> = ({
  open,
  onClose,
  onComplete,
  context
}) => {
  const [type, setType] = useState<'brief' | 'detailed'>('brief');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    
    try {
      // This would integrate with your AI service
      // For now, we'll simulate the API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockContent = type === 'brief' 
        ? `Brief content about: ${prompt}`
        : `Detailed content about: ${prompt}\n\nThis is a more comprehensive explanation that covers multiple aspects of the topic, providing in-depth analysis and examples.`;
      
      onComplete(mockContent);
      onClose();
      setPrompt('');
    } catch (error) {
      console.error('Error generating content:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleGenerate();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Content Generation
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Content Type</Label>
            <RadioGroup value={type} onValueChange={(value) => setType(value as 'brief' | 'detailed')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="brief" id="brief" />
                <Label htmlFor="brief">Brief</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="detailed" id="detailed" />
                <Label htmlFor="detailed">Detailed</Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="prompt" className="text-sm font-medium">
              What would you like me to write about?
            </Label>
            <Input
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g., Explain quantum computing"
              className="mt-1"
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleGenerate} 
              disabled={!prompt.trim() || isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AICompletionDialog;
