const Wordle = require("./wordle")
const Toastify = require("toastify-js")
const GoogleTTS = require('./tts')

const numberOfGuesses = 6
const numberOfLetter = parseInt("{{numberOfLetter}}") || 5
const timeRelaunchInSec = 10
const dico = "{{dico}}".split(',').map(word => word.trim().trim())

let instance = null
let currentNumberOfLetter = numberOfLetter
let currentNumberOfGuesses = numberOfGuesses
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
    instance = new Wordle({numberOfGuesses: numberOfGuesses, numberOfLetter: numberOfLetter, dico: dico})
    channelName = obj.detail.channel.username.toLowerCase()
    instance.getEventDispatcher().addEventListener('success', event => {
        leaderboard[event.detail.winner] = leaderboard[event.detail.winner] ? leaderboard[event.detail.winner] : 0
        leaderboard[event.detail.winner] += (numberOfGuesses - event.detail.tries)
        displayLeaderboard(event.detail.winner)
        Toastify({
            text: `Bravo 🏆 ${event.detail.winner}, le mot était '${instance.rightGuessString}'`,
            duration: timeRelaunchInSec * 1000,
            newWindow: true,
            className: "toast-leaderboard",
            gravity: "top", // `top` or `bottom`
            position: "center" // `left`, `center` or `right`
        }).showToast()
    })
    instance.getEventDispatcher().addEventListener('failure', event => {
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

window.addEventListener('onEventReceived', (obj) => {
   if (obj.detail.listener !== "message") return
   let data = obj.detail.event.data
   const player = data["displayName"].toLowerCase()
   if (player == "streamelements") return
   
   let message = data["text"].toLowerCase()
   //channel author can pass the word
   if (message === '!wordle_next' && player === channelName) return init()
   //channel author can reset leaderboard
   if (message === '!wordle_reset' && player === channelName) return leaderboard = {}
   if (message === '!wordle_say' && player === channelName) return say()
   if (message.match(/^\!wordle_guess[0-9]+$/g) && player === channelName) return currentNumberOfGuesses = parseInt(message.replace('!wordle_guess', ''))
   if (message.length != currentNumberOfLetter) return //no need to check if the word is not the correct number of letter
   if (message.includes(' ')) return //no need to check if contains space
   instance.checkGuess(message, player)
})

const init = () => {
    instance.initBoard({numberOfGuesses: currentNumberOfGuesses, numberOfLetter: currentNumberOfLetter})
    say()
}

const say = () => {
    GoogleTTS.textToSpeech(instance.rightGuessString, 'fr')
}