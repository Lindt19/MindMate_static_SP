#! /usr/bin/python3
# -*- coding: utf-8 -*-

import csv
import logging
import os
from time import gmtime, strftime
import requests
from flask import Flask, render_template, request, jsonify
from datetime import datetime
from dateTime import getTime, getDate
from time import localtime, strftime
import pytz
import nltk
import openai
from time import time
from chatomatic import *
from flask_cors import *
import EvaluationHandler
from FeedbackGenerator import *

nltk.download("punkt")

# Initialize Flask for webapp
app = Flask(__name__)
app.config["SEND_FILE_MAX_AGE_DEFAULT"] = 0
FLASK_PORT = os.environ.get('PORT', 8080)  # use 8080 for local setup

CORS(app)

# Application settings
logging.basicConfig(level=logging.DEBUG)
currentPath = os.path.dirname(os.path.abspath(__file__))  # Current absolute file path$
subfolders = [ f.path for f in os.scandir(currentPath) if f.is_dir() ]
logging.debug("Subfolders: " + str(subfolders))

logging.debug("Content of /data: " + str([ f.path for f in os.scandir(f"{currentPath}/data")]))

# Chatbot settings
useGoogle = "no"  # Yes - Bei nicht wissen durchsucht der Bot google nach dem unbekannten Begriff und gibt einen Link. No - Google wird nicht zur Hilfe gezogen
confidenceLevel = 0.70  # Bot confidence level - Muss zwischen 0 und 1 liegen. Je höher der Wert, desto sicherer muss sich der Bot seiner Antwort sein

# Initialize dateTime util
now = datetime.now(pytz.timezone("Europe/Berlin"))
mm = str(now.month)
dd = str(now.day)
yyyy = str(now.year)
hour = str(now.hour)
minute = str(now.minute)
if now.minute < 10:
    minute = "0" + str(now.minute)
chatBotDate = strftime("%d.%m.%Y, %H:%M", localtime())
chatBotTime = strftime("%H:%M", localtime())

# create an instance of the chatbot
chatomatic = Chatomatic(f"{currentPath}/data/DialoguesDe.yml", language="de")

states = {}
state = 0

# Google fallback if response == IDKresponse
def tryGoogle(myQuery):
    return (
            "<br><br>Gerne kannst du die Hilfe meines Freundes Google in Anspruch nehmen: <a target='_blank' href='https://www.google.com/search?q="
            + myQuery
            + "'>"
            + myQuery
            + "</a>"
    )

# CSV writer
def writeCsv(filePath, data):
    with open(filePath, "a", newline="", encoding="utf-8") as logfile:
        csvWriter = csv.writer(logfile, delimiter=";")
        csvWriter.writerow(data)


def get_feedback(text):
    sub = EvaluationHandler.__get_subjective(text)  # examines sub and pol
    pol = EvaluationHandler.__get_polarity(text)
    future_conclusion = EvaluationHandler.__get_future(text)
    first_person_count = EvaluationHandler.__get_first_person_count(text)
    past_intro = EvaluationHandler.__get_past(text)

    feedback = generate_feedback(sub, sub, pol, pol, first_person_count, past_intro, future_conclusion)

    return feedback

# Flask route for Emma
@app.route("/", methods=["GET", "POST"])
def home_emma():
    return render_template("index.html")


# Flask route for getting bot responses
@app.route("/getResponse", methods=["POST"])
def get_bot_response():
    """
    Basic communication with the chatbot. Uses this route to send text and return reply from the chatbot. Uses
    static chatbot or chatGPT.
    """
    data = request.get_json()
    text = data.get("text")
    gpt = data.get("gpt")  # boolean if chatGPT is active
    global state  # Declare the variable as global
    global intro
    global body
    global conclusion

    uuid = data.get("uuid")
    print(uuid)

    if uuid not in states:
        states[uuid] = {
            "state": 0,
            "context": "",
            "emotions": "",
            "analysis": "",
            "evaluation": "",
            "plan": "",
            "text": ""
        }

    session_state = states[uuid]
    state = session_state["state"]


    try:
        botReply = str(chatomatic.answer(text))
    except Exception as e:
        print("Exception---------------")
        print(e)

    if botReply == "IDKresponse":
        if useGoogle == "yes":
            botReply = botReply + tryGoogle(text)
    elif botReply == "getTIME":
        botReply = getTime()
    elif botReply == "getDATE":
        botReply = getDate()

    #writeCsv(currentPath + "/log/botLog.csv", [text, botReply])
    data = {"botReply": botReply}
    return jsonify(data)


