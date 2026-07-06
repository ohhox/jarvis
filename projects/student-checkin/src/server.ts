import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { config, MOCK_MODE } from './config.js';
import './db/index.js'; // init schema
import { ensureSeed } from './db/seed.js';
import { authRouter } from './routes/auth.js';
import { studentsRouter } from './routes/students.js';
import { checkinRouter } from './routes/checkin.js';
import { zonesRouter } from './routes/zones.js';
import { reportsRouter } from './routes/reports.js';
import { manageRouter } from './routes/manage.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

ensureSeed();

const app = express();
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/students', studentsRouter);
app.use('/api/checkin', checkinRouter);
app.use('/api/zones', zonesRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/manage', manageRouter);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, mockMode: MOCK_MODE });
});

// เสิร์ฟ frontend
const publicDir = join(__dirname, '..', 'public');
app.use(express.static(publicDir));
app.get('/', (_req, res) => res.redirect('/student/'));

app.listen(config.port, () => {
  console.log(`\n🚀 Student Check-in ทำงานที่ http://localhost:${config.port}`);
  console.log(`   • นักเรียน (LIFF):  http://localhost:${config.port}/student/`);
  console.log(`   • ครู (Dashboard):  http://localhost:${config.port}/teacher/`);
  console.log(`   • โหมด: ${MOCK_MODE ? 'MOCK (ยังไม่ต่อ LINE จริง)' : 'LINE จริง'}`);
  console.log('');
});
