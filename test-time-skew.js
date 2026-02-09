import https from 'https';

console.log("System Time:", new Date().toISOString());

https.get('https://www.google.com', (res) => {
    console.log("Google Date Header:", res.headers.date);

    const systemTime = new Date();
    const serverTime = new Date(res.headers.date);

    const diff = systemTime - serverTime;
    console.log("Time Difference (ms):", diff);
    console.log("Time Difference (hours):", diff / 1000 / 60 / 60);

    if (Math.abs(diff) > 300000) { // 5 minutes
        console.error("WARNING: Significant clock skew detected!");
    } else {
        console.log("Clock appears synchronized.");
    }
}).on('error', (e) => {
    console.error("Error fetching google.com:", e);
});
