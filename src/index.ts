import { produce } from "immer";

/**
 * This is what I did:
 * 1. created an interface for the Item, Event and DataStore
 * 2. then, created the initial state of the DataStore
 * 4. eventReducer using produce that takes a state and an event and
 * returns a new state (without original being modified)
 * 5. used ADD_ITEM and REMOVE_ITEM events in the reducer // it is pure function
 * 6. created dataStore, undoStack and redoStack
 * 7. created a curried logActions function that logs the action
 * 8. created undoAction and redoAction functions that undo and redo the last action
 * - I could not really find a way to make the undoAction and redoAction functions without using
 * external variables like undoStack, redoStack and dataStore, thus, I used
 * produce to make a copy of the dataStore and undoStack and redoStack and then
 * modify them accordingly to implement the undo/redo logi
 * 9. I also created dispatchEvent function that takes an event and dispatches it to the reducer
 *
 * 10. Finally, I created two events: addItemEvent and removeItemEvent and dispatched them
 */

interface Item {
  id: number;
  name: string;
}

interface Event {
  type: string;
  payload?: { item?: Item; itemId?: number };
}

interface DataStore {
  items: Item[];
}

const initialState: DataStore = {
  items: [],
};

// pure function - using immer

const eventReducer = (
  dataStore: DataStore,
  event: Event
): DataStore => {
  return produce(dataStore, (draft) => {
    switch (event.type) {
      case "ADD_ITEM":
        if (event.payload?.item) {
          draft.items.push(event.payload.item);
        }
        break;
      case "REMOVE_ITEM":
        if (event.payload?.item) {
          const itemIndex = draft.items.findIndex(
            (item) => item.id === event.payload?.item?.id
          );
          if (itemIndex !== -1) {
            draft.items.splice(itemIndex, 1);
          }
        }
        break;
      default:
        break;
    }
  });
};

let dataStore = initialState;
let undoStack: DataStore[] = [];
let redoStack: DataStore[] = [];

// dispatch event
const dispatchEvent = (event: Event) => {
  undoStack = produce(undoStack, (draft) => {
    draft.push(dataStore);
  });
  redoStack = [];
  dataStore = eventReducer(dataStore, event);
};

// log curried function
const logActions = (message: string) => (event: Event) => {
  console.log(`${message}: ${JSON.stringify(event)}`);
};

const undoAction = (steps = 1) => {
  if (undoStack.length === 0) return;
  for (let i = 0; i < steps; i++) {
    if (undoStack.length === 0) break;
    redoStack = produce(redoStack, (draft) => {
      draft.push(dataStore);
    });
    dataStore = produce(
      undoStack[undoStack.length - 1],
      (draft) => draft
    );
    undoStack = produce(undoStack, (draft) => {
      draft.length -= 1;
    });
  }
};

const redoAction = (steps = 1) => {
  if (redoStack.length === 0) return;
  for (let i = 0; i < steps; i++) {
    if (redoStack.length === 0) break;
    undoStack = produce(undoStack, (draft) => {
      draft.push(dataStore);
    });
    dataStore = produce(
      redoStack[redoStack.length - 1],
      (draft) => draft
    );
    redoStack = produce(redoStack, (draft) => {
      draft.length -= 1;
    });
  }
};

const addItemEvent: Event = {
  type: "ADD_ITEM",
  payload: {
    item: {
      id: 1,
      name: "Product 1",
    },
  },
};

const removeItemEvent: Event = {
  type: "REMOVE_ITEM",
  payload: {
    item: {
      id: 1,
      name: "Product 1",
    },
  },
};

dispatchEvent(addItemEvent);
const logWithMessage = logActions("Event Dispatched");
logWithMessage(addItemEvent);
console.log(dataStore);

dispatchEvent(removeItemEvent);
logWithMessage(removeItemEvent);
console.log(dataStore);

undoAction();
console.log("After undoing the last event");
console.log(dataStore);
redoAction();
console.log("After redoing the last event: ");
console.log(dataStore);
