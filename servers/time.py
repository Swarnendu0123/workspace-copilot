from mcp.server.fastmcp import FastMCP

mcp = FastMCP("takstracker")


@mcp.tool()
def get_current_time():
    """
    Returns the current time in ISO 8601 format.
    """
    from datetime import datetime
    return list(datetime.now().isoformat().split('T'))


@mcp.tool()
def get_current_time_in_unix():
    """
    Returns the current time in Unix timestamp format.
    """
    from datetime import datetime
    return int(datetime.now().timestamp())



if __name__ == "__main__":
    mcp.run(transport="stdio")