declare module "js-interpreter" {
  class Interpreter {
    constructor(
      code: string,
      initFunc?: (interpreter: Interpreter, globalObject: unknown) => void
    );

    step(): boolean;
    run(): boolean;

    setProperty(
      object: unkown,
      name: string,
      value: unkown,
      descriptor?: unkown
    ): void;

    createAsyncFunction(fn: (...args: unkown[]) => void): unkown;
    createNativeFunction(fn: (...args: unkown[]) => unkown): unkown;
  }

  export = Interpreter;
}
