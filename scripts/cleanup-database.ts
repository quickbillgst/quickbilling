import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI environment variable is not set');
  process.exit(1);
}

async function cleanupDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected successfully');

    // Get all collections
    const collections = await mongoose.connection.db?.listCollections().toArray();
    
    if (!collections) {
      console.log('No collections found');
      return;
    }

    console.log('\nDropping all collections...');
    
    for (const collection of collections) {
      try {
        await mongoose.connection.db?.dropCollection(collection.name);
        console.log(`Dropped collection: ${collection.name}`);
      } catch (error) {
        console.log(`Failed to drop ${collection.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log('\nDatabase cleanup completed successfully!');
    console.log('All dummy data has been removed.');
    console.log('You can now create a fresh account and add real data.\n');

  } catch (error) {
    console.error('Error during cleanup:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

cleanupDatabase();
