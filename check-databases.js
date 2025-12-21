const mongoose = require('mongoose');
const cmsUri = 'mongodb+srv://dbuser:2aGo3PT2Awvw6ecI@cluster0.hazc9.mongodb.net/cptsd-cms?retryWrites=true&w=majority';
const journalUri = 'mongodb+srv://dbuser:2aGo3PT2Awvw6ecI@cluster0.hazc9.mongodb.net/cptsd-journal?retryWrites=true&w=majority';

async function checkDb(uri, name) {
  try {
    const conn = await mongoose.createConnection(uri).asPromise();
    const Job = conn.model('Job', new mongoose.Schema({}, { strict: false }));
    const jobs = await Job.find({status: 'PENDING'}).limit(10);
    console.log(`\n${name}: Found ${jobs.length} pending jobs`);
    if (jobs.length > 0) {
      jobs.forEach(j => {
        console.log(`  Job ${j._id.toString().substring(0, 8)} - Type: ${j.type}, createdAt: ${new Date(j.createdAt).toISOString()}`);
      });
    }
    await conn.close();
  } catch (err) {
    console.error(`${name} error:`, err.message);
  }
}

(async () => {
  console.log('Checking both databases for pending jobs...');
  await checkDb(cmsUri, 'cptsd-cms');
  await checkDb(journalUri, 'cptsd-journal');
  console.log('\n✅ Check complete');
  process.exit(0);
})();
