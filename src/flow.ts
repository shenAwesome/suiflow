
type Action = () => void

type AddCleanup = (cleanup: Action) => void

class EngineBase {
    protected contextFunctions: string[] = [];
    protected startTime: number = Date.now();
    protected cancelled: boolean = false;

    protected readonly actionState = {
        values: [] as any[],
        cursor: -1,
        current: -1,
        cleanups: [] as Action[]
    };

    protected get time() {
        return Date.now() - this.startTime
    }

    /**
     * Move to the specified step in the flow.
     * @param step 
     */
    protected gotoStep(step: number) {
        setTimeout(() => {//set time to change values after the return logic
            this.actionState.cursor = step - 1
            this.actionState.values.length = step
            this.actionState.current = -1
        }, 1)
    }

    private readonly context: { [key: string]: Function } = {};

    protected cleanup() {
        this.actionState.cleanups.forEach(c => c())
        this.actionState.cleanups.length = 0
    }

    private wrapFunction(fn: Function, name?: string) {
        const { actionState } = this
        const self = this

        const newFn = function (...args: any[]) {
            //todo .some logging 
            actionState.cursor++
            const { cursor, values, current } = actionState

            if (cursor === values.length) { // last action
                const inAction = cursor === current
                if (self.cancelled) {
                    self.cleanup()
                    throw "cancel"
                }
                if (!inAction) { // kick start the action 
                    const onFinish = (val: any) => {
                        self.cleanup()
                        values.push(val)
                    }
                    actionState.current = cursor
                    const addCleanup = (cleanup: Action) => actionState.cleanups.push(cleanup)
                    args.push(addCleanup)
                    const result = fn.apply(self, args)
                    if (result && result.then) {
                        result.then((val: any) => onFinish(val))
                    } else {
                        onFinish(result)
                    }
                }
                throw 'yield'
            }

            if (cursor > values.length) {
                console.error('something went wrong')
            }

            return values[cursor]
        }

        return newFn
    }

    private move(fn: Function) {
        try {
            this.actionState.cursor = -1
            fn(this.context)
            this.onEnd()
        } catch (e) {
            if (e === 'yield') {
                setTimeout(() => this.move(fn), 20)
            } else if (e === 'cancel') {
                this.onCancel()
            } else {
                throw e
            }
        }
    }

    private onCancel() {
        console.log('Cancelled')
    }

    private onEnd() {
        console.log('Finished')
    }

    public run<T extends { [key: string]: Function }>(actions: T, fn: (context: T & EngineContext) => void) {
        const _actions = Object.entries(actions).filter(([key]) => !key.startsWith('_'))
            .map(([key, fn]) => ({ key, fn }))

        this.contextFunctions.forEach(key => {
            _actions.push({
                key,
                fn: (this as any)[key] as Function
            })
        })

        const { context, actionState } = this
        _actions.forEach(({ key, fn }) => {
            context[key] = this.wrapFunction(fn, key)
        })

        Object.assign(actionState, {
            values: [] as any[],
            cursor: -1,
            current: -1
        })

        this.move(fn)
    }
}

class Engine extends EngineBase {
    private tags: { [tag: string]: number } = {};
    contextFunctions = ['alert', 'prompt', 'print', 'sleep', 'cancel', 'tag', 'gotoTag', 'restart'];

    protected alert(message: any) {
        window.alert(message)
    }

    protected prompt(message: string, defaultValue?: string) {
        return prompt(message, defaultValue)
    }

    protected print(message: any) {
        console.log(message, this.time)
    }

    protected tag(tagName: string) {
        this.tags[tagName] = this.actionState.current
    }

    protected gotoTag(tagName: string) {
        this.gotoStep(this.tags[tagName])
    }

    protected restart() {
        this.gotoStep(0)
    }

    protected sleep(timeout: number) {
        return new Promise<void>(resolve => {
            setTimeout(resolve, timeout)
        }) as unknown as void
    }

    /**
     * Can be called from the flow and outside
     * Will ensure destroyer gets invoked
     */
    cancel() {
        this.cancelled = true
    }

    restartFlow() {
        this.cancelled = true //cancel first
        setTimeout(() => {
            this.cancelled = false
            this.restart()
        }, 100)
    }
}

interface EngineContext {

    alert(message: any): void

    prompt(message: string, defaultValue?: string): string

    print(message: any): void

    sleep(timeout: number): void

    /**
     * Cancels the current flow.
     */
    cancel(): void

    /**
     * Sets a tag at the current point in the flow.
     * @param tagName - The name of the tag to set.
     */
    tag(tagName: string): void

    /**
     * Moves the flow to the specified tag.
     * @param tagName - The name of the tag to move to.
     */
    gotoTag(tagName: string): void

    /**
     * Restarts the entire flow from the beginning.
     */
    restart(): void
}


function runFlow<T extends { [key: string]: Function }>(fn: (context: T & EngineContext) => void, actions: T) {
    const engine = new Engine()
    engine.run(actions, fn)
    return {
        cancel: () => engine.cancel(),
        restart: () => engine.restartFlow()
    }
}

export { runFlow }
export type { AddCleanup }