import React from "react";
import Swal from 'sweetalert';
import {ClapSpinner} from 'react-spinners-kit';
import Chart from 'chart.js';

import {
    CHATBOT_URL,
    chatSuggestCall,
    computeDashboard,
    getTime, getTopSentences,
    hideDetail,
    hideInsights,
    hideEssayField,
    hideFeedback,
    hideHelp,
    hidePrivacy,
    highlightKeyword,
    highlightTopNPolaritySentences,
    highlightTopNSubjectivitySentences,
    initializeBot,
    ready,
    showChat,
    showCloseFeedbackButton,
    showDetail,
    showOpenFeedbackButton,
    showPrivacy,
    submitMessage
} from "../static/javascript/ArgueTutorEn";

const cuid = require('cuid');

const UUID = cuid();

class MainFrameEn extends React.Component {

    /**
     * Handles injected code
     */
    componentDidMount() {
        const that = this;

        /**
         * Handles Chatbot button clicks
         *
         * @param text
         *          Message for the backend
         */
        window.chatSuggest = function (text) {
            that.setState({wasQuestion: true},

                () => chatSuggestCall(that, that.state.chatGPTColor, text, UUID)
            );
        }

        /**
         * Switches to the essay-writing interface
         */
        window.displayELEA = function () {
            that.showEssayField(false);
        }

        /**
         * Highlights the 'keyWord' appearances in the text
         *
         * @param keyWord
         *          keyword to highlight
         */
        window.highlightTopKeywordsWindow = function (keyWord) {
            document.getElementById('userDashboardText').innerHTML = highlightKeyword(that.state.dashboardText, keyWord);

            that.scrollUpDashboard();
        }

        /**
         * Displays Video with the given ID from YouTube inside the chat
         *
         * @param VideoID
         *          video id
         */
        window.playVideo = function (VideoID) {
            let htmlTemplateString = `
            <div class="data-wrapper">
                <p>
                    <iframe id="ytplayer" type="text/html" width="100%" height="360" src="TargetURL"
                            allow="autoplay"></iframe>
                </p>
            </div>`;

            that.setState({
                    wasQuestion: true,
                    scrollHeight: document.getElementById("scrollbox").scrollHeight
                },
                () => {
                    that.updateChatBoxContent(
                        Array.from(document.getElementsByClassName("message")).slice(-1)[0]
                        + (htmlTemplateString.replace("TargetURL", "https://www.youtube.com/embed/" + VideoID)))
                });
        }

        /**
         * Displays Website with the given url inside the chat
         *
         * @param url
         *          website url
         */
        window.displayWebsite = function (url) {
            // <iframe id="ytplayer" type="text/html" width="100%" height="700" src="TargetURL"
            let htmlWepPage = `
                    <div class="data-wrapper">
                        <p>
                           
                            <iframe id="ytplayer" type="text/html" width="100%" height="550" src="TargetURL"
                                allow="autoplay"></iframe>
                        </p>
                    </div>
                `;

            that.setState({
                    wasQuestion: false,
                    scrollHeight: document.getElementById("scrollbox").scrollHeight
                },
                () => that.updateChatBoxContent(
                    Array.from(document.getElementsByClassName("message")).slice(-1)[0]
                    + (htmlWepPage.replace("TargetURL", "https://" + url))));
        }
    }

    componentWillUnmount() {
        window.chatSuggest = undefined;
        window.displayELEA = undefined;
        window.playVideo = undefined;
        window.displayWebsite = undefined;
        window.highlightTopKeywordsWindow = undefined;
    }

    constructor(props) {
        super(props);
        this.state = {
            stringChatBotContent: '',
            chatBoxContent: {__html: ''},
            scrollHeight: 0,
            wasQuestion: false,
            dashboardIsComputed: false,
            topKeywords: [],
            dashboardText: '',
            ascPolSentences: [[]],
            ascSubSentences: [[]],
            chatGPTColor: false,
            chartData: [90, 90, 90, 90, 90, 90, 90]
        };

        /**
         * Startup of the Chatbot
         */
        ready(() => {
            // The following is meant for the login:
            let userName = "";
            showPrivacy()
        });
    }

    /**
     * Displays the essay writing interface
     *
     * @param isDbComputed
     *          whether dashboard is computed or not
     */
    showEssayField = (isDbComputed) => {
        document.getElementById("button-eval").disabled = false;
        document.getElementById("close-essay-field-button").disabled = false;

        document.getElementById("close-feedback-button").click();
        document.getElementById("close-Detail-button").click();
        document.getElementById("close-help-button").click();
        document.getElementById("close-dashboard-button").click();

        document.getElementById("show-dashboard-button").style.display = 'none';
        document.getElementById("open-feedback-button").style.display = 'none';
        document.getElementById("open-Detail-button").style.display = 'none';
        document.getElementById("open-insights-button").style.display = 'none';
        document.getElementById("open-help-button").style.display = 'none';
        document.getElementById("close-essay-field-button").style.display = '';
        document.getElementById("scrollbox").style.display = 'none';
        document.getElementById("userInput").style.display = 'none';
        document.getElementById("ELEAIframeTemplate").style.display = 'inline-block';

        document.getElementById("open-essay-page").style.display = 'none'

        let keywords = document.getElementsByClassName("keywords");
        for (let i = 0; i < keywords.length; i++) {
            keywords[i].style.display = "block";
        }
        this.setState({dashboardIsComputed: isDbComputed});
    }

    /**
     * Scrolls to the top of the essay displayed in the dashboard
     */
    scrollUpDashboard = () => {
        let options = {
            top: 90,
            left: 0,
            behavior: 'smooth'
        };
        document.getElementById("dashboard").scroll(options);
    }

    /**
     * Scrolls to the position indicated by 'scrollHeight' in the chatbox
     */
    scrollChatBox = () => {
        let options = {
            top: this.state.scrollHeight,
            left: 0,
            behavior: 'smooth'
        };
        document.getElementById("scrollbox").scroll(options);
    }

    /**
     * Removes the three dots indicating that the chatbot is typing
     *
     * @returns {string}
     *          returns the chatbox content after removing the "typing" messages
     */
    deletedTypingMessage = () => {
        return this.state.stringChatBotContent.replaceAll(`<div class="message typing"><div class="message-botname">MindMate</div><div class="botText"><div class="avatar-wrapper"><img class="avatar" src="/img/ArgueTutorClosed.png"></div><div class="data-wrapper"><img src="/img/typing3.gif"></div></div></div>`, "");
    }

    /**
     * Adds the given argument to the chatbox
     *
     * @param newContent
     *          content to be added to the chat
     */
    updateChatBoxContent = (newContent) => {
        let newValue;
        if (!this.state.wasQuestion) {
            newValue = this.deletedTypingMessage() + newContent.replace("[object HTMLDivElement]", "");
        } else {
            newValue = this.state.stringChatBotContent + newContent.replace("[object HTMLDivElement]", "");
        }

        // if a question was asked before, we scroll to the height of that question, otherwise to the height of the received new element
        this.setState({
                stringChatBotContent: newValue,
                chatBoxContent: {__html: newValue},

            },
            () => {
                let scrollHeight = this.state.wasQuestion
                    ? document.getElementById("scrollbox").scrollHeight - 200
                    : this.state.scrollHeight;
                this.setState({
                        wasQuestion: !this.state.wasQuestion,
                        scrollHeight: scrollHeight,
                    },
                    this.scrollChatBox)
            });
    }

    /**
     * recomputes the essay stats
     */
    updateEssayStats = () => {
        let text1 = document.getElementById("evalution_textarea").value;
        let text2 = document.getElementById("evalution_textarea2").value;
        let text3 = document.getElementById("evalution_textarea3").value;
        let text = `${text1} ${text2} ${text3}` //text1 + " " + text2 + " " + text3;
        console.log(text);
        let characterCount = document.getElementById("characterCount");
        let wordCount = document.getElementById("wordCount");
        let sentenceCount = document.getElementById("sentenceCount");
        let paragraphCount = document.getElementById("paragraphCount");
        let readingTime = document.getElementById("readingTime");
        let topKeywords = document.getElementById("topKeywords");

        this.computeEssayStats(characterCount, text, wordCount, sentenceCount, paragraphCount, readingTime, topKeywords);

        let keywords = document.getElementsByClassName("keywords")
        for (let i = 0; i < keywords.length; i++) {
            keywords[i].style.display = "block";
        }
    }

    chatGPT = async () => {
        await this.setState({chatGPTColor: !this.state.chatGPTColor})
        initializeBot(this.updateChatBoxContent, this.state.chatGPTColor, UUID)
    }



