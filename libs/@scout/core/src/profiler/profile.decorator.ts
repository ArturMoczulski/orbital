// profiler.decorator.ts
import { ProfilerService, ProfilingSetupEntry } from './profiler.service';

// A simple registry to hold the current ProfilerService instance
let profilerInstance: ProfilerService | null = null;

export const setProfilerInstance = (instance: ProfilerService) => {
  profilerInstance = instance;
};

export const getProfilerInstance = () => {
  if (!profilerInstance) {
    throw new Error(`Profiler Singleton not found. Are you sure you imported ProfilerModule?`)
  }

  return profilerInstance 
};

/**
 * A method decorator that profiles the method using ProfilerService.
 * Accepts a patchMap (ProfilingSetupEntry[]). If provided, before calling
 * the method, the profiler will patch methods in the given classes/definitions.
 *
 * Usage:
 *
 *   @Profile([
 *     { class: SomeService, methods: [ { name: 'someMethod' } ] },
 *     AnotherClassToProfile,
 *   ])
 *   async myMethod() {
 *     // ...
 *   }
 */
export function Profile(patchMap?: ProfilingSetupEntry[]) {
  return function (
    target: Object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<any>
  ): TypedPropertyDescriptor<any> {
    if (process.env.SCOUT_PROFILE !== 'true') {
      return descriptor
    }

    const originalMethod = descriptor.value;
    const className = target.constructor.name;
    const methodName = String(propertyKey);

    descriptor.value = function (...args: any[]) {
      if (!profilerInstance) {
        return originalMethod;
      }

      return profilerInstance.profile(
        // Part name
        `${className}.${methodName}`,
        // Actual method invocation
        () => originalMethod.apply(this, args),
        // The patchMap
        patchMap,
      );
    };

    return descriptor;
  };
}