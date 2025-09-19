import { MongoClient, Db, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI!;
const dbName = process.env.MONGODB_DB || 'quiet_hours';

let _client: MongoClient | null = null;
let _db: Db | null = null;
let _indexesEnsured = false;

export type BlockDoc = {
  _id?: ObjectId;
  userId: string;
  userEmail: string;
  title?: string;
  startAt: Date;
  endAt: Date;
  timezone?: string;
  reminder10Sent?: boolean;
  reminder10SentAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type TimeslotDoc = {
  _id?: ObjectId;
  userId: string;
  blockId: ObjectId;
  slotStart: Date;
  expiresAt: Date;
};

export async function getClient() {
  if (_client) return _client;
  if (!uri) throw new Error('MONGODB_URI is not set');
  _client = new MongoClient(uri);
  await _client.connect();
  return _client;
}

export async function getDb() {
  if (_db) return _db;
  const client = await getClient();
  _db = client.db(dbName);
  if (!_indexesEnsured) {
    await ensureIndexes(_db);
    _indexesEnsured = true;
  }
  return _db;
}

async function ensureIndexes(db: Db) {
  await Promise.all([
    db.collection<TimeslotDoc>('user_timeslots').createIndex(
      { userId: 1, slotStart: 1 },
      { unique: true, name: 'uniq_user_slot' }
    ),
    db.collection<TimeslotDoc>('user_timeslots').createIndex(
      { expiresAt: 1 },
      { expireAfterSeconds: 0, name: 'ttl_timeslots' }
    ),
    db.collection<BlockDoc>('blocks').createIndex(
      { userId: 1, startAt: 1 },
      { name: 'user_start' }
    ),
    db.collection<BlockDoc>('blocks').createIndex(
      { reminder10Sent: 1, startAt: 1 },
      { name: 'reminder_lookup' }
    ),
  ]);
}

export async function collections() {
  const db = await getDb();
  return {
    blocks: db.collection<BlockDoc>('blocks'),
    timeslots: db.collection<TimeslotDoc>('user_timeslots'),
  };
}