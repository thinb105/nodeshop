const fs = require('path')

function deleteFile(filePath) {
    fs.unlink(filePath, err => {
        if(err){
            return new Error(err);
        }
    });
}

function createInvoice(order){
    console.log(order);
}

module.exports = {
    deleteFile: deleteFile,
    createInvoice: createInvoice
}