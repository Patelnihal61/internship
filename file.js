const express = require("express");
const multer = require("multer");

const { MongoClient , ObjectId} = require('mongodb');

const path = require("path");
const MONGODB_URI = 'mongodb://localhost:27017';
const DB_NAME = 'INTERNSHIP';
const COLLECTION_NAME = 'document';

const app = express();
app.use(express.static(path.join(__dirname, "public")));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "Editor.html"));
});
// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });
const client = new MongoClient(MONGODB_URI, { useUnifiedTopology: true });

// Connect to MongoDB
client.connect(err => {
    if (err) {
        console.error('Failed to connect to MongoDB', err);
        process.exit(1);
    }
    console.log('Connected to MongoDB');
});

// Route for file upload
app.post('/upload', upload.single('file'), async (req, res) => {
  console.log(req.file);
  if (!req.file) {
      return res.status(400).send('No files were uploaded.');
  }

  // Prepare file metadata
  const fileMetadata = {
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      uploadTime: new Date(),
      storagePath: req.file.path
  };

  try {
      // Save metadata to MongoDB
      const db = client.db(DB_NAME);
      const collection = db.collection(COLLECTION_NAME);
      await collection.insertOne(fileMetadata);

      res.send('File uploaded and metadata saved successfully');
  } catch (err) {
      console.error('Error saving file metadata to MongoDB:', err);
      res.status(500).send('Internal Server Error');
  }
});


// Route to list uploaded files
app.get('/list', async (req, res) => {
  try {
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);
    const files = await collection.find().toArray();
    res.json(files);
  } catch (err) {
    console.error('Error listing files:', err);
    res.status(500).send('Internal Server Error');
  }
});

// Route to download a file
app.get('/download/:id', async (req, res) => {
  try {
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);
    const file = await collection.findOne({ _id: new ObjectId(req.params.id) });
    if (!file) {
      return res.status(404).send('File not found');  
    }
    res.download(file.storagePath, file.originalName);
  } catch (err) {
    console.error('Error downloading file:', err);
    res.status(500).send('Internal Server Error');
  }
});

// Start server
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
