const express = require("express");
const bodyParser = require("body-parser");
const { MongoClient } = require("mongodb");

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = "mongodb://localhost:27017/INTERNSHIP";

app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/form.html");
});

// Handle form submission
app.post("/form", async (req, res) => {
  const {
    fullName,
    dob,
    gender,
    nationality,
    contactNumber,
    email,
    address,
    highSchool,
    graduationYear,
    gpa,
    subjects,
    program,
    startDate,
    degreeType,
    activities,
    experience,
    languages,
    accommodations,
    emergencyContact,
  } = req.body;

  // Connect to MongoDB
  const client = new MongoClient(MONGODB_URI, { useUnifiedTopology: true });
  try {
    await client.connect();
    const db = client.db();

    // Assuming you have a collection named 'students' for registration
    const studentsCollection = db.collection("student");
    const exituser = await studentsCollection.findOne({
      fullName,
    });
    if (exituser) {
      res.send("firstname already exist");
    } else {
      // Insert the new student into the database
      await studentsCollection.insertOne({
        fullName,
        dob,
        gender,
        nationality,
        contactNumber,
        email,
        address,
        highSchool,
        graduationYear,
        gpa,
        subjects,
        program,
        startDate,
        degreeType,
        activities,
        experience,
        languages,
        accommodations,
        emergencyContact,
      });

      res.send("Registration successful!");
    }
  } catch (err) {
    console.error("Error:", err);
    res.status(500).send("Internal Server Error");
  } finally {
    // Close the connection
    await client.close();
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
