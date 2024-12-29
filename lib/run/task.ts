import type { Frame, Future, Reject, Resolve, Result, Task } from "../types.ts";

import { evaluate } from "../deps.ts";
import { Err } from "../result.ts";
import { action } from "../instructions.ts";

import type { FrameResult } from "./types.ts";
import { create } from "./create.ts";
import { call } from "../call.ts";

type ThenFulfilledType<T, Then=T> = ((value: T) => Then | Promise<Then>) | undefined | null;
type CatchType<Catch=never> = ((reason: any) => Catch | Promise<Catch>) | undefined | null;

export function createTask<T>(
  frame: Frame<T>,
): Task<T> {
  let promise: Promise<T>;

  let awaitResult = (resolve: Resolve<T>, reject: Reject) => {
    evaluate(function* () {
      let result = getResult(yield* frame);

      if (result.ok) {
        resolve(result.value);
      } else {
        reject(result.error);
      }
    });
  };

  let getPromise = () => {
    promise = new Promise<T>((resolve, reject) => {
      awaitResult(resolve, reject);
    });
    getPromise = () => promise;
    return promise;
  };

  let task: Task<T> = create<Task<T>>("Task", {}, {
    *[Symbol.iterator]() {
      let frameResult = evaluate<FrameResult<T> | void>(() => frame);
      if (frameResult) {
        let result = getResult(frameResult);
        if (result.ok) {
          return result.value;
        } else {
          throw result.error;
        }
      } else {
        return yield* action<T>(function* (resolve, reject) {
          getPromise().then(resolve, reject);
        });
      }
    },
    then: async <Result1=T, Result2=never>(onfulfilled?: ThenFulfilledType<T, Result1>, onrejected?: CatchType<Result2>) => {
      type NewResult = Result1 | Result2;
      const newPromise = getPromise().then(onfulfilled, onrejected);
      const future: Future<NewResult> = create<Future<NewResult>>("Future", {}, {
        *[Symbol.iterator]() {
          return yield* call(() => newPromise);
        },
        then: (...args) => newPromise.then(...args),
        catch: (...args) => newPromise.catch(...args),
        finally: (...args) => newPromise.finally(...args),
      });
      return await future;
    },
    catch: async (...args) => {
      return await task.then(undefined, ...args);
    },
    finally: async (onfinally) => {
      const newPromise = getPromise().finally(onfinally);
      const future: Future<T> = create<Future<T>>("Future", {}, {
        *[Symbol.iterator]() {
          return yield* call(() => newPromise);
        },
        then: (...args) => newPromise.then(...args),
        catch: (...args) => newPromise.catch(...args),
        finally: (...args) => newPromise.finally(...args),
      });
      return await future;
    },
    halt() {
      let haltPromise: Promise<void>;
      let getHaltPromise = () => {
        haltPromise = new Promise((resolve, reject) => {
          awaitHaltResult(resolve, reject);
        });
        getHaltPromise = () => haltPromise;
        frame.destroy();
        return haltPromise;
      };
      let awaitHaltResult = (resolve: Resolve<void>, reject: Reject) => {
        evaluate(function* () {
          let { destruction } = yield* frame;
          if (destruction.ok) {
            resolve();
          } else {
            reject(destruction.error);
          }
        });
      };
      const future: Future<void> = create<Future<void>>("Future", {}, {
        *[Symbol.iterator]() {
          let result = evaluate<FrameResult<T> | void>(() => frame);

          if (result) {
            if (!result.ok) {
              throw result.error;
            }
          } else {
            yield* action<void>(function* (resolve, reject) {
              awaitHaltResult(resolve, reject);
              frame.destroy();
            });
          }
        },
        // then: (...args) => getHaltPromise().then(...args),
        then: async <Result1=void, Result2=never>(onfulfilled?: ThenFulfilledType<void, Result1>, onrejected?: CatchType<Result2>) => {
          type NewResult = Result1 | Result2;
          const newPromise = getHaltPromise().then(onfulfilled, onrejected);
          const future: Future<NewResult> = create<Future<NewResult>>("Future", {}, {
            *[Symbol.iterator]() {
              return yield* call(() => newPromise);
            },
            then: (...args) => newPromise.then(...args),
            catch: (...args) => newPromise.catch(...args),
            finally: (...args) => newPromise.finally(...args),
          });
          return await future;
        },
        catch: async (...args) => {
          return await task.then(undefined, ...args);
        },
        finally: async (onfinally) => {
          const newPromise = getHaltPromise().finally(onfinally);
          const future: Future<void> = create<Future<void>>("Future", {}, {
            *[Symbol.iterator]() {
              return yield* call(() => newPromise);
            },
            then: (...args) => newPromise.then(...args),
            catch: (...args) => newPromise.catch(...args),
            finally: (...args) => newPromise.finally(...args),
          });
          return await future;
        },
      });
      return future;
    },
  });
  return task;
}

function getResult<T>(result: FrameResult<T>): Result<T> {
  if (!result.ok) {
    return result;
  } else if (result.exit.type === "aborted") {
    return Err(Error("halted"));
  } else if (result.exit.type === "crashed") {
    return Err(result.exit.error);
  } else {
    return result.exit.result;
  }
}