// Use global fetch

async function testPipeline() {
  const serverUrl = 'http://localhost:5000';
  console.log(`Starting End-to-End Pipeline test at ${serverUrl}...`);

  // 1. Authenticate to get a token
  console.log("Authenticating as admin...");
  const loginRes = await fetch(`${serverUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin' })
  });

  if (!loginRes.ok) {
    throw new Error(`Login failed: ${await loginRes.text()}`);
  }

  const { token } = await loginRes.json() as { token: string };
  console.log("Authentication successful!");

  // 2. Build script storyboard in Telugu
  console.log("Creating script storyboard in Telugu...");
  const scriptRes = await fetch(`${serverUrl}/api/pipeline/script`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      releaseId: 2,
      language: 'Telugu'
    })
  });

  if (!scriptRes.ok) {
    throw new Error(`Script generation failed: ${await scriptRes.text()}`);
  }

  const { scriptId } = await scriptRes.json() as { scriptId: number };
  console.log(`Script storyboard created with ID: ${scriptId}`);

  // 3. Initiate Video Compilation
  console.log("Initiating video compilation job...");
  const videoRes = await fetch(`${serverUrl}/api/pipeline/video`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ scriptId })
  });

  if (!videoRes.ok) {
    throw new Error(`Video compilation scheduling failed: ${await videoRes.text()}`);
  }

  const { videoId } = await videoRes.json() as { videoId: number };
  console.log(`Video compilation started with ID: ${videoId}`);

  // 4. Connect to SSE compilation stream
  console.log("Connecting to SSE stream to start compilation...");
  const sseUrl = `${serverUrl}/api/pipeline/compile-stream/${videoId}`;
  const sseResponse = await fetch(sseUrl);

  if (!sseResponse.ok) {
    throw new Error(`Failed to connect to SSE: ${await sseResponse.text()}`);
  }

  console.log("Connected to compile-stream! Compilation started.");
  
  // Read stream events in background
  const reader = sseResponse.body?.getReader();
  if (reader) {
    (async () => {
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        console.log(`[SSE Update] ${text.trim()}`);
      }
    })().catch(console.error);
  }

  // 5. Poll Video Status
  console.log("Polling compilation status...");
  let attempts = 0;
  const maxAttempts = 30; // 30 attempts, 5s interval = 2.5 minutes max
  while (attempts < maxAttempts) {
    await new Promise(r => setTimeout(r, 5000));
    const statusRes = await fetch(`${serverUrl}/api/pipeline/${videoId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!statusRes.ok) {
      console.error(`Failed to fetch status: ${await statusRes.text()}`);
      continue;
    }

    const video = await statusRes.json() as { status: string; videoUrl: string };
    console.log(`[Attempt ${attempts + 1}/${maxAttempts}] Video status: ${video.status}`);

    if (video.status === 'COMPLETED') {
      console.log(`SUCCESS! Video compiled successfully. URL: ${video.videoUrl}`);
      return;
    } else if (video.status === 'FAILED') {
      throw new Error("Compilation FAILED. Check backend logs for details.");
    }

    attempts++;
  }

  throw new Error("Compilation timed out.");
}

testPipeline()
  .then(() => console.log("Test execution completed successfully!"))
  .catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  });
