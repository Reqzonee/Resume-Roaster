const dotenv = require("dotenv");
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdf = require('pdf-parse');
const { GoogleGenerativeAI } = require("@google/generative-ai");

dotenv.config();
const cors = require('cors');

const app = express();
const PORT = process.env.PORT;
const genAI = new GoogleGenerativeAI(process.env.API_KEY);

// Enable CORS for all routes
console.log("cors ", process.env.CORS_ORIGIN);
app.use(cors({ origin: process.env.CORS_ORIGIN }));

async function generateRoast(resumeData) {
  try {
    // Assuming resumeData contains the necessary information for generating the prompt
    const prompt = resumeData + " This is the resume of a person, write a funny roast for them. if given data doesn't seems like resume then tell me to upload resume and give me 100 word response and in proper text. also add emoji in resume and see your response should directly mention the person by you whoese resume it is.";
    // console.log("Prompt:", prompt);

    // Get the generative model from Google Generative AI (example model)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Generate content based on the prompt
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    // console.log("Roast:", text);

    return text; // Return the generated roast text
  } catch (error) {
    console.error("Error generating roast:", error);
    throw error; // Propagate the error to handle it further
  }
}

// Ensure upload directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDFs, PNGs, and JPEGs are allowed.'));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter
});

// Middleware to parse JSON bodies
app.use(express.json());

// Upload endpoint
app.post('/api/upload', upload.array('Files'), async (req, res) => {
  try {
    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).send({ message: 'No files uploaded' });
    }

    // Process uploaded PDF files
    const pdfDataPromises = files.filter(file => file.mimetype === 'application/pdf').map(async (file) => {
      const dataBuffer = fs.readFileSync(file.path);
      const data = await pdf(dataBuffer);
      return {
        fileName: file.originalname,
        numPages: data.numpages,
        numRender: data.numrender,
        info: data.info,
        metadata: data.metadata,
        text: data.text,
      };
    });

    const pdfDataArray = await Promise.all(pdfDataPromises);

    // Extract relevant resume data here and pass it to generateRoast function
    const resumeData = pdfDataArray.map(pdfData => pdfData.text).join("\n\n");

    // Generate a funny roast based on the resume data
    const roastText = await generateRoast(resumeData);

    // Respond with success message and generated roast
    res.status(200).send({
      message: 'Files uploaded and processed successfully',
      files,
      roast: roastText
    });
  } catch (error) {
    console.error("Error uploading or processing files:", error);
    res.status(500).send({ message: 'Error uploading or processing files', error: error.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
