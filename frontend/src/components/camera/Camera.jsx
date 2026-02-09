import { useEffect, useRef, useState } from "react";
import Cropper from "react-easy-crop";

function createImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });
}

async function getCroppedImg(imageSrc, cropPixels) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = cropPixels.width;
  canvas.height = cropPixels.height;

  ctx.drawImage(
    image,
    cropPixels.x,
    cropPixels.y,
    cropPixels.width,
    cropPixels.height,
    0,
    0,
    cropPixels.width,
    cropPixels.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const file = new File([blob], "cropped-card.jpg", { type: "image/jpeg" });
      resolve(file);
    }, "image/jpeg");
  });
}

export default function Camera({ onCapture }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [capturedImage, setCapturedImage] = useState(null);

  // Crop states
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  // Open camera automatically
  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera access denied", err);
        alert("Please allow camera access");
      }
    }

    startCamera();

    // Cleanup camera
    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach((t) => t.stop());
      }
    };
  }, []);

  // Capture image from video
  const captureImage = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL("image/jpeg");
    setCapturedImage(dataUrl);
  };

  const onCropComplete = (_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  };

  const useCroppedImage = async () => {
    try {
      const croppedFile = await getCroppedImg(capturedImage, croppedAreaPixels);
      onCapture(croppedFile); // ✅ now sending cropped file to VisitingCard.jsx
    } catch (err) {
      console.error(err);
      alert("Cropping failed");
    }
  };

  return (
    <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "900px", maxWidth: "95%" }}>
        {/* If NOT captured -> show camera */}
        {!capturedImage ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              style={{
                width: "100%",
                height: "520px",
                borderRadius: "18px",
                objectFit: "cover",
                boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
              }}
            />

            <canvas ref={canvasRef} style={{ display: "none" }} />

            <button
              onClick={captureImage}
              style={{
                width: "240px",
                height: "56px",
                margin: "18px auto 0",
                display: "block",
                background: "#2563eb",
                color: "white",
                fontWeight: "800",
                border: "none",
                borderRadius: "14px",
                fontSize: "18px",
                cursor: "pointer",
              }}
            >
              Capture
            </button>
          </>
        ) : (
          <>
            {/* Cropper */}
            <div
              style={{
                position: "relative",
                width: "100%",
                height: "520px",
                borderRadius: "18px",
                overflow: "hidden",
                boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
              }}
            >
              <Cropper
                image={capturedImage}
                crop={crop}
                zoom={zoom}
                aspect={16 / 9}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            {/* Buttons */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "14px",
                marginTop: "18px",
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={() => setCapturedImage(null)}
                style={{
                  height: "50px",
                  padding: "0 22px",
                  borderRadius: "12px",
                  border: "1px solid #d1d5db",
                  background: "white",
                  fontWeight: "800",
                  cursor: "pointer",
                }}
              >
                Retake
              </button>

              <button
                onClick={useCroppedImage}
                style={{
                  height: "50px",
                  padding: "0 22px",
                  borderRadius: "12px",
                  border: "none",
                  background: "#16a34a",
                  color: "white",
                  fontWeight: "800",
                  cursor: "pointer",
                }}
              >
                Use Cropped Image
              </button>
            </div>

            {/* Zoom slider */}
            <div style={{ marginTop: "14px", textAlign: "center" }}>
              <p style={{ fontWeight: "700", marginBottom: "8px" }}>Zoom</p>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                style={{ width: "320px" }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
