(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

window.addEventListener('onWidgetLoad', async (obj) => {
    loadLocale()
    .then(_ => {
        instance = new Wordle({numberOfGuesses: numberOfGuesses, numberOfLetter: numberOfLetter, dico: dico[locale]})
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
   //channel author can change the current locale
   if (message.match(/^\!wordle_locale_[a-z]{2}$/g) && player === channelName) return locale = message.replace('!wordle_locale_', '')
   //channel author can change the number of guesses
   if (message.match(/^\!wordle_guess_[0-9]+$/g) && player === channelName) return numberOfGuesses = parseInt(message.replace('!wordle_guess_', ''))
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
},{"./tts":3,"./wordle":4,"toastify-js":2}],2:[function(require,module,exports){
/*!
 * Toastify js 1.11.2
 * https://github.com/apvarun/toastify-js
 * @license MIT licensed
 *
 * Copyright (C) 2018 Varun A P
 */
(function(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.Toastify = factory();
  }
})(this, function(global) {
  // Object initialization
  var Toastify = function(options) {
      // Returning a new init object
      return new Toastify.lib.init(options);
    },
    // Library version
    version = "1.11.2";

  // Set the default global options
  Toastify.defaults = {
    oldestFirst: true,
    text: "Toastify is awesome!",
    node: undefined,
    duration: 3000,
    selector: undefined,
    callback: function () {
    },
    destination: undefined,
    newWindow: false,
    close: false,
    gravity: "toastify-top",
    positionLeft: false,
    position: '',
    backgroundColor: '',
    avatar: "",
    className: "",
    stopOnFocus: true,
    onClick: function () {
    },
    offset: {x: 0, y: 0},
    escapeMarkup: true,
    style: {background: ''}
  };

  // Defining the prototype of the object
  Toastify.lib = Toastify.prototype = {
    toastify: version,

    constructor: Toastify,

    // Initializing the object with required parameters
    init: function(options) {
      // Verifying and validating the input object
      if (!options) {
        options = {};
      }

      // Creating the options object
      this.options = {};

      this.toastElement = null;

      // Validating the options
      this.options.text = options.text || Toastify.defaults.text; // Display message
      this.options.node = options.node || Toastify.defaults.node;  // Display content as node
      this.options.duration = options.duration === 0 ? 0 : options.duration || Toastify.defaults.duration; // Display duration
      this.options.selector = options.selector || Toastify.defaults.selector; // Parent selector
      this.options.callback = options.callback || Toastify.defaults.callback; // Callback after display
      this.options.destination = options.destination || Toastify.defaults.destination; // On-click destination
      this.options.newWindow = options.newWindow || Toastify.defaults.newWindow; // Open destination in new window
      this.options.close = options.close || Toastify.defaults.close; // Show toast close icon
      this.options.gravity = options.gravity === "bottom" ? "toastify-bottom" : Toastify.defaults.gravity; // toast position - top or bottom
      this.options.positionLeft = options.positionLeft || Toastify.defaults.positionLeft; // toast position - left or right
      this.options.position = options.position || Toastify.defaults.position; // toast position - left or right
      this.options.backgroundColor = options.backgroundColor || Toastify.defaults.backgroundColor; // toast background color
      this.options.avatar = options.avatar || Toastify.defaults.avatar; // img element src - url or a path
      this.options.className = options.className || Toastify.defaults.className; // additional class names for the toast
      this.options.stopOnFocus = options.stopOnFocus === undefined ? Toastify.defaults.stopOnFocus : options.stopOnFocus; // stop timeout on focus
      this.options.onClick = options.onClick || Toastify.defaults.onClick; // Callback after click
      this.options.offset = options.offset || Toastify.defaults.offset; // toast offset
      this.options.escapeMarkup = options.escapeMarkup !== undefined ? options.escapeMarkup : Toastify.defaults.escapeMarkup;
      this.options.style = options.style || Toastify.defaults.style;
      if(options.backgroundColor) {
        this.options.style.background = options.backgroundColor;
      }

      // Returning the current object for chaining functions
      return this;
    },

    // Building the DOM element
    buildToast: function() {
      // Validating if the options are defined
      if (!this.options) {
        throw "Toastify is not initialized";
      }

      // Creating the DOM object
      var divElement = document.createElement("div");
      divElement.className = "toastify on " + this.options.className;

      // Positioning toast to left or right or center
      if (!!this.options.position) {
        divElement.className += " toastify-" + this.options.position;
      } else {
        // To be depreciated in further versions
        if (this.options.positionLeft === true) {
          divElement.className += " toastify-left";
          console.warn('Property `positionLeft` will be depreciated in further versions. Please use `position` instead.')
        } else {
          // Default position
          divElement.className += " toastify-right";
        }
      }

      // Assigning gravity of element
      divElement.className += " " + this.options.gravity;

      if (this.options.backgroundColor) {
        // This is being deprecated in favor of using the style HTML DOM property
        console.warn('DEPRECATION NOTICE: "backgroundColor" is being deprecated. Please use the "style.background" property.');
      }

      // Loop through our style object and apply styles to divElement
      for (var property in this.options.style) {
        divElement.style[property] = this.options.style[property];
      }

      // Adding the toast message/node
      if (this.options.node && this.options.node.nodeType === Node.ELEMENT_NODE) {
        // If we have a valid node, we insert it
        divElement.appendChild(this.options.node)
      } else {
        if (this.options.escapeMarkup) {
          divElement.innerText = this.options.text;
        } else {
          divElement.innerHTML = this.options.text;
        }

        if (this.options.avatar !== "") {
          var avatarElement = document.createElement("img");
          avatarElement.src = this.options.avatar;

          avatarElement.className = "toastify-avatar";

          if (this.options.position == "left" || this.options.positionLeft === true) {
            // Adding close icon on the left of content
            divElement.appendChild(avatarElement);
          } else {
            // Adding close icon on the right of content
            divElement.insertAdjacentElement("afterbegin", avatarElement);
          }
        }
      }

      // Adding a close icon to the toast
      if (this.options.close === true) {
        // Create a span for close element
        var closeElement = document.createElement("span");
        closeElement.innerHTML = "&#10006;";

        closeElement.className = "toast-close";

        // Triggering the removal of toast from DOM on close click
        closeElement.addEventListener(
          "click",
          function(event) {
            event.stopPropagation();
            this.removeElement(this.toastElement);
            window.clearTimeout(this.toastElement.timeOutValue);
          }.bind(this)
        );

        //Calculating screen width
        var width = window.innerWidth > 0 ? window.innerWidth : screen.width;

        // Adding the close icon to the toast element
        // Display on the right if screen width is less than or equal to 360px
        if ((this.options.position == "left" || this.options.positionLeft === true) && width > 360) {
          // Adding close icon on the left of content
          divElement.insertAdjacentElement("afterbegin", closeElement);
        } else {
          // Adding close icon on the right of content
          divElement.appendChild(closeElement);
        }
      }

      // Clear timeout while toast is focused
      if (this.options.stopOnFocus && this.options.duration > 0) {
        var self = this;
        // stop countdown
        divElement.addEventListener(
          "mouseover",
          function(event) {
            window.clearTimeout(divElement.timeOutValue);
          }
        )
        // add back the timeout
        divElement.addEventListener(
          "mouseleave",
          function() {
            divElement.timeOutValue = window.setTimeout(
              function() {
                // Remove the toast from DOM
                self.removeElement(divElement);
              },
              self.options.duration
            )
          }
        )
      }

      // Adding an on-click destination path
      if (typeof this.options.destination !== "undefined") {
        divElement.addEventListener(
          "click",
          function(event) {
            event.stopPropagation();
            if (this.options.newWindow === true) {
              window.open(this.options.destination, "_blank");
            } else {
              window.location = this.options.destination;
            }
          }.bind(this)
        );
      }

      if (typeof this.options.onClick === "function" && typeof this.options.destination === "undefined") {
        divElement.addEventListener(
          "click",
          function(event) {
            event.stopPropagation();
            this.options.onClick();
          }.bind(this)
        );
      }

      // Adding offset
      if(typeof this.options.offset === "object") {

        var x = getAxisOffsetAValue("x", this.options);
        var y = getAxisOffsetAValue("y", this.options);

        var xOffset = this.options.position == "left" ? x : "-" + x;
        var yOffset = this.options.gravity == "toastify-top" ? y : "-" + y;

        divElement.style.transform = "translate(" + xOffset + "," + yOffset + ")";

      }

      // Returning the generated element
      return divElement;
    },

    // Displaying the toast
    showToast: function() {
      // Creating the DOM object for the toast
      this.toastElement = this.buildToast();

      // Getting the root element to with the toast needs to be added
      var rootElement;
      if (typeof this.options.selector === "string") {
        rootElement = document.getElementById(this.options.selector);
      } else if (this.options.selector instanceof HTMLElement || (typeof ShadowRoot !== 'undefined' && this.options.selector instanceof ShadowRoot)) {
        rootElement = this.options.selector;
      } else {
        rootElement = document.body;
      }

      // Validating if root element is present in DOM
      if (!rootElement) {
        throw "Root element is not defined";
      }

      // Adding the DOM element
      var elementToInsert = Toastify.defaults.oldestFirst ? rootElement.firstChild : rootElement.lastChild;
      rootElement.insertBefore(this.toastElement, elementToInsert);

      // Repositioning the toasts in case multiple toasts are present
      Toastify.reposition();

      if (this.options.duration > 0) {
        this.toastElement.timeOutValue = window.setTimeout(
          function() {
            // Remove the toast from DOM
            this.removeElement(this.toastElement);
          }.bind(this),
          this.options.duration
        ); // Binding `this` for function invocation
      }

      // Supporting function chaining
      return this;
    },

    hideToast: function() {
      if (this.toastElement.timeOutValue) {
        clearTimeout(this.toastElement.timeOutValue);
      }
      this.removeElement(this.toastElement);
    },

    // Removing the element from the DOM
    removeElement: function(toastElement) {
      // Hiding the element
      // toastElement.classList.remove("on");
      toastElement.className = toastElement.className.replace(" on", "");

      // Removing the element from DOM after transition end
      window.setTimeout(
        function() {
          // remove options node if any
          if (this.options.node && this.options.node.parentNode) {
            this.options.node.parentNode.removeChild(this.options.node);
          }

          // Remove the element from the DOM, only when the parent node was not removed before.
          if (toastElement.parentNode) {
            toastElement.parentNode.removeChild(toastElement);
          }

          // Calling the callback function
          this.options.callback.call(toastElement);

          // Repositioning the toasts again
          Toastify.reposition();
        }.bind(this),
        400
      ); // Binding `this` for function invocation
    },
  };

  // Positioning the toasts on the DOM
  Toastify.reposition = function() {

    // Top margins with gravity
    var topLeftOffsetSize = {
      top: 15,
      bottom: 15,
    };
    var topRightOffsetSize = {
      top: 15,
      bottom: 15,
    };
    var offsetSize = {
      top: 15,
      bottom: 15,
    };

    // Get all toast messages on the DOM
    var allToasts = document.getElementsByClassName("toastify");

    var classUsed;

    // Modifying the position of each toast element
    for (var i = 0; i < allToasts.length; i++) {
      // Getting the applied gravity
      if (containsClass(allToasts[i], "toastify-top") === true) {
        classUsed = "toastify-top";
      } else {
        classUsed = "toastify-bottom";
      }

      var height = allToasts[i].offsetHeight;
      classUsed = classUsed.substr(9, classUsed.length-1)
      // Spacing between toasts
      var offset = 15;

      var width = window.innerWidth > 0 ? window.innerWidth : screen.width;

      // Show toast in center if screen with less than or equal to 360px
      if (width <= 360) {
        // Setting the position
        allToasts[i].style[classUsed] = offsetSize[classUsed] + "px";

        offsetSize[classUsed] += height + offset;
      } else {
        if (containsClass(allToasts[i], "toastify-left") === true) {
          // Setting the position
          allToasts[i].style[classUsed] = topLeftOffsetSize[classUsed] + "px";

          topLeftOffsetSize[classUsed] += height + offset;
        } else {
          // Setting the position
          allToasts[i].style[classUsed] = topRightOffsetSize[classUsed] + "px";

          topRightOffsetSize[classUsed] += height + offset;
        }
      }
    }

    // Supporting function chaining
    return this;
  };

  // Helper function to get offset.
  function getAxisOffsetAValue(axis, options) {

    if(options.offset[axis]) {
      if(isNaN(options.offset[axis])) {
        return options.offset[axis];
      }
      else {
        return options.offset[axis] + 'px';
      }
    }

    return '0px';

  }

  function containsClass(elem, yourClass) {
    if (!elem || typeof yourClass !== "string") {
      return false;
    } else if (
      elem.className &&
      elem.className
        .trim()
        .split(/\s+/gi)
        .indexOf(yourClass) > -1
    ) {
      return true;
    } else {
      return false;
    }
  }

  // Setting up the prototype for the init object
  Toastify.lib.init.prototype = Toastify.lib;

  // Returning the Toastify function to be assigned to the window object/module
  return Toastify;
});

},{}],3:[function(require,module,exports){
const TTS = {
    async playAudios(audioUrls) {
        let audios = [];
        for (let url of audioUrls) {
            audios.push(new Audio(url));
        }
        for (let audio of audios) {
            await new Promise((resolve, reject) => {
                audio.onerror = reject;
                audio.onended = resolve;
                audio.play();
            });
            audio.remove();
        }
    },
    splitSentence(text) {
        let words = text.split(" ");
        let result = [];
        let current = "";
        let i = 0;
        while (words.length > -1) {
            let word = words[0];
            if (!word) {
                result.push(current);
                current = "";
                break;
            }
            if (current.length + word.length <= 199) {
                current += word + " ";
                words.shift();
            } else if (current.length > 0) {
                result.push(current);
                current = "";
            } else {
                current = word.substring(0, 198);
                result.push(current);
                current = "";
                words.shift();
                words.unshift(word.substring(198, word.length - 1));
            }
        }
        return result;
    },
    async textToSpeech(text, language) {
        let parts = this.splitSentence(text);
        let urls = [];
        for (let part of parts) {
            urls.push(this.getTTSUrl(part, language));
        }
        await this.playAudios(urls)
    },
    getTTSUrl(text, language) {
        return `https://translate.google.com/translate_tts?ie=UTF-8&total=1&idx=0&textlen=${text.length}&client=tw-ob&q=${text}&tl=${language}`
    }
}

module.exports = TTS

},{}],4:[function(require,module,exports){
class Wordle {
    constructor(settings) {
        this.settings = Object.assign({numberOfGuesses: 6, numberOfLetters: 5, dico:[]}, settings)
        this.initBoard(this.settings)
    }
    
    initBoard(settings) {
        this.guessesRemaining = settings.numberOfGuesses || this.settings.numberOfGuesses || 6
        this.numberOfLetters = settings.numberOfLetters || this.settings.numberOfLetters || 5
        this.dico = settings.dico || this.settings.dico || []
        this.proposed = []
        this.wordList = this.dico.filter((word) => word.length === this.numberOfLetters)
        this.rightGuessString = this.removeAccents(this.wordList[Math.floor(Math.random() * this.wordList.length)])
        console.log(`Wordle answer : ${this.rightGuessString}`)

        this.initKeyBoard()
        let board = document.getElementById("game-board")
        board.innerHTML = ''
    
        for (let i = 0; i < this.guessesRemaining; i++) {
            let row = document.createElement("div")
            row.className = "letter-row"
            
            for (let j = 0; j < this.numberOfLetters; j++) {
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
        
        if (guess.length != this.numberOfLetters) return this.fire('error', {message: `"${guess}" n'a pas ${this.numberOfLetters} lettres`})
        if (!this.wordList.map(this.removeAccents).includes(guess)) return this.fire('error', {message: `"${guess}" n'est pas dans la liste`})
        if (this.proposed.includes(guess)) return this.fire('error', {message: `"${guess}" à déjà été proposé`})

        this.proposed.push(guess)
        let currentGuess = Array.from(guess)
            
        return await this.animateWrite(currentGuess)
        .then(_ => {
            let row = document.getElementsByClassName("letter-row")[this.settings.numberOfGuesses - this.guessesRemaining]
            let rightGuess = Array.from(this.rightGuessString)
            let promises = []
            for (let i = 0; i < this.numberOfLetters; i++) {
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
                this.fire('success', {message: "Felicitations!", tries: this.settings.numberOfGuesses - this.guessesRemaining, winner: player})
                this.guessesRemaining = 0
                return this
            } else {
                this.guessesRemaining--
                if (this.guessesRemaining === 0) {
                    this.fire('failure', {message: `Perdu!\nLe mot etait: "${this.rightGuessString}"`})
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
},{}]},{},[1]);
