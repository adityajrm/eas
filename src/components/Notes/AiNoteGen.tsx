
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, X } from 'lucide-react';
import { callGeminiAPI } from '@/services/aiService';
import { useToast } from '@/hooks/use-toast';

interface AiNoteGenProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (content: string, isReplacement?: boolean) => void;
  position: { x: number; y: number };
  selectedText?: string;
  context: string;
}

const AiNoteGen: React.FC<AiNoteGenProps> = ({
  isOpen,
  onClose,
  onComplete,
  position,
  selectedText,
  context
}) => {
  const [prompt, setPrompt] = useState('');
  const [completionType, setCompletionType] = useState<'brief' | 'detailed'>('brief');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    
    try {
      let fullPrompt = '';
      
      if (selectedText) {
        // Working with selected text
        fullPrompt = `Please ${prompt} the following text: "${selectedText}". Return only the modified text without any additional formatting or explanation.`;
      } else {
        // Generating new content
        const typeInstruction = completionType === 'brief' 
          ? 'Write a brief, concise response (1-2 sentences)' 
          : 'Write a detailed, comprehensive response (multiple paragraphs)';
        
        fullPrompt = `${typeInstruction} about: ${prompt}. Context: ${context.slice(-200)}`;
      }

      const response = await callGeminiAPI(fullPrompt, []);
      
      if (response.text) {
        onComplete(response.text, !!selectedText);
        toast({
          title: "AI Content Generated",
          description: "The AI has generated your requested content."
        });
      } else {
        throw new Error('No content generated');
      }
    } catch (error) {
      console.error('AI generation error:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate AI content. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed z-50"
      style={{
        left: position.x,
        top: position.y
      }}
    >
      <Card className="w-80 shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              {selectedText ? 'Modify Text' : 'AI Completion'}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {selectedText && (
            <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
              Selected: "{selectedText.slice(0, 50)}..."
            </div>
          )}
          
          {!selectedText && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={completionType === 'brief' ? 'default' : 'outline'}
                onClick={() => setCompletionType('brief')}
              >
                Brief
              </Button>
              <Button
                size="sm"
                variant={completionType === 'detailed' ? 'default' : 'outline'}
                onClick={() => setCompletionType('detailed')}
              >
                Detailed
              </Button>
            </div>
          )}
          
          <Input
            placeholder={selectedText ? "How to modify this text?" : "What should I write about?"}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          
          <Button 
            onClick={handleGenerate} 
            disabled={!prompt.trim() || isGenerating}
            className="w-full"
          >
            {isGenerating ? 'Generating...' : 'Generate'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AiNoteGen;
