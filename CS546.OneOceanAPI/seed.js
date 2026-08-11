import { dbConnection, closeConnection } from './config/mongoConnection.js';
import beachData from './data/beaches.js';
import advisoryData from './data/advisories.js';

const DATASET_URL =
  'https://data.ca.gov/api/3/action/datastore_search?resource_id=0ed1a88b-8260-4b20-80ea-ec714271891a&limit=500';

const seedDatabase = async () => {
  try {
    await dbConnection();

    const response = await fetch(DATASET_URL);

    if (!response.ok) {
      throw new Error(`HTTP Error! Status: ${response.status}`);
    }

    const data = await response.json();

    if (!data || !data.success) {
      throw new Error('Failed to fetch data from CA Open Data API.');
    }

    const records = data.result.records;

    let beachesAdded = 0;
    let advisoriesAdded = 0;
    const addedBeachIds = new Set();

    for (const record of records) {
      const beachId = String(record.station_id || record._id || '101');
      const beachName = record.station_name || record.beach_name || 'California Public Beach';
      const city = record.city || record.county || 'Unknown City';
      const county = record.county || 'California';
      const status = record.status || record.post_status || 'Open';
      const beachLength = parseFloat(record.beach_length) || 1.0;

      const upperLat = parseFloat(record.latitude) || 34.0194;
      const lowerLat = record.latitude ? parseFloat(record.latitude) - 0.001 : 34.0184;
      const upperLon = parseFloat(record.longitude) || -118.4912;
      const lowerLon = record.longitude ? parseFloat(record.longitude) - 0.001 : -118.4922;

      if (!addedBeachIds.has(beachId)) {
        try {
          await beachData.createBeach(
            beachId,
            beachName,
            city,
            county,
            status,
            beachLength,
            upperLat,
            lowerLat,
            upperLon,
            lowerLon
          );
          addedBeachIds.add(beachId);
          beachesAdded++;
        } catch (e) {
        }
      }

      if (record.advisory_type || record.reason || record.posting_type) {
        const advisoryId = String(record._id || Date.now());
        const advisoryType = record.advisory_type || record.posting_type || 'Posting';
        const advisoryCause = record.reason || 'Bacterial Standards Violation';
        const advisoryDuration = record.duration_days ? `${record.duration_days} days` : '1 day';

        const startDate = record.start_date || '2026-01-01';
        const startTime = record.start_time || '08:00AM';
        const endDate = record.end_date || '2026-01-02';
        const endTime = record.end_time || '05:00PM';

        try {
          await advisoryData.createAdvisory(
            advisoryId,
            beachId,
            advisoryType,
            advisoryCause,
            advisoryDuration,
            startDate,
            startTime,
            endDate,
            endTime
          );
          advisoriesAdded++;
        } catch (e) {
        }
      }
    }

    console.log(`Successfully added ${beachesAdded} beaches and ${advisoriesAdded} advisories.`);
  } catch (error) {
    console.error('Error running seed script:', error);
  } finally {
    await closeConnection();
  }
};

seedDatabase();