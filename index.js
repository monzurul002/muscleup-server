const express = require("express");
const app = express()
const cors = require("cors")
app.use(cors())
app.use(express.json())
const port = process.env.PORT || 5000

app.get("/", (req, res) => {
    res.send("Hello , from muscle up.")
})


app.listen(port, () => {
    console.log("server is running");
})
