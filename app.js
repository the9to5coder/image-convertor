const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const app = express();

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
    limits: { fileSize: 10000000 }, // 10MB limit
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

// Home route
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// Image upload and conversion route
app.post('/convert', (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            res.send(err);
        } else {
            if (req.file == undefined) {
                res.send('Error: No File Selected!');
            } else {
                const format = req.body.formatSelect;
                const outputPath = `./converted/${req.file.filename.split('.')[0]}.${format}`;

                sharp(req.file.path)
                    .toFormat(format)
                    .toFile(outputPath, (err, info) => {
                        if (err) {
                            res.send('Error during conversion!');
                        } else {
                            // Delete the uploaded file after conversion
                            fs.unlinkSync(req.file.path);
                            // Send the converted file for download
                            res.download(outputPath, (err) => {
                                if (err) {
                                    res.send('Error during download!');
                                } else {
                                    // Delete the converted file after sending it
                                    fs.unlinkSync(outputPath);
                                }
                            });
                        }
                    });
            }
        }
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
