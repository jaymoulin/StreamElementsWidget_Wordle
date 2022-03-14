const Wordle = require("./wordle")
const Toastify = require("toastify-js")
const GoogleTTS = require('./tts')

const numberOfGuesses = 6
const timeRelaunchInSec = 10

let instance = null
let leaderboard = {}
let channelName = ''

function displayLeaderboard(winner) {
    let list = Object.entries(leaderboard)
        .map(([player, score]) => {
            return {player: player, score: score }
        })
        .sort((a, b) => b.score - a.score)
        .map((entry) => `<li><strong>${entry.player}</strong> : ${entry.score} points</li>`)
        .slice(0, 5)
        .toString()
        .replaceAll(',', '')

    let leaderText = `<h1>🏆 LEADERBOARD</h1><ol>${list}</ol><p>⏱️ Prochain mot dans 10s...</p>`

    Toastify({
        text: leaderText,
        duration: timeRelaunchInSec * 1000,
        newWindow: true,
        className: "toast-leaderboard",
        escapeMarkup: false,
        gravity: "top", // `top` or `bottom`
        position: "center", // `left`, `center` or `right`
        callback: () => init()
    }).showToast()
}

window.addEventListener('onWidgetLoad', (obj) => {
    instance = new Wordle({numberOfGuesses: numberOfGuesses})
    channelName = obj.detail.channel.username.toLowerCase()
    instance.getEventDispatcher().addEventListener('success', event => {
        leaderboard[event.detail.winner] = leaderboard[event.detail.winner] ? leaderboard[event.detail.winner] : 0
        leaderboard[event.detail.winner] += (numberOfGuesses - event.detail.tries)
        displayLeaderboard(event.detail.winner)
    })
    instance.getEventDispatcher().addEventListener('failure', event => {
        setTimeout(() => init(), timeRelaunchInSec * 1000)
        displayLeaderboard()
        Toastify({
            text: event.detail.message,
            duration: timeRelaunchInSec * 1000,
            newWindow: true,
            className: "toast-error",
            gravity: "top", // `top` or `bottom`
            position: "center" // `left`, `center` or `right`
        }).showToast()
    })
    instance.getEventDispatcher().addEventListener('error', event => {
        Toastify({
            text: event.detail.message,
            duration: 2 * 1000,
            newWindow: true,
            className: "toast-error",
            gravity: "top", // `top` or `bottom`
            position: "center" // `left`, `center` or `right`
        }).showToast()
    })
})

window.addEventListener('onEventReceived', async (obj) => {
   if (obj.detail.listener !== "message") return
   let data = obj.detail.event.data
   const player = data["displayName"].toLowerCase()
   if (player == "streamelements") return
   
   let message = data["text"].toLowerCase()
   //channel author can reset
   if (message === '!reset' && player === channelName) init()
   if (message.length != 5) return //no need to check if the word is not 5 letter
   if (message.includes(' ')) return //no need to check if contains space
   await instance.checkGuess(message, player)
})

function init() {
    instance.initBoard(numberOfGuesses)
    GoogleTTS.textToSpeech(instance.rightGuessString, 'fr')
}