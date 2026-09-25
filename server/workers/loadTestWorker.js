const { Worker } = require('bullmq');
const axios = require('axios');
const http = require('http');
const https = require('https');
const { redisConfig } = require('../config/redis');
const Test = require('../models/Test');

const httpAgent = new http.Agent({ keepAlive: true, maxSockets: 500 });
const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 500 });

const executeBatchRequests = async (targetUrl, method, headers, body, concurrency) => {
  const promises = [];
  const startTime = Date.now();

  for (let i = 0; i < concurrency; i++) {
    const reqStart = Date.now();
    const p = axios({
      method: method || 'GET',
      url: targetUrl,
      headers: headers || {},
      data: body || null,
      httpAgent,
      httpsAgent,
      timeout: 5000,
    })
      .then((res) => ({
        status: res.status,
        latency: Date.now() - reqStart,
        success: true,
      }))
      .catch((err) => ({
        status: err.response ? err.response.status : 500,
        latency: Date.now() - reqStart,
        success: false,
      }));

    promises.push(p);
  }

  const results = await Promise.all(promises);
  return { results, batchDuration: Date.now() - startTime };
};

const loadTestWorker = new Worker(
  'load-test-queue',
  async (job) => {
    const { testId, targetUrl, method, headers, body, concurrencySteps } = job.data;

    await Test.findByIdAndUpdate(testId, { status: 'RUNNING', startedAt: new Date() });

    let totalRequests = 0;
    let successfulRequests = 0;
    let failedRequests = 0;
    const latencies = [];
    const statusCodesMap = new Map();

    const steps = concurrencySteps || [
      { concurrency: 10, duration: 5 },
      { concurrency: 50, duration: 5 },
      { concurrency: 100, duration: 5 },
    ];

    for (const step of steps) {
      const stepEndTime = Date.now() + step.duration * 1000;

      while (Date.now() < stepEndTime) {
        const { results } = await executeBatchRequests(
          targetUrl,
          method,
          headers,
          body,
          step.concurrency
        );

        for (const res of results) {
          totalRequests++;
          latencies.push(res.latency);

          if (res.success) {
            successfulRequests++;
          } else {
            failedRequests++;
          }

          const currentCount = statusCodesMap.get(String(res.status)) || 0;
          statusCodesMap.set(String(res.status), currentCount + 1);
        }
      }
    }

    latencies.sort((a, b) => a - b);
    const avgLatency = latencies.length
      ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
      : 0;
    const p95Index = Math.floor(latencies.length * 0.95);
    const p99Index = Math.floor(latencies.length * 0.99);
    const p95Latency = latencies[p95Index] || 0;
    const p99Latency = latencies[p99Index] || 0;
    const errorRate = totalRequests ? Number(((failedRequests / totalRequests) * 100).toFixed(2)) : 0;

    let reliabilityStatus = 'HEALTHY';
    if (errorRate > 10 || p95Latency > 1500) {
      reliabilityStatus = 'CRITICAL';
    } else if (errorRate > 3 || p95Latency > 500) {
      reliabilityStatus = 'WARNING';
    }

    await Test.findByIdAndUpdate(testId, {
      status: 'COMPLETED',
      totalRequests,
      successfulRequests,
      failedRequests,
      averageLatency: avgLatency,
      p95Latency,
      p99Latency,
      errorRate,
      statusCodes: Object.fromEntries(statusCodesMap),
      reliabilityStatus,
      completedAt: new Date(),
    });

    console.log(`[Load Engine] Completed Test ID: ${testId} | Status: ${reliabilityStatus}`);
  },
  { connection: redisConfig }
);

module.exports = loadTestWorker;