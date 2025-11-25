// src/model/data/aws/index.js

// XXX: temporary use of memory-db until we add DynamoDB
const MemoryDB = require('../memory/memory-db');
const logger = require('../../../logger');

// S3 client & commands
const s3Client = require('./s3Client');
const {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require('@aws-sdk/client-s3');

// In-memory DB instances
const metadata = new MemoryDB();

/**
 * Write fragment metadata.
 * Accepts (ownerId, fragment) or (fragment) where fragment.ownerId exists.
 */
function writeFragment(arg1, arg2) {
  let ownerId, fragment;

  if (typeof arg1 === 'string') {
    ownerId = arg1;
    fragment = arg2;
  } else {
    fragment = arg1;
    ownerId = fragment.ownerId;
  }

  if (!ownerId || !fragment || !fragment.id) {
    throw new Error('ownerId and fragment.id are required');
  }

  return metadata.put(ownerId, fragment.id, JSON.stringify(fragment));
}

/**
 * Read fragment metadata
 */
async function readFragment(ownerId, id) {
  const serialized = await metadata.get(ownerId, id);
  return typeof serialized === 'string' ? JSON.parse(serialized) : serialized;
}

/**
 * Write fragment data to S3
 */
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

/**
 * Convert S3 ReadableStream → Buffer
 */
const streamToBuffer = (stream) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });

/**
 * Read fragment data from S3
 */
async function readFragmentData(ownerId, id) {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: `${ownerId}/${id}`,
  };

  const command = new GetObjectCommand(params);

  try {
    const data = await s3Client.send(command);
    return streamToBuffer(data.Body);
  } catch (err) {
    const { Bucket, Key } = params;
    logger.error({ err, Bucket, Key }, 'Error streaming fragment data from S3');
    throw new Error('unable to read fragment data');
  }
}

/**
 * List fragment metadata (same behavior as memory version)
 */
async function listFragments(ownerId, expand = false) {
  const fragments = await metadata.query(ownerId);
  if (!fragments) return [];

  const parsed = fragments.map((f) =>
    typeof f === 'string' ? JSON.parse(f) : f
  );
  parsed.sort((a, b) => a.id.localeCompare(b.id));

  return expand ? parsed.map((f) => JSON.stringify(f)) : parsed.map((f) => f.id);
}

/**
 * Delete fragment metadata + S3 object
 */
async function deleteFragment(ownerId, id) {
  // Delete metadata from memory (same as original)
  await metadata.del(ownerId, id);

  // Now delete the S3 object
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: `${ownerId}/${id}`,
  };

  const command = new DeleteObjectCommand(params);

  try {
    await s3Client.send(command);
  } catch (err) {
    const { Bucket, Key } = params;
    logger.error({ err, Bucket, Key }, 'Error deleting fragment data from S3');
    throw new Error('unable to delete fragment data');
  }
}

module.exports = {
  writeFragment,
  readFragment,
  writeFragmentData,
  readFragmentData,
  listFragments,
  deleteFragment,
};
