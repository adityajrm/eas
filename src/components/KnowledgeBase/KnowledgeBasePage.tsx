
import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, X } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const KnowledgeBasePage = () => {
  const { knowledgeItems, addKnowledgeItem, deleteKnowledgeItem } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState({ 
    title: '', 
    content: '', 
    category: 'General',
    tags: [] 
  });
  const [currentTag, setCurrentTag] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  // Available categories
  const categories = ['General', 'Work', 'Personal', 'Research', 'Projects'];
  
  // Extract all unique categories from existing items
  const existingCategories = [...new Set(knowledgeItems.map(item => item.category))];
  const allCategories = [...new Set([...categories, ...existingCategories])];

  const filteredItems = knowledgeItems.filter(
    (item) =>
      (item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
       item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
       item.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))) &&
      (!filterCategory || item.category === filterCategory)
  );

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && currentTag.trim()) {
      if (!newItem.tags.includes(currentTag.trim())) {
        setNewItem({
          ...newItem,
          tags: [...newItem.tags, currentTag.trim()],
        });
      }
      setCurrentTag('');
      e.preventDefault();
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setNewItem({
      ...newItem,
      tags: newItem.tags.filter((tag) => tag !== tagToRemove),
    });
  };

  const handleSubmit = () => {
    if (newItem.title.trim() && newItem.content.trim()) {
      addKnowledgeItem(newItem);
      setNewItem({ title: '', content: '', category: 'General', tags: [] });
      setIsDialogOpen(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Knowledge Base</h1>
          <p className="text-muted-foreground">Store and retrieve important information</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="flex items-center gap-2">
          <Plus size={16} />
          <span>Add New Entry</span>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            className="pl-10"
            placeholder="Search knowledge base..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select
          value={filterCategory}
          onValueChange={setFilterCategory}
        >
          <SelectTrigger className="md:w-[180px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {allCategories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredItems.length === 0 ? (
        <div className="text-center py-16">
          <h3 className="text-lg font-medium">No knowledge items found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || filterCategory ? 'Try different search criteria' : 'Add your first entry to get started'}
          </p>
          {!searchQuery && !filterCategory && (
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus size={16} className="mr-2" />
              Add Knowledge Entry
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <Card key={item.id} className="knowledge-card">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-assistant-muted text-assistant-primary mt-1 inline-block">
                      {item.category}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => deleteKnowledgeItem(item.id)}
                  >
                    <X size={16} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {item.content.length > 150 ? `${item.content.substring(0, 150)}...` : item.content}
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-0.5 rounded-full bg-assistant-accent text-assistant-primary"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground pt-2">
                  {new Date(item.updatedAt).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Knowledge Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Title
              </label>
              <Input
                id="title"
                placeholder="Entry title"
                value={newItem.title}
                onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="category" className="text-sm font-medium">
                Category
              </label>
              <Select
                value={newItem.category}
                onValueChange={(value) => setNewItem({ ...newItem, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label htmlFor="content" className="text-sm font-medium">
                Content
              </label>
              <Textarea
                id="content"
                placeholder="Write your content here..."
                rows={6}
                value={newItem.content}
                onChange={(e) => setNewItem({ ...newItem, content: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="tags" className="text-sm font-medium">
                Tags (press Enter to add)
              </label>
              <Input
                id="tags"
                placeholder="Add tags..."
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyDown={handleAddTag}
              />
              {newItem.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {newItem.tags.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center text-xs px-2 py-1 rounded-full bg-assistant-accent text-assistant-primary"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 p-0.5 rounded-full hover:bg-assistant-primary hover:text-white"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Save Entry</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KnowledgeBasePage;
