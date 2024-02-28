const express = require('express')
const format = require('date-fns/format')
const isValid = require('date-fns/isValid')
const toDate = require('date-fns/toDate')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const app = express()
app.use(express.json())
const dbPath = path.join(__dirname, 'todoApplication.db')
let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () =>
      console.log('Server is running at http://localhost:3000'),
    )
  } catch (e) {
    console.log(`DB Error ${e.message}`)
    process.exit(1)
  }
}
initializeDBAndServer()

const checkValidInput = async (request, response, next) => {
  const {search_q, category, priority, status, date} = request.query
  const {todoId} = request.params
  if (category !== undefined) {
    const categoryArray = ['WORK', 'HOME', 'LEARNING']
    const isCategoryPresent = categoryArray.includes(category)
    if (isCategoryPresent === true) {
      request.category = category
    } else {
      response.status(400)
      response.send('Invalid Todo Category')
      return
    }
  }
  if (priority !== undefined) {
    const priorityArray = ['HIGH', 'MEDIUM', 'LOW']
    const ispriorityPresent = priorityArray.includes(priority)
    if (ispriorityPresent === true) {
      request.priority = priority
    } else {
      response.status(400)
      response.send('Invalid Todo Priority')
      return
    }
  }
  if (status !== undefined) {
    const statusArray = ['TO DO', 'IN PROGRESS', 'DONE']
    const isstatusPresent = statusArray.includes(status)
    if (isstatusPresent === true) {
      request.status = status
    } else {
      response.status(400)
      response.send('Invalid Todo Status')
      return
    }
  }
  if (date !== undefined) {
    try {
      const myDate = new Date(date)
      const formatedDate = format(myDate, 'yyyy-MM-dd')
      console.log(formatedDate, 'f')
      const result = toDate(
        new Date(
          `${myDate.getFullYear()}-${myDate.getMonth()}-${myDate.getDate}`,
        ),
      )
      console.log(result, 'r')
      console.log(new Date(), 'new')

      const isValidDate = await isValid(result)
      console.log(isValidDate, 'V')

      if (isValidDate === true) {
        request.date = formatedDate
      } else {
        response.status(400)
        response.send('Invalid Todo Date')
        return
      }
    } catch (e) {
      response.status(400)
      response.send('Invalid Todo Date')
      return
    }
  }
  request.todoId = todoId
  request.search_q = search_q

  next()
}

//API GET 1
app.get('/todos/', checkValidInput, async (request, response) => {
  const {search_q = '', status = '', priority = '', category = ''} = request
  console.log(search_q, status, priority, category)
  const getArrayQuery = `
  SELECT 
        id,
        todo,
        priority,
        status,
        category,
        due_date as dueDate 
  FROM todo 
  WHERE todo LIKE "%${search_q}%" AND
        status LIKE "%${status}%" AND
        priority LIKE "${priority}" AND
        category LIKE "${category}";`

  const resp = await db.all(getArrayQuery)
  response.send(resp)
})
