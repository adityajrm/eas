import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendarIcon, Plus, X } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GanttChart from './GanttChart';
import { CalendarEvent } from '@/types';
const CalendarPage = () => {
  const {
    events,
    addEvent,
    deleteEvent,
    updateEvent
  } = useAppContext();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [newEvent, setNewEvent] = useState({
    title: '',
    start: new Date(),
    end: new Date(new Date().setHours(new Date().getHours() + 1)),
    allDay: false,
    notes: '',
    category: 'General'
  });

  // Fix the type for editEvent to make all properties optional except id
  const [editEvent, setEditEvent] = useState<CalendarEvent>({
    id: '',
    title: '',
    start: new Date(),
    end: new Date(),
    allDay: false,
    notes: '',
    category: 'General'
  });
  const [view, setView] = useState('calendar');
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setNewEvent(prev => ({
        ...prev,
        start: date,
        end: new Date(date.getTime() + 60 * 60 * 1000) // 1 hour later
      }));
    }
  };
  const handleAddEvent = () => {
    if (newEvent.title.trim()) {
      addEvent({
        ...newEvent,
        start: new Date(newEvent.start),
        end: new Date(newEvent.end)
      });
      setNewEvent({
        title: '',
        start: new Date(),
        end: new Date(new Date().setHours(new Date().getHours() + 1)),
        allDay: false,
        notes: '',
        category: 'General'
      });
      setIsDialogOpen(false);
    }
  };
  const handleUpdateEvent = () => {
    if (editEvent.title.trim() && editEvent.id) {
      updateEvent(editEvent);
      setIsEditDialogOpen(false);
    }
  };
  const handleEventClick = (event: CalendarEvent) => {
    setEditEvent(event);
    setIsEditDialogOpen(true);
  };
  const handleDeleteEvent = () => {
    if (editEvent.id) {
      deleteEvent(editEvent.id);
      setIsEditDialogOpen(false);
    }
  };
  const formatDate = (date: Date) => {
    return format(new Date(date), 'PPP');
  };

  // Helper function to validate and parse dates
  const parseDate = (date: any): Date | null => {
    const parsedDate = new Date(date);
    return isNaN(parsedDate.getTime()) ? null : parsedDate;
  };

  // Group events by date for list view
  const eventsByDate = events.reduce<Record<string, CalendarEvent[]>>((acc, event) => {
    const startDate = parseDate(event.start);
    if (!startDate) return acc; // Skip invalid events
  
    const date = format(startDate, 'yyyy-MM-dd');
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push({
      ...event,
      start: startDate,
      end: parseDate(event.end) || startDate, // Fallback to start date if end is invalid
    });
    return acc;
  }, {});
  return <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground">Manage your schedule and events</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Event
        </Button>
      </div>

      <Tabs value={view} onValueChange={setView} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="list">List</TabsTrigger>
          <TabsTrigger value="gantt">Gantt Chart</TabsTrigger>
        </TabsList>
      </Tabs>

      {view === 'calendar' && <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0">
              <div className="md:w-7/12">
                <CalendarComponent mode="single" selected={selectedDate} onSelect={handleDateSelect} className="rounded-md border" />
              </div>
              <div className="md:w-5/12">
                <h3 className="mb-4 font-medium">
                  Events for {selectedDate ? formatDate(selectedDate) : "Today"}
                </h3>
                <div className="space-y-4">
                  {selectedDate && events.filter(event => {
                    const eventStart = parseDate(event.start);
                    return (
                      eventStart &&
                      format(eventStart, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
                    );
                  }).map(event => <Card key={event.id} className="cursor-pointer" onClick={() => handleEventClick(event)}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold">{event.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                {format(parseDate(event.start)!, 'h:mm a')} -{' '}
                                {format(parseDate(event.end)!, 'h:mm a')}
                              </p>
                              {event.category && <div className="mt-1 flex items-center">
                                  <span className="text-xs">{event.category}</span>
                                </div>}
                            </div>
                          </div>
                        </CardContent>
                      </Card>)}
                  {selectedDate && events.filter(event => format(new Date(event.start), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')).length === 0 && <p className="text-center text-sm text-muted-foreground">No events for this day</p>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>}

      {view === 'list' && <Card>
          <CardContent className="pt-6">
            <div className="space-y-8">
              {Object.keys(eventsByDate).length > 0 ? Object.keys(eventsByDate).sort((a, b) => new Date(a).getTime() - new Date(b).getTime()).map(date => <div key={date} className="space-y-4">
                      <h3 className="font-medium">{formatDate(new Date(date))}</h3>
                      {eventsByDate[date].map(event => <Card key={event.id} className="cursor-pointer" onClick={() => handleEventClick(event)}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-semibold">{event.title}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(event.start), 'h:mm a')} - {format(new Date(event.end), 'h:mm a')}
                                </p>
                                {event.category && <div className="mt-1 flex items-center">
                                    <span className="text-xs">{event.category}</span>
                                  </div>}
                              </div>
                            </div>
                          </CardContent>
                        </Card>)}
                    </div>) : <p className="text-center text-muted-foreground">No events scheduled</p>}
            </div>
          </CardContent>
        </Card>}

      {view === 'gantt' && <Card>
          <CardHeader>
            <CardTitle>Weekly Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <GanttChart events={events} />
          </CardContent>
        </Card>}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Event</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={newEvent.title} onChange={e => setNewEvent({
              ...newEvent,
              title: e.target.value
            })} placeholder="Event title" />
            </div>
            <div className="grid gap-2">
              <Label>Start</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newEvent.start ? format(newEvent.start, "PPP HH:mm") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent mode="single" selected={newEvent.start} onSelect={date => date && setNewEvent({
                  ...newEvent,
                  start: date
                })} initialFocus />
                  <div className="border-t p-3">
                    <Input type="time" value={format(newEvent.start, "HH:mm")} onChange={e => {
                    const [hours, minutes] = e.target.value.split(':').map(Number);
                    const newDate = new Date(newEvent.start);
                    newDate.setHours(hours);
                    newDate.setMinutes(minutes);
                    setNewEvent({
                      ...newEvent,
                      start: newDate
                    });
                  }} />
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-2">
              <Label>End</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newEvent.end ? format(newEvent.end, "PPP HH:mm") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent mode="single" selected={newEvent.end} onSelect={date => date && setNewEvent({
                  ...newEvent,
                  end: date
                })} initialFocus />
                  <div className="border-t p-3">
                    <Input type="time" value={format(newEvent.end, "HH:mm")} onChange={e => {
                    const [hours, minutes] = e.target.value.split(':').map(Number);
                    const newDate = new Date(newEvent.end);
                    newDate.setHours(hours);
                    newDate.setMinutes(minutes);
                    setNewEvent({
                      ...newEvent,
                      end: newDate
                    });
                  }} />
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select value={newEvent.category} onValueChange={value => setNewEvent({
              ...newEvent,
              category: value
            })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="General">General</SelectItem>
                  <SelectItem value="Personal">Personal</SelectItem>
                  <SelectItem value="Work">Work</SelectItem>
                  <SelectItem value="Health">Health</SelectItem>
                  <SelectItem value="Education">Education</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" value={newEvent.notes} onChange={e => setNewEvent({
              ...newEvent,
              notes: e.target.value
            })} placeholder="Add any additional details..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddEvent}>Add Event</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input id="edit-title" value={editEvent.title} onChange={e => setEditEvent({
              ...editEvent,
              title: e.target.value
            })} placeholder="Event title" />
            </div>
            <div className="grid gap-2">
              <Label>Start</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editEvent.start ? format(new Date(editEvent.start), "PPP HH:mm") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent mode="single" selected={new Date(editEvent.start)} onSelect={date => date && setEditEvent({
                  ...editEvent,
                  start: date
                })} initialFocus />
                  <div className="border-t p-3">
                    <Input type="time" value={format(new Date(editEvent.start), "HH:mm")} onChange={e => {
                    const [hours, minutes] = e.target.value.split(':').map(Number);
                    const newDate = new Date(editEvent.start);
                    newDate.setHours(hours);
                    newDate.setMinutes(minutes);
                    setEditEvent({
                      ...editEvent,
                      start: newDate
                    });
                  }} />
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-2">
              <Label>End</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editEvent.end ? format(new Date(editEvent.end), "PPP HH:mm") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent mode="single" selected={new Date(editEvent.end)} onSelect={date => date && setEditEvent({
                  ...editEvent,
                  end: date
                })} initialFocus />
                  <div className="border-t p-3">
                    <Input type="time" value={format(new Date(editEvent.end), "HH:mm")} onChange={e => {
                    const [hours, minutes] = e.target.value.split(':').map(Number);
                    const newDate = new Date(editEvent.end);
                    newDate.setHours(hours);
                    newDate.setMinutes(minutes);
                    setEditEvent({
                      ...editEvent,
                      end: newDate
                    });
                  }} />
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-category">Category</Label>
              <Select value={editEvent.category || 'General'} onValueChange={value => setEditEvent({
              ...editEvent,
              category: value
            })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="General">General</SelectItem>
                  <SelectItem value="Personal">Personal</SelectItem>
                  <SelectItem value="Work">Work</SelectItem>
                  <SelectItem value="Health">Health</SelectItem>
                  <SelectItem value="Education">Education</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea id="edit-notes" value={editEvent.notes || ''} onChange={e => setEditEvent({
              ...editEvent,
              notes: e.target.value
            })} placeholder="Add any additional details..." />
            </div>
          </div>
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button variant="destructive" onClick={handleDeleteEvent}>
              <X className="mr-2 h-4 w-4" /> Delete
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateEvent}>Save Changes</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>;
};
export default CalendarPage;