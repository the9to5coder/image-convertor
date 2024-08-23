const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// Set storage engine for Multer
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

// Initialize upload
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
}).single('imageUpload');

// Check File Type
function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png|gif|bmp|tiff/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Images Only!');
    }
}

// Serve static files from the public directory
app.use(express.static('public'));
app.use('/converted', express.static('converted'));

// Home route
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.post('/convert', (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            console.error('Multer error:', err);
            return res.status(400).json({ error: 'File upload error', details: err.message });
        }

        if (!req.file) {
            console.log('No file selected');
            return res.status(400).json({ error: 'No file selected' });
        }

        const format = req.body.formatSelect;
        const outputPath = path.join(__dirname, 'converted', `${req.file.filename.split('.')[0]}.${format}`);

        sharp(req.file.path)
            .toFormat(format)
            .toFile(outputPath, (err, info) => {
                if (err) {
                    console.error('Sharp conversion error:', err);
                    return res.status(500).json({ error: 'Error during conversion', details: err.message });
                }

                // Delete the uploaded file after conversion
                fs.unlink(req.file.path, (err) => {
                    if (err) console.error('Error deleting uploaded file:', err);
                });

                // Send the converted file for download
                res.json({
                    message: 'File converted successfully!',
                    fileUrl: `/converted/${path.basename(outputPath)}`
                });
            });
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
