import cors from "cors"
import express from "express"
import data from "./data.json" with { type: "json" }

const port = process.env.PORT || 8080
const app = express()

app.use(cors())
app.use(express.json())


app.get("/", (req, res) => {
  res.json({
    name: "Happy Thoughts API",
    version: "1.0",
    endpoints: [
      {
        method: "GET",
        path: "/",
        description: "API documentation (this page)",
      },
      {
        method: "GET",
        path: "/messages",
        description: "Get all messages (collection)",
      },
      {
        method: "GET",
        path: "/messages/:id",
        description: "Get a single message by id",
      },
      {
        method: "GET",
        path: "/messages?liked=true",
        description: "Get only liked messages (hearts > 0)",
      },
      {
        method: "GET",
        path: "/messages?search=happy",
        description: "Search messages by text (example: happy)",
      },
    ],
  })
})


app.get("/messages", (req, res) => {
  const { liked, search } = req.query

  let results = [...data]

  if (liked === "true") {
    results = results.filter((msg) => msg.hearts > 0)
  }

  if (search) {
    const term = String(search).toLowerCase()
    results = results.filter((msg) =>
      msg.message.toLowerCase().includes(term)
    )
  }

  res.json(results)
})

app.get("/messages/:id", (req, res) => {
  const message = data.find((msg) => msg._id === req.params.id)

  if (!message) {
    return res.status(404).json({ error: "No message with that id" })
  }

  res.json(message)
})

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})
