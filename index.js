const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');

const OCM_API_KEY = process.env.OCM_API_KEY;
const OCM_URL = process.env.OCM_URL;
const TABLE_NAME = process.env.CHARGERS_TABLE;

const DYNAMODB_ENDPOINT = process.env.LOCALSTACK_HOSTNAME
  ? `http://${process.env.LOCALSTACK_HOSTNAME}:4566`
  : 'http://localhost:4566';

console.log('DynamoDB endpoint:', DYNAMODB_ENDPOINT);
console.log('OCM API KEY:', OCM_API_KEY);

const client = new DynamoDBClient({
  endpoint: DYNAMODB_ENDPOINT,
  region: 'us-east-1',
});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async () => {
  console.log("Fetching OCM chargers...");

  try {
    const MAX_RESULTS = 1000;
    const params = new URLSearchParams({
      key: OCM_API_KEY,
      countrycode: 'RS',
      maxresults: MAX_RESULTS,
      compact: true,
      verbose: false,
    });

    const response = await fetch(`${OCM_URL}?${params}`);
    const chargers = await response.json();

    const fetchedAll = chargers.length < MAX_RESULTS;
    console.log(`Fetched ${chargers.length} chargers from OCM`);
    console.log(fetchedAll ? 'All chargers fetched' : 'May have more chargers (hit maxresults limit)');
    console.log('Example charger:', JSON.stringify(chargers[0], null, 2));

    // TODO: Save to DynamoDB

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': 'http://punjaci-website.s3-website.localhost.localstack.cloud:4566' },
      body: JSON.stringify({
        message: "Data fetched",
        count: chargers.length,
        fetchedAll: fetchedAll,
      }),
    };
  } catch (error) {
    console.error("Error syncing OCM data:", error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': 'http://punjaci-website.s3-website.localhost.localstack.cloud:4566' },
      body: JSON.stringify({ error: error.message }),
    };
  }
};