/**
 * Basic Usage Example for Visa MCP Client
 *
 * Prerequisites:
 * 1. Navigate to the project root directory
 * 2. Build the project: npm run build
 * 3. Navigate to the MCP examples directory: cd apps/mcp-examples
 * 4. Set up environment variables in .env file (see .env.example)
 * 5. Run this example:
 *    - Using npm script: npm run mcp:connection
 *    - Or directly: npx tsx workflows/mcp-server-connection.ts
 *
 * This workflow demonstrates:
 * Basic MCP server connection and tool discovery using the listTools operation
 */

import type { Tool } from '@vic/mcp-client';
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
