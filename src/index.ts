import app from './app';
import { env } from './config/env';
import './config/firebase';

app.listen(env.port, () => {
  console.log(`Server running on port ${env.port}`);
});