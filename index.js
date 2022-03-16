const Wordle = require("./wordle")
const Toastify = require("toastify-js")
const GoogleTTS = require('./tts')

const timeRelaunchInSec = 10
let locale = 'fr'
let dico = {}

let instance = null
let numberOfLetter = parseInt("{{numberOfLetter}}") || 5
let numberOfGuesses = 6
let leaderboard = {}
let channelName = ''
let guessList = []

function displayLeaderboard(relaunch = true, specificTimeInSec = 0) {
    let list = Object.entries(leaderboard)
        .map(([player, score]) => {
            return {player: player, score: score }
        })
        .sort((a, b) => b.score - a.score)
        .map((entry) => `<li><strong>${entry.player}</strong> : ${entry.score} points</li>`)
        .slice(0, 5)
        .toString()
        .replaceAll(',', '')

    let leaderText = `<h1>🏆 LEADERBOARD</h1><ol>${list}</ol>`
    leaderText += relaunch ? `<p>⏱️ Prochain mot dans ${specificTimeInSec || timeRelaunchInSec}s...</p>` : ''

    Toastify({
        text: leaderText,
        duration: (specificTimeInSec || timeRelaunchInSec) * 1000,
        newWindow: true,
        className: "toast-leaderboard",
        escapeMarkup: false,
        gravity: "top", // `top` or `bottom`
        position: "center", // `left`, `center` or `right`
        callback: () => relaunch && init()
    }).showToast()
}

window.addEventListener('onWidgetLoad', async (obj) => {
    loadLocale()
    .then(_ => {
        instance = new Wordle({numberOfGuesses: numberOfGuesses, numberOfLetter: numberOfLetter, dico: dico[locale]})
        channelName = obj.detail.channel.username.toLowerCase()
        instance.getEventDispatcher().addEventListener('success', event => {
            leaderboard[event.detail.winner] = leaderboard[event.detail.winner] ? leaderboard[event.detail.winner] : 0
            leaderboard[event.detail.winner] += (numberOfGuesses - event.detail.tries)
            displayLeaderboard()
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
        setTimeout(checkGuess, 10)
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
   //channel author can ear the word with this command
   if (message === '!wordle_say' && player === channelName) return say()
   //channel author can display leaderboard
   if (message === '!wordle_podium' && player === channelName) return displayLeaderboard(false, 5)
   //channel author can change the current locale
   if (message.match(/^\!wordle_locale_[a-z]{2}$/g) && player === channelName) return locale = message.replace('!wordle_locale_', '')
   //channel author can change the number of guesses
   if (message.match(/^\!wordle_guess_[0-9]+$/g) && player === channelName) return numberOfGuesses = parseInt(message.replace('!wordle_guess_', ''))
   //channel author can change the number of letter
   if (message.match(/^\!wordle_letter_[0-9]+$/g) && player === channelName) return numberOfLetter = parseInt(message.replace('!wordle_letter_', ''))
   if (message.length != numberOfLetter) return //no need to check if the word is not the correct number of letter
   if (message.includes(' ')) return //no need to check if contains space
   guessList.push({message: message, player: player})
})

const init = () => {
    loadLocale()
    .then(_ => {
        instance.initBoard({numberOfGuesses: numberOfGuesses, numberOfLetter: numberOfLetter, dico: dico[locale]})
        say()
    })
}

const say = () => {
    GoogleTTS.textToSpeech(instance.rightGuessString, locale)
}

const loadLocale = async () => {
    let url = 'https://raw.githubusercontent.com/words/an-array-of-french-words/master/index.json'
    if (dico[locale]) return
    switch (locale) {
        case 'fr':
            url = 'https://raw.githubusercontent.com/words/an-array-of-french-words/master/index.json'
            break
        case 'en':
            url = 'https://raw.githubusercontent.com/words/an-array-of-english-words/master/index.json'
            break
        case 'es':
            url = 'https://raw.githubusercontent.com/words/an-array-of-spanish-words/master/index.json'
            break
        case 'de':
            url = 'https://raw.githubusercontent.com/creativecouple/all-the-german-words/master/woerter.json'
            break
    }    
    return fetch(url)
        .then((response) => response.json())
        .then((json) => dico[locale] = json)
}

const checkGuess = async () => {
    if (!guessList.length) return setTimeout(checkGuess, 10)
    let entry = guessList.pop()
    await instance.checkGuess(entry.message, entry.player)
    setTimeout(checkGuess, 10)
}