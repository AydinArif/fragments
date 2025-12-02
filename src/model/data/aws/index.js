// Use S3 for fragment data (DynamoDB usage removed for now)
const s3Client = require('./s3Client');
const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const logger = require('../../../logger');

// Metadata persistence (DynamoDB) is disabled for now. Keep a stub
// so callers (e.g., Fragment.save()) still work without throwing.
async function writeFragment(fragment) {
  logger.warn({ fragment }, 'DynamoDB disabled: skipping writeFragment metadata persistence');
  return;
}

// Metadata reads are disabled for now; return undefined.
async function readFragment(ownerId, id) {
  logger.warn({ ownerId, id }, 'DynamoDB disabled: readFragment returning undefined');
  return undefined;
}

// Writes a fragment's data to an S3 Object in a Bucket
async function writeFragmentData(ownerId, id, data) {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: `${ownerId}/${id}`,
    Body: data,
  };
  const command = new PutObjectCommand(params);
  try {
    await s3Client.send(command);
  } catch (err) {
    const { Bucket, Key } = params;
    logger.error({ err, Bucket, Key }, 'Error uploading fragment data to S3');
    throw new Error('unable to upload fragment data');
  }
}

// Convert a stream into a Buffer
const streamToBuffer = (stream) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });

// Read a fragment's data from S3. Returns a Promise<Buffer>
async function readFragmentData(ownerId, id) {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: `${ownerId}/${id}`,
  };
  const command = new GetObjectCommand(params);
  try {
    const response = await s3Client.send(command);
    return streamToBuffer(response.Body);
  } catch (err) {
    const { Bucket, Key } = params;
    logger.error({ err, Bucket, Key }, 'Error streaming fragment data from S3');
    throw new Error('unable to read fragment data');
  }
}

// Listing fragments (via DynamoDB) is disabled for now. Return empty list.
async function listFragments(ownerId, expand) {
  if (typeof expand === 'undefined') expand = false;
  logger.warn({ ownerId }, 'DynamoDB disabled: listFragments returning empty list');
  return [];
}

// Delete fragment metadata and S3 object
async function deleteFragment(ownerId, id) {
  // 1. Delete from S3 first
  const s3Params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: `${ownerId}/${id}`,
  };
  const s3Command = new DeleteObjectCommand(s3Params);

  try {
    await s3Client.send(s3Command);
  } catch (err) {
    logger.error({ err, ...s3Params }, 'Error deleting fragment data from S3');
    throw new Error('unable to delete fragment data');
  }
}

module.exports = {
  listFragments,
  writeFragment,
  readFragment,
  writeFragmentData,
  readFragmentData,
  deleteFragment,
};
