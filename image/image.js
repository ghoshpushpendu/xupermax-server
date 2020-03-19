var express = require('express');
var multer = require('multer');
var path = require('path');
var fs = require('fs');
var router = express.Router();
var file = require('./image.model');
const gm = require('gm').subClass({imageMagick: true});


//storage for files
var storage = multer.diskStorage({
    destination: function (request, file, cb) {
        cb(null, './uplods')
    },
    filename: function (request, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
});

// Api for Image Upload
router.post('/upload', (request, response) => {
    var image;
    

    let imageResponse = {};

    var upload = multer({
        storage: storage,
        fileFilter: function (request, file, cb) {
            var ext = path.extname(file.originalname);
            cb(null, true)
        }
    }).single('file');

    upload(request, response, function (error) {
        
      
        if (error) {
            
            // throw error;
            imageResponse.error = true;
            imageResponse.message = `Error :` + error.message;
            response.status(500).json(imageResponse);
        }
        else if (request.file) {
            
            image = request.file;
            let resizedImagePath = 'uplods/thumb-' + image.filename;
            // 
            gm(image.path)
                .resize(64, 64)
                .write(resizedImagePath, (error, resizedImage) => {
                    gm(resizedImagePath).identify((error, imageData) => {
                        
                        if (error) {
                            imageResponse.error = true;
                            imageResponse.message = `Error :` + error.message;
                            response.status(500).json(imageResponse);
                        }
                        else {
                            if(imageData)
                            {
                            // 
                            var resizeImage = {
                                mimetype: imageData['Mime type'],
                                size: imageData.Filesize,
                                path: imageData.path,
                            }
                            // 
             
                            }
                            let data = new file({
                                thumbnail: resizeImage,                    
                                file: image
                            });
                            
                            data.save((error, result) => {
                                
                                

                                if (error) {
                                    imageResponse.error = true;
                                    imageResponse.message = `Error :` + error.message;
                                    response.status(500).json(imageResponse);
                                }
                                else if (result) {
                                    imageResponse.error = false;
                                    imageResponse.upload = result;
                                    imageResponse.message = `file uploaded successful.`;
                                    response.status(200).json(imageResponse);
                                }
                                else {
                                    imageResponse.error = true;
                                    imageResponse.message = `file upload unsuccessful.`;
                                    response.status(500).json(imageResponse);
                                }
                            });
                        }
                    })

                })


        }
    });
});

/* Api for get Image through their Id
*/
router.get('/getImage', (request, response) => {
    let imageResponse = {};
    

    
    let select = request.query.select;

    file.findById(request.query.imageId, (error, result) => {
        
        
        if (error) {
            imageResponse.error = true;
            imageResponse.message = `Server error : ` + error.message;
            response.status(500).json(imageResponse);
        }
        else if (result) {
            
            if (select == "thumbnail") {
                response.set({
                    "Content-Disposition": 'attachment; filename="' + 'uplods/thumb-' + result.file.originalname + '"',
                    "Content-Type": result.thumbnail.mimetype
                });
                fs.createReadStream(result.thumbnail.path).pipe(response);
            }
            else {
                response.set({
                    "Content-Disposition": 'attachment; filename="' + result.file.originalname + '"',
                    "Content-Type": result.file.mimetype
                });
                fs.createReadStream(result.file.path).pipe(response);
                
            }
        }
        else {
            imageResponse.error = true;
            imageResponse.message = `No such image available`;
            response.status(500).json(imageResponse);
        }
    })
});
module.exports = router;