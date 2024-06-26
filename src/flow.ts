
type Action = () => void

type AddCleanup = (cleanup: Action) => void

// Define the convert function
type Methods<T> = {
    [K in keyof T]: (...args: any[]) => Promise<any> | any
}

type Resolved<T> = {
    [K in keyof T]: T[K] extends (...args: any[]) => infer R
    ? R extends Promise<infer U>
    ? U
    : R
    : never
}

class EngineBase {

    protected startTime: number = Date.now();

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
            this.cleanup()
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
        const self = this
        const { actionState } = this

        const newFn = function (...args: any[]) {
            //todo .some logging 
            actionState.cursor++
            const { cursor, values, current } = actionState

            if (cursor === values.length) { // last action
                const inAction = cursor === current
                if (current == -2) {
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
            this.onEnd('finished')
        } catch (e) {
            if (e === 'yield') {
                setTimeout(() => this.move(fn), 20)
            } else {
                this.onEnd(e)
            }
        }
    }

    public onEnd(evt: any) {
        console.log('flow ended', evt)
    }

    public run(actions: { [key: string]: Function }, flow: Function) {
        const methodsInA = new Set(Object.getOwnPropertyNames(Engine.prototype))
        const methodsInB = new Set(Object.getOwnPropertyNames(EngineBase.prototype))
        const tools = [...methodsInA].filter(method => !methodsInB.has(method)
            && !method.startsWith('_'))

        //console.log(tools)
        const _actions = Object.entries(actions).filter(([key]) => !key.startsWith('_'))
            .map(([key, fn]) => ({ key, fn }))

        tools.forEach(key => {
            const fn = (this as any)[key]
            _actions.push({ key, fn })
        })

        const { context, actionState } = this
        _actions.forEach(({ key, fn }) => {
            context[key] = this.wrapFunction(fn, key)
        })

        Object.assign(actionState, { values: [] as any[], cursor: -1, current: -1 })

        const self = this
        const toSync = function (fn: () => Promise<void> | void) {
            const newFn = self.wrapFunction(fn)
            newFn()
        }
        Object.assign(context, { Action: toSync })

        this.move(flow)
    }
}



class Engine extends EngineBase {
    private tags: { [tag: string]: number } = {};

    /**
     * Displays an alert message to the user.
     * @param message - The message to display.
     */
    alert(message: any) {
        window.alert(message)
    }

    /**
     * Prompts the user with a message and an optional default value.
     * @param message - The message to display.
     * @param defaultValue - The default value to display in the prompt input.
     * @returns The user's input as a string.
     */
    prompt(message: string, defaultValue?: string) {
        return prompt(message, defaultValue)
    }

    /**
     * Prints a message to the console with a timestamp.
     * @param message - The message to print.
     */
    print(message: any) {
        console.log(message, this.time)
    }

    /**
     * Sets a tag at the current flow state.
     * @param tagName - The name of the tag to set.
     */
    tag(tagName: string) {
        this.tags[tagName] = this.actionState.current
    }

    /**
     * Moves to the flow state associated with the specified tag.
     * @param tagName - The name of the tag to go to.
     */
    gotoTag(tagName: string) {
        this.gotoStep(this.tags[tagName])
    }

    /**
     * Restarts the flow from the beginning.
     */
    restart() {
        this.gotoStep(0)
    }

    /**
     * Pauses the flow for a specified amount of time.
     * @param timeout - The time in milliseconds to sleep. 
     */
    sleep(timeout: number) {
        return new Promise<void>(resolve => {
            setTimeout(resolve, timeout)
        })
    }

    /**
     * Cancels the current flow  
     */
    cancel() {
        this.actionState.current = -2
    }

    /**
     * Executes a custom action function. 
     * @param fn - The action function to execute.
     */
    Action<T>(fn: () => Promise<T> | T): T {
        // Placeholder for custom action logic
        return null as T
    }

    async getJSON(url: string, params?: { [key: string]: any }) {
        if (params && (typeof params !== 'function')) {
            const queryString = new URLSearchParams(params).toString()
            url = `${url}?${queryString}`
        }
        return await (await fetch(url)).json()
    }
}

function containsLet(func: Function) {
    const funcSource = func.toString()
    const letKeywordRegex = /\blet\b/
    return letKeywordRegex.test(funcSource)
}

type KeysOfEngine = Exclude<keyof Engine, keyof EngineBase>

function runFlow<T extends Methods<T>>(
    flow: (params:
        { [K in KeysOfEngine]: (...args: Parameters<Engine[K]>) => Resolved<Engine>[K] }
        & { [K in keyof T]: (...args: Parameters<T[K]>) => Resolved<T>[K] }
    ) => void,
    actions: T,
    onEnd?: (evt: any) => void
) {
    if (containsLet(flow)) {
        console.warn("Using 'let' is not recommended in flow code; use 'const' if possible.")
    }
    const engine = new Engine()
    engine.run(actions, flow)
    if (onEnd) engine.onEnd = onEnd
    return {
        cancel: () => engine.cancel(),
        restart: () => engine.restart()
    }
}

export { runFlow }
export type { AddCleanup }