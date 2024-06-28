const express = require("express");
const bodyParser = require("body-parser");
const { MongoClient, ObjectId } = require("mongodb");
const multer = require("multer");

const path = require("path");
const { Script } = require("vm");
const MONGODB_URI = "mongodb://localhost:27017/INTERNSHIP";
const COLLECTION_NAME = "document";
const APPROVED_COLLECTION_NAME = "ApprovedDocument";
const client = new MongoClient(MONGODB_URI, { useUnifiedTopology: true });
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/login.html");
});
const upload = multer({ storage: storage });

app.post("/login", async (req, res) => {
  const { role, username, password } = req.body;

  try {
    await client.connect();
    const db = client.db();
    if (role === "Editor") {
      const usersCollection = db.collection("Editor");
      const user = await usersCollection.findOne({ username, password });
      if (user) {
        res.sendFile(path.join(__dirname, "/Editor.html"));
        app.post("/upload", upload.single("file"), handleFileUpload);
      } else {
        res.send("Invalid username or password");
      }
    } else if (role === "Manager") {
      const usersCollection = db.collection("Manager");
      const user = await usersCollection.findOne({ username, password });
      if (user) {
        res.sendFile(path.join(__dirname, "/Manager.html"));

        app.get("/list", listFiles);

        app.get("/download/:id", downloadFile);

        app.post("/approve/:id", approveFile);
      } else {
        res.send("Invalid username or password");
      }
    } else if (role === "Admin") {
      const usersCollection = db.collection("Admin");
      const user = await usersCollection.findOne({ username, password });
      if (user) {
        res.sendFile(path.join(__dirname, "/Admin.html"));

        app.get("/Approvedlist", listApprovedFiles);

        app.get("/download/:id", downloadApprovedFile);

        
      } else {
        res.send("Invalid username or password");
      }
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal server error");
  } finally {
    await client.close();
  }
});

// Route to upload file
async function handleFileUpload(req, res) {
        console.log(req.file);
        if (!req.file) {
          return res.status(400).send("No files were uploaded.");
        }

        // Prepare file metadata
        const fileMetadata = {
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size,
          uploadTime: new Date(),
          storagePath: req.file.path,
        };

        try {
          // Save metadata to MongoDB
          await client.connect();
          const db = client.db();
          const collection = db.collection(COLLECTION_NAME);
          await collection.insertOne(fileMetadata);

          res.send(`<script>
            alert("File uploaded and metadata saved successfully");
            window.location.href = "/";
            </script>`);
        } catch (err) {
          console.error("Error saving file metadata to MongoDB:", err);
          res.status(500).send("Internal Server Error");
  }
}
// Route to list uploaded files
async function listFiles(req, res) {
        try {
          await client.connect();
          const db = client.db();
          const collection = db.collection(COLLECTION_NAME);
          const files = await collection.find().toArray();
          res.json(files);
        } catch (err) {
          console.error("Error listing files:", err);
          res.status(500).send("Internal Server Error");
        }
}
// Route to download a file
async function downloadFile(req, res) {
      try {
        await client.connect();
        const db = client.db();
        const collection = db.collection(COLLECTION_NAME);
        const file = await collection.findOne({ _id: new ObjectId(req.params.id) });
        if (!file) {
          return res.status(404).send("File not found");
        }
        res.download(file.storagePath, file.originalName);
      } catch (err) {
        console.error("Error downloading file:", err);
        res.status(500).send("Internal Server Error");
      }
}

// Route to approve a file
async function approveFile(req, res) {
        try {
          await client.connect();
          const db = client.db();
          const collection = db.collection(COLLECTION_NAME);
          const file = await collection.findOne({ _id: new ObjectId(req.params.id) });

          if (!file) {
            return res.status(404).send("File not found");
          }

          // Move file to approved collection or send it to the admin
          const approvedCollection = db.collection(APPROVED_COLLECTION_NAME);
          await approvedCollection.insertOne(file);
          await collection.deleteOne({ _id: new ObjectId(req.params.id) });

          res.status(200).send("File approved successfully");
        } catch (err) {
          console.error("Error approving file:", err);
          res.status(500).send("Internal Server Error");
        }
}

// Route to list uploaded files
async function listApprovedFiles(req, res) {
  try {
    await client.connect();
    const db = client.db();
    const collection = db.collection(APPROVED_COLLECTION_NAME);
    const files = await collection.find().toArray();
    res.json(files);
  } catch (err) {
    console.error("Error listing files:", err);
    res.status(500).send("Internal Server Error");
  }
}
// Route to download a file
async function downloadApprovedFile(req, res) {
try {
  await client.connect();
  const db = client.db();
  const collection = db.collection(APPROVED_COLLECTION_NAME);
  const file = await collection.findOne({ _id: new ObjectId(req.params.id) });
  if (!file) {
    return res.status(404).send("File not found");
  }
  res.download(file.storagePath, file.originalName);
} catch (err) {
  console.error("Error downloading file:", err);
  res.status(500).send("Internal Server Error");
}
}

app.listen(3001, () => {
  console.log("Server is running on http://localhost:3001");
});
