// src/model/data/aws/index.js

// Clients
const ddbDocClient = require('./ddbDocClient');
const s3Client = require('./s3Client');

// AWS Commands
const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { PutCommand, GetCommand, QueryCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

const logger = require('../../../logger');

const tableName = process.env.AWS_DYNAMODB_TABLE_NAME;

/**
 * Write full fragment metadata to DynamoDB
 * Stores the entire fragment object as-is
 */
async function writeFragment(fragment) {
  if (!fragment || !fragment.ownerId || !fragment.id) {
    throw new Error('ownerId and fragment.id are required');
  }

  const params = {
    TableName: tableName,
    Item: fragment,  // IMPORTANT: store full fragment object
  };

  const command = new PutCommand(params);

  try {
    await ddbDocClient.send(command);
  } catch (err) {
    logger.error({ err, fragment }, 'Error writing fragment metadata to DynamoDB');
    throw new Error('unable to write fragment metadata');
  }
}

/**
 * Read a fragment’s metadata from DynamoDB
 */
async function readFragment(ownerId, id) {
  const params = {
    TableName: tableName,
    Key: {
      ownerId,
      id,
    },
  };

  const command = new GetCommand(params);

  try {
    const response = await ddbDocClient.send(command);
    return response.Item || undefined;
  } catch (err) {
    logger.error({ err, ownerId, id }, 'Error reading fragment metadata from DynamoDB');
    throw new Error('unable to read fragment metadata');
  }
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
    logger.error({ err, Bucket: params.Bucket, Key: params.Key }, 'Error uploading fragment data to S3');
    throw new Error('unable to upload fragment data');
  }
}

/**
 * Stream-to-buffer helper
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
    const response = await s3Client.send(command);
    return streamToBuffer(response.Body);
  } catch (err) {
    logger.error({ err, Bucket: params.Bucket, Key: params.Key }, 'Error streaming fragment data from S3');
    throw new Error('unable to read fragment data');
  }
}

/**
 * List fragment IDs or full fragment objects
 */
async function listFragments(ownerId, expand = false) {
  const params = {
    TableName: tableName,
    KeyConditionExpression: 'ownerId = :ownerId',
    ExpressionAttributeValues: {
      ':ownerId': ownerId,
    },
  };

  const command = new QueryCommand(params);

  try {
    const response = await ddbDocClient.send(command);

    if (!response.Items || response.Items.length === 0) {
      return [];
    }

    return expand ? response.Items : response.Items.map((f) => f.id);
  } catch (err) {
    logger.error({ err, ownerId }, 'Error querying fragments from DynamoDB');
    throw new Error('unable to list fragments');
  }
}

/**
 * Delete metadata + data for fragment
 */
async function deleteFragment(ownerId, id) {
  // 1. Delete S3 data
  const s3Params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: `${ownerId}/${id}`,
  };

  try {
    await s3Client.send(new DeleteObjectCommand(s3Params));
  } catch (err) {
    logger.error({ err, ...s3Params }, 'Error deleting fragment data from S3');
    throw new Error('unable to delete fragment data');
  }

  // 2. Delete DynamoDB record
  const ddbParams = {
    TableName: tableName,
    Key: {
      ownerId,
      id,
    },
  };

  try {
    await ddbDocClient.send(new DeleteCommand(ddbParams));
  } catch (err) {
    logger.error({ err, ownerId, id }, 'Error deleting fragment metadata from DynamoDB');
    throw new Error('unable to delete fragment metadata');
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
