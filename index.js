const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require("express");
const app = express()
const cors = require("cors")
app.use(cors())
app.use(express.json())
const port = process.env.PORT || 5000
require("dotenv").config()
const { config } = require("dotenv");
//cloudinary and multer
const cloudinary = require('cloudinary').v2;
const multer = require('multer')
const storage = multer.diskStorage({});
const upload = multer({ storage: storage });

cloudinary.config({
    cloud_name: 'dj7z2d6lv',
    api_key: '775228647313376',
    api_secret: 'kv06GEzPWW0OVgMhZYj8S7VuWGg'
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.1u9t2.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const cartCollection = client.db("muscleDb").collection("cart");
        const classesCollection = client.db("muscleDb").collection("classes");
        const userCollection = client.db("muscleDb").collection("users")
        //carts collection
        app.get('/carts', async (req, res) => {
            const result = await cartCollection.find().toArray();
            res.send(result)
        })

        app.post("/carts", async (req, res) => {
            const cartInfo = req.body;

            const result = await cartCollection.insertOne(cartInfo);
            res.send(result)
        })
        //class delte from class

        app.delete("/carts/:id", async (req, res) => {
            const id = req.params.id;

            const filter = { _id: new ObjectId(id) }
            const result = await cartCollection.deleteOne(filter)
            res.send(result)

        })



        //classes end point & image upload
        // app.post("/classes", upload.single("image"), async (req, res) => {
        //     try {
        //         const classesInfo = req.body;
        //         const image = req.file;
        //         console.log(image);
        //         const result = await cloudinary.uploader.upload(image.buffer);
        //         console.log(result);

        //         // const result = await classesCollection.insertOne(classesInfo);
        //         // res.send(result)
        //     }
        //     catch (error) {
        //         console.log(error);
        //     }

        // })
        app.post("/classes", upload.single("image"), async (req, res) => {
            try {
                const image = req.file;
                if (!image) {
                    return res.status(400).json({ error: 'No file received' });
                }
                const classesInfo = req.body;
                const hostInfo = await cloudinary.uploader.upload(image.path);
                classesInfo.image = hostInfo.secure_url;
                classesInfo.status = "pending"
                const result = await classesCollection.insertOne(classesInfo);
                res.send(result)


            } catch (error) {
                console.error(error);

                if (error.http_code) {
                    // Cloudinary error
                    return res.status(error.http_code).json({ error: error.message });
                } else {
                    // Internal server error
                    return res.status(500).send('Internal Server Error');
                }
            }
        });
        //classes collection

        app.get("/classes", async (req, res) => {
            try {
                const email = req.query.email;

                if (email) {
                    const query = { instructorEmail: email }
                    const result = await classesCollection.find(query).toArray();
                    res.send(result)
                } else {
                    const result = await classesCollection.find().toArray();
                    res.send(result)
                }
            } catch (error) {
                console.error("Error fetching classes:", error);
                res.status(500).send("Internal Server Error");
            }
        });

        app.put('/classes/:id', async (req, res) => {
            const id = req.params.id;
            const updateStatus = req.body;
            let updateDoc;
            const query = { _id: new ObjectId(id) }
            if (!updateStatus.status) {

                updateDoc = {
                    $set: {
                        feedback: updateStatus?.feedback
                    }
                }
            }
            else {
                updateDoc = {
                    $set: {
                        status: updateStatus?.status
                    }
                }
            }
            const result = await classesCollection.updateOne(query, updateDoc, { upsert: true });
            res.send(result)

        })

        //users collection
        app.post("/users", async (req, res) => {
            const userInfo = req.body;
            const result = await userCollection.insertOne(userInfo);
            res.send(result)
        })

        app.get("/users", async (req, res) => {

            const result = await userCollection.find().toArray();
            res.send(result)
        })

        //make Admin or instructor

        app.put("/users/:id", async (req, res) => {
            const roleinfo = req.body;
            const id = req.params.id;
            console.log(roleinfo);
            const filter = { _id: new ObjectId(id) }

            const updateDoc = {
                $set: {
                    role: roleinfo?.role
                }
            }
            const options = { upsert: true };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            res.send(result)
        })

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get("/", (req, res) => {
    res.send("Hello , from muscle up.")
})

app.listen(port, () => {
    console.log("server is running");
})
