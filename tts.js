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
