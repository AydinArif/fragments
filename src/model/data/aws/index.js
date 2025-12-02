const { MemoryDB } = require('../memory/memory-db');

const metadata = new MemoryDB();
const s3Client = require('./s3Client');
const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const logger = require('../../../logger');

/**
 * Write a fragment's metadata to the in-process metadata store.
 * Accepts either (ownerId, fragment) or (fragment) where fragment.ownerId exists.
 */
function writeFragment(arg1, arg2) {
  let ownerId, fragment;

  if (typeof arg1 === 'string') {
    ownerId = arg1;
    fragment = arg2;
  } else {
    fragment = arg1;
    ownerId = fragment?.ownerId;
  }

  if (!ownerId || !fragment || !fragment.id) {
    throw new Error('ownerId and fragment.id are required');
  }

  const serialized = JSON.stringify(fragment);
  return metadata.put(ownerId, fragment.id, serialized);
}

async function readFragment(ownerId, id) {
  const serialized = await metadata.get(ownerId, id);
  if (serialized === undefined) return undefined;
  return typeof serialized === 'string' ? JSON.parse(serialized) : serialized;
}

const streamToBuffer = (stream) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });

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
    if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) {
      return null;
    }
    logger.error({ err, Bucket, Key }, 'Error streaming fragment data from S3');
    throw new Error('unable to read fragment data');
  }
}

async function listFragments(ownerId, expand = false) {
  const fragments = await metadata.query(ownerId);
  if (!fragments) return [];

  // ensure deterministic order by ID
  const parsed = fragments.map((f) =>
    typeof f === 'string' ? JSON.parse(f) : f
  );
  parsed.sort((a, b) => a.id.localeCompare(b.id));

  if (expand) {
    // return serialized JSON strings to match memory backend contract
    return parsed.map((f) => JSON.stringify(f));
  }

  return parsed.map((f) => f.id);
}

async function deleteFragment(ownerId, id) {
  try {
    const fragment = await readFragment(ownerId, id);
    if (!fragment) {
      return false;
    }

    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: `${ownerId}/${id}`,
    };

    const command = new DeleteObjectCommand(params);

    await Promise.all([metadata.del(ownerId, id), s3Client.send(command)]);

    return true;
  } catch (err) {
    logger.error({ err, ownerId, id }, 'Error deleting fragment from S3');
    return false;
  }
}

module.exports.listFragments = listFragments;
module.exports.writeFragment = writeFragment;
module.exports.readFragment = readFragment;
module.exports.writeFragmentData = writeFragmentData;
module.exports.readFragmentData = readFragmentData;
module.exports.deleteFragment = deleteFragment;