    /**
     * Computes the essay stats based on the given input
     *
     * @param characterCount
     * @param text
     * @param wordCount
     * @param sentenceCount
     * @param paragraphCount
     * @param readingTime
     * @param topKeywords
     */
    computeEssayStats = (characterCount, text, wordCount, sentenceCount, paragraphCount, readingTime, topKeywords) => {
        characterCount.innerHTML = text.length;
        let words = text.match(/[-?(\w+)äöüÄÖÜß]+/gi);

        if (words === null) {
            wordCount.innerHTML = 0;
            sentenceCount.innerHTML = 0;
            paragraphCount.innerHTML = 0;
            readingTime.innerHTML = "0s";
            topKeywords.style.display = "none";

            return;
        }

        wordCount.innerHTML = words.length;
        sentenceCount.innerHTML = text.split(/[.!?]+/g).length - 1;
        paragraphCount.innerHTML = text.replace(/\n$/gm, '').split(/\n/).length;

        const seconds = Math.ceil(words.length * 60 / 275);
        if (seconds > 59) {
            let minutes = Math.floor(seconds / 60);
            const actualSeconds = seconds - minutes * 60;
            readingTime.innerHTML = minutes + "m " + actualSeconds + "s";
        } else {
            readingTime.innerHTML = seconds + "s";
        }

        // todo redefine stop words
        let nonStopWords = [];
        let stopWords = ["a", "ab", "aber", "ach", "acht", "achte", "achten", "achter", "achtes", "ag", "alle", "allein", "allem", "allen", "aller", "allerdings", "alles", "allgemeinen", "als", "also", "am", "an", "ander", "andere", "anderem", "anderen", "anderer", "anderes", "anderm", "andern", "anderr", "anders", "au", "auch", "auf", "aus", "ausser", "ausserdem", "außer", "außerdem", "b", "bald", "bei", "beide", "beiden", "beim", "beispiel", "bekannt", "bereits", "besonders", "besser", "besten", "bin", "bis", "bisher", "bist", "c", "d", "d.h", "da", "dabei", "dadurch", "dafür", "dagegen", "daher", "dahin", "dahinter", "damals", "damit", "danach", "daneben", "dank", "dann", "daran", "darauf", "daraus", "darf", "darfst", "darin", "darum", "darunter", "darüber", "das", "dasein", "daselbst", "dass", "dasselbe", "davon", "davor", "dazu", "dazwischen", "daß", "dein", "deine", "deinem", "deinen", "deiner", "deines", "dem", "dementsprechend", "demgegenüber", "demgemäss", "demgemäß", "demselben", "demzufolge", "den", "denen", "denn", "denselben", "der", "deren", "derer", "derjenige", "derjenigen", "dermassen", "dermaßen", "derselbe", "derselben", "des", "deshalb", "desselben", "dessen", "deswegen", "dich", "die", "diejenige", "diejenigen", "dies", "diese", "dieselbe", "dieselben", "diesem", "diesen", "dieser", "dieses", "dir", "doch", "dort", "drei", "drin", "dritte", "dritten", "dritter", "drittes", "du", "durch", "durchaus", "durfte", "durften", "dürfen", "dürft", "e", "eben", "ebenso", "ehrlich", "ei", "ei,", "eigen", "eigene", "eigenen", "eigener", "eigenes", "ein", "einander", "eine", "einem", "einen", "einer", "eines", "einig", "einige", "einigem", "einigen", "einiger", "einiges", "einmal", "eins", "elf", "en", "ende", "endlich", "entweder", "er", "ernst", "erst", "erste", "ersten", "erster", "erstes", "es", "etwa", "etwas", "euch", "euer", "eure", "eurem", "euren", "eurer", "eures", "f", "folgende", "früher", "fünf", "fünfte", "fünften", "fünfter", "fünftes", "für", "g", "gab", "ganz", "ganze", "ganzen", "ganzer", "ganzes", "gar", "gedurft", "gegen", "gegenüber", "gehabt", "gehen", "geht", "gekannt", "gekonnt", "gemacht", "gemocht", "gemusst", "genug", "gerade", "gern", "gesagt", "geschweige", "gewesen", "gewollt", "geworden", "gibt", "ging", "gleich", "gott", "gross", "grosse", "grossen", "grosser", "grosses", "groß", "große", "großen", "großer", "großes", "gut", "gute", "guter", "gutes", "h", "hab", "habe", "haben", "habt", "hast", "hat", "hatte", "hatten", "hattest", "hattet", "heisst", "her", "heute", "hier", "hin", "hinter", "hoch", "hätte", "hätten", "i", "ich", "ihm", "ihn", "ihnen", "ihr", "ihre", "ihrem", "ihren", "ihrer", "ihres", "im", "immer", "in", "indem", "infolgedessen", "ins", "irgend", "ist", "j", "ja", "jahr", "jahre", "jahren", "je", "jede", "jedem", "jeden", "jeder", "jedermann", "jedermanns", "jedes", "jedoch", "jemand", "jemandem", "jemanden", "jene", "jenem", "jenen", "jener", "jenes", "jetzt", "k", "kam", "kann", "kannst", "kaum", "kein", "keine", "keinem", "keinen", "keiner", "keines", "kleine", "kleinen", "kleiner", "kleines", "kommen", "kommt", "konnte", "konnten", "kurz", "können", "könnt", "könnte", "l", "lang", "lange", "leicht", "leide", "lieber", "los", "m", "machen", "macht", "machte", "mag", "magst", "mahn", "mal", "man", "manche", "manchem", "manchen", "mancher", "manches", "mann", "mehr", "mein", "meine", "meinem", "meinen", "meiner", "meines", "mensch", "menschen", "mich", "mir", "mit", "mittel", "mochte", "mochten", "morgen", "muss", "musst", "musste", "mussten", "muß", "mußt", "möchte", "mögen", "möglich", "mögt", "müssen", "müsst", "müßt", "n", "na", "nach", "nachdem", "nahm", "natürlich", "neben", "nein", "neue", "neuen", "neun", "neunte", "neunten", "neunter", "neuntes", "nicht", "nichts", "nie", "niemand", "niemandem", "niemanden", "noch", "nun", "nur", "o", "ob", "oben", "oder", "offen", "oft", "ohne", "ordnung", "p", "q", "r", "recht", "rechte", "rechten", "rechter", "rechtes", "richtig", "rund", "s", "sa", "sache", "sagt", "sagte", "sah", "satt", "schlecht", "schluss", "schon", "sechs", "sechste", "sechsten", "sechster", "sechstes", "sehr", "sei", "seid", "seien", "sein", "seine", "seinem", "seinen", "seiner", "seines", "seit", "seitdem", "selbst", "sich", "sie", "sieben", "siebente", "siebenten", "siebenter", "siebentes", "sind", "so", "solang", "solche", "solchem", "solchen", "solcher", "solches", "soll", "sollen", "sollst", "sollt", "sollte", "sollten", "sondern", "sonst", "soweit", "sowie", "später", "startseite", "statt", "steht", "suche", "t", "tag", "tage", "tagen", "tat", "teil", "tel", "tritt", "trotzdem", "tun", "u", "uhr", "um", "und", "uns", "unse", "unsem", "unsen", "unser", "unsere", "unserer", "unses", "unter", "v", "vergangenen", "viel", "viele", "vielem", "vielen", "vielleicht", "vier", "vierte", "vierten", "vierter", "viertes", "vom", "von", "vor", "w", "wahr", "wann", "war", "waren", "warst", "wart", "warum", "was", "weg", "wegen", "weil", "weit", "weiter", "weitere", "weiteren", "weiteres", "welche", "welchem", "welchen", "welcher", "welches", "wem", "wen", "wenig", "wenige", "weniger", "weniges", "wenigstens", "wenn", "wer", "werde", "werden", "werdet", "weshalb", "wessen", "wie", "wieder", "wieso", "will", "willst", "wir", "wird", "wirklich", "wirst", "wissen", "wo", "woher", "wohin", "wohl", "wollen", "wollt", "wollte", "wollten", "worden", "wurde", "wurden", "während", "währenddem", "währenddessen", "wäre", "würde", "würden", "x", "y", "z", "z.b", "zehn", "zehnte", "zehnten", "zehnter", "zehntes", "zeit", "zu", "zuerst", "zugleich", "zum", "zunächst", "zur", "zurück", "zusammen", "zwanzig", "zwar", "zwei", "zweite", "zweiten", "zweiter", "zweites", "zwischen", "zwölf", "über", "überhaupt", "übrigens"];
        for (let i = 0; i < words.length; i++) {
            if (stopWords.indexOf(words[i].toLowerCase()) === -1 && isNaN(words[i])) {
                nonStopWords.push(words[i].toLowerCase());
            }
        }
        let keywords = {};
        for (let i = 0; i < nonStopWords.length; i++) {
            if (nonStopWords[i] in keywords) {
                keywords[nonStopWords[i]] += 1;
            } else {
                keywords[nonStopWords[i]] = 1;
            }
        }
        let sortedKeywords = [];
        for (let keyword in keywords) {
            sortedKeywords.push([keyword, keywords[keyword]])
        }
        sortedKeywords.sort(function (a, b) {
            return b[1] - a[1]
        });

        this.setState({topKeywords: sortedKeywords.slice(0, 4)});

        topKeywords.innerHTML = "";
        for (let i = 0; i < sortedKeywords.length && i < 4; i++) {
            let li = document.createElement('li');
            li.innerHTML = "<b>" + sortedKeywords[i][0] + "</b>: " + sortedKeywords[i][1];

            topKeywords.appendChild(li);
        }

        topKeywords.style.display = "block";
    }

