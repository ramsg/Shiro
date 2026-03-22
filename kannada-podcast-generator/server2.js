require("dotenv").config()

const express = require("express")
const bodyParser = require("body-parser")
const sdk = require("microsoft-cognitiveservices-speech-sdk")
const ffmpeg = require("fluent-ffmpeg")
const fs = require("fs")
const { v4: uuidv4 } = require("uuid")

const app = express()

app.use(bodyParser.json())
app.use(express.static("public"))

const speechKey = process.env.AZURE_SPEECH_KEY
const region = process.env.AZURE_REGION

// -----------------------------
// Progress bar for terminal
// -----------------------------

function progress(percent, message) {

const width = 10
const filled = Math.round(width * percent / 100)

const bar =
"█".repeat(filled) +
"░".repeat(width - filled)

console.log(`[${bar}] ${percent}%  ${message}`)

}

// -----------------------------
// Parse HOST / EXPERT dialogue
// -----------------------------

function parseDialogue(text) {

let lines = text.split("\n")

let dialogue = []

for (let line of lines) {

line = line.trim()

if (line.startsWith("HOST:")) {

dialogue.push({
voice: "kn-IN-GaganNeural",
text: line.replace("HOST:", "").trim()
})

}

else if (line.startsWith("EXPERT:")) {

dialogue.push({
voice: "kn-IN-SapnaNeural",
text: line.replace("EXPERT:", "").trim()
})

}

}

return dialogue

}

// -----------------------------
// Build SSML for Azure
// -----------------------------

function buildSSML(dialogue){

let ssml = `<speak version="1.0" xml:lang="kn-IN">`

dialogue.forEach(d => {

ssml += `
<voice name="${d.voice}">
${d.text}
<break time="600ms"/>
</voice>
`

})

ssml += "</speak>"

return ssml

}

// -----------------------------
// Generate Podcast
// -----------------------------

app.post("/generate", async (req, res) => {

try {

progress(10, "Request received")

console.log("Request body:", req.body)

let script = req.body.script

if (!script) {
return res.status(400).send("No script provided")
}

let dialogue = parseDialogue(script)

if (dialogue.length === 0) {
return res.status(400).send("No HOST/EXPERT lines detected")
}

let ssml = buildSSML(dialogue)

let id = uuidv4()

let voiceFile = `output/voice_${id}.mp3`
let finalFile = `output/podcast_${id}.mp3`

const speechConfig = sdk.SpeechConfig.fromSubscription(speechKey, region)

speechConfig.speechSynthesisOutputFormat =
sdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3

const audioConfig = sdk.AudioConfig.fromAudioFileOutput(voiceFile)

const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig)

progress(30, "Azure speech synthesis")

synthesizer.speakSsmlAsync(

ssml,

result => {

synthesizer.close()

if (result.reason === sdk.ResultReason.Canceled) {

const cancellation = sdk.CancellationDetails.fromResult(result)

console.log("Azure cancellation reason:", cancellation.reason)
console.log("Azure error details:", cancellation.errorDetails)

return res.status(500).send("Azure synthesis canceled")

}

progress(60, "Voice file created")

// Verify file exists and is not empty

if (!fs.existsSync(voiceFile) || fs.statSync(voiceFile).size === 0) {

console.log("Voice file invalid")

return res.status(500).send("Voice generation failed")

}

progress(80, "Mixing background music")

ffmpeg()
.input("audio/background.mp3")
.input(voiceFile)
.complexFilter([
"[0:a]volume=0.25[a0]",
"[1:a]volume=1[a1]",
"[a0][a1]amix=inputs=2:duration=longest"
])
.output(finalFile)
.on("end", () => {

progress(100, "Podcast ready")

console.log("Output file:", finalFile)

res.download(finalFile)

})
.on("error", err => {

console.log("FFmpeg error:", err)

res.status(500).send("Audio mixing failed")

})
.run()

},

error => {

console.log("Azure error:", error)

res.status(500).send("Speech synthesis error")

}

)

}

catch (err) {

console.log("Server error:", err)

res.status(500).send("Internal server error")

}

})

// -----------------------------

app.listen(3000, () => {

console.log("Podcast generator running on http://localhost:3000")

})
