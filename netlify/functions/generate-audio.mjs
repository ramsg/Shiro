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

async function commitToGitHub(filePath, fileContent, message) {
  const [owner, repo] = process.env.GITHUB_REPO.split('/');
  const branch = 'main';

  // Get current file SHA if it exists (needed for updates)
  let sha = null;
  try {
    const getRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
      {
        headers: {
          'Authorization': `token ${process.env.GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );
    if (getRes.ok) {
      const data = await getRes.json();
      sha = data.sha;
    }
  } catch (error) {
    console.log('File does not exist yet, creating new');
  }

  // Encode content to base64
  const encodedContent = Buffer.from(fileContent).toString('base64');

  // Commit to GitHub
  const commitRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: message,
        content: encodedContent,
        branch: branch,
        ...(sha && { sha })
      })
    }
  );

  if (!commitRes.ok) {
    const error = await commitRes.json();
    throw new Error(`GitHub commit failed: ${error.message}`);
  }

  return true;
}

async function getManifest() {
  try {
    const res = await fetch('/.netlify/functions/get-manifest');
    if (res.ok) {
      return await res.json();
    }
  } catch (error) {
    console.log('Manifest not found, starting fresh');
  }
  return { daily: {}, weekly: {} };
}

async function saveManifest(manifest) {
  await commitToGitHub(
    'audio/manifest.json',
    JSON.stringify(manifest, null, 2),
    'Update audio manifest with generated files'
  );
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

    // 2. Commit audio to GitHub
    console.log('Committing to GitHub...');
    const fileName = `${type}/${day}.mp3`;
    const base64Audio = Buffer.from(audioBuffer).toString('base64');
    await commitToGitHub(
      `audio/${fileName}`,
      base64Audio,
      `Generate audio for ${type} ${day}`
    );
    console.log(`Committed to: audio/${fileName}`);

    // 3. Update manifest
    console.log('Updating manifest...');
    const manifest = await getManifest();
    if (!manifest[type]) manifest[type] = {};
    manifest[type][day] = {
      generatedAt: new Date().toISOString(),
      url: `/audio/${fileName}`,
      size: audioBuffer.length
    };
    await saveManifest(manifest);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, url: `/audio/${fileName}`, size: audioBuffer.length }),
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