## Flask route for posting feedback
@app.route("/feedback", methods=["POST"])
def send_feedback():
    data = request.get_json()
    bot = data.get("bot")
    rating = data.get("rating")
    text = data.get("text")
    improvement = data.get("improve")

    writeCsv(
        currentPath + "/log/evaluationFeedback.csv",
        [bot, rating, text, improvement],
    )

    return jsonify({"success": True}, 200, {"ContentType": "application/json"})


@app.route("/evaluate", methods=["POST"])
def evaluate():
    """
    Provides feedback of the reflection essay.
    """
    data = request.get_json()
    uuid = data.get("uuid")
    print(uuid)

    if uuid not in states:
        states[uuid] = {
                "state": 0,
                "context": "",
                "emotions": "",
                "analysis": "",
                "evaluation": "",
                "plan": "",
                "text": ""
            }

    session_state = states[uuid]
    # Context
    context =  session_state["context"]
    context_past_tense = EvaluationHandler.__get_past(context)
    context_presence_of_named_entity = EvaluationHandler.__get_named_entities(context)
    # Emotions
    emotions = EvaluationHandler.__get_emotion(session_state["emotions"])
    # Analysis
    analysis = session_state["analysis"]
    analysis_polarity = EvaluationHandler.__get_polarity(analysis)
    analysis_subjectivity = EvaluationHandler.__get_subjective(analysis)
    analysis_causal_keywords = EvaluationHandler.__get_causal_keywords(analysis)
    # Evaluation
    evaluation = session_state["evaluation"]
    evaluation_polarity = EvaluationHandler.__get_polarity(evaluation)
    evaluation_subjectivity = EvaluationHandler.__get_subjective(evaluation)
    # Plan
    plan_future_tense = EvaluationHandler.__get_future(session_state["plan"])

    data = {
                "context_past_tense": context_past_tense,
                "context_presence_of_named_entity": context_presence_of_named_entity,
                "emotions": emotions,
                "analysis_polarity": analysis_polarity,
                "analysis_subjectivity": analysis_subjectivity,
                "analysis_causal_keywords": analysis_causal_keywords,
                "evaluation_polarity": evaluation_polarity,
                "evaluation_subjectivity": evaluation_subjectivity,
                "plan_future_tense": plan_future_tense,
                "text": session_state["text"],
                "first_person_count": 0
            }

    return jsonify(data)


# Added to implement the file transfer for reading the pdf and giving corresponding answer
#  GET AND POST are required - otherwise : method not allowed error
@app.route("/texttransfer", methods=["POST"])
def receive_text():
    """
    Provides feedback of the reflection essay using nltk and spacy library. Used for static chatbot.
    """
    # receive text from front-end
    received_text = request.get_json().get("text")
    received_text = received_text.replace("\\n", "\n")

    context = request.get_json().get("context")
    emotions = request.get_json().get("emotions")
    analysis = request.get_json().get("analysis")
    evaluation = request.get_json().get("evaluation")
    plan = request.get_json().get("plan")


    # used for not english text
    translated_context = EvaluationHandler.__translate_to_english(context)
    print(translated_context)
    translated_emotions = EvaluationHandler.__translate_to_english(emotions)
    translated_analysis = EvaluationHandler.__translate_to_english(analysis)
    translated_evaluation = EvaluationHandler.__translate_to_english(evaluation)
    translated_plan = EvaluationHandler.__translate_to_english(plan)

    # Context
    context_past_tense = EvaluationHandler.__get_past(translated_context)
    context_presence_of_named_entity = EvaluationHandler.__get_named_entities(translated_context)
    # Emotions
    emotions = EvaluationHandler.__get_emotion(translated_emotions)
    # Analysis
    analysis_polarity = EvaluationHandler.__get_polarity(translated_analysis)
    analysis_subjectivity = EvaluationHandler.__get_subjective(translated_analysis)
    analysis_causal_keywords = EvaluationHandler.__get_causal_keywords(translated_analysis)
    # Evaluation
    evaluation_polarity = EvaluationHandler.__get_polarity(translated_evaluation)
    evaluation_subjectivity = EvaluationHandler.__get_subjective(translated_evaluation)
    # Plan
    plan_future_tense = EvaluationHandler.__get_future(translated_plan)

    data = {
        "context_past_tense": context_past_tense,
        "context_presence_of_named_entity": context_presence_of_named_entity,
        "emotions": emotions,
        "analysis_polarity": analysis_polarity,
        "analysis_subjectivity": analysis_subjectivity,
        "analysis_causal_keywords": analysis_causal_keywords,
        "evaluation_polarity": evaluation_polarity,
        "evaluation_subjectivity": evaluation_subjectivity,
        "plan_future_tense": plan_future_tense,
        "text": received_text,
        "first_person_count": 0
    }

    return jsonify(data)


if __name__ == "__main__":
    # using debug=True makes GPT unavailable
    app.run(host="0.0.0.0", port=int(FLASK_PORT))
