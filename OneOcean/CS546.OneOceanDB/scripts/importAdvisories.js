import 'dotenv/config';
import { parse } from 'csv-parse/sync';
import { MongoClient } from 'mongodb';
import { advisoriesIndexes, advisoriesValidator } from '../schema/advisories.js';

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017';
const databaseName = process.env.MONGO_DB_NAME || 'oneocean';

const CKAN_DATASET_BASE = 'https://data.ca.gov/dataset/b9c8ce91-40ff-4ad3-8164-bc17c46afb44/resource';
const BEACH_ADVISORIES_CSV_URL = `${CKAN_DATASET_BASE}/d5cd6a23-829c-426d-a63e-689a55a3db9c/download/beach-advisories.csv`;

const fetchCsv = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  const text = await response.text();
  return parse(text, { columns: true, bom: true, skip_empty_lines: true });
};

const toAdvisoryDocument = (row, advisoriesByBeachId) => ({
  advisoryId: Number(row['Advisory id']),
  beachId: Number(row.BeachName_id),
  advisoryType: row.AdvisoryType.length > 0 ? row.AdvisoryType.trim(): null,
  advisoryCause: row.AdvisoryCause.length > 0 ? row.AdvisoryCause.trim() : null,
  advisoryDuration: Number(row['DURATION CALCULATED']),
  advisoryStartDate: row.DateofAdvisory.trim(),
  advisoryStartTime: row.TimeofAdvisory.trim(),
  advisoryEndDate: row.DateOpened.length > 0 ? row.DateOpened.trim() : null,
  advisoryEndTime: row.TimeOpened.length > 0 ? row.TimeOpened.trim() : null
});

const batch_size = 1000;
const bulkWriteInBatches = async (collection, ops, options) => {
  const totalStats = {
    totalCount: 0,
    upsertedCount: 0,
    modifiedCount: 0
  };
  for (let i = 0; i < ops.length; i+= batch_size) {
    const currentBatch = ops.slice(i, i + batch_size)
    const res = await collection.bulkWrite(currentBatch, options)

    totalStats.totalCount += currentBatch.length;
    totalStats.upsertedCount += res.upsertedCount;
    totalStats.modifiedCount += res.modifiedCount;
  }
  return totalStats;
}


const client = new MongoClient(mongoUri);

try {
  const [advisoryRows] = await Promise.all([
    fetchCsv(BEACH_ADVISORIES_CSV_URL)
  ]);

  const advisoryDocuments = advisoryRows
    .map((row) => toAdvisoryDocument(row));

  await client.connect();
  const db = client.db(databaseName);

  await db.command({
    collMod: 'advisories',
    validator: advisoriesValidator,
    validationLevel: 'strict',
    validationAction: 'error'
  });
  const advisories = db.collection('advisories');
  for (const index of advisoriesIndexes) {
    const options = { name: index.name, unique: index.unique };
    if (index.collation) options.collation = index.collation;
    await advisories.createIndex(index.key, options);
  }

  const bulkOps = advisoryDocuments.map((doc) => ({
    updateOne: {
      filter: { advisoryId: doc.advisoryId },
      update: {
        $set: doc,
        $setOnInsert: {}
      },
      upsert: true
    }
  }));

  const result = await bulkWriteInBatches(advisories, bulkOps, { ordered: false });
  console.log(
    `Imported ${result.totalCount} advisories: ${result.upsertedCount} inserted, ${result.modifiedCount} updated.`
  );
} finally {
  await client.close();
}
