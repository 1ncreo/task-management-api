const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; 
  
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ message: 'Invalid token.' });
  }
};

const cacheMiddleware = (duration) => {
  return (req, res, next) => {

    if (req.method !== 'GET') {
      return next();
    }

    const key = `__taskapi__${req.originalUrl || req.url}__${req.user.id}`;

    if (req.app.get('redisClient')) {
      const redisClient = req.app.get('redisClient');
      
      redisClient.get(key).then(cachedResponse => {
        if (cachedResponse) {
          const parsedResponse = JSON.parse(cachedResponse);
          return res.status(200).json(parsedResponse);
        } else {
          const originalSend = res.send;

          res.send = function(body) {
            res.send = originalSend;

            redisClient.setEx(key, duration, body);

            return originalSend.call(this, body);
          };
          
          next();
        }
      }).catch(error => {
        console.error('Redis cache error:', error);
        next();
      });
    } 
    else if (global.cache) {
      const cachedResponse = global.cache.get(key);
      
      if (cachedResponse) {
        return res.status(200).json(cachedResponse);
      } else {
        const originalJson = res.json;

        res.json = function(body) {
          res.json = originalJson;

          global.cache.set(key, body, duration);

          return originalJson.call(this, body);
        };
        
        next();
      }
    } else {
      next();
    }
  };
};

const clearUserCache = (userId) => {
  if (global.redisClient) {

    const pattern = `__taskapi__*__${userId}`;
    global.redisClient.keys(pattern).then(keys => {
      if (keys.length > 0) {
        return global.redisClient.del(keys);
      }
    }).catch(console.error);
  } else if (global.cache) {
    const keys = global.cache.keys();
    keys.forEach(key => {
      if (key.includes(`__${userId}`)) {
        global.cache.del(key);
      }
    });
  }
};

module.exports = {
  authenticateToken,
  cacheMiddleware,
  clearUserCache
};