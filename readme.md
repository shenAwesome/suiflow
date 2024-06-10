### Project Description: SUIFlow Library

The purpose of this project is to create a library, SUIFlow, that aids developers in efficiently developing user interface interaction flows.

#### Use Case Scenario:
1. A user selects a state from a dropdown list.
2. Every suburb in the selected state is displayed as polygons on the map.
3. The user picks a suburb.
4. The user draws a rectangle on the map.
5. The user fills out a form.
6. The system generates a PDF map based on these steps. 
7. if user starts another flow before finish this one, system closes this flow automatically and cleanup all resources.

While this scenario can be implemented with traditional coding methods, such an approach is often time-consuming, difficult to maintain, and can lead to inconsistencies across different developers' implementations. SUIFlow addresses these challenges by providing the following features:

- **Specify user interaction logic with Flow:** Developers specify the user interaction using JavaScript or TypeScript as a **Flow**. The code follows a synchronous style, so flow developers do not need to manage the asynchronous nature of the code. code in flow should not make side effects except Actions.

- **Make side effects in Actions:** When a  flow is running, it controls the user interface to display information or capture input as required, via **Actions**.

- **Flow Control:** A flow can be cancelled, moved backward to a specified point, and restarted, allowing for flexible user interactions and easier debugging.

- **clean up resource:** when a flow finishes or is cancelled, resouces it uses are released automatically. for example the event liseners are removed

By using SUIFlow, developers can create consistent and maintainable user interaction flows more efficiently.

### Glossary
- **Flow:** The code that implements the user interaction flow. It follows a synchronous coding style and should not make any side effects. Within the code, it invokes various actions to produce side effects.
- **Actions:** Functions that produce side effects.
- **Flow Tools:** a serise of utlities tools are built in to provide flow control and , essentially they are Actions.

### Example
```javascript
 
// A flow that uses built-in tools 'sleep', 'print', and 'restart', along with a custom Action 'add'.
const flow = runFlow(({ 
  sleep, print,  restart,
  add 
}) => {
  print('hello') 
  const result = add(1, 2) 
  sleep(1000) 
  print('world ' + result) 
  sleep(1000) 
  restart()  // Infinite loop until being cancelled
}, {
  // Implementation of 'add', can be sync or async
  add: async (a: number, b: number) => {
    return a + b 
  }
}) 

// Cancel the flow after 10 seconds from outside
setTimeout(() => {
  flow.cancel() 
}, 10 * 1000) 

```

