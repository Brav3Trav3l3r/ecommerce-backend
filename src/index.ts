import 'dotenv/config';
import { createApp } from './app';
import { seedProducts } from './seed';

seedProducts();

const app = createApp();
const port = parseInt(process.env.PORT ?? '3000', 10);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
