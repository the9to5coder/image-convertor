const express = require('express');
const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const fs = require('fs');

const app = express();
const port = 3000;

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Serve static files
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Handle file conversion
app.post('/convert', upload.single('imageUpload'), async (req, res) => {
    const { formatSelect } = req.body;
    const { filename, path: filePath } = req.file;
    const newFileName = `${Date.now()}.${formatSelect}`;
    const outputPath = path.join('uploads', newFileName);

    try {
        await sharp(filePath).toFormat(formatSelect).toFile(outputPath);
        fs.unlinkSync(filePath); // Remove the original file after conversion

        res.json({
            message: 'File converted successfully!',
            fileUrl: `/download/${newFileName}`
        });
    } catch (error) {
        res.status(500).json({ error: 'Error converting file', details: error });
    }
});

// Route to download the converted file
app.get('/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'uploads', filename);

    res.download(filePath, (err) => {
        if (err) {
            console.error('Error during file download:', err);
            res.status(500).send('File download failed');
        } else {
            // Delete the file after sending it to the user
            fs.unlinkSync(filePath);
        }
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
