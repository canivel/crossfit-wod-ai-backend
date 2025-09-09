export const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log the incoming request
  console.log(`📥 ${req.method} ${req.originalUrl}`, {
    timestamp: new Date().toISOString(),
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length'),
    ...(req.body && Object.keys(req.body).length > 0 && { 
      bodyKeys: Object.keys(req.body) 
    })
  });

  // Override res.json to log responses
  const originalJson = res.json;
  res.json = function(body) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Log the response
    console.log(`📤 ${req.method} ${req.originalUrl}`, {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      responseSize: JSON.stringify(body).length + ' bytes',
      ...(res.statusCode >= 400 && { error: true })
    });
    
    return originalJson.call(this, body);
  };

  next();
};