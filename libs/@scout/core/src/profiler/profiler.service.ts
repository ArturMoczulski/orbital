import { Injectable, Logger } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { getProfilerInstance } from "./profile.decorator";

export function profile<T>(
  partName: string,
  fn: () => T | Promise<T>
): T | Promise<T> {
  return ProfilerService.Instance().profilePart(partName, fn)
}

export type ProfilerNode = {
  profile: number;
  parts: Record<string, ProfilerNode>;
  callCount: number;       
};

export type ProfilingMethod = {
  name: string;
  alias?: string;
  resetBeforeCall?: boolean; // if true, reset before method call
};

export type ProfilingDefinition = {
  class: new (...args: any[]) => any;
  methods?: Array<string | ProfilingMethod>;
};

export type ProfilingSetupEntry =
  | (new (...args: any[]) => any)
  | ProfilingDefinition;

@Injectable()
export class ProfilerService {
  private readonly logger = new Logger(ProfilerService.name);
  private readonly PatchSymbol = Symbol("___profilerPatched");

  // The profiling tree
  private root: ProfilerNode = { profile: 0, parts: {}, callCount: 0 };
  private stack: ProfilerNode[] = [this.root];

  constructor(private readonly eventEmitter: EventEmitter2) {}

  static Instance(): ProfilerService {
    return getProfilerInstance()
  }

  // -----------------------------------------
  // 1) Core profiling logic
  // -----------------------------------------

  /**
   * Profiles a block of code under `partName`. Nested calls accumulate
   * in the profiler tree. However, NO events are emitted at this level
   * (per your request for a single "bulk" event at the end).
   */
    public profilePart<T>(
    partName: string,
    fn: () => T | Promise<T>
  ): T | Promise<T> {
    const parentNode = this.stack[this.stack.length - 1];

    // Create or reuse child node
    if (!parentNode.parts[partName]) {
      parentNode.parts[partName] = {
        profile: 0,
        parts: {},
        callCount: 0,  // Initialize calls
      };
    }
    const childNode = parentNode.parts[partName];
    this.stack.push(childNode);

    const startTime = performance.now();

    // The runner handles both sync and async flows
    const runFn = () => {
      let result: T | Promise<T>;
      try {
        result = fn();
      } catch (err) {
        this.stack.pop();
        throw err;
      }

      // Once we know the function was *actually* called:
      // increment this node's call count
      childNode.callCount++;

      if (result instanceof Promise) {
        return result.then(
          (val) => {
            const endTime = performance.now();
            childNode.profile += endTime - startTime;
            this.stack.pop();
            return val;
          },
          (error) => {
            const endTime = performance.now();
            childNode.profile += endTime - startTime;
            this.stack.pop();
            throw error;
          },
        );
      } else {
        const endTime = performance.now();
        childNode.profile += endTime - startTime;
        this.stack.pop();
        return result;
      }
    };

    return runFn();
  }

  /**
   * High-level method: optionally sets up hooks, resets, runs the user code,
   * prints results, unpatches, and finally emits ONE bulk event with the entire data.
   */
  public profile<T>(
    partName: string,
    fn: () => T | Promise<T>,
    patchMap?: ProfilingSetupEntry[]
  ): T | Promise<T> {
    let unpatchFn: (() => void) | undefined;

    // 1) If provided, set up hooks
    if (patchMap) {
      unpatchFn = this.setupHooks(patchMap);
    }

    // 2) Reset
    this.reset();

    // 3) Profile
    const result = this.profilePart(partName, fn);

    // 4) finalize: after finishing, optionally print results and restore hooks
    const finalize = (returnValue: T, isError = false) => {
      // If you want an immediate print, do it here:
      // this.monitor.printTable(this.root);
      // this.monitor.printTree(this.root);

      // 5) Now emit a SINGLE event with the entire profiling data
      //    e.g. "ProfilerService.MyMethodName.profileFinished"
      this.eventEmitter.emit(`${this.constructor.name}.${partName}.profile`, {
        partName,
        data: this.root,
      });

      if (unpatchFn) {
        unpatchFn();
      }
      if (isError) {
        throw returnValue;
      }
      return returnValue;
    };

    if (result instanceof Promise) {
      return result.then(
        (val) => finalize(val),
        (error) => finalize(error as T, true)
      );
    } else {
      return finalize(result);
    }
  }

