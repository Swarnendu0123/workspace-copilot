from mcp.server.fastmcp import FastMCP
from datetime import datetime

mcp = FastMCP("taskstracker")  # Fixed typo


@mcp.tool()
def get_current_time():
   """
   Returns the current time in multiple formats.
   """
   now = datetime.now()
   return {
       "time_12hour": now.strftime("%I:%M:%S %p"),
       "time_24hour": now.strftime("%H:%M:%S"),
       "time_short": now.strftime("%I:%M %p"),
       "hour": now.strftime("%H"),
       "minute": now.strftime("%M"),
       "second": now.strftime("%S"),
       "am_pm": now.strftime("%p")
   }


@mcp.tool()
def get_current_time_in_unix():
   """
   Returns the current Unix timestamp and readable format.
   """
   now = datetime.now()
   return {
       "unix_timestamp": int(now.timestamp()),
       "unix_milliseconds": int(now.timestamp() * 1000),
       "readable_time": now.strftime("%Y-%m-%d %H:%M:%S")
   }


if __name__ == "__main__":
   mcp.run(transport="stdio")