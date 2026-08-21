import { MongoClient } from 'mongodb';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const MONGO_DB_NAME = process.env.MONGO_DB_NAME || 'oneocean';

let _client = undefined;
let _db = undefined;

export const dbConnection = async () => {
  if (!_db) {
    _client = new MongoClient(MONGO_URI);
    await _client.connect();
    _db = _client.db(MONGO_DB_NAME);
  }
  return _db;
};

export const closeConnection = async () => {
  if (_client) {
    await _client.close();
    _client = undefined;
    _db = undefined;
  }
};
