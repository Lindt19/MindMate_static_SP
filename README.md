# MindMate (Static reflection version)

Chatbot for self reflections created as part of a semester project in the  ML4ED lab at EPFL

## Table of Contents

- [Frontend](#Frontend)
- [Backend](#Backend)
- [Installation](#installation)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

## Frontend
Present in the mindMate_frontend_static folder.

### Main components:

These are the main files that define the functionality of MindMate

- `MainFrameDe.js` and `MainFrameEn.js`: They contain the javascript code for the German and English versions respectively.
- `MindMateEn.js`: It contains the javascript code of the functions used to update the frontend components
- `epfl.css`, `normalize.css`, `style.css`: They contain the style definitions for all the frontend classes/componenrs

### Usage:

Run the following command inside the MindMate_frontend folder:

```
npm install
npm start
```
Note: Does not work on Safari

## Backend
Present in the mindMate_backend_static folder.

### Main components:

- `app.py`: Main class of the Flask application
- `chatomatic.py`: Contains the dialog generation function
- `dateTime.py`: Handles the date and time generation
- `EvaluationHandler.py`: Contains the feedback generation functions

## Usage:

Run the following command inside the MindMate_backend folder:
Create a new python environment:
```
python -m venv <env_name>
source <env_name>/bin/activate
```
Start the server:
```
python requirements installer.py
python app.py
```

Note: the requirements can be installed only the first time, then the created environment is re-used in the future-
## Reference

The code is inspired from the ArgueTutor project.

## Contact

- [Hind El Bouchrifi](mailto:hind.elbouchrifi@epfl.ch) 

