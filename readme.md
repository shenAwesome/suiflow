### Project Description: SUIFlow Library

The purpose of this project is to create a library, SUIFlow, that aids developers in efficiently developing user interface interaction flows.

#### Use Case Scenario:
1. A user selects a state from a dropdown list.
2. Every suburb in the selected state is displayed as polygons on the map.
3. The user picks a suburb.
4. The user draws a rectangle on the map.
5. The user fills out a form.
6. The system generates a PDF map based on these steps.

While this scenario can be implemented with traditional coding methods, such an approach is often time-consuming, difficult to maintain, and can lead to inconsistencies across different developers' implementations. SUIFlow addresses these challenges by providing the following features:

- **Author Flow via JavaScript/TypeScript:** Developers specify the user interaction flow using JavaScript or TypeScript. The code follows a synchronous style, so flow developers do not need to manage the asynchronous nature of the code.

- **Make side effects in flow:** When a  flow is running, it controls the user interface to display information or capture input as required, via pre developed Actions.

- **Flow Control:** A flow can be cancelled, moved backward to a specified point, and restarted, allowing for flexible user interactions and easier debugging.

- **clean up resource:** when a flow is cancelled, resouces it uses need to be all released. for example the event liseners should be removed

By using SUIFlow, developers can create consistent and maintainable user interaction flows more efficiently.

### Glossary
- **Flow:** The code that implements the user interaction flow. It follows a synchronous coding style and should not make any side effects. Within the code, it invokes various actions to produce side effects.
- **Flow Context:** A context is created when the flow starts and destroyed when the flow finishes. It maintains the state of the flow and provides code access to actions
- **Actions:** Functions that produce side effects.
