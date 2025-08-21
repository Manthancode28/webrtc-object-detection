# Real-time WebRTC Multi-Object Detection

### One-Line Goal
This project is a reproducible demo that performs real-time multi-object detection on a live video streamed from a phone via WebRTC, returns detection bounding boxes to the browser, and overlays them in near real-time.

### Current Project Status
**Partially Complete:** The application is fully containerized with Docker and the core architecture is in place. The frontend and backend services run, the phone can connect to the laptop over the network, and the "Broadcasting..." status is successfully initiated. The final step of establishing the peer-to-peer WebRTC video stream is currently blocked, preventing the video from appearing on the laptop. The object detection model loading and processing logic is implemented but is currently disabled to debug the video stream.

---

### Tech Stack
* **Frontend**: React (Vite)
* **Backend**: Node.js, Express, WebSockets (for signaling)
* **Real-time Communication**: WebRTC (`simple-peer` library)
* **Object Detection**: ONNX Runtime Web (WASM)
* **Containerization**: Docker, Docker Compose

---

### How to Run the Application

**Prerequisites:**
* Docker and Docker Compose must be installed and running.
* Git must be installed.

**Step 1: Clone the Repository**
```bash
git clone <your-repo-url>
cd <your-repo-name>
```

**Step 2: Start the Application**
Run the convenience script from the root of the project. This will build the Docker containers and start the application in the background.
```bash
./start.sh
```

**Step 3: Connect Your Phone**
1.  On your laptop, find your **Local Network IP Address** (on Windows, run `ipconfig` in the command prompt and look for the "IPv4 Address").
2.  On your laptop's web browser, open `http://localhost:3000`. You will see the "Viewer" page.
3.  On your **phone's** web browser, manually enter the following URL, replacing `<YOUR_LAPTOP_IP>` with the address you found in step 1:
    `http://<YOUR_LAPTOP_IP>:3000?broadcaster=true`
4.  Grant the browser camera permissions on your phone. It should now show the "Broadcasting..." page.

---

### Mode Switching
[cite_start]The application is designed to run in two modes, as required by the task[cite: 5]. You can switch the mode by setting an environment variable before running the start script.

* **WASM Mode (Default - Low-Resource):** Runs inference in the browser.
    ```bash
    # This is the default, no action needed
    ./start.sh
    ```
* **Server Mode:** Runs inference on the server (Note: This mode's inference logic is not fully implemented in the current version).
    ```bash
    MODE=server ./start.sh
    ```

---

