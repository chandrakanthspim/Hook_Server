const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectsCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const config = require('../config/config');

const bucketName = config.aws.s3.svgBucketName;
const region = config.aws.s3.awsRegion;
const accessKeyId = config.aws.s3.awsAccessKeyId;
const secretAccessKey = config.aws.s3.awsSecretAccessKey;

const s3Client = new S3Client({
    region,
    credentials: {
        accessKeyId,
        secretAccessKey,
    },
});

exports.s3UploadMultiple = async (files, keyprefix) => {
    const params = files.map((file) => {
        return {
            Bucket: bucketName,
            Key: `${keyprefix}/${file.key}`,
            Body: file.buffer,
        };
    });

    return await Promise.all(params.map((param) => s3Client.send(new PutObjectCommand(param))));
};

exports.s3UploadSingle = async (file, keyprefix) => {
    const param = {
        Bucket: bucketName,
        Key: `${keyprefix}/${file.originalname}`,
        Body: file.buffer,
    };

    return await s3Client.send(new PutObjectCommand(param));
};

exports.s3DeleteSingle = async (file, keyprefix) => {
    const param = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: `${keyprefix}/${file.filename}`,
    });

    return await s3Client.send(param);
};

exports.s3DeleteMultiple = async (files) => {
    const deleteParams = {
        Bucket: bucketName,
        Delete: {
            Objects: files.map(fileName => ({ Key: fileName.url })),
        },
    };

    try {
        const command = new DeleteObjectsCommand(deleteParams);
        const response = await s3Client.send(command);
        return response.Deleted;
    } catch (error) {
        console.error('Error deleting files:', error);
        throw error;
    }
};

exports.getSignedUrl = async (key, keyprefix) => {
    const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: `${keyprefix}/${key}`,
    });
    const signedUrl = await getSignedUrl(
        s3Client,
        command,
        { expiresIn: 1800 } // 60 seconds
    );
    return signedUrl;
};

exports.getSignedUrlMultiple = async (files, keyprefix) => {
    const urls = await Promise.all(
        files.map(async (file) => {
            try {
                const command = new GetObjectCommand({
                    Bucket: bucketName,
                    Key: `${keyprefix}/${file}`,
                });
                const url = await getSignedUrl(s3Client, command, { expiresIn: 1800 });
                return url; // Add URL to file object
            } catch (error) {
                console.error('Error generating pre-signed URL:', error);
                // return { ...file, url: null }; // Handle error, provide null URL
                throw new Error(`Presigned URL generation failed: ${error.message}`);
            }
        })
    );
    return urls;
};
