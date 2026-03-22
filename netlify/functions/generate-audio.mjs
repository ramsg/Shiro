import * as sdk from 'microsoft-cognitiveservices-speech-sdk';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

function isValidAdminToken(token) {
  return token === process.env.ADMIN_PASSWORD;
}

async function generateAudioFromScript(script) {
  return new Promise((resolve, reject) => {
    try {
      const speechConfig = sdk.SpeechConfig.fromSubscription(
        process.env.AZURE_SPEECH_KEY,
        process.env.AZURE_REGION
      );

      // Configure for Kannada language
      speechConfig.speechSynthesisLanguage = 'kn-IN';

      // Use file output for audio
      const audioConfig = sdk.AudioConfig.fromDefaultSpeakerOutput();
      const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

      synthesizer.speakTextAsync(
        script,
        result => {
          synthesizer.close();
          if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
            resolve(result.audioData);
          } else if (result.reason === sdk.ResultReason.Canceled) {
            reject(new Error(`Speech synthesis canceled: ${result.errorDetails}`));
          }
        },
        error => {
          synthesizer.close();
          reject(error);
        }
      );
    } catch (error) {
      reject(error);
    }
  });
}

async function uploadToBunnyCDN(audioBuffer, filePath) {
  const uploadUrl = `https://${process.env.BUNNY_FTP_HOSTNAME}/${process.env.BUNNY_STORAGE_ZONE}/audio/${filePath}`;

  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'AccessKey': process.env.BUNNY_CDN_API_KEY,
      'Content-Type': 'audio/mpeg'
    },
    body: audioBuffer
  });

  if (!response.ok) {
    throw new Error(`Bunny upload failed with status ${response.status}`);
  }

  // Return public CDN URL
  return `https://${process.env.BUNNY_STORAGE_ZONE}.b-cdn.net/audio/${filePath}`;
}

async function getManifest() {
  try {
    const url = `https://${process.env.BUNNY_STORAGE_ZONE}.b-cdn.net/manifest.json`;
    const res = await fetch(url);
    if (res.ok) {
      return await res.json();
    }
  } catch (error) {
    console.log('Manifest not found, starting fresh');
  }
  return { daily: {}, weekly: {} };
}

async function saveManifest(manifest) {
  const uploadUrl = `https://${process.env.BUNNY_FTP_HOSTNAME}/${process.env.BUNNY_STORAGE_ZONE}/manifest.json`;

  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'AccessKey': process.env.BUNNY_CDN_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(manifest)
  });

  if (!response.ok) {
    throw new Error(`Failed to save manifest with status ${response.status}`);
  }
}

export default async (req, context) => {
  if (req.method === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  try {
    // Verify admin token
    const token = req.headers.authorization?.split(' ')[1];
    if (!isValidAdminToken(token)) {
      return { statusCode: 403, body: JSON.stringify({ error: 'Unauthorized' }), headers };
    }

    const body = JSON.parse(req.body || '{}');
    const { type, day, script } = body;

    if (!type || !day || !script) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields: type, day, script' }), headers };
    }

    console.log(`Generating audio for ${type}/${day}...`);

    // 1. Generate audio using Azure Speech SDK
    console.log('Calling Azure Speech Services...');
    const audioBuffer = await generateAudioFromScript(script);
    console.log(`Audio generated: ${audioBuffer.length} bytes`);

    // 2. Upload to Bunny CDN
    console.log('Uploading to Bunny CDN...');
    const fileName = `${type}/${day}.mp3`;
    const cdnUrl = await uploadToBunnyCDN(audioBuffer, fileName);
    console.log(`Uploaded to: ${cdnUrl}`);

    // 3. Update manifest
    console.log('Updating manifest...');
    const manifest = await getManifest();
    if (!manifest[type]) manifest[type] = {};
    manifest[type][day] = {
      generatedAt: new Date().toISOString(),
      url: cdnUrl,
      size: audioBuffer.length
    };
    await saveManifest(manifest);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, url: cdnUrl, size: audioBuffer.length }),
      headers
    };
  } catch (error) {
    console.error('Error in generate-audio:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
      headers
    };
  }
};