    render() {

        /**
         * Sends the question from the textInput to the backend
         */
        const sendText = () => {
            let text = document.getElementById("textInput").value;

            // added this, so that the scrollbox height is adjusted to the correct spot since the last one is still at the height of the
            // last question if we clicked on "textfeld öffnen"
            this.setState({wasQuestion: true},
                () => submitMessage(text, this.state.chatGPTColor, this.updateChatBoxContent, UUID))
        }

        /**
         * When the user hits enter (13), the typed question is sent to the backend
         *
         * @param event
         *          keyboard event
         */
        const keyUpTextInput = (event) => {
            if (event.which === 13) {
                sendText();
            }
        }

        /**
         * Shows the Dashboard after already having evaluated the essay
         *
         * @param text Essay text
         */
        const showDashboardStats = (text) => {
            let characterCount = document.getElementById("characterCountDB");
            let wordCount = document.getElementById("wordCountDashboard");
            let sentenceCount = document.getElementById("sentenceCountDB");
            let paragraphCount = document.getElementById("paragraphCountDB");
            let readingTime = document.getElementById("readingTimeDB");
            let topKeywords = document.getElementById("topKeywordsDB");

            this.computeEssayStats(characterCount, text, wordCount, sentenceCount, paragraphCount, readingTime, topKeywords);
        }

        /**
         * Hides the Chat interface
         */
        const hideChat = () => {
            document.getElementById("open-feedback-button").style.display = 'none';
            document.getElementById("open-Detail-button").style.display = 'none';
            document.getElementById("open-insights-button").style.display = 'none';
            document.getElementById("open-help-button").style.display = 'none';
            document.getElementById("scrollbox").style.display = 'none';
            document.getElementById("userInput").style.display = 'none';
        }

        /**
         * Shows the dashboard
         *      - only callable once the dashboard has been computed and the user has returned to the chat (with the button in the header bar)
         */
        const showDashboardButtonClick = () => {
            hideChat();
            document.getElementById("help").style.display = 'none';
            document.getElementById("Detail").style.display = 'none';
            document.getElementById("feedback").style.display = 'none';

            document.getElementById("close-feedback-button").style.display = 'none';
            document.getElementById("close-help-button").style.display = 'none';
            document.getElementById("close-Detail-button").style.display = 'none';
            document.getElementById("show-dashboard-button").style.display = 'none';
            document.getElementById("close-dashboard-button").style.display = '';
            document.getElementById("dashboard").style.display = 'inline-block';
        }


        /**
         * Handles help button click
         */
        const helpButtonClick = () => {
            hideChat();

            document.getElementById("close-help-button").style.display = '';
            document.getElementById("help").style.display = 'inline-block';
        }

        /**
         * Handles close help button click
         */
        const closeHelpButtonClick = () => {
            hideHelp();
        }

        /**
         * Handles close Dashboard button click
         */
        const closeDashboardButtonClick = () => {
            showChat()
            closeDetailButtonClick();
            closeHelpButtonClick();
            closeFeedbackButtonClick();

            document.getElementById("dashboard").style.display = 'none';
            document.getElementById("open-essay-page").style.display = 'none';
            document.getElementById("close-dashboard-button").style.display = 'none';

            if (this.state.dashboardIsComputed) {
                document.getElementById("show-dashboard-button").style.display = '';
            }
        }


        /**
         * handles detail button click (FAQ)
         */
        const detailButtonClick = () => {
            hideChat();

            document.getElementById("close-Detail-button").style.display = '';
            document.getElementById("Detail").style.display = 'inline-block';
        }

        /**
         * handels close Detail (FAQ) button click
         */
        const closeDetailButtonClick = () => {
            hideDetail();
        }

        /**
         * handels close Detail (FAQ) button click
         */
        const closeInsightsButtonClick = () => {
            hideInsights();
        }

        /**
         * handles close essay button click
         */
        const closeEssayButtonClick = () => {
            hideEssayField();

            if (this.state.dashboardIsComputed) {
                showDashboardButtonClick();
                document.getElementById("open-essay-page").style.display = '';
            } else {
                showChat();
            }
            this.setState({wasQuestion: false});
        }

        /**
         * handles feedback button click
         */
        const feedbackButtonClick = () => {
            document.getElementById("open-help-button").style.display = 'none';
            document.getElementById("open-Detail-button").style.display = 'none';
            document.getElementById("open-insights-button").style.display = 'none';
            document.getElementById("scrollbox").style.display = 'none';
            document.getElementById("userInput").style.display = 'none';

            document.getElementById("feedback").style.display = 'inline-block';
            showCloseFeedbackButton();
        }

        /**
         * handles close feedback button click
         */
        const closeFeedbackButtonClick = () => {
            showOpenFeedbackButton();
            hideFeedback();
        }

        /**
         * submits the feedback to the backend
         */
        const feedbackSubmitButtonClick = () => {
            let feedbackBot = "WritingTutor Evaluation";
            let feedbackText = document.getElementById("feedback-text").value;
            let feedbackImprovement = document.getElementById("feedback-improve").value;

            if (feedbackText.trim() === "") {
                Swal({
                    title: 'Leerer Text!',
                    text: 'Bitte schreiben Sie Ihr Feedback in das dafür vorgesehene Textfeld',
                    icon: 'error',
                    confirmButtonText: 'Weiter',
                    confirmButtonColor: '#00762C'
                });
                return;
            }

            // if nothing pressed, then the value is "on"...
            let rating = document.getElementById("rating-1").value;
            let feedbackRating = rating === "on"
                ? 0
                : rating;

            let _data = {
                bot: feedbackBot,
                rating: feedbackRating,
                text: feedbackText.replaceAll(";", " -"),
                improve: feedbackImprovement.replaceAll(";", " -")
            }

            fetch(CHATBOT_URL + "/feedback", {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json;charset=utf-8'
                },
                body: JSON.stringify(_data)
            }).then(() => {
                Swal({
                    title: 'Abgeschlossen!',
                    text: 'Vielen Dank für Ihr Feedback! 🤩',
                    icon: 'success',
                    confirmButtonText: 'Weiter',
                    confirmButtonColor: '#00762C'
                })
                closeFeedbackButtonClick();
            });
        }

        /**
         * reloads the window and resets the chatbot to the beginning
         */
        const refreshPage = () => {
            window.location.reload();
        }

        /**
         * adds restartfunctionality to the reload button
         */
        const addOnClickToReloadPage = () => {
            document.getElementById("reload-page").addEventListener('click',
                () => refreshPage());
        }

