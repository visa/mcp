/**
 * Basic Usage Example for Visa MCP Client
 *
 * Prerequisites:
 * 1. Navigate to the MCP client directory: cd mcp-client
 * 2. Build the project: npm run build
 * 3. Set up environment variables in .env file (see .env.example)
 * 4. Run this example:
 *    - Using npm script: npm run workflow:connection
 *    - Or directly: npx tsx examples/workflows/mcp-server-connection.ts
 *
 * This workflow demonstrates:
 * Basic MCP server connection and tool discovery using the listTools operation
 */

import type { Tool } from '../../src/mcp-client.js';
import { runWorkflow } from '../utils/workflow-helpers.js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function main(): Promise<void> {
  await runWorkflow('Visa MCP Client Basic Usage Example', async (client) => {
    console.log('Step 1: Listing available tools from Visa MCP server...');
    const tools = await client.listTools();
    console.log(`✓ Found ${tools.length} tool(s):\n`);

    tools.forEach((tool: Tool, index: number) => {
      console.log(`${index + 1}. ${tool.name}`);
      console.log(`Description: ${tool.description || 'No description'}`);
      console.log('');
    });
  });
}

// Run the example
main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
