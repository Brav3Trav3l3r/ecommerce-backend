import { createApp } from '../src/app';
import { seedProducts } from '../src/seed';

seedProducts();

const app = createApp();

export default app;
