/**
 * Pack Registry - Auto-onboarding system for new packs
 * 
 * This system automatically integrates new packs into the agent and dashboard.
 * When a new pack is created, it can register itself here and be automatically
 * integrated into the system.
 */

export interface PackFeature {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  available: boolean;
  version: string;
  phase?: string;
}

export interface PackTestCase {
  category: string;
  task: string;
  expected: string;
  packId: string;
}

export interface PackIntegration {
  id: string;
  name: string;
  version: string;
  description: string;
  features: PackFeature[];
  testCases: PackTestCase[];
  statusEndpoint?: string;
  initFunction?: () => Promise<void>;
  enabled: boolean;
}

/**
 * Pack Registry - Central registry for all packs
 */
export class PackRegistry {
  private packs: Map<string, PackIntegration> = new Map();

  /**
   * Register a new pack
   */
  register(pack: PackIntegration): void {
    if (this.packs.has(pack.id)) {
      console.warn(`Pack '${pack.id}' is already registered. Updating...`);
    }
    this.packs.set(pack.id, pack);
    console.log(`✅ Pack registered: ${pack.name} v${pack.version}`);
  }

  /**
   * Get a pack by ID
   */
  getPack(id: string): PackIntegration | undefined {
    return this.packs.get(id);
  }

  /**
   * Get all registered packs
   */
  getAllPacks(): PackIntegration[] {
    return Array.from(this.packs.values());
  }

  /**
   * Get all enabled packs
   */
  getEnabledPacks(): PackIntegration[] {
    return this.getAllPacks().filter(p => p.enabled);
  }

  /**
   * Get all test cases from enabled packs
   */
  getAllTestCases(): PackTestCase[] {
    const testCases: PackTestCase[] = [];
    for (const pack of this.getEnabledPacks()) {
      testCases.push(...pack.testCases);
    }
    return testCases;
  }

  /**
   * Get all features from enabled packs
   */
  getAllFeatures(): PackFeature[] {
    const features: PackFeature[] = [];
    for (const pack of this.getEnabledPacks()) {
      features.push(...pack.features);
    }
    return features;
  }

  /**
   * Initialize all enabled packs
   */
  async initializeAll(): Promise<void> {
    const enabledPacks = this.getEnabledPacks();
    console.log(`🚀 Initializing ${enabledPacks.length} packs...`);

    for (const pack of enabledPacks) {
      if (pack.initFunction) {
        try {
          await pack.initFunction();
          console.log(`✅ Initialized: ${pack.name}`);
        } catch (error) {
          console.error(`❌ Failed to initialize ${pack.name}:`, error);
        }
      }
    }
  }

  /**
   * Get pack status summary
   */
  getStatusSummary() {
    const packs = this.getAllPacks();
    const enabled = packs.filter(p => p.enabled);
    const features = this.getAllFeatures();
    const enabledFeatures = features.filter(f => f.enabled && f.available);

    return {
      totalPacks: packs.length,
      enabledPacks: enabled.length,
      totalFeatures: features.length,
      enabledFeatures: enabledFeatures.length,
      packs: packs.map(p => ({
        id: p.id,
        name: p.name,
        version: p.version,
        enabled: p.enabled,
        features: p.features.length,
        testCases: p.testCases.length
      }))
    };
  }
}

// Global pack registry instance
export const packRegistry = new PackRegistry();

