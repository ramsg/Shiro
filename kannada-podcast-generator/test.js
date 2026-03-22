require("dotenv").config()
const sdk = require("microsoft-cognitiveservices-speech-sdk")

const speechKey = process.env.AZURE_SPEECH_KEY
const region = process.env.AZURE_REGION

const speechConfig = sdk.SpeechConfig.fromSubscription(speechKey, region)

const audioConfig = sdk.AudioConfig.fromAudioFileOutput("test.mp3")

const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig)

synthesizer.speakTextAsync(

"ನಮಸ್ಕಾರ ಇದು ಪರೀಕ್ಷೆ",

result => {

console.log("Audio created")
synthesizer.close()

},

error => {

console.log(error)

}

)
