// Backend API tests (Jest + Supertest)
const request = require('supertest');
const app = require('../index');

describe('API Health', () => {
  it('should return 200 for /api/health', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
  });
});
