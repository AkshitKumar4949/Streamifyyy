# Streamify - Production Scalability Guide

## Current Status
- Stream.io: ✅ Auto-scales (managed service)
- Express Backend: ⚠️ Single instance, not scalable
- MongoDB: ⚠️ Basic setup, needs optimization
- Frontend: ✅ Static files, can be CDN'd

## Recommended Production Setup for Millions of Users

### 1. Backend Scalability (Express)

#### Option A: Docker + Kubernetes (Recommended for scale)
```bash
# Build Docker image
docker build -t streamify-backend .

# Deploy to Kubernetes or Docker Swarm
# Auto-scales based on CPU/memory
```

#### Option B: PM2 + Load Balancer (Simpler)
```bash
# Install PM2
npm install -g pm2

# Start multiple instances
pm2 start src/server.js -i 4  # 4 instances

# Load balance traffic across instances
# Use Nginx/HAProxy
```

### 2. Database Optimization (MongoDB)

#### Critical Indexes to Add:
```javascript
// In MongoDB user collection
db.users.createIndex({ email: 1 });
db.users.createIndex({ _id: 1, friends: 1 });

// In FriendRequest collection
db.friendrequests.createIndex({ recipient: 1, status: 1 });
db.friendrequests.createIndex({ sender: 1, status: 1 });
```

#### Move to MongoDB Atlas (Managed Service):
- Automatic backups
- Automatic scaling (sharding)
- High availability (replica sets)
- Better monitoring

### 3. Caching Layer (Redis)

```javascript
// Install Redis
npm install redis

// Cache friend lists, user data
// Reduces DB queries by 80%
```

### 4. Session Management

```javascript
// Use Redis for sessions instead of cookies
// Better for distributed systems
npm install connect-redis express-session
```

### 5. Frontend Optimization

- Use Vite's built-in code splitting ✅ (already using)
- Lazy load routes ✅ (already doing)
- Compress assets with gzip ✅ (Vite handles)
- Use CDN for static files (CloudFlare, CloudFront)

### 6. Environment Setup

#### .env (Backend)
```
NODE_ENV=production
PORT=5001
MONGODB_URI=<MongoDB Atlas connection>
REDIS_URI=<Redis connection>
JWT_SECRET_KEY=<secure key>
STREAM_API_KEY=<stream key>
STREAM_API_SECRET=<stream secret>
```

#### .env.production (Frontend)
```
VITE_STREAM_API_KEY=<stream key>
VITE_API_BASE_URL=https://api.yourdomain.com
```

## Scaling Checklist

- [ ] Add database indexes
- [ ] Move to MongoDB Atlas
- [ ] Set up Redis cache
- [ ] Configure PM2 or Docker
- [ ] Set up Nginx/Load balancer
- [ ] Enable HTTPS/SSL
- [ ] Configure rate limiting
- [ ] Add API monitoring (Sentry, DataDog)
- [ ] Set up logging (Winston, Morgan)
- [ ] Configure CDN for static assets
- [ ] Add health check endpoints
- [ ] Set up auto-backup strategy

## What Stream.io Provides (No config needed)

✅ Handles up to millions of concurrent connections
✅ Auto-scaling
✅ 99.99% uptime SLA
✅ Connection pooling
✅ Message queuing
✅ Video infrastructure

## Quick Production Fixes (Can do now)

### 1. Add Database Indexes
```javascript
// Backend: Add this to a setup script
import User from './models/User.js'
import FriendRequest from './models/FriendRequest.js'

export const setupIndexes = async () => {
  await User.collection.createIndex({ email: 1 })
  await User.collection.createIndex({ _id: 1, friends: 1 })
  await FriendRequest.collection.createIndex({ recipient: 1, status: 1 })
  await FriendRequest.collection.createIndex({ sender: 1, status: 1 })
  console.log("Indexes created successfully")
}
```

### 2. Add Rate Limiting
```bash
npm install express-rate-limit
```

### 3. Add Request Logging
```bash
npm install morgan
```

## Estimated Capacity

| Component | Capacity | Bottleneck |
|-----------|----------|-----------|
| Stream.io | ∞ (unlimited) | None |
| Express (1 instance) | ~1,000 req/s | CPU/Memory |
| Express (4 instances) | ~4,000 req/s | Still backend |
| MongoDB (basic) | ~10,000 ops/s | Sharding needed for more |
| With Redis cache | ~50,000+ req/s | Backend becomes main |

**Conclusion**: For millions of users, you need load balancers + multiple backend instances + Redis cache + MongoDB Atlas sharding.

Stream.io itself never becomes a bottleneck - they handle the real-time infrastructure automatically!
