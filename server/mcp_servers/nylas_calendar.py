import os 
from dotenv import load_dotenv
from mcp.server.fastmcp import FastMCP
import os
from nylas import Client


load_dotenv()

nylas = Client(
    os.environ.get('NYLAS_API_KEY')
)

grant_id = os.environ.get("NYLAS_GRANT_ID")
calendar_id = os.environ.get("NYLAS_CALENDAR_ID")


mcp = FastMCP("calender")


@mcp.tool()
def create_event(title: str, start_time: str, end_time: str):
    """
    Creates and schedules a new calendar event.
    
    IMPORTANT FOR AI: This function creates calendar events using exact datetime information.
    
    Parameters:
    - title (str): A descriptive title for the event (e.g., "Team Meeting", "Doctor Appointment", "Project Review")
    - start_time (str): The exact start datetime in ISO 8601 format with IST timezone (e.g., "2025-06-21T14:30:00+05:30")
    - end_time (str): The exact end datetime in ISO 8601 format with IST timezone (e.g., "2025-06-21T15:30:00+05:30")
    
    AI USAGE INSTRUCTIONS:
    1. NEVER assume or guess dates - ALWAYS use the date/time tools to get current date/time first
    2. When user says "today", "tomorrow", "next week" etc., convert to exact dates using date tools
    3. ALL TIMES ARE IN IST (Indian Standard Time, UTC+05:30) - always use +05:30 timezone offset
    4. When user provides only time (e.g., "2 PM"), combine with the correct date and IST timezone
    5. Always ensure start_time is before end_time
    6. Use IST timezone format: +05:30 in all datetime strings
    7. If user doesn't specify duration, assume 1 hour unless context suggests otherwise
    
    Example workflow:
    - User: "Schedule meeting tomorrow at 2 PM"
    - AI should: 1) Get tomorrow's date, 2) Convert "2 PM" to "2025-06-22T14:00:00+05:30", 3) Create event with IST timezone
    
    Returns: Event creation response from Nylas API
    """

    def iso_to_unix(iso_str: str) -> int:
        """
        Convert ISO 8601 date string to Unix timestamp.
    
        Args:
            iso_str (str): ISO 8601 formatted date string with IST timezone (e.g., "2025-06-20T14:30:00+05:30")
    
        Returns:
            int: Unix timestamp (seconds since epoch)
        """
        from datetime import datetime
        # Handle both Z (UTC) and +05:30 (IST) formats
        if iso_str.endswith('Z'):
            dt = datetime.fromisoformat(iso_str.replace("Z", "+00:00"))
        else:
            dt = datetime.fromisoformat(iso_str)
        return int(dt.timestamp())

    start_time = iso_to_unix(start_time)
    end_time = iso_to_unix(end_time)
    

    events = nylas.events.create(
    grant_id,
    request_body={
    "title": title,
    "when": {
        "start_time": start_time,
        "end_time": end_time
        },
    },
    query_params={
        "calendar_id": calendar_id
    })

    return events



@mcp.tool()
def get_calendar_events():
    """
    Retrieves all events from the connected calendar.
    
    IMPORTANT FOR AI: This function fetches existing calendar events to check availability and avoid conflicts.
    
    AI USAGE INSTRUCTIONS:
    1. Use this function to check for scheduling conflicts before creating new events
    2. Use this to show user their upcoming events when asked
    3. Use this to find available time slots for scheduling
    4. Parse the returned events to provide user-friendly summaries
    
    Returns: List of calendar events with details including titles, start times, end times, and other metadata
    """

    events = nylas.events.list(
    grant_id,
    query_params={
      "calendar_id": calendar_id,
    }
    )
    
    return events



print(get_calendar_events())

if __name__ == "__main__":    
    mcp.run(transport="stdio")