        /**
         * Sends evaluation request to the backend and then displays the corresponding Dashboard with the results
         */
        const evaluationChatSuggest = () => {
            let context = document.getElementById("evalution_textarea").value;
            let emotions = document.getElementById("evalution_textarea2").value;
            let analysis = document.getElementById("evalution_textarea3").value;
            let evaluation = document.getElementById("evalution_textarea4").value;
            let plan = document.getElementById("evalution_textarea5").value;

            let submittedText = `${context} ${emotions} ${analysis} ${evaluation} ${plan}` //text1 + " " + text2 + " " + text3;

            if (context.trim().length === 0) {
                Swal({
                    title: 'Leerer Kontext-Text!',
                    text: 'Bitte schreiben Sie einen Text von etwa 200 Wörtern in das erste Feld',
                    icon: 'error',
                    confirmButtonText: 'Weiter',
                    confirmButtonColor: '#00762C'
                })
                return;
            }
            if (emotions.trim().length === 0) {
                Swal({
                    title: 'Leerer Emotionen Text!',
                    text: 'Bitte schreiben Sie einen Text von etwa 200 Wörtern in das zweite Feld',
                    icon: 'error',
                    confirmButtonText: 'Weiter',
                    confirmButtonColor: '#00762C'
                })
                return;
            }
            if (analysis.trim().length === 0) {
                Swal({
                    title: 'Leerer Analysen Text!',
                    text: 'Bitte schreiben Sie einen Text von etwa 200 Wörtern in das dritte Feld',
                    icon: 'error',
                    confirmButtonText: 'Weiter',
                    confirmButtonColor: '#00762C'
                })
                return;
            }
            if (evaluation.trim().length === 0) {
                Swal({
                    title: 'Leerer Bewertungs text!',
                    text: 'Bitte schreiben Sie einen Text von etwa 200 Wörtern in das vierte Feld',
                    icon: 'error',
                    confirmButtonText: 'Weiter',
                    confirmButtonColor: '#00762C'
                })
                return;
            }
            if (plan.trim().length === 0) {
                Swal({
                    title: 'Leerer Plan text!',
                    text: 'Bitte schreiben Sie einen Text von etwa 200 Wörtern in das fünfte Feld',
                    icon: 'error',
                    confirmButtonText: 'Weiter',
                    confirmButtonColor: '#00762C'
                })
                return;
            }


            this.setState({wasQuestion: false});

            document.getElementById("loadingEvaluationAnimation").style.display = "";
            document.getElementById("close-essay-field-button").disabled = true;
            document.getElementById("button-eval").disabled = true;

            let _data = {
                text: submittedText,
                context: context,
                emotions: emotions,
                analysis: analysis,
                evaluation: evaluation,
                plan: plan
            }

            // Used to signal to the user if there is a massive evaluation delay
            const timeout = new Promise((resolve, reject) => {
                setTimeout(() => {
                    reject(new Error('Request timed out'));
                }, 25000); // Timeout after 25 seconds
            });
            // use race method in order to check what happens first, response from the bot or timeout
            Promise.race([fetch(CHATBOT_URL + "/texttransfer", {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json;charset=utf-8'
                    },
                    body: JSON.stringify(_data)
                }), timeout]
            ).then(response => response.json()
            ).then(data => {

                let context_past_tense =  data.context_past_tense;
                let context_presence_of_named_entity = data.context_presence_of_named_entity;
                let emotions = data.emotions;
                let analysis_polarity = data.analysis_polarity;
                let analysis_subjectivity = data.analysis_subjectivity;
                let analysis_causal_keywords = data.analysis_causal_keywords;
                let evaluation_polarity = data.evaluation_polarity;
                let evaluation_subjectivity = data.evaluation_subjectivity;
                let plan_future_tense = data.plan_future_tense;
                let text = data.text;
                let first_person_count = data.first_person_count;

                // Create the chart
                //this.setState({chartData: emotions.map(e => Math.round(Number((e.score * 100))))});
                var chart = document.getElementById('chart');
                let labels = emotions.map(e => e.label).map(e => {
                    if(e === "joy") return "Freude";
                    else if(e === "fear") return "Angst";
                    else if(e === "sadness") return "Traurigkeit";
                    else if(e === "anger") return "Wut";
                    else if(e === "disgust") return "Ekel";
                    else if(e === "surprise") return "Überraschung";
                    else if(e === "neutral") return "Neutral";
                });
                new Chart(chart, {
                    type: 'pie',
                    data: {
                        labels: labels, // Replace with your own labels
                        datasets: [{
                            data: emotions.map(e => Math.round(Number((e.score * 100)))), // Replace with your own data values
                            backgroundColor: ['lightcoral', 'lightgreen', 'lightsalmon', 'lightcyan', 'lightgrey', 'lightyellow', 'lightpink'], // Replace with your own colors
                        }]
                    }
                });

                let neutral_score = emotions.filter(e => e.label == "neutral")[0].score * 100
                if(neutral_score >= 35){
                    document.getElementById("emotions_text").innerHTML = "Es scheint, dass Sie Ihre Gefühle auf neutrale Weise ausgedrückt haben. Versuchen Sie, die Gefühle, die Sie während des Erlebnisses hatten, deutlicher zu beschreiben 💭"
                }
                else{
                    document.getElementById("emotions_text").innerHTML = "Es scheint, dass Sie einige Emotionen beschrieben haben. Das hilft Ihnen zu verstehen, wie sich diese Erfahrung auf Sie ausgewirkt hat und ermöglicht so eine gute Reflexion 💭"
                }

                let adaptedText = text.replaceAll("\\n", "\n");
                if(context_past_tense <= 0){
                    document.getElementById("context_past_tense").innerHTML = "Es wäre am besten, die Vergangenheitsform zu verwenden, wenn Sie den Kontext beschreiben.";
                }
                else {
                    document.getElementById("context_past_tense").innerHTML = "Gut! Es scheint, dass Sie die Vergangenheitsform verwendet haben, was ein Zeichen dafür ist, den Kontext zu beschreiben.";
                }
                if(context_presence_of_named_entity.length == 0){
                    document.getElementById("context_named_entities").innerHTML = "Es sieht so aus, als ob Sie keinen Ort, kein Datum und keine Personen in dem Zusammenhang erwähnt haben. Das kann daran liegen, dass Sie keine Bezeichnungen verwendet haben. Ansonsten versuchen Sie, den Kontext besser zu beschreiben 📅";
                }
                else{
                    document.getElementById("context_named_entities").innerHTML = "Es scheint, dass Sie einen Ort, ein Datum oder Personen erwähnt haben, was ein Zeichen dafür ist, dass Sie den Kontext beschreiben. Gut gemacht 👍";
                }

                document.getElementById("subjectivityBar_analysis").title = "Auf einer Skala von sehr objektiv (0%) bis sehr subjektiv (100%) ist dieser Text: " + analysis_subjectivity.toFixed(2) + "%";
                document.getElementById("subjectivityBar_analysis").value = analysis_subjectivity * 100;
                document.getElementById("polarityBar_analysis").title = "Auf einer Skala von sehr negativ (0%) bis sehr positiv (100%) ist dieser Text: " + analysis_polarity.toFixed(2) + "%";
                document.getElementById("polarityBar_analysis").value = ((analysis_polarity / 2.0) + 0.5) * 100;
                // Causality
                if(analysis_causal_keywords <= 0){
                    document.getElementById("analysis_causal").innerHTML = "Es scheint, dass Sie nicht explizit eine Ursache-Wirkungs-Beziehung erwähnt haben. Versuchen Sie ansonsten, Ihre Erfahrungen besser zu analysieren 📈";
                }
                else{
                    document.getElementById("analysis_causal").innerHTML = "Es scheint, dass Sie eine Ursache-Wirkungs-Beziehung erwähnt haben. Großartig!";
                }
                document.getElementById("subjectivityBar_evaluation").title = "Auf einer Skala von sehr objektiv (0%) bis sehr subjektiv (100%) ist dieser Text: " + evaluation_subjectivity.toFixed(2) + "%";
                document.getElementById("subjectivityBar_evaluation").value = evaluation_subjectivity * 100;
                document.getElementById("polarityBar_evaluation").title = "Auf einer Skala von sehr negativ (0%) bis sehr positiv (100%) ist dieser Text: " + evaluation_polarity.toFixed(2) + "%";
                document.getElementById("polarityBar_evaluation").value = ((evaluation_polarity / 2.0) + 0.5) * 100;

                if(plan_future_tense <= 0){
                    document.getElementById("plan_future_tense").innerHTML = "Am besten wäre es, wenn Sie bei der Beschreibung des Aktionsplans die Zukunftsform verwenden.";
                }
                else {
                    document.getElementById("plan_future_tense").innerHTML = "Gut! Es scheint, dass Sie das Futur verwendet haben, was ein Zeichen für die Beschreibung eines Aktionsplans ist.";
                }

                closeEssayButtonClick();
                this.setState({dashboardIsComputed: true, dashboardText: adaptedText, ascPolSentences: 0, ascSubSentences: 0});
                showDashboardStats(adaptedText);
                computeDashboard(analysis_subjectivity,analysis_polarity,evaluation_subjectivity,evaluation_polarity, adaptedText, addOnClickToReloadPage, this.state)

                let botHtml =
                    `<div class="message">
                        <div class="message-botname">MindMate</div>
                        <div class="botText">
                            <div class="avatar-wrapper">
                                <img class="avatar" src="/img/ArgueTutor.png" alt="avatar">
                            </div>
                            <div class="data-wrapper">Das Feedback zu Ihrem letzten Aufsatz wurde erstellt. Sie können es erneut einsehen, indem Sie auf die Schaltfläche Dashboard klicken.</div>
                        </div>
                        <div class="message-time">` + getTime() + `</div>
                    </div>
                    `;
                this.updateChatBoxContent(botHtml)
                document.getElementById("loadingEvaluationAnimation").style.display = "none";

                //     timeout and error handling
            }).catch(() => {
                document.getElementById("loadingEvaluationAnimation").style.display = "none";
                closeEssayButtonClick();
                closeDashboardButtonClick();
                let botHtml =
                    `<div class="message">
                        <div class="message-botname">MindMate</div>
                        <div class="botText">
                            <div class="avatar-wrapper">
                                <img class="avatar" alt="avatar">
                            </div>
                            <div class="data-wrapper">Bei der Erstellung des Feedbacks zu Ihrem Aufsatz ist ein Fehler unterlaufen. Ich bitte um Entschuldigung. Bitte versuchen Sie es erneut, indem Sie die Seite aktualisieren.</div>
                        </div>
                        <div class="message-time">` + getTime() + `</div>
                    </div>
                    `;
                this.setState({wasQuestion: true}, () => this.updateChatBoxContent(botHtml));
            });
        }

        /**
         * Sends evaluation request to the backend and then displays the corresponding Dashboard with the results
         */
        const evaluationChatSuggestInteractive = () => {
            this.setState({wasQuestion: false});

            document.getElementById("loadingEvaluationAnimation").style.display = "";
            document.getElementById("close-essay-field-button").disabled = true;
            document.getElementById("button-eval").disabled = true;

            // Used to signal to the user if there is a massive evaluation delay
            const timeout = new Promise((resolve, reject) => {
                setTimeout(() => {
                    reject(new Error('Request timed out'));
                }, 25000); // Timeout after 25 seconds
            });
            // use race method in order to check what happens first, response from the bot or timeout
            Promise.race([fetch(CHATBOT_URL + "/evaluate", {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json;charset=utf-8'
                    },
                    body: JSON.stringify({uuid: UUID})
                }), timeout]
            ).then(response => response.json()
            ).then(data => {

                let context_past_tense =  data.context_past_tense;
                let context_presence_of_named_entity = data.context_presence_of_named_entity;
                let emotions = data.emotions;
                let analysis_polarity = data.analysis_polarity;
                let analysis_subjectivity = data.analysis_subjectivity;
                let analysis_causal_keywords = data.analysis_causal_keywords;
                let evaluation_polarity = data.evaluation_polarity;
                let evaluation_subjectivity = data.evaluation_subjectivity;
                let plan_future_tense = data.plan_future_tense;
                let text = data.text;

                let adaptedText = text.replaceAll("\\n", "\n");
                if(adaptedText.length <= 0){
                    Swal({
                        title: 'Leerer Text!',
                        text: 'Sie können erst dann Erkenntnisse über Ihre Reflexion gewinnen, wenn Sie sie abgeschlossen haben.',
                        icon: 'error',
                        confirmButtonText: 'Weiter',
                        confirmButtonColor: '#00762C'
                    })
                    return;
                }
                let labels = emotions.map(e => e.label).map(e => {
                    if(e === "joy") return "Freude";
                    else if(e === "fear") return "Angst";
                    else if(e === "neutral") return "Neutral";
                    else if(e === "sadness") return "Traurigkeit";
                    else if(e === "anger") return "Wut";
                    else if(e === "disgust") return "Ekel";
                    else if(e === "surprise") return "Überraschung";
                });

                var chart = document.getElementById('chart');
                new Chart(chart, {
                    type: 'pie',
                    data: {
                        labels: labels, // Replace with your own labels
                        datasets: [{
                            data: emotions.map(e => Math.round(Number((e.score * 100)))), // Replace with your own data values
                            backgroundColor: ['lightcoral', 'lightgreen', 'lightsalmon', 'lightcyan', 'lightgrey', 'lightyellow', 'lightpink'], // Replace with your own colors
                        }]
                    }
                });

                let neutral_score = emotions.filter(e => e.label == "neutral")[0].score * 100
                if(neutral_score >= 35){
                    document.getElementById("emotions_text").innerHTML = "Es scheint, dass Sie Ihre Gefühle auf neutrale Weise ausgedrückt haben. Versuchen Sie, die Gefühle, die Sie während des Erlebnisses hatten, deutlicher zu beschreiben 💭"
                }
                else{
                    document.getElementById("emotions_text").innerHTML = "Es scheint, dass Sie einige Emotionen beschrieben haben. Das hilft Ihnen zu verstehen, wie sich diese Erfahrung auf Sie ausgewirkt hat und ermöglicht so eine gute Reflexion 💭"
                }

                if(context_past_tense <= 0){
                    document.getElementById("context_past_tense").innerHTML = "Es wäre am besten, die Vergangenheitsform zu verwenden, wenn Sie den Kontext beschreiben.";
                }
                else {
                    document.getElementById("context_past_tense").innerHTML = "Gut! Es scheint, dass Sie die Vergangenheitsform verwendet haben, was ein Zeichen dafür ist, den Kontext zu beschreiben.";
                }
                if(context_presence_of_named_entity.length == 0){
                    document.getElementById("context_named_entities").innerHTML = "Es sieht so aus, als ob Sie keinen Ort, kein Datum und keine Personen in dem Zusammenhang erwähnt haben. Das kann daran liegen, dass Sie keine Bezeichnungen verwendet haben. Ansonsten versuchen Sie, den Kontext besser zu beschreiben 📅";
                }
                else{
                    document.getElementById("context_named_entities").innerHTML = "Es scheint, dass Sie einen Ort, ein Datum oder Personen erwähnt haben, was ein Zeichen dafür ist, dass Sie den Kontext beschreiben. Gut gemacht 👍";
                }

                document.getElementById("subjectivityBar_analysis").title = "Auf einer Skala von sehr objektiv (0%) bis sehr subjektiv (100%) ist dieser Text: " + analysis_subjectivity.toFixed(2) + "%";
                document.getElementById("subjectivityBar_analysis").value = analysis_subjectivity * 100;
                document.getElementById("polarityBar_analysis").title = "Auf einer Skala von sehr negativ (0%) bis sehr positiv (100%) ist dieser Text: " + analysis_polarity.toFixed(2) + "%";
                document.getElementById("polarityBar_analysis").value = ((analysis_polarity / 2.0) + 0.5) * 100;
                // Causality
                if(analysis_causal_keywords <= 0){
                    document.getElementById("analysis_causal").innerHTML = "Es scheint, dass Sie nicht explizit eine Ursache-Wirkungs-Beziehung erwähnt haben. Versuchen Sie ansonsten, Ihre Erfahrungen besser zu analysieren 📈";
                }
                else{
                    document.getElementById("analysis_causal").innerHTML = "Es scheint, dass Sie eine Ursache-Wirkungs-Beziehung erwähnt haben. Großartig!";
                }
                document.getElementById("subjectivityBar_evaluation").title = "Auf einer Skala von sehr objektiv (0%) bis sehr subjektiv (100%) ist dieser Text: " + evaluation_subjectivity.toFixed(2) + "%";
                document.getElementById("subjectivityBar_evaluation").value = evaluation_subjectivity * 100;
                document.getElementById("polarityBar_evaluation").title = "Auf einer Skala von sehr negativ (0%) bis sehr positiv (100%) ist dieser Text: " + evaluation_polarity.toFixed(2) + "%";
                document.getElementById("polarityBar_evaluation").value = ((evaluation_polarity / 2.0) + 0.5) * 100;

                if(plan_future_tense <= 0){
                    document.getElementById("plan_future_tense").innerHTML = "Am besten wäre es, wenn Sie bei der Beschreibung des Aktionsplans die Zukunftsform verwenden.";
                }
                else {
                    document.getElementById("plan_future_tense").innerHTML = "Gut! Es scheint, dass Sie das Futur verwendet haben, was ein Zeichen für die Beschreibung eines Aktionsplans ist.";
                }

                closeEssayButtonClick();
                this.setState({dashboardIsComputed: true, dashboardText: adaptedText, ascPolSentences: 0, ascSubSentences: 0});
                showDashboardStats(adaptedText);
                computeDashboard(analysis_subjectivity,analysis_polarity,evaluation_subjectivity,evaluation_polarity, adaptedText, addOnClickToReloadPage, this.state)

                let botHtml =
                    `<div class="message">
                        <div class="message-botname">MindMate</div>
                        <div class="botText">
                            <div class="avatar-wrapper">
                                <img class="avatar" src="/img/ArgueTutor.png" alt="avatar">
                            </div>
                            <div class="data-wrapper">Das Feedback zu Ihrem letzten Aufsatz wurde erstellt. Sie können es erneut einsehen, indem Sie auf die Schaltfläche Dashboard klicken.</div>
                        </div>
                        <div class="message-time">` + getTime() + `</div>
                    </div>
                    `;
                this.updateChatBoxContent(botHtml)
                document.getElementById("loadingEvaluationAnimation").style.display = "none";

                //     timeout and error handling
            }).catch(() => {
                document.getElementById("loadingEvaluationAnimation").style.display = "none";
                closeEssayButtonClick();
                closeDashboardButtonClick();
                let botHtml =
                    `<div class="message">
                        <div class="message-botname">MindMate</div>
                        <div class="botText">
                            <div class="avatar-wrapper">
                                <img class="avatar" alt="avatar">
                            </div>
                            <div class="data-wrapper">Bei der Erstellung des Feedbacks zu Ihrem Aufsatz ist ein Fehler unterlaufen. Ich bitte um Entschuldigung. Bitte versuchen Sie es erneut, indem Sie die Seite aktualisieren.</div>
                        </div>
                        <div class="message-time">` + getTime() + `</div>
                    </div>
                    `;
                this.setState({wasQuestion: true}, () => this.updateChatBoxContent(botHtml));
            });
        }


        /**
         * Sets the value of the lowest star to the rating selected
         */
        const adaptFeedbackStars = (idx) => {
            document.getElementById("rating-1").value = idx;
        }

        return (
            <div>
                {/* Version 3.0 */}
                <meta charSet="utf-8"/>
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1, user-scalable=no"
                />
                <meta name="apple-mobile-web-app-capable" content="yes"/>

                <title>MindMate</title>
                <div className="chatbot">
                    <div className="header">
                        <div className="header-logo"/>
                        <div className="header-botname">MindMate</div>
                        <div className="header-button-bar">
                            <button className="header-button" id="open-insights-button" onClick={evaluationChatSuggestInteractive}>
                                <i className="fa fa-search"/>
                                <span>Einblicke</span>
                            </button>
                            <button
                                className="header-button"
                                id="close-insights-button"
                                style={{display: "none"}}
                                onClick={closeInsightsButtonClick}
                            >
                                <i className="fa fa-times"/>
                                <span>Einblicke</span>
                            </button>
                            <button className="header-button" id="open-help-button" onClick={helpButtonClick}>
                                <i className="fa fa-info"/>
                                <span>Hilfe</span>
                            </button>
                            <button className="header-button" id="open-Detail-button" onClick={detailButtonClick}>
                                <i className="fa fa-question"/>
                                <span>FAQ</span>
                            </button>
                            <button
                                className="header-button"
                                id="close-Detail-button"
                                style={{display: "none"}}
                                onClick={closeDetailButtonClick}
                            >
                                <i className="fa fa-times"/>
                                <span>FAQ</span>
                            </button>
                            <button className="header-button" id="open-feedback-button" onClick={feedbackButtonClick}>
                                <i className="fa fa-pencil-square-o"/>
                                <span>Feedback</span>
                            </button>
                            <button
                                className="header-button"
                                id="close-feedback-button"
                                style={{display: "none"}}
                                onClick={closeFeedbackButtonClick}
                            >
                                <i className="fa fa-times"/>
                                <span>Feedback</span>
                            </button>
                            <button className="header-button" id="chatgpt" onClick={this.chatGPT}>
                                <i className="fa fa-comments"/>
                                <span>interactive</span>
                            </button>

                            <button
                                className="header-button"
                                id="close-help-button"
                                style={{display: "none"}}
                                onClick={closeHelpButtonClick}
                            >
                                <i className="fa fa-times"/>
                                <span>Hilfe</span>
                            </button>
                            <button
                                className="header-button"
                                id="close-dashboard-button"
                                style={{display: "none"}}
                                onClick={closeDashboardButtonClick}
                            >
                                <i className="fa fa-times"/>
                                <span>Dashboard</span>
                            </button>
                            <button
                                className="header-button"
                                id="show-dashboard-button"
                                style={{display: "none"}}
                                onClick={showDashboardButtonClick}
                            >
                                <i className="fas fa-chart-pie"/>
                                <span>Dashboard</span>
                            </button>
                            <button
                                className="header-button"
                                id="close-essay-field-button"
                                style={{display: "none"}}
                                onClick={closeEssayButtonClick}
                            >
                                <i className="fa fa-times"/>
                                 Zurück
                            </button>


                            <button
                                className="header-button"
                                id="open-essay-page"
                                style={{display: "none"}}
                                onClick={() => this.showEssayField(this.state.dashboardIsComputed)}
                            >
                                <i className="fa fa-book"/>
                                <span>Reflektieren</span>
                            </button>
                        </div>
                    </div>
                    <div id="scrollbox">
                        <div className="messagecontainer">
                            <div id="chatbox" dangerouslySetInnerHTML={this.state.chatBoxContent}/>
                        </div>
                    </div>

                    {/* DASHBOARD including the evaluation */}
                    <div id="dashboard">
                        <div className="col-md-12">
                            <div className="rounded border">
                                <div className="container-fluid text-center mt-3">
                                    <h1
                                        className="m-0"
                                        style={{
                                            borderBottomStyle: "solid",
                                            marginBottom: "15px!important",
                                        }}
                                    >
                                        Dashboard
                                    </h1>
                                </div>
                                <div className="row">
                                    <div className="col-md-12">
                                        <div className="p-2">
                                            {/* STRUCTURE-GRAPH */}
                                            <div
                                                className="container-fluid text-center"
                                                style={{fontSize: "1.5em", fontWeight: 600}}
                                            >
                                                Hier ist Ihr Text
                                            </div>
                                        </div>
                                    </div>
                                    {/* Implementation of the text in the dashboard, including the wordcount table*/}

                                    <div
                                        className="col-md-12 card"
                                        style={{
                                            maxWidth: "80%",
                                            marginLeft: "auto",
                                            marginRight: "auto",
                                        }}
                                    >
                                        <div
                                            className="p-2 border p-4"
                                            id="userDashboardText"
                                            style={{
                                                marginTop: 10,
                                                marginBottom: 20,
                                                backgroundColor: "azure",
                                            }}
                                        />
                                        <section className="container" style={{maxWidth: 1000}}>
                                            <div
                                                className="left-half"
                                                style={{display: "inline-block", width: "50%"}}
                                            >
                                                <div className="output row" style={{marginLeft: "-1rem"}}>
                                                    <div>
                                                        Zeichen: <span id="characterCountDB">0</span>
                                                    </div>
                                                    <div>
                                                        Wörter: <span id="wordCountDashboard">0</span>
                                                    </div>
                                                </div>
                                                <div className="output row" style={{marginLeft: "-1rem"}}>
                                                    <div>
                                                        Sätze: <span id="sentenceCountDB">0</span>
                                                    </div>
                                                    <div>
                                                        Paragraphen: <span id="paragraphCountDB">0</span>
                                                    </div>
                                                </div>
                                                <div className="output row" style={{marginLeft: "-1rem"}}>
                                                    <div>
                                                        Lesezeit: <span id="readingTimeDB">0</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div
                                                className="right-half"
                                                style={{display: "inline-block", width: "49%"}}
                                            >
                                                <div className="keywords" style={{marginRight: "-1rem"}}>
                                                    <h3>Top Schlüsselwörter</h3>
                                                    <ul id="topKeywordsDB"></ul>
                                                </div>
                                            </div>
                                        </section>
                                    </div>
                                </div>
                                {/* Second section  */}
                                <div className="row">
                                    <div className="col-md-12">
                                        <div className="p-2">
                                            {/* Visual and written feedback */}
                                            <div className="container-fluid text-center">
                                                Haben Sie Fragen zur Analyse? (
                                                <a href="javascript:void(0);" onClick={() => {
                                                    closeDashboardButtonClick();
                                                    showDetail();
                                                }}>
                                                    Wie wurde mein Text analysiert?
                                                </a>
                                                )
                                            </div>
                                            <div className="row text-center" style={{height: "auto"}}>
                                                <div className="col-md-12 text-center my-5">
                                                    {/* Evaluation section within the Dashboard */}
                                                    <h1 style={{borderTopStyle: "solid"}}>
                                                        Feedback
                                                    </h1>
                                                    <div
                                                        className="container my-3"
                                                        style={{alignItems: "flex-start"}}
                                                    >
                                                        <h4 className="my-2"> Kontext </h4>
                                                        <div
                                                            className="text-black-50"
                                                            style={{fontSize: "large", marginBottom: 30}}
                                                            id="context_past_tense"
                                                        />
                                                        <div
                                                            className="text-black-50"
                                                            style={{fontSize: "large", marginBottom: 30}}
                                                            id="context_named_entities"
                                                        />
                                                        <h4 className="my-2"> Emotionen </h4>
                                                        <canvas id="chart" />
                                                        <div
                                                            className="text-black-50"
                                                            style={{fontSize: "large", marginBottom: 30}}
                                                            id="emotions_text"
                                                        />

                                                        <h4 className="my-2"> Analyse </h4>
                                                        <div
                                                            className="text-black-50"
                                                            style={{fontSize: "large", marginBottom: 30}}
                                                            id="analysis_sub_pol"
                                                        >
                                                            Die Analyse sollte recht subjektiv sein und eine nicht neutrale Polarität aufweisen. Hier sind die Statistiken für Ihren Text:
                                                        </div>
                                                        <h4 className="my-2"> Subjektivität/Objektivität der Analyse </h4>
                                                        <progress className={"progress"} id="subjectivityBar_analysis"
                                                                  title={"On a scale from very objective (0%) to very subjective (100%), this text is: "}
                                                                  max="100" value="90">
                                                        </progress>
                                                        <div
                                                            className="row w-100 text-center mx-auto mt-2"
                                                            style={{marginBottom: 15}}
                                                        >
                                                            <div
                                                                id="s1"
                                                                className="col-md-2 border mx-auto"
                                                                style={{borderRadius: 10, textAlign: "center"}}
                                                            >
                                                                Sehr objektiv
                                                            </div>
                                                            <div
                                                                id="s2"
                                                                className="col-md-2 border mx-auto"
                                                                style={{borderRadius: 10, textAlign: "center"}}
                                                            >
                                                                Objektiv
                                                            </div>
                                                            <div
                                                                id="s3"
                                                                className="col-md-2 border mx-auto"
                                                                style={{borderRadius: 10, textAlign: "center"}}
                                                            >
                                                                Neutral
                                                            </div>
                                                            <div
                                                                id="s4"
                                                                className="col-md-2 border mx-auto"
                                                                style={{borderRadius: 10, textAlign: "center"}}
                                                            >
                                                                Subjektiv
                                                            </div>
                                                            <div
                                                                id="s5"
                                                                className="col-md-2 border mx-auto"
                                                                style={{borderRadius: 10, textAlign: "center"}}
                                                            >
                                                                Sehr subjektiv
                                                            </div>
                                                        </div>


                                                        <h4 className="my-2"> Polarität der Analyse </h4>
                                                        <progress className={"progress"} id="polarityBar_analysis"
                                                                  title={"On a scale from very negative (0%) to very positive (100%), this text is: "}
                                                                  max="100" value="90">
                                                        </progress>
                                                        <div
                                                            className="row w-100 text-center mx-auto mt-2"
                                                            style={{marginBottom: 20}}
                                                        >
                                                            <div
                                                                id="p1"
                                                                className="col-md-2 border mx-auto"
                                                                style={{borderRadius: 10, textAlign: "center"}}
                                                            >
                                                                Sehr Negativ
                                                            </div>
                                                            <div
                                                                id="p2"
                                                                className="col-md-2 border mx-auto"
                                                                style={{borderRadius: 10, textAlign: "center"}}
                                                            >
                                                                Negativ
                                                            </div>
                                                            <div
                                                                id="p3"
                                                                className="col-md-2 border mx-auto"
                                                                style={{borderRadius: 10, textAlign: "center"}}
                                                            >
                                                                Neutral
                                                            </div>
                                                            <div
                                                                id="p4"
                                                                className="col-md-2 border mx-auto"
                                                                style={{borderRadius: 10, textAlign: "center"}}
                                                            >
                                                                Positiv
                                                            </div>
                                                            <div
                                                                id="p5"
                                                                className="col-md-2 border mx-auto"
                                                                style={{borderRadius: 10, textAlign: "center"}}
                                                            >
                                                                Sehr positiv
                                                            </div>
                                                        </div>

                                                        <div
                                                            className="text-black-50"
                                                            style={{fontSize: "large", marginBottom: 30}}
                                                            id="analysis_causal"
                                                        />
                                                        <h4 className="my-2"> Bewertung </h4>
                                                        <div
                                                            className="text-black-50"
                                                            style={{fontSize: "large", marginBottom: 30}}
                                                            id="evaluation_sub_pol"
                                                        >
                                                            Die Bewertung sollte recht subjektiv und nicht neutral sein. Hier sind die Statistiken für Ihren Text:
                                                        </div>
                                                        <h4 className="my-2"> Subjektivität/Objektivität der Bewertung </h4>
                                                        <progress className={"progress"} id="subjectivityBar_evaluation"
                                                                  title={"On a scale from very objective (0%) to very subjective (100%), this text is: "}
                                                                  max="100" value="90">
                                                        </progress>
                                                        <div
                                                            className="row w-100 text-center mx-auto mt-2"
                                                            style={{marginBottom: 15}}
                                                        >
                                                            <div
                                                                id="s1_2"
                                                                className="col-md-2 border mx-auto"
                                                                style={{borderRadius: 10, textAlign: "center"}}
                                                            >
                                                                Sehr objektiv
                                                            </div>
                                                            <div
                                                                id="s2_2"
                                                                className="col-md-2 border mx-auto"
                                                                style={{borderRadius: 10, textAlign: "center"}}
                                                            >
                                                                objektiv
                                                            </div>
                                                            <div
                                                                id="s3_2"
                                                                className="col-md-2 border mx-auto"
                                                                style={{borderRadius: 10, textAlign: "center"}}
                                                            >
                                                                Neutral
                                                            </div>
                                                            <div
                                                                id="s4_2"
                                                                className="col-md-2 border mx-auto"
                                                                style={{borderRadius: 10, textAlign: "center"}}
                                                            >
                                                                subjektiv
                                                            </div>
                                                            <div
                                                                id="s5_2"
                                                                className="col-md-2 border mx-auto"
                                                                style={{borderRadius: 10, textAlign: "center"}}
                                                            >
                                                                Sehr subjektiv
                                                            </div>
                                                        </div>


                                                        <h4 className="my-2"> Polarität der Bewertung </h4>
                                                        <progress className={"progress"} id="polarityBar_evaluation"
                                                                  title={"On a scale from very negative (0%) to very positive (100%), this text is: "}
                                                                  max="100" value="90">
                                                        </progress>
                                                        <div
                                                            className="row w-100 text-center mx-auto mt-2"
                                                            style={{marginBottom: 20}}
                                                        >
                                                            <div
                                                                id="p1_2"
                                                                className="col-md-2 border mx-auto"
                                                                style={{borderRadius: 10, textAlign: "center"}}
                                                            >
                                                                Sehr Negativ
                                                            </div>
                                                            <div
                                                                id="p2_2"
                                                                className="col-md-2 border mx-auto"
                                                                style={{borderRadius: 10, textAlign: "center"}}
                                                            >
                                                                Negativ
                                                            </div>
                                                            <div
                                                                id="p3_2"
                                                                className="col-md-2 border mx-auto"
                                                                style={{borderRadius: 10, textAlign: "center"}}
                                                            >
                                                                Neutral
                                                            </div>
                                                            <div
                                                                id="p4_2"
                                                                className="col-md-2 border mx-auto"
                                                                style={{borderRadius: 10, textAlign: "center"}}
                                                            >
                                                                positiv
                                                            </div>
                                                            <div
                                                                id="p5_2"
                                                                className="col-md-2 border mx-auto"
                                                                style={{borderRadius: 10, textAlign: "center"}}
                                                            >
                                                                Sehr positiv
                                                            </div>
                                                        </div>

                                                        <h4 className="my-2"> Aktionsplan </h4>
                                                        <div
                                                            className="text-black-50"
                                                            style={{fontSize: "large", marginBottom: 30}}
                                                            id="plan_future_tense"
                                                        />

                                                    </div>
                                                    {/* Reload page function - getting back to the introduction.  */}
                                                    <div className="container-fluid text-center">
                                                        <div className="display-8">
                                                            {" "}
                                                            Kontakt {" "}
                                                            <a href="mailto:thiemo.wambsganss@epfl.ch">
                                                                thiemo.wambsganss@epfl.ch
                                                            </a>
                                                            , wenn Sie weitere Hilfe benötigen.
                                                        </div>
                                                        <button
                                                            type={"button"}
                                                            className="buttonTest"
                                                            id="reload-page"
                                                            onClick={refreshPage}
                                                        >
                                                            <span>Neu anfangen</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* DASHBOARD END */}

                    {/*scrollbox end*/}
                    <div id="privacy">
                        <h3>Einverständniserklärung</h3>
                        <p>Bitte lesen Sie die Einwilligungserklärung sorgfältig durch.</p>
                        <p>
                            Ich bin damit einverstanden, dass der Inhalt meiner Nachrichten an den Chatbot zum Zweck der
                            Sprachverarbeitung an Universitätsserver gesendet wird. Ich bin außerdem damit
                            einverstanden, dass meine anonymisierten Daten für wissenschaftliche Zwecke genutzt werden
                            können. Mir ist bekannt, dass ich meine Einwilligung jederzeit widerrufen kann.
                        </p>
                        <p>
                            Wir versichern volle Anonymität - eine Zuordnung der gesammelten Datenpunkte zu einzelnen
                            Teilnehmern ist nicht möglich.
                        </p>
                        <p>
                            Wenn Sie Fragen zur Verwendung Ihrer Daten haben, können Sie sich an die Organisatoren der
                            Umfrage unter den folgenden Kontaktdaten wenden:
                        </p>
                        <p>
                            <a href="mailto:thiemo.wambsganss@epfl.ch">thiemo.wambsganss@epfl.ch</a>
                        </p>
                        <p>
                            <button
                                type="button"
                                id="privacy-accept"
                                className="button button-primary"
                                onClick={() => {
                                    hidePrivacy();
                                    initializeBot(this.updateChatBoxContent, this.state.chatGPTColor);
                                }}
                            >
                                Ich bin damit einverstanden.
                            </button>
                        </p>
                    </div>
                    <div id="feedback">
                        <h3> Der MindMate würde sich über ein Feedback freuen!</h3>
                        <form id="feedback-form">
                            <div>
                                <p> Wie zufrieden waren Sie mit der Nutzung? </p>
                                <fieldset className="rating">
                                    <input
                                        type="radio"
                                        id="rating-5"
                                        name="feedback-rating"
                                        onClick={() => adaptFeedbackStars(5)}
                                    />
                                    <label htmlFor="rating-5"></label>
                                    <input
                                        type="radio"
                                        id="rating-4"
                                        name="feedback-rating"
                                        onClick={() => adaptFeedbackStars(4)}
                                    />
                                    <label htmlFor="rating-4"></label>
                                    <input
                                        type="radio"
                                        id="rating-3"
                                        name="feedback-rating"
                                        onClick={() => adaptFeedbackStars(3)}
                                    />
                                    <label htmlFor="rating-3"></label>
                                    <input
                                        type="radio"
                                        id="rating-2"
                                        name="feedback-rating"
                                        onClick={() => adaptFeedbackStars(2)}
                                    />
                                    <label htmlFor="rating-2"></label>
                                    <input
                                        type="radio"
                                        id="rating-1"
                                        name="feedback-rating"
                                        onClick={() => adaptFeedbackStars(1)}
                                    />
                                    <label htmlFor="rating-1"></label>
                                </fieldset>
                            </div>
                            <div>
                                <p>
                                    {" "}
                                    Was halten Sie von MindMate? Ist es ein nützliches Werkzeug, um
                                    Fragen zu klären?{" "}
                                </p>
                                <p>
                        <textarea
                            type="text"
                            id="feedback-text"
                            placeholder="Write at least two short sentences, please."
                            defaultValue={""}
                        />
                                </p>
                            </div>
                            <div>
                                <p> Was könnte noch verbessert werden? (Fakultativ)</p>
                                <p>
                        <textarea
                            type="text"
                            id="feedback-improve"
                            placeholder="Write here your suggestions for the improvement..."
                            defaultValue={""}
                        />
                                </p>
                            </div>
                            <p>
                                <button type={"button"} className="button button-primary" id="feedback-submit"
                                        onClick={feedbackSubmitButtonClick}>
                                    <i className="fa fa-check"/>
                                    <span>Feedback abgeben</span>
                                </button>
                            </p>
                        </form>
                    </div>
                    <div id="help">
                        <h1>Hilfe</h1>
                        <div>
                            <h4>Probleme mit dem MindMate?</h4>
                            <p>
                                {" "}
                                Wenn Sie nicht weiterkommen oder das Gefühl haben, dass MindMate
                                nicht antwortet, versuchen Sie, ''Einführung'' in das Chat-Feld
                                einzugeben. Alternativ können Sie auch die Seite mit MindMate neu
                                laden.
                            </p>
                            <p>Benötigen Sie weitere Unterstützung? </p>
                            <p>
                                {" "}
                                Wenn ja, wenden Sie sich an Thiemo Wambsganss unter der folgenden
                                E-Mail-Adresse:
                            </p>
                            <p>
                                <a href="mailto:thiemo.wambsganss@epfl.ch">
                                    thiemo.wambsganss@epfl.ch
                                </a>
                            </p>
                        </div>
                    </div>
                    <div id="Detail">
                        <h1>FAQ</h1>
                        <div>
                            <h4>Was kann der MindMate tun?</h4>
                            <p>
                                {" "}
                                MindMate ist darauf geschult, Sie beim Schreiben der Reflexion zu unterstützen
                                Schreiben zu unterstützen und die Kohärenz der Struktur Ihres Reflexionsaufsatzes zu analysieren.
                                Sie werden in der Lage sein, die Grundlagen des reflexiven
                                mit den zur Verfügung gestellten Theorien. Die Textanalyse gibt Ihnen direktes
                                Feedback, das Sie an Ihre eigenen Vorlieben anpassen können.
                            </p>
                            <h4>Wie sollte ich MindMate verwenden?</h4>
                            <p>
                                {" "}
                                MindMate bietet Ihnen die Möglichkeit, in Ihrem eigenen Tempo zu lernen.
                                Sie können die Theorie jederzeit nachlesen, auch während des Schreibens.
                                Sie haben 2 Optionen. Eine statische, bei der Sie, sobald Sie das Schreiben beendet haben,
                                MindMate wird Ihr Ergebnis analysieren. Sie können die Auswertung so oft wie Sie möchten überarbeiten.
                                Die zweite Option ist interaktiver und der Chatbot führt Sie durch den Reflexionsprozess.
                                MindMate schreibt Ihnen keinen Lernprozess vor, sondern gibt Ihnen
                                die Möglichkeit, Ihren Lernprozess nach Ihren Wünschen anzupassen. Die
                                Schaltflächen ermöglichen es Ihnen, einfach durch die verschiedenen Lerneinheiten zu navigieren.
                                Auf diese Weise können Sie MindMate so nutzen, wie es Ihnen am besten passt. Wenn Sie
                                weitere Unterstützung benötigen, können Sie jederzeit den Hilfebereich besuchen {" "}
                            </p>
                            <h4>Wie funktioniert der MindMate?</h4>
                            <p>
                                {" "}
                                MindMate verwendet eine vordefinierte Bibliothek mit textlichen und visuellen
                                Inhalte, um Sie über das relative Schreiben zu unterrichten.
                                Darüber hinaus wird die Analyse Ihres Textes mit Hilfe der TextBlob-Bibliothek durchgeführt.
                                Die neueste ist ein beliebtes Werkzeug für die Verarbeitung natürlicher Sprache.
                            </p>

                            <h4>Wurden Ihre Fragen beantwortet? </h4>

                            <p>
                                <a href="mailto:thiemo.wambsganss@epfl.ch">
                                    Wenn nicht, kontaktieren Sie Thiemo Wambsgans, um weitere
                                    Informationen zu erhalten:
                                </a>
                            </p>
                        </div>
                    </div>



                    {/*Essay Writing Part*/}
                    <div id="ELEAIframeTemplate">
                        <form method="post" >
                            <label style={{display: "block", fontSize: "x-large"}}>
                                Geben Sie Ihren Text in die folgenden Felder ein, indem Sie versuchen, die einzelnen Fragen zu beantworten:
                            </label>
                            <div className="w3-display-left">
                                <div className="ehi-wordcount-container">
                                    <label htmlFor="evalution_textarea"/>

                                    <div id={"loadingEvaluationAnimation"}
                                         style={{
                                             display: "none",
                                             position: 'fixed',
                                             top: '50%',
                                             left: '50%',
                                             transform: 'translate(-50%, -50%)',
                                             background: 'white',
                                             padding: '20px',}}>
                                        <ClapSpinner size={40} color="#686769" loading={true}/>
                                    </div>
                                    <div
                                        className="text-black-50"
                                        style={{fontSize: "large", marginBottom: 30}}
                                        id="evaluation_sub_pol"
                                    >
                                        Was ist der Kontext der Erfahrung?
                                    </div>
                                    <textarea
                                        spellCheck={true}
                                        className="text"
                                        rows={25}
                                        cols={25}
                                        name="evaluationText"
                                        id="evalution_textarea"
                                        style={{
                                            resize: "none",
                                            borderRadius: 10,
                                            boxShadow: "none",
                                            borderWidth: 0,
                                            backgroundColor: "#f4f4f4",
                                            height: 150,
                                            marginBottom: "1rem",
                                            padding: "0.5rem"
                                        }}
                                        defaultValue={""}
                                    />
                                    <div
                                        className="text-black-50"
                                        style={{fontSize: "large", marginBottom: 30}}
                                        id="evaluation_sub_pol"
                                    >
                                        Welche Emotionen haben Sie während dieser Erfahrung empfunden?
                                    </div>
                                    <textarea
                                        spellCheck={true}
                                        className="text"
                                        rows={25}
                                        cols={25}
                                        name="evaluationText"
                                        id="evalution_textarea2"
                                        style={{
                                            resize: "none",
                                            borderRadius: 10,
                                            boxShadow: "none",
                                            borderWidth: 0,
                                            backgroundColor: "#f4f4f4",
                                            height: 150,
                                            marginBottom: "1rem",
                                            padding: "0.5rem"
                                        }}
                                        defaultValue={""}
                                    />
                                    <div
                                        className="text-black-50"
                                        style={{fontSize: "large", marginBottom: 30}}
                                        id="evaluation_sub_pol"
                                    >
                                        Was lief gut und was nicht? Versuchen Sie auch, über die möglichen Ursachen und Auswirkungen der Erfahrung nachzudenken.
                                    </div>
                                    <textarea
                                        spellCheck={true}
                                        className="text"
                                        rows={25}
                                        cols={25}
                                        name="evaluationText"
                                        id="evalution_textarea3"
                                        style={{
                                            resize: "none",
                                            borderRadius: 10,
                                            boxShadow: "none",
                                            borderWidth: 0,
                                            backgroundColor: "#f4f4f4",
                                            height: 150,
                                            marginBottom: "1rem",
                                            padding: "0.5rem"
                                        }}
                                        defaultValue={""}
                                    />
                                    <div
                                        className="text-black-50"
                                        style={{fontSize: "large", marginBottom: 30}}
                                        id="evaluation_sub_pol"
                                    >
                                        Welche Einsichten, Fähigkeiten oder Kenntnisse haben Sie daraus gewonnen?
                                    </div>
                                    <textarea
                                        spellCheck={true}
                                        className="text"
                                        rows={25}
                                        cols={25}
                                        name="evaluationText"
                                        id="evalution_textarea4"
                                        style={{
                                            resize: "none",
                                            borderRadius: 10,
                                            boxShadow: "none",
                                            borderWidth: 0,
                                            backgroundColor: "#f4f4f4",
                                            height: 150,
                                            marginBottom: "1rem",
                                            padding: "0.5rem"
                                        }}
                                        defaultValue={""}
                                    />
                                    <div
                                        className="text-black-50"
                                        style={{fontSize: "large", marginBottom: 30}}
                                        id="evaluation_sub_pol"
                                    >
                                        Wie können Sie das Gelernte auf zukünftige Vorhaben anwenden?
                                    </div>
                                    <textarea
                                        spellCheck={true}
                                        className="text"
                                        rows={25}
                                        cols={25}
                                        name="evaluationText"
                                        id="evalution_textarea5"
                                        style={{
                                            resize: "none",
                                            borderRadius: 10,
                                            boxShadow: "none",
                                            borderWidth: 0,
                                            backgroundColor: "#f4f4f4",
                                            height: 150,
                                            marginBottom: "1rem",
                                            padding: "0.5rem"
                                        }}
                                        defaultValue={""}
                                    />

                                </div>
                            </div>
                        </form>
                        <button
                            className="buttonEval"
                            id="button-eval"
                            onClick={evaluationChatSuggest}
                        >
                            Feedback generieren
                        </button>
                    </div>

                    {/* Header Buttons END */}
                    <div id="userInput">
                        <input
                            id="textInput"
                            type="text"
                            name="msg"
                            placeholder="Geben Sie Ihre Frage hier ein..."
                            autoFocus
                            autoCorrect={true}
                            onKeyUp={keyUpTextInput}
                        />
                        <button id="buttonInput" onClick={sendText}>
                            <i className="fa fa-arrow-right"/>
                        </button>
                    </div>
                </div>

                <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/mdbassit/Coloris@latest/dist/coloris.min.css"/>
            </div>

        );
    }
}

export {MainFrameEn}