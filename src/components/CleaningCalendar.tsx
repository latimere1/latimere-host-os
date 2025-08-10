// src/components/CleaningCalendar.tsx
import React, {
  useMemo,
  useState,
  useRef,
  MouseEvent,
  useLayoutEffect,
} from 'react'
import {
  Calendar,
  dateFnsLocalizer,
  Views,
  EventProps,
} from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { enUS } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'

export type Cleaning = {
  id: string
  unitID: string
  unitName: string
  scheduledDate: string    // ISO date, e.g. "2025-08-26T00:00:00Z"
  status: 'scheduled' | 'completed'
  assignedTo: string
}

const locales = { 'en-US': enUS }

const localizer = dateFnsLocalizer({
  format,
  parse: (value, formatString) => parse(value, formatString, new Date()),
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales,
})

interface Props {
  cleanings: Cleaning[]
}

export default function CleaningCalendar({ cleanings }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Popover state
  const [popover, setPopover] = useState<{
    event: any
    top:   number
    left:  number
  } | null>(null)

  // 1️⃣ Close popover on any outside mousedown (fires earlier than click)
  useLayoutEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (
        popover &&
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setPopover(null)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [popover])

  // 2️⃣ Build your calendar events with tooltip text
  const events = useMemo(
    () =>
      cleanings.map(c => {
        const [dateOnly] = c.scheduledDate.split('T')
        const start = new Date(`${dateOnly}T00:00:00`)
        return {
          id:          c.id,
          title:       c.unitName,
          start,
          end:         start,
          allDay:      true,
          status:      c.status,
          assignedTo:  c.assignedTo,
          tooltipText: `Unit: ${c.unitName}\nCleaner: ${c.assignedTo}\nStatus: ${c.status}`,
        }
      }),
    [cleanings]
  )

  // 3️⃣ Custom event renderer that opens our popover
  function Event({ event }: EventProps<any>) {
    const onClick = (e: React.MouseEvent<HTMLSpanElement>) => {
      e.stopPropagation()
      const box = (e.currentTarget).closest('.rbc-event') as HTMLElement
      if (!box || !containerRef.current) return
      const boxRect = box.getBoundingClientRect()
      const containerRect = containerRef.current.getBoundingClientRect()

      setPopover({
        event,
        // position the popover just below the event box, inside our container
        top:  boxRect.bottom  - containerRect.top  + 4,
        left: boxRect.left    - containerRect.left - 2,
      })
    }

    return (
      <span
        title={event.tooltipText}
        onClick={onClick}
        style={{ cursor: 'pointer', userSelect: 'none' }}
      >
        {event.title}
      </span>
    )
  }

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', height: 600, marginTop: '2rem' }}
    >
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        defaultView={Views.MONTH}
        views={[Views.MONTH, Views.WEEK, Views.DAY]}
        components={{ event: Event }}
        style={{ background: 'white', padding: 10, borderRadius: 8 }}
        selectable
      />

      {popover && (
        <div
          // 4️⃣ Make container interactive and stop propagation so outside handler
          //     doesn’t immediately close it when clicking inside
          onMouseDown={e => e.stopPropagation()}
          style={{
            position:      'absolute',
            top:           popover.top,
            left:          popover.left,
            pointerEvents: 'auto',
            background:    'white',
            border:        '1px solid rgba(0,0,0,0.2)',
            boxShadow:     '0 2px 8px rgba(0,0,0,0.2)',
            padding:       '8px 12px',
            borderRadius:  4,
            zIndex:        1000,
            whiteSpace:    'pre-wrap',
          }}
        >
          <strong>Cleaning Details</strong>
          <div style={{ marginTop: 4, fontSize: 14, lineHeight: 1.4 }}>
            {popover.event.tooltipText}
          </div>
          <button
            // 5️⃣ Stop propagation on the button’s press (mousedown) so our
            //     outside listener doesn’t catch it first, then close
            onMouseDown={e => {
              e.stopPropagation()
              setPopover(null)
            }}
            style={{
              marginTop: 8,
              fontSize:  12,
              padding:   '2px 6px',
              cursor:    'pointer',
            }}
          >
            Close
          </button>
        </div>
      )}
    </div>
  )
}
