const express = require("express");
const path = require("path");
const logger = require("morgan");
require("dotenv").config();
const bodyParser = require("body-parser");
const cors = require("cors");
const expressFileUpload = require("express-fileupload");

const apiRouter = require("./routes/api");
const cornController = require("./controller/cronController");
const expressip = require('express-ip')
const app = express();

// Middlewares
app.use(logger("dev"));
app.use(cors());
app.options("*", cors());
// CORS Middleware
app.use(cors({
    origin: "*", // Allow all origins; restrict this to specific origins in production
    methods: ["GET", "POST", "OPTIONS", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["X-Requested-With", "Content-Type"],
    credentials: true
}));

// Manual CORS Headers Middleware
app.use(function (req, res, next) {
    res.setHeader("Access-Control-Allow-Headers", "X-Requested-With,content-type");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
    res.setHeader("Access-Control-Allow-Credentials", true);
    next();
});

// Body Parsers and File Upload Middleware
app.use(express.json({ limit: "1024mb" }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(expressFileUpload());
app.use(expressip().getIpInfoMiddleware);

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, "public")));

// Router
apiRouter(app);
cornController(app);                                        

// Home route
app.get("/", (req, res) => {
    res.send("Welcome To Fantasy sports!!");
});

// Server listener
const port = process.env.PORT || 8000;
app.listen(port, () => {
    console.log("Server running at port: " + port);
    // console.log("DB: ", process.env.DB_HOST, process.env.DB_PORT, process.env.DB_NAME, process.env.DB_USERNAME, process.env.DB_PASSWORD, process.env.DB_DIALECT);
});

module.exports = app;
