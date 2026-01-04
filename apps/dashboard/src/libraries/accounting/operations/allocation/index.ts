// Export all allocation-related types and classes
export type {
  AllocationStrategy,
  AllocationOptions,
  AllocationResult,
  AllocationResultItem,
  UnitAllocationInput,
} from './strategy';

export { ByShareAllocation } from './by-share';
export { ByUsageAllocation } from './by-usage';
export { FlatAllocation } from './flat';
export { SpecificUnitsAllocation } from './specific-units';

export type { AllocationService } from './service';
export { createAllocationService } from './service';
