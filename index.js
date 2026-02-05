const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');

const OCM_API_KEY = process.env.OCM_API_KEY;
const OCM_URL = process.env.OCM_URL;
const TABLE_NAME = process.env.CHARGERS_TABLE;

const DYNAMODB_ENDPOINT = process.env.LOCALSTACK_HOSTNAME
  ? `http://${process.env.LOCALSTACK_HOSTNAME}:4566`
  : 'http://localhost:4566';

const client = new DynamoDBClient({
  endpoint: DYNAMODB_ENDPOINT,
  region: 'us-east-1',
});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async () => {
  console.log("Sync Lambda placeholder");
  return {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': 'http://punjaci-website.s3-website.localhost.localstack.cloud:4566' },
    body: JSON.stringify({ message: "Placeholder" }),
  };
};