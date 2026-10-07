import { Router, Request, Response } from 'express';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { createLinguaMcpServer } from './linguaMcpServer';

const router = Router();
const activeTransports = new Map<string, SSEServerTransport>();

/**
 * GET /api/v1/mcp/sse
 * Establishes an SSE stream connection with an MCP client
 */
router.get('/sse', async (_req: Request, res: Response): Promise<void> => {
  try {
    const server = createLinguaMcpServer();
    const transport = new SSEServerTransport('/api/v1/mcp/messages', res);

    activeTransports.set(transport.sessionId, transport);

    transport.onclose = () => {
      activeTransports.delete(transport.sessionId);
    };

    await server.connect(transport);
  } catch (err: any) {
    console.error('[LinguaLeap MCP SSE] Error initiating SSE session:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to establish MCP SSE connection' });
    }
  }
});

/**
 * POST /api/v1/mcp/messages
 * Handles incoming JSON-RPC messages from connected SSE clients
 */
router.post('/messages', async (req: Request, res: Response): Promise<void> => {
  const sessionId = req.query.sessionId as string;
  if (!sessionId) {
    res.status(400).json({ error: 'Missing sessionId query parameter' });
    return;
  }

  const transport = activeTransports.get(sessionId);
  if (!transport) {
    res.status(404).json({ error: `No active MCP session found for sessionId: ${sessionId}` });
    return;
  }

  try {
    await transport.handlePostMessage(req, res, req.body);
  } catch (err: any) {
    console.error('[LinguaLeap MCP SSE] Error handling message:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to process MCP message' });
    }
  }
});

/**
 * GET /api/v1/mcp/info
 * Human and agent-readable summary of LinguaLeap MCP capabilities
 */
router.get('/info', (_req: Request, res: Response) => {
  res.json({
    name: 'LinguaLeap Model Context Protocol (MCP) Server',
    version: '1.0.0',
    protocolVersion: '2024-11-05',
    status: 'online',
    transports: {
      stdio: {
        command: 'npx tsx src/mcp/stdio.ts',
        description: 'Standard Input/Output transport for Claude Desktop, Cursor, Antigravity',
      },
      sse: {
        endpoint: '/api/v1/mcp/sse',
        messagesEndpoint: '/api/v1/mcp/messages',
        description: 'Server-Sent Events HTTP transport for remote agents & web apps',
      },
    },
    capabilities: {
      tools: [
        {
          name: 'search_cards',
          description: 'Search vocabulary cards with IPA phonetics, Vietnamese meanings, and examples',
        },
        {
          name: 'create_deck',
          description: 'Create a new flashcard deck with vocabulary cards directly in LinguaLeap database',
        },
        {
          name: 'get_study_stats',
          description: 'Query learning streak, accuracy, total cards studied, and XP',
        },
        {
          name: 'extract_and_save_vocab',
          description: 'Extract key vocabulary from English text using Gemini AI with 100% IPA and auto-save as a deck',
        },
        {
          name: 'get_deck_by_id',
          description: 'Fetch full details and card list of any LinguaLeap deck',
        },
      ],
      resources: [
        'lingualeap://decks/public',
        'lingualeap://stats/summary',
        'lingualeap://deck/{deckId}',
      ],
      prompts: [
        'vocab_tutor',
        'exam_quiz_generator',
      ],
    },
  });
});

export default router;
