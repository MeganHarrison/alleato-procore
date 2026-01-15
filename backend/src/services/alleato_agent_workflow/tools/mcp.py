"""
MCP (Model Context Protocol) and Web Search tool configurations.

This module defines the external tool connections used by agents:
- Supabase MCP tools for RAG data access
- Linear MCP for issue tracking
- Web search for external research
"""

import logging
import os

from agents import HostedMCPTool, WebSearchTool


logger = logging.getLogger(__name__)


# Primary Supabase MCP connection for RAG
mcp = HostedMCPTool(tool_config={
    "type": "mcp",
    "server_label": "Supabase",
    "allowed_tools": [],
    "authorization": "sbp_c9f4a689e3ea92657771323f0aa31fab6f552b4e",
    "require_approval": "never",
    "server_description": "Alleato's Supabase for RAG",
    "server_url": "https://mcp.supabase.com/mcp?project_ref=lgveqfnpkxvzbnnwuled"
})

# Secondary Supabase MCP connection
mcp1 = HostedMCPTool(tool_config={
    "type": "mcp",
    "server_label": "Supabase",
    "allowed_tools": [],
    "authorization": "sbp_c9f4a689e3ea92657771323f0aa31fab6f552b4e",
    "require_approval": "never",
    "server_description": "Alleato Supabase",
    "server_url": "https://mcp.supabase.com/mcp?project_ref=lgveqfnpkxvzbnnwuled"
})


_linear_mcp_url = os.environ.get("LINEAR_MCP_SERVER_URL")
_linear_mcp_token = os.environ.get("LINEAR_MCP_TOKEN") or os.environ.get("LINEAR_API_KEY")

if _linear_mcp_url and _linear_mcp_token:
    linear_mcp = HostedMCPTool(tool_config={
        "type": "mcp",
        "server_label": "Linear",
        "allowed_tools": [],
        "authorization": _linear_mcp_token,
        "require_approval": "always",
        "server_description": "Linear issue tracking via MCP",
        "server_url": _linear_mcp_url
    })
else:
    missing = []
    if not _linear_mcp_url:
        missing.append("LINEAR_MCP_SERVER_URL")
    if not _linear_mcp_token:
        missing.append("LINEAR_MCP_TOKEN/LINEAR_API_KEY")
    logger.warning("Linear MCP not configured; set %s to enable", ", ".join(missing))
    linear_mcp = None

# Web search tool for external research
web_search_preview = WebSearchTool(
    search_context_size="medium",
    user_location={
        "type": "approximate"
    }
)
