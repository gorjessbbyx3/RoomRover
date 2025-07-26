
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DateRangePicker } from './date-range-picker';
import { useToast } from '@/hooks/use-toast';
import { differenceInDays } from 'date-fns';

interface BookingDialogProps {
  roomId: string;
  roomNumber: number;
  propertyName: string;
  dailyRate: number;
  children: React.ReactNode;
}

export function BookingDialog({ roomId, roomNumber, propertyName, dailyRate, children }: BookingDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [guestName, setGuestName] = useState('');
  const [guestContact, setGuestContact] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const totalDays = startDate && endDate ? differenceInDays(endDate, startDate) : 0;
  const totalAmount = totalDays * dailyRate;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !guestName || !guestContact) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // First create or find the guest
      const guestResponse = await fetch('/api/guests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: guestName,
          contact: guestContact,
          contactType: guestEmail ? 'email' : 'phone',
          notes: guestEmail || null
        })
      });

      if (!guestResponse.ok) throw new Error('Failed to create guest');
      const guest = await guestResponse.json();

      // Create the booking
      const bookingResponse = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          guestId: guest.id,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          totalAmount: totalAmount.toString(),
          status: 'confirmed',
          notes
        })
      });

      if (!bookingResponse.ok) throw new Error('Failed to create booking');

      toast({
        title: "Booking Created",
        description: `Room ${roomNumber} booked for ${guestName}`,
      });

      setIsOpen(false);
      // Reset form
      setStartDate(null);
      setEndDate(null);
      setGuestName('');
      setGuestContact('');
      setGuestEmail('');
      setNotes('');
    } catch (error) {
      toast({
        title: "Booking Failed",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Book Room {roomNumber} - {propertyName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Guest Name *</label>
              <Input
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Full name"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Phone Number *</label>
              <Input
                value={guestContact}
                onChange={(e) => setGuestContact(e.target.value)}
                placeholder="Phone number"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Email (Optional)</label>
            <Input
              type="email"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              placeholder="Email address"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Notes</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special requests or notes"
            />
          </div>

          {totalDays > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between">
                <span>{totalDays} nights × ${dailyRate}/night</span>
                <span className="font-bold">${totalAmount}</span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating Booking...' : 'Book Room'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
