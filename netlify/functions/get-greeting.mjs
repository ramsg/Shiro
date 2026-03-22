const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders });
}

function buildGreetingScript({ hour, temp, condition, humidity, wind, dayName, isSunday, dateStr, rainProbability, locationName }) {
  let greeting;
  if (hour >= 5 && hour < 12)       greeting = "ಶುಭ ಬೆಳಿಗ್ಗೆ";
  else if (hour >= 12 && hour < 17) greeting = "ಶುಭ ಮಧ್ಯಾಹ್ನ";
  else if (hour >= 17 && hour < 21) greeting = "ಶುಭ ಸಂಜೆ";
  else                               greeting = "ಶುಭ ರಾತ್ರಿ";

  const dayLabel = isSunday ? "ಇಂದು ಭಾನುವಾರ" : `ಇಂದು ${dayName}`;
  const dateLabel = dateStr ? `, ${dateStr}` : "";
  const locLabel = locationName ? ` ${locationName} ಪ್ರದೇಶದಿಂದ.` : ".";

  let script = `${greeting}! ${dayLabel}${dateLabel}${locLabel}\n`;

  // Weather
  if (temp !== undefined && temp !== null) {
    script += `ಇಂದಿನ ಹವಾಮಾನ: ತಾಪಮಾನ ${Math.round(temp)} ಡಿಗ್ರಿ ಸೆಲ್ಸಿಯಸ್.`;
    if (condition) script += ` ${condition}.`;
    if (humidity)  script += ` ಆರ್ದ್ರತೆ ${Math.round(humidity)} ಶೇಕಡ.`;
    if (wind)      script += ` ಗಾಳಿ ವೇಗ ಗಂಟೆಗೆ ${Math.round(wind)} ಕಿಲೋಮೀಟರ್.`;

    // Rain probability
    if (rainProbability !== null && rainProbability !== undefined) {
      if (rainProbability >= 70)
        script += ` ಇಂದು ಮಳೆ ಬೀಳುವ ಸಾಧ್ಯತೆ ಹೆಚ್ಚಾಗಿದೆ, ${Math.round(rainProbability)} ಶೇಕಡ.`;
      else if (rainProbability >= 30)
        script += ` ಮಳೆ ಬೀಳುವ ಸಾಧ್ಯತೆ ${Math.round(rainProbability)} ಶೇಕಡ ಇದೆ.`;
      else
        script += ` ಇಂದು ಮಳೆ ಬೀಳುವ ಸಾಧ್ಯತೆ ಕಡಿಮೆ.`;
    }
    script += "\n";
  } else {
    script += "ಹವಾಮಾನ ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ.\n";
  }

  return script;
}

export default async (req, context) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.text();
    const { hour, temp, condition, humidity, wind, dayName, isSunday, dateStr, rainProbability, locationName } = JSON.parse(body || '{}');

    const speechKey = process.env.AZURE_SPEECH_KEY;
    const speechRegion = process.env.AZURE_REGION;
    if (!speechKey || !speechRegion) {
      return json({ error: 'Azure Speech credentials not configured' }, 500);
    }

    const script = buildGreetingScript({ hour, temp, condition, humidity, wind, dayName, isSunday, dateStr, rainProbability, locationName });

    // Get Azure token
    const tokenRes = await fetch(
      `https://${speechRegion}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
      { method: 'POST', headers: { 'Ocp-Apim-Subscription-Key': speechKey } }
    );
    if (!tokenRes.ok) return json({ error: 'Failed to get Azure token' }, 500);
    const accessToken = await tokenRes.text();

    // Synthesize
    const ssml = `<speak version='1.0' xml:lang='kn-IN'>
      <voice xml:lang='kn-IN' xml:gender='Female' name='kn-IN-SapnaNeural'>
        ${script.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
      </voice>
    </speak>`;

    const ttsRes = await fetch(
      `https://${speechRegion}.tts.speech.microsoft.com/cognitiveservices/v1`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3'
        },
        body: ssml
      }
    );
    if (!ttsRes.ok) {
      const errText = await ttsRes.text();
      return json({ error: `Azure TTS failed: ${errText}` }, 500);
    }

    const audioBuffer = await ttsRes.arrayBuffer();
    const base64Audio = Buffer.from(new Uint8Array(audioBuffer)).toString('base64');

    return json({ success: true, audioBase64: base64Audio, script });
  } catch (error) {
    console.error('Error in get-greeting:', error);
    return json({ error: error.message }, 500);
  }
};
