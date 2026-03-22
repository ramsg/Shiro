async function generate(){

let script = document.getElementById("script").value

const res = await fetch("/generate",{

method:"POST",

headers:{

"Content-Type":"application/json"

},

body:JSON.stringify({script})

})

const blob = await res.blob()

const url = window.URL.createObjectURL(blob)

document.getElementById("player").src = url

}
