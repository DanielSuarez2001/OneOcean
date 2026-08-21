import { dbConnection, closeConnection } from './config/mongoConnection.js';
import beachData from './data/beaches.js';

const main = async () => {
  const db = await dbConnection();
  await db.dropDatabase(); //clears old database to start fresh

  console.log('Seeding One Ocean database...');

  //create Beaches with valid status values ('Active', 'Closed', or 'Unknown')
  const beach1 = await beachData.createBeach(
    101,                       // beachId
    'Santa Monica State Beach',// beachName
    'Santa Monica',            // city
    'Los Angeles',             // county
    'Active',                  // status (Must be Active, Closed, or Unknown)
    3.5,                       // beachLength
    34.0250,                   // upperLat
    34.0050,                   // lowerLat
    -118.4900,                 // upperLon
    -118.5100                  // lowerLon
  );
  console.log('Created Beach:', beach1.beachName, 'with MongoDB _id:', beach1._id);

  const beach2 = await beachData.createBeach(
    102,                       // beachId
    'La Jolla Cove',           // beachName
    'San Diego',               // city
    'San Diego',               // county
    'Active',                  // status
    0.5,                       // beachLength
    32.8510,                   // upperLat
    32.8490,                   // lowerLat
    -117.2700,                 // upperLon
    -117.2730                  // lowerLon
  );
  console.log('Created Beach:', beach2.beachName, 'with MongoDB _id:', beach2._id);

  const beach3 = await beachData.createBeach(
    103,                       // beachId
    'Huntington City Beach',   // beachName
    'Huntington Beach',        // city
    'Orange',                  // county
    'Closed',                  // status
    3.5,                       // beachLength
    33.6650,                   // upperLat
    33.6450,                   // lowerLat
    -117.9900,                 // upperLon
    -118.0100                  // lowerLon
  );
  console.log('Created Beach:', beach3.beachName, 'with MongoDB _id:', beach3._id);

  //test getBeachById using the generated MongoDB _id string
  console.log('\nTesting getBeachById...');
  const fetchedBeach = await beachData.getBeachById(beach1._id);
  console.log('Successfully fetched from DB:', fetchedBeach.beachName);

  console.log('\nSeeding completed successfully!');
  await closeConnection();
};

main().catch((e) => {
  console.error('Error during seeding:', e);
  closeConnection();
});