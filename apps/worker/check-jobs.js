const mongoose = require('mongoose');
const uri = process.env.MONGODB_URI || 'mongodb+srv://dbuser:2aGo3PT2Awvw6ecI@cluster0.hazc9.mongodb.net/cptsd-journal?retryWrites=true&w=majority';
mongoose.connect(uri).then(async () => {
  const Job = mongoose.model('Job', new mongoose.Schema({}, { strict: false }));
  const now = new Date();
  const jobs = await Job.find({status: 'PENDING'}).limit(5);
  console.log('Found', jobs.length, 'pending jobs');
  for (const j of jobs) {
    const runAt = new Date(j.runAt);
    const ready = runAt <= now;
    console.log('Job:', j._id.toString().substring(0, 8));
    console.log('  runAt:', runAt.toISOString());
    console.log('  now:', now.toISOString());
    console.log('  ready?', ready, '(runAt <= now)');
    console.log('  lockedAt:', j.lockedAt || 'none');
    console.log('---');
  }
  process.exit(0);
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
