from mcp.server.fastmcp import FastMCP

mcp = FastMCP("prersonal_details")


@mcp.tool()
def get_profile():
   """
   Returns user profile information
   """
   return {
        "name": "Swarnendu Bhandari",
        "email": "clickswarnendu123@gmail.com",
        "github": "github.com/Swarnendu0123",
        "linkedin": "linkedin.com/in/swarnendu-bhandari",
   }


if __name__ == "__main__":
   mcp.run(transport="stdio")