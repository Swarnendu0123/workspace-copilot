from mcp.server.fastmcp import FastMCP
from datetime import datetime

mcp = FastMCP("taskstracker")


@mcp.tool()
def get_todays_date():
   """
   Returns today's date in multiple formats.
   """
   now = datetime.now()
   return {
       "iso_format": now.strftime("%Y-%m-%d"),
       "readable_format": now.strftime("%B %d, %Y"),
       "short_format": now.strftime("%m/%d/%Y"),
       "day_name": now.strftime("%A"),
       "month_name": now.strftime("%B"),
       "year": now.strftime("%Y")
   }


if __name__ == "__main__":
   mcp.run(transport="stdio")