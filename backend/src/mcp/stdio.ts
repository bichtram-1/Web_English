import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createLinguaMcpServer } from './linguaMcpServer';

/**
 * LinguaLeap MCP Server - Stdio Transport Entrypoint
 * Used by Claude Desktop, Cursor, Antigravity, and other desktop/terminal AI tools.
 * Communication takes place over stdin/stdout using standard JSON-RPC.
 */
async function runStdioServer() {
  const server = createLinguaMcpServer();
  const transport = new StdioServerTransport();

  await server.connect(transport);
  console.error('🚀 [LinguaLeap MCP] Stdio Server is running and listening for JSON-RPC messages.');
}

runStdioServer().catch((error) => {
  console.error('❌ [LinguaLeap MCP] Fatal error running Stdio server:', error);
  process.exit(1);
});
