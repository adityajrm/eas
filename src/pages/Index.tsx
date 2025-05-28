
import { useState } from "react";
import { Plus, Book, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const Index = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const createNewNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: "Untitled Note",
      content: "",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setNotes([newNote, ...notes]);
    setSelectedNote(newNote);
    setIsEditing(true);
  };

  const updateNote = (updatedNote: Note) => {
    const updatedNotes = notes.map(note =>
      note.id === updatedNote.id ? { ...updatedNote, updatedAt: new Date() } : note
    );
    setNotes(updatedNotes);
    setSelectedNote(updatedNote);
  };

  const deleteNote = (noteId: string) => {
    const filteredNotes = notes.filter(note => note.id !== noteId);
    setNotes(filteredNotes);
    if (selectedNote?.id === noteId) {
      setSelectedNote(filteredNotes[0] || null);
      setIsEditing(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-80 bg-white/80 backdrop-blur-sm border-r border-blue-100 shadow-sm">
          <div className="p-6 border-b border-blue-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Book className="h-5 w-5 text-blue-600" />
              </div>
              <h1 className="text-xl font-semibold text-gray-800">My Notes</h1>
            </div>
            <Button 
              onClick={createNewNote}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all duration-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Note
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {notes.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Book className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No notes yet</p>
                <p className="text-sm">Create your first note to get started</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notes.map((note) => (
                  <Card
                    key={note.id}
                    className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                      selectedNote?.id === note.id
                        ? 'border-blue-200 bg-blue-50/50 shadow-sm'
                        : 'border-gray-100 hover:border-gray-200'
                    }`}
                    onClick={() => {
                      setSelectedNote(note);
                      setIsEditing(false);
                    }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-800 truncate flex-1">
                        {note.title}
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNote(note.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 hover:bg-red-100 hover:text-red-600 transition-all duration-200"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                      {note.content || "No content"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatDate(note.updatedAt)}
                    </p>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {selectedNote ? (
            <>
              <div className="p-6 border-b border-blue-100 bg-white/50 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    {isEditing ? (
                      <Input
                        value={selectedNote.title}
                        onChange={(e) =>
                          updateNote({ ...selectedNote, title: e.target.value })
                        }
                        className="text-xl font-semibold border-0 bg-transparent p-0 h-auto focus:ring-0 focus:border-0"
                        placeholder="Note title..."
                      />
                    ) : (
                      <h2 className="text-xl font-semibold text-gray-800">
                        {selectedNote.title}
                      </h2>
                    )}
                    <p className="text-sm text-gray-500 mt-1">
                      Last updated {formatDate(selectedNote.updatedAt)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(!isEditing)}
                      className="border-blue-200 hover:bg-blue-50"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      {isEditing ? 'Done' : 'Edit'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteNote(selectedNote.id)}
                      className="border-red-200 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex-1 p-6">
                {isEditing ? (
                  <Textarea
                    value={selectedNote.content}
                    onChange={(e) =>
                      updateNote({ ...selectedNote, content: e.target.value })
                    }
                    placeholder="Start writing your note..."
                    className="w-full h-full resize-none border-0 bg-transparent text-gray-700 focus:ring-0 focus:border-0 text-base leading-relaxed"
                  />
                ) : (
                  <div className="prose max-w-none">
                    {selectedNote.content ? (
                      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {selectedNote.content}
                      </p>
                    ) : (
                      <p className="text-gray-400 italic">
                        This note is empty. Click "Edit" to add content.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md">
                <div className="p-4 bg-blue-100 rounded-full w-fit mx-auto mb-4">
                  <Book className="h-8 w-8 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  Welcome to Your Notes
                </h2>
                <p className="text-gray-600 mb-6">
                  Select a note from the sidebar to start reading, or create a new note to begin writing.
                </p>
                <Button 
                  onClick={createNewNote}
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Note
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
