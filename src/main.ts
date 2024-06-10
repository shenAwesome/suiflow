import { AddCleanup, runFlow } from './flow.ts'
import './style.css'

const flow = runFlow(({
  add, sleep, print, restart,
  alert, prompt, test, Action
}) => {
  /*
  const result = add(1, 2)
  print("hello world 1  :" + result)
  sleep(1000)
  //const name = prompt('name?')
  print("hello world 2")
  sleep(1000)
  //alert('hello ' + name)
  print("hello world 3")
  sleep(1000)
  const msg = test('shen')
  print(msg)
  */
  Action(async () => {
    console.log('1')
  })
  sleep(2000)
  Action(() => {
    console.log('2')
  })
  sleep(1000)
  Action(async () => {
    console.log('3')
  })
  restart()
}, {
  add: (a: number, b: number, addCleanup?: AddCleanup) => {
    addCleanup?.(() => {
      console.log('cleanup add')
    })
    return a + b
  },
  test: async (name: string) => {
    return 'hello ' + name
  }
})

setTimeout(() => {
  flow.cancel()
}, 10000)


//'sleep' and 'print' are built-in tools, 'add' is a custom Action
runFlow(({ sleep, print, add }) => {
  print('hello')
  sleep(1000)
  print('world')
  const result = add(1, 2)
  sleep(1000)
  print(result)
}, {
  add: async (a: number, b: number) => { //implemnetaiton of 'add', it can be sync or async
    return a + b
  }
})
