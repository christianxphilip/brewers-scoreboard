const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');
const fs = require('fs');

// Initialize S3 if credentials are provided
let s3Client = null;
let useS3 = false;
let s3Region = process.env.AWS_REGION || 'us-east-1';

if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_S3_BUCKET) {
    s3Client = new S3Client({
        region: s3Region,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
    });
    useS3 = true;
    console.log('[Storage] Using AWS S3 for file storage', {
        bucket: process.env.AWS_S3_BUCKET,
        region: s3Region,
    });
} else {
    console.log('[Storage] Using local filesystem for file storage (S3 not configured)');
}

/**
 * Get multer storage configuration for a specific upload type
 * @param {string} uploadType - 'teams', 'players'
 * @returns {multer.StorageEngine} Multer storage engine
 */
function getStorage(uploadType) {
    if (useS3 && s3Client) {
        // Use S3 storage
        return multerS3({
            s3: s3Client,
            bucket: process.env.AWS_S3_BUCKET,
            key: function (req, file, cb) {
                // Generate unique filename
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const ext = path.extname(file.originalname);
                const filename = `${uploadType}/${uploadType}-${uniqueSuffix}${ext}`;
                cb(null, filename);
            },
            contentType: multerS3.AUTO_CONTENT_TYPE,
        });
    } else {
        // Use local filesystem storage
        const uploadDir = path.join(__dirname, '../../uploads', uploadType);

        // Ensure directory exists
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        return multer.diskStorage({
            destination: (req, file, cb) => {
                cb(null, uploadDir);
            },
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                cb(null, `${uploadType}-${uniqueSuffix}${path.extname(file.originalname)}`);
            },
        });
    }
}

/**
 * Get the public URL for an uploaded file
 * @param {string} filePath - The file path from multer (either S3 key or local path)
 * @param {string} uploadType - The upload type
 * @returns {string} Public URL to access the file
 */
function getFileUrl(filePath, uploadType) {
    if (!filePath) return null;

    if (useS3 && s3Client && filePath) {
        // If filePath is already a full URL, return it
        if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
            return filePath;
        }

        // Construct S3 public URL
        const bucket = process.env.AWS_S3_BUCKET;
        const region = s3Region;

        // Use the standard virtual-hosted style URL
        // For us-east-1, the region is often omitted in the hostname, but works with it too
        return `https://${bucket}.s3.${region}.amazonaws.com/${filePath}`;
    } else {
        // Local filesystem - return relative path
        if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
            return filePath;
        }

        if (filePath.startsWith('/uploads/')) {
            return filePath;
        }

        const filename = path.basename(filePath);
        return `/uploads/${uploadType}/${filename}`;
    }
}

/**
 * Delete a file from storage
 * @param {string} filePath - The file path or S3 key
 * @param {string} uploadType - The upload type
 * @returns {Promise<void>}
 */
async function deleteFile(filePath, uploadType) {
    if (!filePath) return;

    if (useS3 && s3Client && filePath) {
        try {
            let key = filePath;
            if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
                const url = new URL(filePath);
                key = url.pathname.substring(1);
                if (key.startsWith(process.env.AWS_S3_BUCKET + '/')) {
                    key = key.substring(process.env.AWS_S3_BUCKET.length + 1);
                }
            }

            const command = new DeleteObjectCommand({
                Bucket: process.env.AWS_S3_BUCKET,
                Key: key,
            });

            await s3Client.send(command);
            console.log('[Storage] Deleted file from S3:', key);
        } catch (error) {
            console.error('[Storage] Error deleting file from S3:', error);
        }
    } else {
        // Local filesystem
        try {
            const filePathFull = path.join(__dirname, '../../uploads', uploadType, path.basename(filePath));
            if (fs.existsSync(filePathFull)) {
                fs.unlinkSync(filePathFull);
                console.log('[Storage] Deleted local file:', filePathFull);
            }
        } catch (error) {
            console.error('[Storage] Error deleting local file:', error);
        }
    }
}

module.exports = {
    getStorage,
    getFileUrl,
    deleteFile,
    isUsingS3: () => useS3
};
