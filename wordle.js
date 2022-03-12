const WORDS = require("./dico/fr")

class Wordle {
    constructor(settings) {
        this.settings = Object.assign({numberOfGuesses: 6}, settings)
        this.initBoard(this.settings.numberOfGuesses)
    }
    
    initBoard(numberOfGuesses) {
        this.guessesRemaining = numberOfGuesses
        this.rightGuessString = this.removeAccents(WORDS[Math.floor(Math.random() * WORDS.length)])
        console.log(`Wordle answer : ${this.rightGuessString}`)

        this.initKeyBoard()
        let board = document.getElementById("game-board")
        board.innerHTML = ''
    
        for (let i = 0; i < this.settings.numberOfGuesses; i++) {
            let row = document.createElement("div")
            row.className = "letter-row"
            
            for (let j = 0; j < 5; j++) {
                let box = document.createElement("div")
                box.className = "letter-box"
                row.appendChild(box)
            }
    
            board.appendChild(row)
        }
    }

    initKeyBoard() {
        for (let elem of document.getElementsByClassName("keyboard-button")) {
            elem.style.backgroundColor = 'white'
        }
        return this
    }

    shadeKeyBoard(letter, color) {
        for (let elem of document.getElementsByClassName("keyboard-button")) {
            if (elem.textContent !== letter) continue
            let oldColor = elem.style.backgroundColor
            if (oldColor === 'green') return
            if (oldColor === 'yellow' && color !== 'green') return
            elem.style.backgroundColor = color
            break
        }
    }
    
    async checkGuess(guess, player) {
        if (this.guessesRemaining <= 0) return
        guess = this.removeAccents(guess)
        
        let currentGuess = Array.from(this.removeAccents(guess))
        
        if (guess.length != 5) return this.fire('error', {message: `"${guess}" has not enough letters`})
        if (!WORDS.map(this.removeAccents).includes(guess)) return this.fire('error', {message: `"${guess}" is not in list!`})
            
        await this.animateWrite(currentGuess)
        .then(_ => {
            let row = document.getElementsByClassName("letter-row")[this.settings.numberOfGuesses - this.guessesRemaining]
            let rightGuess = Array.from(this.rightGuessString)
            let promises = []
            for (let i = 0; i < 5; i++) {
                let letterColor = ''
                let box = row.children[i]
                let letter = currentGuess[i]
                
                let letterPosition = rightGuess.indexOf(currentGuess[i])
                // is letter in the correct guess
                if (letterPosition === -1) {
                    letterColor = 'grey'
                } else {
                    // now, letter is definitely in word
                    // if letter index and right guess index are the same
                    // letter is in the right position 
                    letterColor = (currentGuess[i] === rightGuess[i]) ? 'green' : 'yellow'
                    rightGuess[letterPosition] = "#"
                }
        
                let delay = 150 * i
                promises.push(new Promise((resolve) => {
                    setTimeout(
                        function () {
                            //flip box
                            this.animateCSS(box, 'flipInX')
                            //shade box
                            box.style.backgroundColor = letterColor
                            this.shadeKeyBoard(letter, letterColor)
                            resolve()
                        }.bind(this),
                        delay
                    )
                }))
            }
            return Promise.all(promises)
        })
        .then(_ => {
            if (guess === this.rightGuessString) {
                this.fire('success', {message: "You guessed right! Game over!", tries: this.settings.numberOfGuesses - this.guessesRemaining, winner: player})
                this.guessesRemaining = 0
                return this
            } else {
                this.guessesRemaining--
                if (this.guessesRemaining === 0) {
                    this.fire('failure', {message: `You've run out of guesses! Game over!\nThe right word was: "${this.rightGuessString}"`})
                }
            }
        })
    }
    
    animateCSS(element, animation, prefix = 'animate__') {
        // We create a Promise and return it
        return new Promise((resolve, reject) => {
            const animationName = `${prefix}${animation}`;
            const node = element
            node.style.setProperty('--animate-duration', '0.3s');
            
            node.classList.add(`${prefix}animated`, animationName);

            // When the animation ends, we clean the classes and resolve the Promise
            function handleAnimationEnd(event) {
                event.stopPropagation();
                node.classList.remove(`${prefix}animated`, animationName);
                resolve('Animation ended');
            }

            node.addEventListener('animationend', handleAnimationEnd, {once: true});
        })
    }
    
    animateWrite(word) {
        let promises = []
        let nextLetter = 0
        for (let i = 0; i < word.length; i++) {
            const letter = word[i].toLowerCase()
            let delay = 50 * i
            promises.push(
                new Promise((resolve, _) => {
                    setTimeout(
                        function () {
                            let row = document.getElementsByClassName("letter-row")[this.settings.numberOfGuesses - this.guessesRemaining]
                            let box = row.children[nextLetter++]
                            this.animateCSS(box, "pulse")
                            box.textContent = letter
                            box.classList.add("filled-box")
                            resolve()
                        }.bind(this),
                        delay
                    )
                })
            )
        }
        return Promise.all(promises)
    }

    fire(name, settings) {
        return this.getEventDispatcher().dispatchEvent(new CustomEvent(name, {detail: settings}))
    }

    removeAccents(text) {
        return text.toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    }

    getEventDispatcher() {
        return document.getElementById("game-board")
    }
}

module.exports = Wordle