
import { Block, BlockType } from '@/types/blocks';

export const createBlock = (type: BlockType = 'text', content: string = ''): Block => {
  return {
    id: crypto.randomUUID(),
    type,
    content,
    ...(type === 'todo' && { checked: false }),
    ...(type === 'toggle' && { collapsed: false, children: [] }),
    ...(type === 'callout' && { calloutType: 'info' }),
    ...(type === 'code' && { language: 'javascript' }),
  };
};

export const exportToMarkdown = (blocks: Block[]): string => {
  return blocks.map(block => {
    switch (block.type) {
      case 'heading1':
        return `# ${block.content}`;
      case 'heading2':
        return `## ${block.content}`;
      case 'heading3':
        return `### ${block.content}`;
      case 'bulletList':
        return `- ${block.content}`;
      case 'numberedList':
        return `1. ${block.content}`;
      case 'todo':
        return `- [${block.checked ? 'x' : ' '}] ${block.content}`;
      case 'quote':
        return `> ${block.content}`;
      case 'code':
        return `\`\`\`${block.language || ''}\n${block.content}\n\`\`\``;
      case 'divider':
        return '---';
      case 'callout':
        return `> **${block.calloutType?.toUpperCase()}:** ${block.content}`;
      default:
        return block.content;
    }
  }).join('\n\n');
};

export const importFromMarkdown = (markdown: string): Block[] => {
  const lines = markdown.split('\n');
  const blocks: Block[] = [];
  let currentCodeBlock = '';
  let inCodeBlock = false;

  for (const line of lines) {
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        blocks.push(createBlock('code', currentCodeBlock.trim()));
        currentCodeBlock = '';
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      currentCodeBlock += line + '\n';
      continue;
    }

    if (line.trim() === '') continue;

    if (line.startsWith('# ')) {
      blocks.push(createBlock('heading1', line.substring(2)));
    } else if (line.startsWith('## ')) {
      blocks.push(createBlock('heading2', line.substring(3)));
    } else if (line.startsWith('### ')) {
      blocks.push(createBlock('heading3', line.substring(4)));
    } else if (line.startsWith('- [x]')) {
      const block = createBlock('todo', line.substring(5).trim());
      block.checked = true;
      blocks.push(block);
    } else if (line.startsWith('- [ ]')) {
      blocks.push(createBlock('todo', line.substring(5).trim()));
    } else if (line.startsWith('- ')) {
      blocks.push(createBlock('bulletList', line.substring(2)));
    } else if (line.match(/^\d+\. /)) {
      blocks.push(createBlock('numberedList', line.replace(/^\d+\. /, '')));
    } else if (line.startsWith('>')) {
      blocks.push(createBlock('quote', line.substring(1).trim()));
    } else if (line === '---') {
      blocks.push(createBlock('divider'));
    } else {
      blocks.push(createBlock('text', line));
    }
  }

  return blocks.length > 0 ? blocks : [createBlock('text')];
};

export const searchBlocks = (blocks: Block[], query: string): Block[] => {
  const lowercaseQuery = query.toLowerCase();
  return blocks.filter(block =>
    block.content.toLowerCase().includes(lowercaseQuery)
  );
};
