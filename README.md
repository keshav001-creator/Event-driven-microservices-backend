<body>

<h1>Event-Driven Microservices Backend</h1>
<p class="tagline">
  A production-inspired backend with 7 independent services communicating asynchronously via RabbitMQ.
  Built to handle real failure scenarios — server crashes mid-payment, duplicate order retries, and service downtime without data loss.
</p>

<h2>Architecture</h2>
<pre>
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│  Auth Svc    │   │  Product Svc │   │   Cart Svc   │
│  JWT + Redis │   │    MySQL     │   │    MySQL     │
└──────┬───────┘   └──────┬───────┘   └──────┬───────┘
       │                  │                  │
       └──────────────────┴──────────────────┘
                          │
                   RabbitMQ (CloudAMQP)
                          │
       ┌──────────────────┴──────────────────┐
       │                  │                  │
┌──────┴───────┐   ┌──────┴───────┐   ┌──────┴──────────┐
│  Order Svc   │   │ Payment Svc  │   │Notification Svc  │
│    MySQL     │   │  Razorpay    │   │    Gmail         │
└──────────────┘   └──────────────┘   └──────────────────┘
       │
┌──────┴────────────┐
│  Seller Dashboard │
└───────────────────┘
</pre>
<p>Each service has its own MySQL database. No service directly queries another service's database.</p>

<h2>Services</h2>
<table>
  <thead>
    <tr><th>Service</th><th>Responsibility</th></tr>
  </thead>
  <tbody>
    <tr><td><code>auth</code></td><td>Registration, login, JWT issuance, Redis token blacklisting on logout</td></tr>
    <tr><td><code>product</code></td><td>Product listing and inventory management</td></tr>
    <tr><td><code>cart</code></td><td>Add/remove items, cart state per user</td></tr>
    <tr><td><code>order</code></td><td>Order creation with idempotent key validation to block duplicates</td></tr>
    <tr><td><code>payment</code></td><td>Razorpay integration, payment verification, cron-based autoverify</td></tr>
    <tr><td><code>notification</code></td><td>Gmail transactional emails for registration, payment success and failure</td></tr>
    <tr><td><code>seller-dashboard</code></td><td>Seller-specific order and product management</td></tr>
  </tbody>
</table>

<h2>Tech Stack</h2>
<table>
  <thead>
    <tr><th>Category</th><th>Technology</th></tr>
  </thead>
  <tbody>
    <tr><td>Runtime</td><td>Node.js</td></tr>
    <tr><td>Framework</td><td>Express.js</td></tr>
    <tr><td>Database</td><td>MySQL (one per service)</td></tr>
    <tr><td>Message Broker</td><td>RabbitMQ via CloudAMQP</td></tr>
    <tr><td>Cache</td><td>Redis</td></tr>
    <tr><td>Payment</td><td>Razorpay</td></tr>
    <tr><td>Notifications</td><td>Gmail via Nodemailer</td></tr>
    <tr><td>Auth</td><td>JWT</td></tr>
  </tbody>
</table>

<h2>Key Technical Decisions</h2>

<h3>Async communication via RabbitMQ</h3>
<p>
  Services never call each other directly. They publish events to RabbitMQ queues using <code>amqplib</code> and CloudAMQP.
  If a service goes down, messages stay queued and get processed once it recovers — no data is lost.
</p>

<h3>Idempotent payment keys</h3>
<p>
  A unique key is generated on the client side per order attempt and passed via request header.
  Before creating an order, the system checks if one already exists with that key.
  If yes, the duplicate request is blocked — preventing double orders on network retries.
</p>

<h3>Cron job for payment recovery</h3>
<p>
  If the server crashes after Razorpay deducts payment but before confirmation is saved, the order stays in a <code>pending</code> state.
  A cron job runs periodically, finds all pending payments, and verifies them directly with Razorpay —
  auto-confirming or failing them based on actual payment status.
</p>

<h3>Redis token blacklisting</h3>
<p>
  On logout, the JWT is added to a Redis blacklist with a TTL matching token expiry.
  Every protected route checks the blacklist before trusting the token — preventing reuse of logged-out sessions.
</p>

<h2>Fault Tolerance Scenarios</h2>
<table>
  <thead>
    <tr><th>Scenario</th><th>How it's handled</th></tr>
  </thead>
  <tbody>
    <tr><td>Order service goes down during checkout</td><td>Cart event stays queued in RabbitMQ, processed on recovery</td></tr>
    <tr><td>Server crashes after payment deducted</td><td>Cron job detects pending payment, verifies with Razorpay, auto-confirms</td></tr>
    <tr><td>User retries order after network failure</td><td>Idempotent key blocks duplicate order creation</td></tr>
    <tr><td>User reuses a logged-out JWT</td><td>Redis blacklist rejects the token before reaching any controller</td></tr>
  </tbody>
</table>

<h2>Getting Started</h2>

<h3>Prerequisites</h3>
<ul>
  <li>Node.js v18+</li>
  <li>MySQL</li>
  <li>Redis</li>
  <li>RabbitMQ or a CloudAMQP account</li>
  <li>Razorpay account</li>
</ul>

<h3>Environment Variables</h3>
<p>Each service has its own <code>.env</code> file. Example for the auth service:</p>
<pre>
PORT=3001
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=auth_db
JWT_SECRET=your_jwt_secret
REDIS_URL=redis://localhost:6379
RABBITMQ_URL=your_cloudamqp_url
</pre>

<h3>Running the Services</h3>
<pre>
# Clone the repo
git clone https://github.com/yourusername/microservices-backend.git
cd microservices-backend
</pre>

<h2>Project Structure</h2>
<pre>
microservices-backend/
├── auth-service/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   └── index.js
├── product-service/
├── cart-service/
├── order-service/
├── payment-service/
├── notification-service/
└── seller-dashboard-service/
</pre>

<h2>Why I Built This</h2>
<p>
  Most backend tutorials show how to build APIs but none show what happens when things go wrong in production —
  a server crash mid-payment, a service going down during a transaction, duplicate orders on retry.
  I built this to implement and test real failure handling patterns rather than just read about them.
</p>

<hr/>

</body>
</html>
