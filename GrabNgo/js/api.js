export const ProductService = {
  async getAll() {
    const response = await fetch('/api/products');
    return response.json();
  },
  async getById(id) {
    const response = await fetch(`/api/products/${id}`);
    return response.json();
  }
};
