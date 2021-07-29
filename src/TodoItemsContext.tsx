import {arrayMove} from '@dnd-kit/sortable'
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useReducer,
} from 'react'

export interface TodoItem {
  id: string
  title: string
  details?: string
  done: boolean
}

interface TodoItemsState {
  todoItems: TodoItem[]
}

interface TodoItemsAction {
  type:
    | 'loadState'
    | 'add'
    | 'delete'
    | 'toggleDone'
    | 'dragEnd'
    | 'setSorted'
    | 'infoChange'
  data: any
}

const TodoItemsContext = createContext<
  (TodoItemsState & {dispatch: (action: TodoItemsAction) => void}) | null
>(null)

const defaultState = {todoItems: []}
const localStorageKey = 'todoListState'

export const TodoItemsContextProvider = ({
  children,
}: {
  children?: ReactNode
}) => {
  const [state, dispatch] = useReducer(todoItemsReducer, defaultState)

  useEffect(() => {
    function handleStorageChange(event: StorageEvent) {
      const savedState = localStorage.getItem(localStorageKey)
      if (savedState) {
        try {
          dispatch({type: 'loadState', data: JSON.parse(savedState)})
        } catch {}
      }
    }
    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  useEffect(() => {
    const savedState = localStorage.getItem(localStorageKey)

    if (savedState) {
      try {
        dispatch({type: 'loadState', data: JSON.parse(savedState)})
      } catch {}
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(localStorageKey, JSON.stringify(state))
  }, [state])

  return (
    <TodoItemsContext.Provider value={{...state, dispatch}}>
      {children}
    </TodoItemsContext.Provider>
  )
}

export const useTodoItems = () => {
  const todoItemsContext = useContext(TodoItemsContext)

  if (!todoItemsContext) {
    throw new Error(
      'useTodoItems hook should only be used inside TodoItemsContextProvider'
    )
  }

  return todoItemsContext
}

const sortingKey = 'isSortingState'
function todoItemsReducer(state: TodoItemsState, action: TodoItemsAction) {
  switch (action.type) {
    case 'loadState': {
      const isSorting = localStorage.getItem(sortingKey) ? false : true
      return action.data

      let sortedItems = state.todoItems.slice().sort((a, b) => {
        if (a.done && !b.done) {
          return 1
        }

        if (!a.done && b.done) {
          return -1
        }

        return 0
      })

      return {
        ...state,
        todoItems: isSorting ? sortedItems : state.todoItems,
      }
    }
    case 'add':
      return {
        ...state,
        todoItems: [
          {id: generateId(), done: false, ...action.data.todoItem},
          ...state.todoItems,
        ],
      }
    case 'delete':
      return {
        ...state,
        todoItems: state.todoItems.filter(({id}) => id !== action.data.id),
      }
    case 'dragEnd':
      return {
        ...state,
        todoItems: arrayMove(
          state.todoItems,
          action.data.oldIndex,
          action.data.newIndex
        ),
      }
    case 'setSorted': {
      let sortedItems = state.todoItems.slice().sort((a, b) => {
        if (a.done && !b.done) {
          return 1
        }

        if (!a.done && b.done) {
          return -1
        }

        return 0
      })

      return {
        ...state,
        todoItems: sortedItems,
      }
    }
    case 'infoChange':
      console.log(action.data)
      const changedIndex = state.todoItems.findIndex(
        ({id}) => id === action.data.id
      )
      const newTitle = action.data.title
      const newDetails = action.data.details

      return {
        ...state,
        todoItems: state.todoItems.map((item, index) => {
          if (changedIndex === index) {
            return {
              ...item,
              title: newTitle,
              details: newDetails,
            }
          }

          return item
        }),
      }

    case 'toggleDone':
      const itemIndex = state.todoItems.findIndex(
        ({id}) => id === action.data.id
      )
      const item = state.todoItems[itemIndex]

      return {
        ...state,
        todoItems: [
          ...state.todoItems.slice(0, itemIndex),
          {...item, done: !item.done},
          ...state.todoItems.slice(itemIndex + 1),
        ],
      }
    default:
      throw new Error()
  }
}

function generateId() {
  return `${Date.now().toString(36)}-${Math.floor(
    Math.random() * 1e16
  ).toString(36)}`
}
