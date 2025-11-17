import mongoose from 'mongoose';

// Connection pool optimization
const MONGODB_OPTIONS = {
  maxPoolSize: 10,
  minPoolSize: 2,
  maxIdleTimeMS: 30000,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
};

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  const cache = cached!; // Type assertion
  
  if (cache.conn) {
    return cache.conn;
  }

  if (!cache.promise) {
    const opts = {
      bufferCommands: false,
      ...MONGODB_OPTIONS,
    };

    const MONGODB_URI = process.env.MONGODB_URI;

    if (!MONGODB_URI) {
      throw new Error('Please define the MONGODB_URI environment variable');
    }

    cache.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('✅ MongoDB connected with optimized pool');
      return mongoose;
    });
  }

  try {
    cache.conn = await cache.promise;
  } catch (e) {
    cache.promise = null;
    throw e;
  }

  return cache.conn;
}

// Query optimization helpers
export class QueryBuilder {
  static paginate(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    return { skip, limit };
  }

  static selectFields(fields: string[]) {
    return fields.join(' ');
  }

  static sortBy(field: string, order: 'asc' | 'desc' = 'desc') {
    return { [field]: order === 'desc' ? -1 : 1 };
  }
}

// Lean queries for better performance
export function leanQuery<T>(query: mongoose.Query<T, any>) {
  return query.lean().select('-__v') as mongoose.Query<T, any>;
}

// Batch operations
export async function batchInsert<T>(
  Model: mongoose.Model<T>,
  documents: any[],
  options: { ordered?: boolean; rawResult?: boolean } = {}
) {
  return Model.insertMany(documents, {
    ordered: false,
    rawResult: false,
    ...options,
  });
}

export async function batchUpdate<T>(
  Model: mongoose.Model<T>,
  filter: any,
  update: any,
  options: any = {}
) {
  return Model.updateMany(filter, update, {
    runValidators: true,
    ...options,
  });
}

// Index management
export async function createIndexes(model: mongoose.Model<any>) {
  try {
    await model.createIndexes();
    console.log(`✅ Indexes created for ${model.modelName}`);
  } catch (error) {
    console.error(`❌ Error creating indexes for ${model.modelName}:`, error);
  }
}

// Aggregation pipeline helpers
export class AggregationBuilder {
  private pipeline: any[] = [];

  match(filter: any) {
    this.pipeline.push({ $match: filter });
    return this;
  }

  lookup(from: string, localField: string, foreignField: string, as: string) {
    this.pipeline.push({
      $lookup: { from, localField, foreignField, as },
    });
    return this;
  }

  unwind(path: string, preserveNullAndEmptyArrays: boolean = false) {
    this.pipeline.push({
      $unwind: { path, preserveNullAndEmptyArrays },
    });
    return this;
  }

  group(groupBy: any) {
    this.pipeline.push({ $group: groupBy });
    return this;
  }

  sort(sortBy: any) {
    this.pipeline.push({ $sort: sortBy });
    return this;
  }

  project(fields: any) {
    this.pipeline.push({ $project: fields });
    return this;
  }

  limit(limit: number) {
    this.pipeline.push({ $limit: limit });
    return this;
  }

  skip(skip: number) {
    this.pipeline.push({ $skip: skip });
    return this;
  }

  build() {
    return this.pipeline;
  }
}

// Performance monitoring
export function queryWithStats<T>(
  queryFn: () => Promise<T>,
  queryName: string
): Promise<T> {
  const start = Date.now();
  
  return queryFn()
    .then((result) => {
      const duration = Date.now() - start;
      if (duration > 1000) {
        console.warn(`⚠️ Slow query: ${queryName} took ${duration}ms`);
      }
      return result;
    })
    .catch((error) => {
      console.error(`❌ Query failed: ${queryName}`, error);
      throw error;
    });
}

export default connectDB;
