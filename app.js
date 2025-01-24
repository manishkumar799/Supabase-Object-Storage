import express from "express";
import multer from "multer";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
app.use(express.json());
// Supabase client setup
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);
const bucketName = "mani";

// Multer setup for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Upload file to Supabase storage
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const filePath = `uploads/${Date.now()}-${req.file.originalname}`;
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, req.file.buffer, { contentType: req.file.mimetype });

    if (error) throw error;

    res.json({ message: "File uploaded successfully", filePath, data });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
});

// Get public URL of a file
app.get("/file", async (req, res) => {
  try {
    const { path } = req.body;
    const { data } = supabase.storage.from(bucketName).getPublicUrl(path);
    res.json({ url: data.publicUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a file from Supabase storage
app.delete("/delete/:path", async (req, res) => {
  try {
    const { path } = req.params;
    const { data, error } = await supabase.storage
      .from(bucketName)
      .remove([path]);

    if (error) throw error;

    res.json({ message: "File deleted successfully", data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
