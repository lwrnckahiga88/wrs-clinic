import express from 'express';
import cors from 'cors';
import { initDb } from './db/index.js';

import patientsRouter from './routes/patients.js';
import appointmentsRouter from './routes/appointments.js';
import consultationsRouter from './routes/consultations.js';
import pharmacyRouter from './routes/pharmacy.js';
import reportsRouter from './routes/reports.js';
import whatsappRouter from './routes/whatsapp.js';
import syncRouter from './routes/sync.js';
import marketplaceRouter from './routes/marketplace.js';

initDb();

const app = express();
app.use(cors());
app.use(express.json());

// Each of these corresponds 1:1 to an installed WRS runtime package.
app.use('/api/patients', patientsRouter);
app.use('/api/appointments', appointmentsRouter);
app.use('/api/consultations', consultationsRouter);
app.use('/api/pharmacy', pharmacyRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/whatsapp', whatsappRouter);
app.use('/api/sync', syncRouter);
app.use('/api/marketplace', marketplaceRouter);

app.get('/api/health', (req, res) => res.json({ status: 'ok', gateway: 'wrs-gateway', time: new Date().toISOString() }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`WRS Gateway running on port ${PORT}`));
