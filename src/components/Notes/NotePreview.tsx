import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Note } from '@/types';
import { format } from 'date-fns';
import { Copy } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
interface NotePreviewProps {
  note: Note | null;
  open: boolean;
  onClose: () => void;
}
const NotePreview: React.FC<NotePreviewProps> = ({
  note,
  open,
  onClose
}) => {
  if (!note) {
    return null;
  }

  // Function to handle code block copying
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Function to convert markdown to HTML with table support
  const formatContent = (text: string): string => {
    // Process code blocks first (before other transformations)
    let formattedText = text.replace(/```(.+?)\n([\s\S]*?)```/gm, (match, language, code) => {
      return `<div class="code-block"><div class="code-header"><span class="language">${language}</span><button class="copy-button" data-code="${encodeURIComponent(code.trim())}"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="copy-icon"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg></button></div><pre><code>${code.trim()}</code></pre></div>`;
    });

    // Process tables
    formattedText = formattedText.replace(/(\|.+\|\n)+/g, tableMatch => {
      // Check if it's actually a table with at least two pipe characters per line
      const lines = tableMatch.split('\n').filter(line => line.trim().length > 0);
      const isProbablyTable = lines.every(line => (line.match(/\|/g) || []).length >= 2);
      if (!isProbablyTable) {
        return tableMatch;
      }

      // Extract table data
      const rows = lines.map(line => {
        // Extract cells between pipes and trim whitespace
        return line.split('|').filter(cell => cell.trim() !== '') // Remove empty cells at beginning/end
        .map(cell => cell.trim());
      });

      // Check if we have at least a header row and one data row
      if (rows.length < 2) {
        return tableMatch;
      }

      // Create table HTML
      return '<div class="table-container"><table-component data-rows="' + encodeURIComponent(JSON.stringify(rows)) + '"></table-component></div>';
    });

    // Process basic markdown elements
    return formattedText
    // Bold formatting - make sure to handle it properly (**)
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    // Italic formatting (*)
    .replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/gim, '<em>$1</em>')
    // Headers
    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold my-4">$1</h1>').replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold my-3">$1</h2>').replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold my-2">$1</h3>')
    // Lists
    .replace(/^- (.*$)/gim, '<li class="ml-4">$1</li>').replace(/^\d+\. (.*$)/gim, '<li class="ml-6">$1</li>')
    // Links - make them clickable
    .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" target="_blank" class="text-primary underline">$1</a>').replace(/\n\n/g, '<br /><br />');
  };

  // Function to handle click events for copy buttons
  const handleNoteContentClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.copy-button')) {
      const button = target.closest('.copy-button') as HTMLButtonElement;
      const code = decodeURIComponent(button.dataset.code || '');
      copyToClipboard(code);

      // Show temporary "Copied!" text
      button.innerHTML = 'Copied!';
      setTimeout(() => {
        button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="copy-icon"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
      }, 1500);
    }
  };

  // Function to render table once component is mounted
  const renderTables = () => {
    // Find all table component placeholders
    document.querySelectorAll('table-component').forEach(tableEl => {
      const rowsAttr = tableEl.getAttribute('data-rows');
      if (!rowsAttr) return;
      try {
        const rows = JSON.parse(decodeURIComponent(rowsAttr));
        const tableRoot = document.createElement('div');

        // Create React table structure (manually in DOM for simplicity)
        const tableHTML = `
          <div class="w-full overflow-auto">
            <table class="w-full caption-bottom text-sm">
              <thead class="[&_tr]:border-b">
                <tr class="border-b transition-colors hover:bg-muted/50">
                  ${rows[0].map((cell: string) => `<th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">${cell}</th>`).join('')}
                </tr>
              </thead>
              <tbody class="[&_tr:last-child]:border-0">
                ${rows.slice(1).map((row: string[]) => `
                  <tr class="border-b transition-colors hover:bg-muted/50">
                    ${row.map((cell: string) => `<td class="p-4 align-middle">${cell}</td>`).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
        tableRoot.innerHTML = tableHTML;
        tableEl.replaceWith(tableRoot);
      } catch (e) {
        console.error('Error parsing table data:', e);
      }
    });
  };

  // Add effect to run after the content is rendered
  React.useEffect(() => {
    if (open) {
      // Small delay to ensure the DOM is ready
      setTimeout(renderTables, 100);
    }
  }, [open, note.content]);
  return <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl overflow-y-auto max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{note.title}</DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2 mt-2">
                {note.tags && note.tags.length > 0 ? note.tags.map(tag => <span key={tag} className="px-2 py-1 text-xs rounded-full bg-primary/20 text-primary">
                      {tag}
                    </span>) : <span className="text-sm text-muted-foreground">No tags</span>}
              </div>
              <div className="text-sm text-muted-foreground">
                Created: {note.createdAt ? format(new Date(note.createdAt), 'PPp') : 'Unknown'}
                {note.updatedAt && ` · Updated: ${format(new Date(note.updatedAt), 'PPp')}`}
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4 prose prose-sm max-w-none knowledge-card" onClick={handleNoteContentClick} dangerouslySetInnerHTML={{
        __html: formatContent(note.content)
      }} />
        
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>;
};
export default NotePreview;