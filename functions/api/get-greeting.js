const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: cors });
}

function buildScript({ hour, temp, condition, humidity, wind, dayName, isSunday, dateStr, rainProbability, locationName }) {
  let greeting;
  if (hour >= 5 && hour < 12)       greeting = 'ಶುಭ ಬೆಳಿಗ್ಗೆ';
  else if (hour >= 12 && hour < 17) greeting = 'ಶುಭ ಮಧ್ಯಾಹ್ನ';
  else if (hour >= 17 && hour < 21) greeting = 'ಶುಭ ಸಂಜೆ';
  else                               greeting = 'ಶುಭ ರಾತ್ರಿ';

  const dayLabel  = isSunday ? 'ಇಂದು ಭಾನುವಾರ' : `ಇಂದು ${dayName}`;
  const dateLabel = dateStr     ? `, ${dateStr}` : '';
  const locLabel  = locationName ? ` ${locationName} ಪ್ರದೇಶದಿಂದ.` : '.';

  let s = `${greeting}! ${dayLabel}${dateLabel}${locLabel} `;

  if (temp !== undefined && temp !== null) {
    s += `ಇಂದಿನ ಹವಾಮಾನ: ತಾಪಮಾನ ${Math.round(temp)} ಡಿಗ್ರಿ ಸೆಲ್ಸಿಯಸ್.`;
    if (condition) s += ` ${condition}.`;
    if (humidity)  s += ` ಆರ್ದ್ರತೆ ${Math.round(humidity)} ಶೇಕಡ.`;
    if (wind)      s += ` ಗಾಳಿ ವೇಗ ಗಂಟೆಗೆ ${Math.round(wind)} ಕಿಲೋಮೀಟರ್.`;
    if (rainProbability !== null && rainProbability !== undefined) {
      if (rainProbability >= 70)
        s += ` ಇಂದು ಮಳೆ ಬೀಳುವ ಸಾಧ್ಯತೆ ಹೆಚ್ಚಾಗಿದೆ, ${Math.round(rainProbability)} ಶೇಕಡ.`;
      else if (rainProbability >= 30)
        s += ` ಮಳೆ ಬೀಳುವ ಸಾಧ್ಯತೆ ${Math.round(rainProbability)} ಶೇಕಡ ಇದೆ.`;
      else
        s += ` ಇಂದು ಮಳೆ ಬೀಳುವ ಸಾಧ್ಯತೆ ಕಡಿಮೆ.`;
    }
  } else {
    s += 'ಹವಾಮಾನ ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ.';
  }
  return s;
}

// Google Cloud TTS - synthesize Kannada speech
async function synthesize(text, apiKey) {
  const res = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text },
        voice: {
          languageCode: 'kn-IN',
          name: 'kn-IN-Standard-A',
          ssmlGender: 'FEMALE'
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: 0.95,
          pitch: 0
        }
      })
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error('Google TTS error:', res.status, err);
    throw new Error(`Google TTS failed (${res.status}): ${err.error?.message || JSON.stringify(err)}`);
  }

  const data = await res.json();
  return data.audioContent; // base64-encoded MP3
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: cors });
  }

  try {
    const body = await request.json();
    const script = buildScript(body);

    if (!env.GOOGLE_TTS_KEY) {
      return json({ error: 'Google TTS API key not configured' }, 500);
    }

    console.log('Greeting script:', script);

    // Synthesize via Google Cloud TTS
    const audioBase64 = await synthesize(script, env.GOOGLE_TTS_KEY);

    return json({ success: true, audioBase64, script });
  } catch (e) {
    console.error('Greeting error:', e);
    return json({ error: e.message }, 500);
  }
}
