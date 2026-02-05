const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, BatchWriteCommand, ScanCommand, DeleteItemCommand } = require('@aws-sdk/lib-dynamodb');

const OCM_API_KEY = process.env.OCM_API_KEY;
const OCM_URL = process.env.OCM_URL;
const TABLE_NAME = process.env.CHARGERS_TABLE;
const BATCH_SIZE = 25;

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

    const ttl = Math.floor(Date.now() / 1000) + 2 * 24 * 60 * 60;
    
    const items = chargers.map(c => ({
      chargerId: String(c.ID),
      title: c.AddressInfo?.Title || 'Unknown',
      addressLine1: c.AddressInfo?.AddressLine1 || '',
      town: c.AddressInfo?.Town || 'Unknown',
      postcode: c.AddressInfo?.Postcode || '',
      latitude: c.AddressInfo?.Latitude,
      longitude: c.AddressInfo?.Longitude,
      numberOfPoints: c.NumberOfPoints || 0,
      isRecentlyVerified: c.IsRecentlyVerified || false,
      ttl: ttl,
    }));

    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const batch = items.slice(i, i + BATCH_SIZE);
      await docClient.send(new BatchWriteCommand({
        RequestItems: {
          [TABLE_NAME]: batch.map(item => ({
            PutRequest: {
              Item: item
            }
          }))
        }
      }));
      console.log(`Wrote batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(items.length/BATCH_SIZE)}`);
    }

    console.log(`Successfully wrote ${items.length} items to DynamoDB`);

    let deletedCount = 0;
    const scanResult = await docClient.send(new ScanCommand({
      TableName: TABLE_NAME,
      ProjectionExpression: 'chargerId, #ttl',
      ExpressionAttributeNames: { '#ttl': 'ttl' },
      FilterExpression: '#ttl < :now',
      ExpressionAttributeValues: { ':now': Math.floor(Date.now() / 1000) }
    }));

    const staleIds = scanResult.Items?.map(item => item.chargerId) || [];
    
    if (staleIds.length > 0) {
      for (const id of staleIds) {
        await docClient.send(new DeleteItemCommand({
          TableName: TABLE_NAME,
          Key: { chargerId: id }
        }));
      }
      deletedCount = staleIds.length;
      console.log(`Deleted ${deletedCount} stale records`);
    }

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': 'http://punjaci-website.s3-website.localhost.localstack.cloud:4566' },
      body: JSON.stringify({
        message: "OCM data synced to DynamoDB",
        count: items.length,
        deleted: deletedCount,
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