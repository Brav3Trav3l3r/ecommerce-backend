import { store } from './store';

export function seedProducts(): void {
  const products = [
    { id: 'p1', name: 'T-Shirt', price: 29.99, description: 'Classic cotton t-shirt' },
    { id: 'p2', name: 'Jeans', price: 59.99, description: 'Slim fit denim jeans' },
    { id: 'p3', name: 'Sneakers', price: 89.99, description: 'Casual canvas sneakers' },
    { id: 'p4', name: 'Cap', price: 19.99, description: 'Adjustable baseball cap' },
    { id: 'p5', name: 'Hoodie', price: 49.99, description: 'Pullover fleece hoodie' },
  ];

  for (const product of products) {
    store.products.set(product.id, product);
  }
}
