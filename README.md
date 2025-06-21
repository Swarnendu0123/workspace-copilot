# MCP Server

This project is a multi-server tool integration system designed to assist users in scheduling events, retrieving the current date and time, and interacting with a calendar. It uses the MCP (Multi-Client Protocol) framework to enable seamless communication between multiple servers and a client.

## Features

- **Calendar Integration**: Schedule events and fetch calendar details using the Nylas API.
- **Date and Time Tools**: Retrieve the current date and time in various formats.
- **AI-Powered Assistant**: Use an AI agent to interact with the tools and provide intelligent responses to user queries.

## Project Structure
- `client.py`: The main client that interacts with the servers and the AI agent.
- `servers/`: Contains individual server scripts for calendar, date, and time functionalities.
  - `calendar.py`: Handles calendar-related operations using the Nylas API.
  - `date.py`: Provides the current date in ISO 8601 format.
  - `time.py`: Provides the current time in ISO 8601 and Unix timestamp formats.
- `.env`: Stores environment variables such as API keys.
- `requirements.txt`: Lists the Python dependencies for the project.


## Dependencies
- langchain-groq
- langchain-mcp-adapters
- mcp
- langgraph
- nylas
