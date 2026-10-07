import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createLinguaMcpServer } from './linguaMcpServer';
import prisma from '../config/prisma';

async function runMcpVerification() {
  console.log('====================================================');
  console.log('🧪 LINGUALEAP MCP PROTOCOL TEST CLIENT & VERIFICATION');
  console.log('====================================================\n');

  // 1. Initialize MCP Server & Client using Linked In-Memory Transport
  console.log('▶ Step 1: Initializing LinguaLeap MCP Server & Client...');
  const server = createLinguaMcpServer();
  const client = new Client(
    { name: 'lingualeap-test-agent', version: '1.0.0' },
    { capabilities: {} }
  );

  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  await Promise.all([
    server.connect(serverTransport),
    client.connect(clientTransport),
  ]);
  console.log('✅ Connected successfully to LinguaLeap MCP Server via JSON-RPC transport.\n');

  // 2. List & Verify Tools
  console.log('▶ Step 2: Querying Available MCP Tools (Tools Discovery)...');
  const toolsResult = await client.listTools();
  console.log(`✅ Discovered ${toolsResult.tools.length} Tools:`);
  toolsResult.tools.forEach((t) => {
    console.log(`   - 🛠️ [${t.name}]: ${(t.description || '').slice(0, 75)}...`);
  });

  const expectedTools = [
    'search_cards',
    'create_deck',
    'get_study_stats',
    'extract_and_save_vocab',
    'get_deck_by_id',
  ];
  for (const expected of expectedTools) {
    if (!toolsResult.tools.some((t) => t.name === expected)) {
      throw new Error(`Missing expected tool: ${expected}`);
    }
  }
  console.log('✅ All 5 core tools verified.\n');

  // 3. Test Tool: search_cards
  console.log('▶ Step 3: Invoking Tool "search_cards" (query: "work")...');
  const searchRes: any = await client.callTool({
    name: 'search_cards',
    arguments: { query: 'work', limit: 3 },
  });
  console.log('Result type:', searchRes.content[0].type);
  const searchData = JSON.parse(searchRes.content[0].text);
  console.log(`✅ Found ${searchData.totalFound} matching cards. Sample card:`);
  if (searchData.results.length > 0) {
    console.log(`   • Word: "${searchData.results[0].word}" | IPA: ${searchData.results[0].phoneticIPA}`);
    console.log(`   • Meaning: ${searchData.results[0].meaningVi}`);
    console.log(`   • Example: "${searchData.results[0].exampleEn}"`);
  }
  console.log();

  // 4. Test Tool: get_study_stats
  console.log('▶ Step 4: Invoking Tool "get_study_stats"...');
  const statsRes: any = await client.callTool({
    name: 'get_study_stats',
    arguments: {},
  });
  const statsData = JSON.parse(statsRes.content[0].text);
  console.log(`✅ Learner: "${statsData.learnerName}" | Streak: ${statsData.streakDays} days | XP: ${statsData.totalXp} XP`);
  console.log(`   • Accuracy: ${statsData.averageAccuracy} | Total Cards Studied: ${statsData.totalCardsStudied}\n`);

  // 5. List & Verify Resources
  console.log('▶ Step 5: Querying MCP Resources (Resources Discovery)...');
  const resourcesResult = await client.listResources();
  console.log(`✅ Discovered ${resourcesResult.resources.length} Static/Dynamic Resources:`);
  resourcesResult.resources.forEach((r) => {
    console.log(`   - 📄 [${r.uri}]: ${r.name}`);
  });

  // Read resource: lingualeap://stats/summary
  console.log('\n▶ Step 6: Reading Resource "lingualeap://stats/summary"...');
  const resReadResult = await client.readResource({ uri: 'lingualeap://stats/summary' });
  const platformSummary = JSON.parse((resReadResult.contents[0] as any).text as string);
  console.log(`✅ Platform: ${platformSummary.platform}`);
  console.log(`   • Total Users: ${platformSummary.totalUsers}`);
  console.log(`   • Total Decks: ${platformSummary.totalDecks}`);
  console.log(`   • Total Cards: ${platformSummary.totalCards}\n`);

  // 6. List & Verify Prompts
  console.log('▶ Step 7: Querying MCP Prompts (Prompts Discovery)...');
  const promptsResult = await client.listPrompts();
  console.log(`✅ Discovered ${promptsResult.prompts.length} Expert Prompts:`);
  promptsResult.prompts.forEach((p) => {
    console.log(`   - 💡 [${p.name}]: ${p.description}`);
  });

  // Get Prompt: vocab_tutor
  console.log('\n▶ Step 8: Getting Prompt "vocab_tutor"...');
  const tutorPrompt = await client.getPrompt({
    name: 'vocab_tutor',
    arguments: { deckId: 'cum-dong-tu-voi-con-vat' },
  });
  console.log('✅ Generated Prompt message sample:');
  const promptText = (tutorPrompt.messages[0].content as any).text;
  console.log(`"${promptText.slice(0, 180)}..."\n`);

  // 7. Cleanup & Disconnect
  await client.close();
  await server.close();
  await prisma.$disconnect();

  console.log('====================================================');
  console.log('🎉 ALL MCP VERIFICATION TESTS PASSED SUCCESSFULLY! (100%)');
  console.log('====================================================');
}

runMcpVerification().catch((err) => {
  console.error('❌ MCP Verification Failed:', err);
  prisma.$disconnect();
  process.exit(1);
});
