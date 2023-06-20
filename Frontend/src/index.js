import React from 'react';
import ReactDOM from 'react-dom/client';
import './static/stylesheet/style.css';
import './static/stylesheet/normalize.css';
import './static/stylesheet/epfl.css';

import {MainFrameEn} from "./components/MainFrameEn";

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();


// ========================================================

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <MainFrameEn />
);

