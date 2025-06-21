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
calendar_id = "clickswarnendu123@gmail.com"


mcp = FastMCP("calender")


@mcp.tool()
def create_event(title: str, start_time: str, end_time: str):
    """
    Creates/Schedules a new event/interview/task in the calendar.

    title: The title of the event.
    start_time: The start time of the event in ISO 8601 format.
    end_time: The end time of the event in ISO 8601 format.
    """

    def iso_to_unix(iso_str: str) -> int:
        """
        Convert ISO 8601 date string to Unix timestamp.
    
        Args:
            iso_str (str): ISO 8601 formatted date string (e.g., "2025-06-20T14:30:00Z")
    
        Returns:
            int: Unix timestamp (seconds since epoch)
        """
        from datetime import datetime
        dt = datetime.fromisoformat(iso_str.replace("Z", "+00:00"))
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
    Fetches the calendar events for the calendar.
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