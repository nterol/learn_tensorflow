import React, { useMemo, useRef, useState, useEffect } from "react";
import * as tf from "@tensorflow/tfjs";
// import * as tfvis from "@tensorflow/tfjs-vis";

import "./App.css";

const cocoSsd = require("@tensorflow-models/coco-ssd");

function App() {
  const [model, setModel] = useState(false);
  const [error, setError] = useState(false);
  const [hideButton, setButtonHidden] = useState(false);
  const [liveView, setLiveView] = useState([]);

  const requestIdRef = useRef();
  const streamRef = useRef();

  useEffect(() => {
    async function loadCocoSSD() {
      try {
        const res = await cocoSsd.load();
        setModel(res);
        console.log("✅", res);
      } catch (e) {
        console.log(e);
        setError(true);
      }
    }
    loadCocoSSD();
  }, []);

  const userEnableCamera = useMemo(
    () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    []
  );

  const hasLoaded = useMemo(() => tf, []);

  const predictWebcam = async () => {
    const predictions = await model.detect(videoRef.current);
    const filtered = [];
    for (let n = 0; n < predictions.length; n++) {
      if (predictions[n].score > 0.66) filtered.push(predictions[n]);
    }
    filtered.length && setLiveView(filtered);
    requestIdRef.current = window.requestAnimationFrame(predictWebcam);
  };

  const handleCameraEnable = async () => {
    if (!model || !videoRef.current) return;
    const constraints = {
      video: true,
    };

    setButtonHidden(true);

    console.log(videoRef.current.srcObject);

    if (!videoRef.current.srcObject) {
      streamRef.current = await navigator.mediaDevices.getUserMedia(
        constraints
      );

      videoRef.current.srcObject = streamRef.current;
      videoRef.current.addEventListener("loadeddata", predictWebcam);
    } else window.requestAnimationFrame(predictWebcam);
  };

  const handleCancel = () => {
    window.cancelAnimationFrame(requestIdRef.current);
    setLiveView([]);
    setButtonHidden(false);
  };

  // const handleStop = () => {
  //   handleCancel();
  //   streamRef.current.getTracks().forEach((track) => track.stop());
  //   videoRef.current.srcObject = null;
  // };

  const videoRef = useRef(null);

  return (
    <div className="App">
      <h1>
        Multiple object detection using pre trained model in TensorFlow.js
      </h1>
      <h2>Let's do some TSF with React</h2>
      {error ? (
        <div>
          <span role="img" aria-label="error">
            😕
          </span>
          Sorry...we could not load then model...
        </div>
      ) : null}
      {!model ? (
        <>
          <div className="spin">
            <span role="img" aria-label="wait please">
              ⏳
            </span>
          </div>
          <p>
            Wait for the model to load before clicking the button to enable the
            webcam - at which point it will become visible to use.
          </p>
        </>
      ) : null}

      <p className={hasLoaded ? "p-success" : "p-loading"}>
        {hasLoaded
          ? ` ✔ Tensorflow loaded  - version ${tf.version.tfjs}`
          : "Loading Tensorflow..."}
      </p>

      {!userEnableCamera && (
        <section>
          <p>Your browser won't let me access your camera</p>
          <span role="img" aria-label="sad">
            😢
          </span>
        </section>
      )}
      <section id="demos" className={model ? "" : "invisible"}>
        <p>
          Hold some objects up close to your webcam to get a real-time
          classification! When ready click "enable webcam" below and accept
          access to the webcam when the browser asks (check the top left of your
          window)
        </p>

        <div id="liveView" className="camView">
          {liveView.length
            ? liveView.map(({ class: type, score, bbox }) => (
                <React.Fragment key={`${type}-${score}`}>
                  <p
                    style={{
                      marginLeft: `${bbox[0]}px`,
                      marginTop: `${bbox[1] - 10}px`,
                      width: `${bbox[2] - 10}px`,
                      top: 0,
                      left: 0,
                    }}
                  >{`${type} - with ${Math.round(
                    parseFloat(score) * 100
                  )}% confidence`}</p>
                  <div
                    className="highlighter"
                    style={{
                      left: `${bbox[0]}px`,
                      top: `${bbox[1]}px`,
                      width: `${bbox[2]}px`,
                      height: `${bbox[3]}px`,
                    }}
                  ></div>
                </React.Fragment>
              ))
            : null}
          {!hideButton ? (
            <button disabled={!model} onClick={handleCameraEnable}>
              Enable Webcam
            </button>
          ) : (
            <button onClick={handleCancel}>Cancel tsf</button>
            // <div style={{ display: "flex" }}>
            //   <button onClick={handleCancel}>Cancel tsf</button>
            //   <button onClick={handleStop}>Stop Camera</button>
            // </div>
          )}
          <video
            ref={videoRef}
            id="webcam"
            autoPlay
            width="640"
            height="480"
          ></video>
        </div>
      </section>
    </div>
  );
}

export default App;
