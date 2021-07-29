import {useCallback} from 'react'
import Card from '@material-ui/core/Card'
import CardHeader from '@material-ui/core/CardHeader'
import CardContent from '@material-ui/core/CardContent'
import Typography from '@material-ui/core/Typography'
import IconButton from '@material-ui/core/IconButton'
import Checkbox from '@material-ui/core/Checkbox'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import DeleteIcon from '@material-ui/icons/Delete'
import {makeStyles} from '@material-ui/core/styles'
import classnames from 'classnames'
import {motion} from 'framer-motion'
import {TodoItem, useTodoItems} from './TodoItemsContext'
import {DndContext, DragEndEvent} from '@dnd-kit/core'
import {SortableContext, arrayMove} from '@dnd-kit/sortable'
import {useSortable} from '@dnd-kit/sortable'
import {CSS} from '@dnd-kit/utilities'
import {useEffect} from 'react'
import {useState} from 'react'

const spring = {
  type: 'spring',
  damping: 25,
  stiffness: 120,
  duration: 0.25,
}

const useTodoItemListStyles = makeStyles({
  root: {
    listStyle: 'none',
    padding: 0,
  },
})

const localStorageKey = 'isSortingState'

export const TodoItemsList = function () {
  const {dispatch} = useTodoItems()
  let {todoItems} = useTodoItems()
  const [isSorting, setSorting] = useState<boolean>(
    localStorage.getItem(localStorageKey) ? false : true
  )

  const classes = useTodoItemListStyles()

  let sortedItems = todoItems.slice().sort((a, b) => {
    if (a.done && !b.done) {
      return 1
    }

    if (!a.done && b.done) {
      return -1
    }

    return 0
  })

  const itemIds = todoItems.map(i => i.id)

  const handleOnDragEnd = useCallback(
    (oldIndex: number, newIndex: number) =>
      dispatch({
        type: 'dragEnd',
        data: {
          oldIndex: oldIndex,
          newIndex: newIndex,
        },
      }),
    [dispatch]
  )

  const handleOnSort = useCallback(
    () =>
      dispatch({
        type: 'setSorted',
        data: {todoItems: sortedItems},
      }),
    [sortedItems, dispatch]
  )

  return (
    <>
      <DndContext
        onDragEnd={(event: DragEndEvent) => {
          if (event.over?.id && event.active.id !== event.over?.id) {
            const oldIndex = itemIds.indexOf(event.active.id)
            const newIndex = itemIds.indexOf(event.over.id)
            localStorage.setItem(localStorageKey, 'false')
            setSorting(false)
            handleOnDragEnd(oldIndex, newIndex)
          }
        }}
      >
        <SortableContext items={todoItems.map(i => i.id)}>
          <button
            onClick={() => {
              localStorage.removeItem(localStorageKey)
              handleOnSort()
            }}
          >
            SORT AGAIN
          </button>
          <ul className={classes.root}>
            {isSorting
              ? sortedItems.map(item => (
                  <motion.li key={item.id} transition={spring} layout={true}>
                    <TodoItemCard item={item} />
                  </motion.li>
                ))
              : todoItems.map(item => (
                  <motion.li key={item.id} transition={spring} layout={true}>
                    <TodoItemCard item={item} />
                  </motion.li>
                ))}
          </ul>
        </SortableContext>
      </DndContext>
    </>
  )
}

const useTodoItemCardStyles = makeStyles({
  root: {
    marginTop: 24,
    marginBottom: 24,
  },
  doneRoot: {
    textDecoration: 'line-through',
    color: '#888888',
  },
})

export const TodoItemCard = function ({item}: {item: TodoItem}) {
  const classes = useTodoItemCardStyles()
  const {dispatch} = useTodoItems()

  const {attributes, listeners, setNodeRef, transform, transition, isDragging} =
    useSortable({id: item.id})

  useEffect(() => {
    if (isDragging) {
      console.log('DRAGGING')
    }
  }, [isDragging])

  const style = {
    transform: transform ? CSS.Translate.toString(transform) : '',
    transition: transition ?? '',
  }

  const handleDelete = useCallback(
    () => dispatch({type: 'delete', data: {id: item.id}}),
    [item.id, dispatch]
  )

  const handleToggleDone = useCallback(
    () =>
      dispatch({
        type: 'toggleDone',
        data: {id: item.id},
      }),
    [item.id, dispatch]
  )

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={classnames(classes.root, {
        [classes.doneRoot]: item.done,
      })}
      {...attributes}
      {...listeners}
    >
      <CardHeader
        action={
          <IconButton aria-label='delete' onClick={handleDelete}>
            <DeleteIcon />
          </IconButton>
        }
        title={
          <FormControlLabel
            control={
              <Checkbox
                checked={item.done}
                onChange={handleToggleDone}
                name={`checked-${item.id}`}
                color='primary'
              />
            }
            label={item.title}
          />
        }
      />
      {item.details ? (
        <CardContent>
          <Typography variant='body2' component='p'>
            {item.details}
          </Typography>
        </CardContent>
      ) : null}
    </Card>
  )
}
