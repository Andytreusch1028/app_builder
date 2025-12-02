/**
 * Pack Registration Template
 * 
 * Use this template when creating new pack registrations.
 * Follow the capability-based organization for test cases.
 */

import { packRegistry, PackIntegration } from '../pack-registry.js';

/**
 * Pack X: [Pack Name]
 * 
 * Description: [Brief description of what this pack does]
 * Phase: [Phase 1/2/3 if applicable]
 * Dependencies: [List any pack dependencies]
 */
const packX: PackIntegration = {
  id: 'pack-x',
  name: '[Pack Name]',
  version: '1.0.0',
  description: '[Detailed description of pack functionality]',
  
  /**
   * Features
   * 
   * List all features provided by this pack.
   * Set enabled=true for implemented features, false for planned features.
   * Set available=true if the feature is ready to use, false if it requires external dependencies.
   */
  features: [
    {
      id: 'pack-x-feature-1',
      name: '[Feature Name]',
      description: '[What this feature does]',
      enabled: true,
      available: true,
      version: '1.0.0',
      phase: 'Phase 1' // Optional
    },
    {
      id: 'pack-x-feature-2',
      name: '[Future Feature]',
      description: '[Planned feature]',
      enabled: false,
      available: false,
      version: '0.0.0',
      phase: 'Phase 2' // Optional
    }
  ],

  /**
   * Test Cases
   * 
   * IMPORTANT: Organize by CAPABILITY, not complexity!
   * 
   * Use capability-based categories:
   * - "Agent Execution" - Task understanding, decomposition, planning
   * - "File System" - File operations
   * - "Error Handling" - Error handling and recovery
   * - "Security" - Security and validation
   * - "Pack X: [Capability]" - Pack-specific capabilities
   * 
   * Examples:
   * - "Pack 5: RAG" - Vector search, knowledge retrieval
   * - "Pack 11: Context" - Personal context injection
   * - "Pack 11: Memory" - Memory system operations
   * - "Pack 7: UI" - Frontend rendering, Monaco editor
   */
  testCases: [
    {
      category: 'Pack X: [Capability Name]',
      task: '[Test task description]',
      expected: '[Expected behavior]',
      packId: 'pack-x'
    },
    {
      category: 'Pack X: [Capability Name]',
      task: '[Another test task]',
      expected: '[Expected behavior]',
      packId: 'pack-x'
    },
    // Add more test cases as needed
    // Group by capability, not by complexity
  ],

  /**
   * Status Endpoint (Optional)
   * 
   * If your pack has a status endpoint, specify it here.
   * The endpoint should return pack-specific status information.
   */
  statusEndpoint: '/api/agent/packx-status', // Optional

  /**
   * Initialization Function (Optional)
   * 
   * This function runs when the server starts.
   * Use it to:
   * - Initialize services
   * - Load configuration
   * - Check dependencies
   * - Log startup information
   */
  initFunction: async () => {
    console.log('🚀 Initializing Pack X: [Pack Name]');
    
    // Example: Check if external service is available
    // const isAvailable = await checkExternalService();
    // if (!isAvailable) {
    //   console.warn('⚠️  External service not available');
    // }
    
    console.log('   ✅ Feature 1 loaded');
    console.log('   ⏳ Feature 2 (not implemented)');
  },

  /**
   * Enabled Flag
   * 
   * Set to true to enable this pack, false to disable.
   * Disabled packs won't be initialized or tested.
   */
  enabled: true
};

// Register the pack
packRegistry.register(packX);

export default packX;

/**
 * INTEGRATION CHECKLIST:
 * 
 * 1. ✅ Create this file: src/config/packs/pack-{number}-registration.ts
 * 2. ✅ Import in src/index.ts: import './config/packs/pack-{number}-registration.js';
 * 3. ✅ Create status endpoint (if needed): src/api/agent.routes.ts
 * 4. ✅ Test the pack: npm run build && npm start
 * 5. ✅ Verify in dashboard: http://localhost:3000/test-agent.html
 * 6. ✅ Check pack registry: GET /api/agent/packs
 * 7. ✅ Run test cases: Use dashboard to run pack-specific tests
 * 
 * That's it! The pack will automatically:
 * - Register on server startup
 * - Initialize via initFunction()
 * - Add test cases to dashboard (organized by capability)
 * - Appear in /api/agent/packs endpoint
 * - Be tracked in pack registry
 */

