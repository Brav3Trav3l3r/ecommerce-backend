import { store } from './store';

export function seedProducts(): void {
  const IMAGE = 'https://images.pexels.com/photos/31364592/pexels-photo-31364592.jpeg';
  const products = [
    { id: 'p1', name: 'T-Shirt', price: 29.99, description: 'Classic cotton t-shirt', image: IMAGE },
    { id: 'p2', name: 'Jeans', price: 59.99, description: 'Slim fit denim jeans', image: IMAGE },
    { id: 'p3', name: 'Sneakers', price: 89.99, description: 'Casual canvas sneakers', image: IMAGE },
    { id: 'p4', name: 'Cap', price: 19.99, description: 'Adjustable baseball cap', image: IMAGE },
    { id: 'p5', name: 'Hoodie', price: 49.99, description: 'Pullover fleece hoodie', image: IMAGE },
  ];

  for (const product of products) {
    store.products.set(product.id, product);
  }
}
