import { store } from './store';

export function seedProducts(): void {

  const products = [
    { id: 'p1', name: 'T-Shirt', price: 29.99, description: 'Classic cotton t-shirt', image: "https://images.pexels.com/photos/8522833/pexels-photo-8522833.jpeg" },
    { id: 'p2', name: 'Jeans', price: 59.99, description: 'Slim fit denim jeans', image: "https://images.pexels.com/photos/6856271/pexels-photo-6856271.jpeg" },
    { id: 'p3', name: 'Sneakers', price: 89.99, description: 'Casual canvas sneakers', image: "https://images.pexels.com/photos/31364592/pexels-photo-31364592.jpeg" },
    { id: 'p4', name: 'Cap', price: 19.99, description: 'Adjustable baseball cap', image: "https://images.pexels.com/photos/27401299/pexels-photo-27401299.jpeg" },
    { id: 'p5', name: 'Hoodie', price: 49.99, description: 'Pullover fleece hoodie', image: "https://images.pexels.com/photos/5319514/pexels-photo-5319514.jpeg" },
  ];

  for (const product of products) {
    store.products.set(product.id, product);
  }
}
