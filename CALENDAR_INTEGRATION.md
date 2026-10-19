# Calendar Integration — superseded

The external Google/Apple personal-calendar integration this file used to
document was removed before shipping. Product direction changed:
Wavelength has its own internal calendar (`artist_calendar_events`), and
artists are never asked to connect a personal calendar or configure OAuth.

See **CALENDAR.md** for the current architecture (month/week/day calendar
UI in the Artist Portal and Admin, built entirely on the existing
`artist_calendar_events` table and Server Actions).