  // -----------------------------------------
  // 2) Profiler State
  // -----------------------------------------

  public getResult(): ProfilerNode {
    return this.root;
  }

  public reset(): void {
    this.root = { profile: 0, parts: {}, callCount: 0 };
    this.stack = [this.root];
  }

  // -----------------------------------------
  // 3) Method patching
  // -----------------------------------------
  private hookMethod(
    targetPrototype: any,
    methodConfig: ProfilingMethod,
    className: string
  ): () => void {
    const { name, alias, resetBeforeCall } = methodConfig;
    const originalMethod = targetPrototype[name];

    if (typeof originalMethod !== 'function') {
      this.logger.warn(
        `Could not patch method "${name}" on ${className}: not a function.`,
      );
      return () => {};
    }

    // Check or create a patch dictionary on the method
    if (!(originalMethod as any)[this.PatchSymbol]) {
      (originalMethod as any)[this.PatchSymbol] = {};
    }
    const patchDict = (originalMethod as any)[this.PatchSymbol];

    // Already patched for this specific class?
    if (patchDict[className]) {
      this.logger.warn(
        `Skipping hooking of "${className}.${name}" - it's already hooked for this class.`,
      );
      return () => {};
    }

    // Mark it patched for this class
    patchDict[className] = true;

    const profilerName = alias ?? `${className}.${name}`;
    const serviceRef = this;

    // Patch the method
    const wrappedMethod = function (...args: any[]) {
      if (resetBeforeCall) {
        serviceRef.reset();
      }
      return serviceRef.profilePart(profilerName, () =>
        originalMethod.apply(this, args),
      );
    };

    targetPrototype[name] = wrappedMethod;

    // Return unpatch function
    return () => {
      // Remove the "patched" marker for this class
      delete patchDict[className];

      // If no classes remain patched, remove the dictionary entirely
      if (Object.keys(patchDict).length === 0) {
        delete (originalMethod as any)[this.PatchSymbol];
      }

      // Restore original method
      targetPrototype[name] = originalMethod;
    };
  }

  public setupHooks(patchMap: ProfilingSetupEntry[]): () => void {
    const restoreFns: Array<() => void> = [];

    for (const entry of patchMap) {
      if (typeof entry === "function") {
        // entry is a class
        const classRef = entry;
        const className = classRef.name;
        const prototype = classRef.prototype;

        const allMethodNames = this.getAllMethodNames(classRef);

        for (const methodName of allMethodNames) {
          const config: ProfilingMethod = { name: methodName };
          restoreFns.push(this.hookMethod(prototype, config, className));
        }
      } else {
        // entry is a ProfilingDefinition
        const { class: classRef, methods } = entry;
        const className = classRef.name;
        const prototype = classRef.prototype;

        if (!methods) {
          const allMethodNames = this.getAllMethodNames(classRef);
          for (const methodName of allMethodNames) {
            const config: ProfilingMethod = { name: methodName };
            restoreFns.push(this.hookMethod(prototype, config, className));
          }
        } else {
          // Hook only specified
          methods.forEach((methodEntry) => {
            // If methodEntry is a string, convert it to a ProfilingMethod
            const methodConfig: ProfilingMethod =
              typeof methodEntry === "string"
                ? { name: methodEntry }
                : methodEntry;

            restoreFns.push(
              this.hookMethod(prototype, methodConfig, className)
            );
          });
        }
      }
    }

    return () => {
      for (const fn of restoreFns) fn();
    };
  }

  getAllMethodNames(classRef: Function): string[] {
    const methodNames = new Set<string>(); // to avoid duplicates
    let currentProto = classRef.prototype;

    while (currentProto && currentProto !== Object.prototype) {
      const ownNames = Object.getOwnPropertyNames(currentProto).filter(
        (m) => m !== 'constructor' && typeof currentProto[m] === 'function'
      );
      ownNames.forEach((name) => methodNames.add(name));

      currentProto = Object.getPrototypeOf(currentProto);
    }
    return [...methodNames];
  }
}