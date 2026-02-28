
const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { connect, closeDatabase, clearDatabase } = require('./utils/mongoMemory');

let app;

function makeAuthCookie(userId, role = 'user') {
  const payload = { id: userId, role };
  const token = jwt.sign(payload, process.env.JWT_SECRET_KEY || 'test_jwt_secret', { expiresIn: '1h' });
  return `token=${token}`;
}

beforeAll(async () => {
  // ensure tests use a deterministic secret
  process.env.JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || 'test_jwt_secret';
  await connect();
  // require app after mongoose connected in case app code uses mongoose models on import
  app = require('../src/app');
});

afterAll(async () => {
  await closeDatabase();
});

beforeEach(async () => {
  await clearDatabase();
});

describe('POST /api/order - Create order from current cart', () => {
  test('creates order from cart, copies items and sets status=PENDING', async () => {
    const userId = new mongoose.Types.ObjectId().toString();

    const cartPayload = {
      // userId,
      cart: {
        items: [
          {
            product: new mongoose.Types.ObjectId().toString(),
            quantity: 2,
            price: { amount: 100, currency: 'INR' }
          },
          {
            product: new mongoose.Types.ObjectId().toString(),
            quantity: 1,
            price: { amount: 50, currency: 'INR' }
          }
        ],
        shippingAddress: {
          street: '123 Test St',
          city: 'Testville',
          state: 'TS',
          pincode: '123456',
          country: 'Testland'
        }
      }
    };

    const authCookie = makeAuthCookie(userId);
    const res = await request(app)
      .post('/api/order')
      .send(cartPayload)
      .set('Accept', 'application/json')
      .set('Cookie', authCookie);

    // Contract assertions: implementation may compute taxes/shipping; ensure minimal expectations
    expect([200,201]).toContain(res.status);
    expect(res.body).toBeDefined();
    expect(res.body.user).toBeDefined();
    expect(res.body.status).toBeDefined();
    // status must be PENDING by spec
    expect(res.body.status).toBe('PENDING');
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.length).toBe(2);

    // verify items copied: each item should have product and quantity
    for (let i = 0; i < cartPayload.cart.items.length; i++) {
      expect(res.body.items[i].product).toBeDefined();
      expect(res.body.items[i].quantity).toBe(cartPayload.cart.items[i].quantity);
      expect(res.body.items[i].price).toBeDefined();
      expect(res.body.items[i].price.amount).toBeDefined();
    }

    expect(res.body.totalPrice).toBeDefined();
    expect(res.body.totalPrice.amount).toBeGreaterThanOrEqual(
      cartPayload.cart.items.reduce((s, it) => s + it.price.amount * it.quantity, 0)
    );
    expect(res.body.shippingAddress).toBeDefined();
    expect(res.body.shippingAddress.city).toBe(cartPayload.cart.shippingAddress.city);
  });

  test('returns 400 when cart is empty', async () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const payload = { userId, cart: { items: [] } };
    const authCookie = makeAuthCookie(userId);

    const res = await request(app)
      .post('/api/order')
      .send(payload)
      .set('Accept', 'application/json')
      .set('Cookie', authCookie);

    expect([400,422]).toContain(res.status);
    expect(res.body).toBeDefined();
    // expect an errors or message property
    expect(res.body.message || res.body.errors).toBeDefined();
  });

  test('validates payload and returns 400 for missing userId', async () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const payload = { cart: { items: [{ product: new mongoose.Types.ObjectId().toString(), quantity: 1, price: { amount: 10, currency: 'INR' } }] } };
    const authCookie = makeAuthCookie(userId);

    const res = await request(app)
      .post('/api/order')
      .send(payload)
      .set('Accept', 'application/json')
      .set('Cookie', authCookie);

    expect([400,422]).toContain(res.status);
    expect(res.body).toBeDefined();
    expect(res.body.message || res.body.errors).toBeDefined();
  });
});
