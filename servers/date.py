from mcp.server.fastmcp import FastMCP

mcp = FastMCP("takstracker")


@mcp.tool()
def get_todays_date():
    """
    Returns the current time in ISO 8601 format.
    """
    from datetime import datetime
    return datetime.now().isoformat().split('T')[0]



if __name__ == "__main__":
    mcp.run(transport="stdio")