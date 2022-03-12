const Wordle = require("./wordle")

const numberOfGuesses = 6
const timeRelaunchInSec = 10

let instance = null
let leaderboard = {}
let channelName = ''

window.addEventListener('onWidgetLoad', (obj) => {
    instance = new Wordle({numberOfGuesses: numberOfGuesses})
    channelName = obj.detail.channel.username.toLowerCase()
    instance.getEventDispatcher().addEventListener('success', event => {
        console.log('success')
        leaderboard[event.detail.winner] = leaderboard[event.detail.winner] ? leaderboard[event.detail.winner] : 0
        leaderboard[event.detail.winner] += (numberOfGuesses - event.detail.tries)
        console.log(leaderboard)
        setTimeout(() => instance.initBoard(numberOfGuesses), timeRelaunchInSec * 1000)
   })
   instance.getEventDispatcher().addEventListener('failure', event => {
    console.log('failure')
    console.log(event.detail)
    setTimeout(() => instance.initBoard(numberOfGuesses), timeRelaunchInSec * 1000)
})
   instance.getEventDispatcher().addEventListener('error', event => {
    console.log('error')
    console.log(event.detail)
})
})

window.addEventListener('onEventReceived', (obj) => {
   if (obj.detail.listener !== "message") return
   let data = obj.detail.event.data
   const player = data["displayName"].toLowerCase()
   if (player == "streamelements") return
   
   let message = data["text"]
   //channel author can reset
   if (message.toLowerCase() === '!reset' && player === channelName) {
       instance.initBoard(numberOfGuesses)
       //will reinit leaderboard
   }
   if (message.length != 5) return //no need to check if the word is not 5 letter
   instance.checkGuess(message, player)
})

