import React, { useEffect, useRef, useState } from 'react';
import SimplePeer from 'simple-peer';
import { QRCodeCanvas } from 'qrcode.react';
import * as ort from 'onnxruntime-web';
import styled from 'styled-components';

// --- Styled Components for UI ---
const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background-color: #f0f2f5;
  min-height: 100vh;
`;

const VideoContainer = styled.div`
  position: relative;
  width: 640px;
  height: 480px;
  border: 2px solid #333;
`;

const StyledVideo = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const StyledCanvas = styled.canvas`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
`;

const MetricsContainer = styled.pre`
  background-color: #fff;
  border: 1px solid #ddd;
  padding: 15px;
  margin-top: 20px;
  width: 640px;
  white-space: pre-wrap;
  word-wrap: break-word;
`;

const modelUrl = import.meta.env.VITE_MODEL_URL;

const App = () => {
  const [isBroadcaster, setIsBroadcaster] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const peerRef = useRef(null);
  const wsRef = useRef(null);
  const [session, setSession] = useState(null);
  const [metrics, setMetrics] = useState({});

  useEffect(() => {
    // Determine mode from URL query parameter
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'broadcaster') {
      setIsBroadcaster(true);
      startBroadcasting();
    } else {
      setupViewer();
    }
    
    // Load the ONNX model for the viewer
    if (!params.get('mode')) {
        const initModel = async () => {
            try {
                const newSession = await ort.InferenceSession.create(modelUrl);
                setSession(newSession);
                console.log("Model loaded successfully");
            } catch (e) {
                console.error("Failed to load the ONNX model:", e);
            }
        };
        initModel();
    }
  }, []);

  const startBroadcasting = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: false });
    if (videoRef.current) videoRef.current.srcObject = stream;
    
    wsRef.current = new WebSocket('ws://localhost:8080'); // Adjust if server is elsewhere
    wsRef.current.onopen = () => {
        wsRef.current.send(JSON.stringify({ type: 'broadcaster' }));

        const peer = new SimplePeer({ initiator: true, stream: stream });
        
        peer.on('signal', data => {
            wsRef.current.send(JSON.stringify(data));
        });

        wsRef.current.onmessage = event => {
            peer.signal(JSON.parse(event.data));
        };
        
        peerRef.current = peer;
    };
  };
  
  const setupViewer = () => {
    wsRef.current = new WebSocket('ws://localhost:8080');
    wsRef.current.onopen = () => {
        wsRef.current.send(JSON.stringify({ type: 'viewer' }));

        const peer = new SimplePeer();

        peer.on('signal', data => {
            wsRef.current.send(JSON.stringify(data));
        });
        
        peer.on('stream', stream => {
            if (videoRef.current) videoRef.current.srcObject = stream;
        });

        wsRef.current.onmessage = event => {
            peer.signal(JSON.parse(event.data));
        };

        peerRef.current = peer;
    };
  };

  const runDetection = async () => {
      if (!session || !videoRef.current || videoRef.current.paused || videoRef.current.ended) {
          requestAnimationFrame(runDetection);
          return;
      }

      // Pre-process frame
      const canvas = document.createElement('canvas');
      canvas.width = modelInputShape[2];
      canvas.height = modelInputShape[3];
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const { data } = imageData;
      const inputTensor = new ort.Tensor('float32', new Float32Array(data), modelInputShape); // Simplified preprocessing

      // Run inference
      const feeds = { images: inputTensor };
      const results = await session.run(feeds);
      
      // Post-process and draw
      drawBoundingBoxes(results.output.data);

      requestAnimationFrame(runDetection);
  };
  
  const drawBoundingBoxes = (boxes) => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    // This is a simplified drawing function. You will need to decode the model's output properly.
    // For YOLOv5, output format is [batch, num_detections, (x, y, w, h, confidence, class_scores...)]
    // Example:
    // for (let i = 0; i < boxes.length; i += 6) {
    //     const [x, y, w, h, score, classId] = boxes.slice(i, i + 6);
    //     if (score > 0.5) {
    //         ctx.strokeStyle = 'red';
    //         ctx.lineWidth = 2;
    //         ctx.strokeRect(x * ctx.canvas.width, y * ctx.canvas.height, w * ctx.canvas.width, h * ctx.canvas.height);
    //     }
    // }
  };

  useEffect(() => {
    if (!isBroadcaster && session && videoRef.current) {
      videoRef.current.onplay = () => {
        runDetection();
      };
    }
  }, [isBroadcaster, session]);

  if (isBroadcaster) {
    return <AppContainer><h1>Broadcasting...</h1><StyledVideo ref={videoRef} autoPlay playsInline muted /></AppContainer>;
  }

const joinUrl = import.meta.env.VITE_JOIN_URL;
  return (
    <AppContainer>
      <h1>WebRTC Object Detection Viewer</h1>
      <p>Scan this QR code with your phone to start streaming.</p>
      <QRCodeCanvas  value={joinUrl} />
      <p>Or open this URL: <a href={joinUrl}>{joinUrl}</a></p>
      <VideoContainer>
        <StyledVideo ref={videoRef} autoPlay playsInline />
        <StyledCanvas ref={canvasRef} width="640" height="480" />
      </VideoContainer>
      <MetricsContainer>
        <h3>Live Metrics</h3>
        <p>Median E2E Latency: {metrics.medianLatency || 'N/A'} ms</p>
        <p>P95 E2E Latency: {metrics.p95Latency || 'N/A'} ms</p>
        <p>Processed FPS: {metrics.fps || 'N/A'}</p>
      </MetricsContainer>
    </AppContainer>
  );
};

export default App;