"use client";

import { replaceShowsAction } from "@/lib/admin/artistActions";
import { RepeatableListEditor } from "@/components/admin/artists/RepeatableListEditor";
import { Input, Label, Select } from "@/components/admin/ui/FormField";

export interface ShowItem {
  date: string;
  city: string;
  venue: string;
  country: string;
  eventType: string;
  status: "available" | "tickets" | "sold-out" | "private-event" | "booked";
  ticketUrl: string;
  detailsUrl: string;
  isPast: boolean;
}

const emptyItem: ShowItem = {
  date: "",
  city: "",
  venue: "",
  country: "",
  eventType: "",
  status: "available",
  ticketUrl: "",
  detailsUrl: "",
  isPast: false,
};

export function ShowsTab({ artistId, items }: { artistId: string; items: ShowItem[] }) {
  return (
    <RepeatableListEditor<ShowItem>
      items={items}
      emptyItem={emptyItem}
      itemLabel={(item) => `${item.date || "TBD"} — ${item.venue || "Untitled show"}`}
      onSave={async (all) =>
        replaceShowsAction(
          artistId,
          all.map((item) => ({
            date: item.date,
            city: item.city,
            venue: item.venue,
            country: item.country,
            eventType: item.eventType,
            status: item.status,
            ticketUrl: item.ticketUrl || null,
            detailsUrl: item.detailsUrl || null,
            isPast: item.isPast,
          }))
        )
      }
      renderItem={(item, update) => (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label>Date</Label>
            <Input type="date" value={item.date} onChange={(e) => update({ date: e.target.value })} />
          </div>
          <div>
            <Label>Status</Label>
            <Select value={item.status} onChange={(e) => update({ status: e.target.value as ShowItem["status"] })}>
              <option value="available">Available</option>
              <option value="tickets">Tickets</option>
              <option value="sold-out">Sold out</option>
              <option value="private-event">Private event</option>
              <option value="booked">Booked</option>
            </Select>
          </div>
          <div>
            <Label>Venue</Label>
            <Input value={item.venue} onChange={(e) => update({ venue: e.target.value })} />
          </div>
          <div>
            <Label>City</Label>
            <Input value={item.city} onChange={(e) => update({ city: e.target.value })} />
          </div>
          <div>
            <Label>Country</Label>
            <Input value={item.country} onChange={(e) => update({ country: e.target.value })} />
          </div>
          <div>
            <Label>Event type</Label>
            <Input value={item.eventType} onChange={(e) => update({ eventType: e.target.value })} />
          </div>
          <div>
            <Label>Ticket URL</Label>
            <Input value={item.ticketUrl} onChange={(e) => update({ ticketUrl: e.target.value })} />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input id={`past-${item.venue}-${item.date}`} type="checkbox" checked={item.isPast} onChange={(e) => update({ isPast: e.target.checked })} />
            <Label htmlFor={`past-${item.venue}-${item.date}`} className="mb-0">
              Past show
            </Label>
          </div>
        </div>
      )}
    />
  );
}
