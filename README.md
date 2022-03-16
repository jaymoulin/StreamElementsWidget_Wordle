# Twitch Wordle

Allows to play to wordle in a single Stream Elements module

[![PayPal donation](https://github.com/jaymoulin/jaymoulin.github.io/raw/master/ppl.png "PayPal donation")](https://www.paypal.me/jaymoulin)
[![Buy me a coffee](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png "Buy me a coffee")](https://www.buymeacoffee.com/jaymoulin)
[![Become a Patron](https://badgen.net/badge/become/a%20patron/F96854 "Become a Patron")](https://patreon.com/jaymoulin)

# Install

1. Create a custom widget
1. Open editor
1. Paste `index.html` content in HTML code
1. Paste `index.css` content in CSS code
1. Paste `index.json` content in fields code
1. Paste `data.json` content in data code (this is a 5 words french dictionary but you can use your own)
1. Compile `index.js` into `bundle.js` with browserify (just do `make build` if docker and makefile are both installed)
1. Paste `bundle.js` content in JS code

# Commands

As a streamer, you can use the following commands:

* `!wordle_reset` : Reset leaderboard
* `!wordle_next` : Pass to the next word
* `!wordle_say` : Say the correct word
* `!wordle_guess_[0-9]+` : Change to a specified number of guess (default 6) (example: !wordle_guess_3)
* `!wordle_letter_[0-9]+` : Change to a specified number of letter (default 5) (example: !wordle_letter_6)
* `!wordle_locale_[a-z]{2}}` : Change to a specified locale (default fr) (example: !wordle_locale_en)
* `!wordle_podium` : Displays the leaderboard