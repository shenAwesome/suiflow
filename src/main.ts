import { AddCleanup, runFlow } from './flow.ts'
import './style.css'



const flow = runFlow(ctx => {
  const { add, sleep, print, restart, alert, prompt } = ctx
  const result = add(1, 2)
  print("hello world 1  :" + result)
  sleep(1000)
  //const name = prompt('name?')
  print("hello world 2")
  sleep(1000)
  //alert('hello ' + name)
  print("hello world 3")
  sleep(1000)
  restart()
}, {
  add: (a: number, b: number, addCleanup?: AddCleanup) => {
    addCleanup?.(() => {
      console.log('cleanup add')
    })
    return a + b
  }
})

setTimeout(() => {
  flow.cancel()
}, 10000);

