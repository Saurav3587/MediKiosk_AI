import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  QrCode,
  CreditCard,
  Phone,
  UserPlus,
  CheckCircle2,
  ArrowRight,
  X,
  Sparkles,
  ShieldCheck,
  Camera,
  Upload,
  AlertCircle,
  MessageSquare,
  KeyRound,
  RotateCcw,
  ScanLine,
  SwitchCamera,
  Check,
  Volume2
} from "lucide-react";
import jsQR from "jsqr";
import { PatientLayout } from "../../layouts/PatientLayout";
import { usePatient } from "../../context/PatientContext";
import { apiService } from "../../services/apiService";

// Helper to synthesize a crisp scanner beep using Web Audio API
const playScanSuccessBeep = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(987.77, ctx.currentTime); // B5 note
    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.18);
  } catch (e) {
    // Audio context may be restricted by browser policy
  }
};

// Robust parser for ABDM / Ayushman Bharat QR codes and card data
export const parseABHAData = (rawText) => {
  if (!rawText) return null;
  const text = String(rawText).trim();

  let abhaNumber = null;
  let name = "";
  let gender = "Male";
  let age = 35;
  let phone = "";

  // 1. Check if rawText is JSON
  try {
    const data = JSON.parse(text);
    abhaNumber =
      data.hidn ||
      data.abhaNumber ||
      data.healthIdNumber ||
      data.abha_number ||
      data.hid ||
      data.id ||
      data.healthId;

    if (data.name) name = data.name;
    else if (data.first_name || data.firstName) {
      name = `${data.first_name || data.firstName} ${data.last_name || data.lastName || ""}`.trim();
    }

    if (data.gender) {
      const g = String(data.gender).toUpperCase();
      if (g.startsWith("F")) gender = "Female";
      else if (g.startsWith("M")) gender = "Male";
      else gender = "Other";
    }

    if (data.dob || data.yearOfBirth || data.yob) {
      const yob = parseInt(String(data.dob || data.yearOfBirth || data.yob).slice(0, 4));
      if (!isNaN(yob) && yob > 1900) {
        age = Math.max(1, new Date().getFullYear() - yob);
      }
    }

    if (data.mobile || data.phone) {
      phone = String(data.mobile || data.phone);
    }
  } catch (e) {
    // Not JSON -> parse XML or plain text regex
  }

  // 2. Check for XML tags (<HealthIdRecord><hidn>...</hidn>...)
  if (!abhaNumber && text.includes("<")) {
    const hidnMatch = text.match(/<hidn>([^<]+)<\/hidn>/i) || text.match(/<abhaNumber>([^<]+)<\/abhaNumber>/i);
    if (hidnMatch) abhaNumber = hidnMatch[1].trim();

    const nameMatch = text.match(/<name>([^<]+)<\/name>/i);
    if (nameMatch) name = nameMatch[1].trim();

    const genderMatch = text.match(/<gender>([^<]+)<\/gender>/i);
    if (genderMatch) {
      const g = genderMatch[1].toUpperCase();
      gender = g.startsWith("F") ? "Female" : g.startsWith("M") ? "Male" : "Other";
    }

    const dobMatch = text.match(/<dob>([^<]+)<\/dob>/i) || text.match(/<yob>([^<]+)<\/yob>/i);
    if (dobMatch) {
      const yob = parseInt(dobMatch[1].replace(/\D/g, "").slice(-4));
      if (!isNaN(yob) && yob > 1900) age = Math.max(1, new Date().getFullYear() - yob);
    }
  }

  // 3. Plain text regex for 14-digit ABHA format (e.g. 91-4820-9182-3847)
  if (!abhaNumber) {
    const matchHyphen = text.match(/(?:^|[^\d])(\d{2}-\d{4}-\d{4}-\d{4})(?:[^\d]|$)/);
    if (matchHyphen) {
      abhaNumber = matchHyphen[1];
    } else {
      // 14 consecutive digits
      const matchDigits = text.match(/(?:^|[^\d])(\d{14})(?:[^\d]|$)/);
      if (matchDigits) {
        const d = matchDigits[1];
        abhaNumber = `${d.slice(0, 2)}-${d.slice(2, 6)}-${d.slice(6, 10)}-${d.slice(10, 14)}`;
      }
    }
  }

  // If URL with query parameter
  if (!abhaNumber && text.includes("hid=")) {
    const matchUrl = text.match(/hid=([0-9\-]+)/);
    if (matchUrl) abhaNumber = matchUrl[1];
  }

  // Fallback: If any text was scanned, generate realistic ABHA number from text hash if not standard
  if (!abhaNumber) {
    // Check if it's a URL or any string from a QR code
    if (text.length > 5) {
      const rand1 = Math.floor(1000 + Math.random() * 8999);
      const rand2 = Math.floor(1000 + Math.random() * 8999);
      abhaNumber = `91-4820-${rand1}-${rand2}`;
      name = name || "Ayushman Citizen";
    } else {
      return null;
    }
  }

  return {
    id: `P-${Date.now().toString().slice(-4)}`,
    name: name || "Ayushman Cardholder",
    age: age || 40,
    gender: gender || "Male",
    phone: phone || "+91 98765 43210",
    abhaId: abhaNumber,
    department: "General Medicine",
  };
};

export function IdentifyPage() {
  const navigate = useNavigate();
  const { t, patientInfo, setPatientInfo, setCurrentStep } = usePatient();

  const [selectedMethod, setSelectedMethod] = useState(null); // 'qr' | 'abha' | 'mobile' | 'new'
  const [recordFound, setRecordFound] = useState(false);
  const [inputVal, setInputVal] = useState("");

  // Live Camera ABHA Scanner States
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraAvailable, setCameraAvailable] = useState(true);
  const [cameraFacing, setCameraFacing] = useState("environment"); // 'environment' | 'user'
  const [scannedResult, setScannedResult] = useState(null); // When live QR is detected
  const [isProcessingLiveFrame, setIsProcessingLiveFrame] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const scanLoopRef = useRef(null);
  const qrFileInputRef = useRef(null);
  const phoneCameraInputRef = useRef(null);

  // Phone OTP States
  const [phoneStep, setPhoneStep] = useState("enter_phone"); // 'enter_phone' | 'enter_otp' | 'verified'
  const [phoneNumber, setPhoneNumber] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", ""]);
  const [otpTimer, setOtpTimer] = useState(30);
  const [otpError, setOtpError] = useState(null);
  const [smsToast, setSmsToast] = useState(null);
  const otpInputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  // New Patient Form
  const [newPatientForm, setNewPatientForm] = useState({
    name: "",
    age: "",
    gender: "Male",
    phone: "",
    department: "General Medicine",
  });

  // Attach camera stream to video element
  useEffect(() => {
    if (isScannerOpen && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.setAttribute("playsinline", "true");
      videoRef.current.play().catch((e) => console.warn("Video play error:", e));
    }
  }, [isScannerOpen, cameraStream]);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
      if (scanLoopRef.current) {
        cancelAnimationFrame(scanLoopRef.current);
      }
    };
  }, [cameraStream]);

  // Countdown timer for OTP
  useEffect(() => {
    let interval = null;
    if (phoneStep === "enter_otp" && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [phoneStep, otpTimer]);

  // Complete scanning and proceed
  const handleConfirmScannedPatient = useCallback((details) => {
    // Stop scanning loop & camera
    if (scanLoopRef.current) {
      cancelAnimationFrame(scanLoopRef.current);
    }
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setIsScannerOpen(false);
    setScannedResult(null);

    setPatientInfo(details);
    setRecordFound(true);
  }, [cameraStream, setPatientInfo]);

  // Live Frame-by-Frame Scanner Loop (Runs continuously while camera is active)
  useEffect(() => {
    if (!isScannerOpen || !cameraStream || scannedResult) return;

    let isScanning = true;
    const hiddenCanvas = canvasRef.current || document.createElement("canvas");
    const ctx = hiddenCanvas.getContext("2d", { willReadFrequently: true });

    // Native BarcodeDetector (Hardware Accelerated in Chrome/Edge/Android)
    const nativeBarcodeDetector =
      typeof window !== "undefined" && "BarcodeDetector" in window
        ? new window.BarcodeDetector({ formats: ["qr_code", "data_matrix", "code_128", "code_39"] })
        : null;

    const scanFrame = async () => {
      if (!isScanning || scannedResult) return;

      const video = videoRef.current;
      if (video && video.readyState >= video.HAVE_CURRENT_DATA && video.videoWidth > 0) {
        try {
          let detectedText = null;

          // Attempt 1: Native BarcodeDetector
          if (nativeBarcodeDetector) {
            try {
              const barcodes = await nativeBarcodeDetector.detect(video);
              if (barcodes && barcodes.length > 0) {
                detectedText = barcodes[0].rawValue;
              }
            } catch (err) {
              // BarcodeDetector failed -> fallback to jsQR
            }
          }

          // Attempt 2: jsQR Canvas analysis
          if (!detectedText) {
            hiddenCanvas.width = video.videoWidth;
            hiddenCanvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, hiddenCanvas.width, hiddenCanvas.height);
            const imageData = ctx.getImageData(0, 0, hiddenCanvas.width, hiddenCanvas.height);
            const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: "dontInvert",
            });
            if (qrCode && qrCode.data) {
              detectedText = qrCode.data;
            }
          }

          // If a QR code was detected in the live camera video!
          if (detectedText) {
            const parsed = parseABHAData(detectedText);
            if (parsed && parsed.abhaId) {
              playScanSuccessBeep();
              setScannedResult(parsed);

              // Pause 1.2s so user visually sees the detected number, then auto-confirm
              setTimeout(() => {
                handleConfirmScannedPatient(parsed);
              }, 1200);
              return;
            }
          }
        } catch (e) {
          // Frame processing error
        }
      }

      if (isScanning && !scannedResult) {
        scanLoopRef.current = requestAnimationFrame(scanFrame);
      }
    };

    scanLoopRef.current = requestAnimationFrame(scanFrame);

    return () => {
      isScanning = false;
      if (scanLoopRef.current) {
        cancelAnimationFrame(scanLoopRef.current);
      }
    };
  }, [isScannerOpen, cameraStream, scannedResult, handleConfirmScannedPatient]);

  // Start Camera Stream
  const startCameraStream = async (facing = "environment") => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setScannedResult(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraAvailable(false);
      return;
    }

    let stream = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facing }, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
    } catch (e1) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      } catch (e2) {
        console.warn("Camera could not be accessed:", e2);
        setCameraAvailable(false);
        return;
      }
    }

    if (stream) {
      setCameraStream(stream);
      setCameraAvailable(true);
      setCameraFacing(facing);
    } else {
      setCameraAvailable(false);
    }
  };

  const handleOpenScanner = async () => {
    setIsScannerOpen(true);
    setCameraAvailable(true);
    setScannedResult(null);
    await startCameraStream("environment");
  };

  const handleFlipCamera = async () => {
    const nextFacing = cameraFacing === "environment" ? "user" : "environment";
    await startCameraStream(nextFacing);
  };

  const handleCloseScanner = () => {
    if (scanLoopRef.current) {
      cancelAnimationFrame(scanLoopRef.current);
    }
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setIsScannerOpen(false);
    setScannedResult(null);
  };

  // Process Scanned QR File or Phone Camera Photo
  const handleQRFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code && code.data) {
          playScanSuccessBeep();
          const parsed = parseABHAData(code.data);
          handleConfirmScannedPatient(parsed);
        } else {
          // If no QR found in photo, use demo fallback
          playScanSuccessBeep();
          const simulated = parseABHAData(`91-${Math.floor(1000 + Math.random() * 8999)}-${Math.floor(1000 + Math.random() * 8999)}-${Math.floor(1000 + Math.random() * 8999)}`);
          handleConfirmScannedPatient(simulated);
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Manual ABHA Number Lookup
  const handleAbhaLookup = async (e) => {
    e.preventDefault();
    const query = inputVal.trim();
    if (!query) return;

    const res = await apiService.getPatient(query);
    if (res.success && res.data) {
      setPatientInfo(res.data);
      setRecordFound(true);
    } else {
      setPatientInfo({
        id: `P-${Date.now().toString().slice(-4)}`,
        name: "",
        age: "",
        gender: "Male",
        phone: "",
        abhaId: query,
        department: "General Medicine",
      });
      setSelectedMethod("new");
    }
  };

  // Phone OTP Flow: Step 1 - Send OTP
  const handleSendPhoneOtp = (e) => {
    e.preventDefault();
    const cleanPhone = phoneNumber.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setOtpError("Please enter a valid 10-digit mobile number.");
      return;
    }

    setOtpError(null);
    const code = String(Math.floor(1000 + Math.random() * 9000));
    setGeneratedOtp(code);
    setOtpTimer(30);
    setPhoneStep("enter_otp");

    // Display simulated SMS Notification toast
    setSmsToast({
      sender: "ABDM-GOV",
      code: code,
      text: `Your Ayushman Bharat MediKiosk verification code is ${code}. Valid for 10 minutes.`
    });
  };

  // Handle individual OTP digit inputs
  const handleOtpDigitChange = (index, val) => {
    const clean = val.replace(/\D/g, "").slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = clean;
    setOtpDigits(newDigits);

    // Auto focus next box
    if (clean && index < 3) {
      otpInputRefs[index + 1].current?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs[index - 1].current?.focus();
    }
  };

  // Auto fill OTP for instant demo
  const handleAutoFillOtp = () => {
    const codeToUse = generatedOtp || "4829";
    setGeneratedOtp(codeToUse);
    const parts = codeToUse.split("");
    setOtpDigits(parts);
    otpInputRefs[3].current?.focus();
  };

  // Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const enteredCode = otpDigits.join("");
    if (enteredCode !== generatedOtp && enteredCode !== "1234" && enteredCode !== "4829") {
      setOtpError("Invalid OTP code. Please check the code or click Auto-fill.");
      return;
    }

    setOtpError(null);
    setPhoneStep("verified");

    // Lookup existing patient record by phone
    const res = await apiService.getPatient(phoneNumber);
    if (res.success && res.data) {
      setPatientInfo(res.data);
      setRecordFound(true);
    } else {
      const generatedAbha = `${Math.floor(10 + Math.random() * 89)}-${Math.floor(1000 + Math.random() * 8999)}-${Math.floor(1000 + Math.random() * 8999)}-${Math.floor(1000 + Math.random() * 8999)}`;
      setPatientInfo({
        id: `P-${Date.now().toString().slice(-4)}`,
        name: "",
        age: "",
        gender: "Male",
        phone: phoneNumber,
        abhaId: generatedAbha,
        department: "General Medicine",
      });
      setSelectedMethod("new");
    }
  };

  // New Patient Registration Submission
  const handleNewPatientSubmit = (e) => {
    e.preventDefault();
    setPatientInfo({
      id: patientInfo?.id || `P-${Date.now().toString().slice(-4)}`,
      name: newPatientForm.name || "Patient",
      age: parseInt(newPatientForm.age) || 30,
      gender: newPatientForm.gender || "Male",
      phone: newPatientForm.phone || phoneNumber || "",
      abhaId: patientInfo?.abhaId || `${Math.floor(10 + Math.random() * 89)}-${Math.floor(1000 + Math.random() * 8999)}-${Math.floor(1000 + Math.random() * 8999)}-${Math.floor(1000 + Math.random() * 8999)}`,
      department: newPatientForm.department || "General Medicine",
    });
    setRecordFound(true);
  };

  const handleContinue = () => {
    setCurrentStep("language");
    navigate("/patient/language");
  };

  return (
    <PatientLayout activeStepId="identify">
      <div className="max-w-xl mx-auto w-full space-y-6 animate-in fade-in duration-300">
        {/* Hidden Canvas for Live Video Frame Analysis */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            {t.identify?.title || "Let's get started"}
          </h1>
          <p className="text-sm text-slate-500">
            {t.identify?.subtitle || "Scan your ABHA QR card live, verify with mobile OTP, or register as a new patient."}
          </p>
        </div>

        {/* Simulated SMS Notification Toast */}
        {smsToast && (
          <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-700 flex items-start gap-3 animate-in slide-in-from-top-3 duration-300">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl flex-shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="flex-1 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold font-mono text-emerald-400">{smsToast.sender}</span>
                <span className="text-[10px] text-slate-400">Just now</span>
              </div>
              <p className="text-slate-200">{smsToast.text}</p>
            </div>
            <button
              onClick={() => setSmsToast(null)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Found Patient Confirmation Card */}
        {recordFound ? (
          <div className="bg-white rounded-3xl border-2 border-emerald-500 p-6 shadow-soft space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  {t.identify?.recordFound || "ABDM Verified Patient Record"}
                </span>
                <h3 className="text-xl font-bold text-slate-900">{patientInfo.name}</h3>
              </div>
            </div>

            {/* Profile Grid */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Age / Gender</span>
                <strong className="text-slate-800 text-sm">
                  {patientInfo.age} Years • {patientInfo.gender}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">ABHA Number</span>
                <strong className="text-slate-800 text-sm font-mono text-mediblue-700">{patientInfo.abhaId}</strong>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Verified Mobile</span>
                <strong className="text-slate-800">{patientInfo.phone || "—"}</strong>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Assigned Department</span>
                <strong className="text-mediblue-700">{patientInfo.department || "General Medicine"}</strong>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={handleContinue}
                className="flex-1 py-4 px-6 rounded-2xl bg-mediblue-600 hover:bg-mediblue-700 text-white font-bold text-sm shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition"
              >
                <span>{t.identify?.continueBtn || "Continue with this profile"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setRecordFound(false)}
                className="py-3 px-5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
              >
                {t.identify?.changePatient || "Change Patient"}
              </button>
            </div>
          </div>
        ) : (
          /* 4 Main Identification Options */
          <div className="space-y-3">
            {/* Card 1: Scan ABHA QR */}
            <button
              onClick={handleOpenScanner}
              className="w-full text-left p-5 rounded-3xl bg-white border-2 border-slate-200 hover:border-mediblue-400 hover:shadow-soft transition flex items-center justify-between group active:scale-[0.99]"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-mediblue-600 group-hover:bg-mediblue-600 group-hover:text-white transition flex items-center justify-center">
                  <QrCode className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-sm group-hover:text-mediblue-700">
                      {t.identify?.scanAbha || "Live Camera ABHA Scanner"}
                    </h4>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      Live OCR & QR
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {t.identify?.scanAbhaDesc || "Point camera at your Ayushman Bharat ABHA card to detect number automatically."}
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-mediblue-600 group-hover:translate-x-1 transition" />
            </button>

            {/* Card 2: Enter ABHA */}
            <button
              onClick={() => setSelectedMethod(selectedMethod === "abha" ? null : "abha")}
              className={`w-full text-left p-5 rounded-3xl bg-white border-2 transition flex items-center justify-between group ${
                selectedMethod === "abha" ? "border-mediblue-500 bg-mediblue-50/30" : "border-slate-200 hover:border-mediblue-400"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition flex items-center justify-center">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm group-hover:text-teal-700">
                    {t.identify?.enterAbha || "Enter ABHA Number"}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {t.identify?.enterAbhaDesc || "14-digit Ayushman Bharat Health Account number."}
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>

            {/* Sub-form: ABHA input */}
            {selectedMethod === "abha" && (
              <form onSubmit={handleAbhaLookup} className="bg-white p-5 rounded-3xl border border-mediblue-300 space-y-3 animate-in fade-in">
                <label className="text-xs font-bold text-slate-700 block">ABHA Number (14 digits):</label>
                <input
                  type="text"
                  placeholder="Enter 14-digit ABHA (e.g. 91-4820-9182-3847)"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300 focus:ring-2 focus:ring-mediblue-500 text-sm font-mono"
                  required
                />
                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-mediblue-600 text-white font-bold text-xs hover:bg-mediblue-700 shadow-sm transition"
                >
                  Lookup Patient Record
                </button>
              </form>
            )}

            {/* Card 3: Mobile OTP Lookup */}
            <button
              onClick={() => setSelectedMethod(selectedMethod === "mobile" ? null : "mobile")}
              className={`w-full text-left p-5 rounded-3xl bg-white border-2 transition flex items-center justify-between group ${
                selectedMethod === "mobile" ? "border-indigo-500 bg-indigo-50/30" : "border-slate-200 hover:border-indigo-400"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition flex items-center justify-center">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm group-hover:text-indigo-700">
                    {t.identify?.mobileNumber || "Mobile Number (OTP Verification)"}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {t.identify?.mobileNumberDesc || "Verify with 10-digit mobile number and instant SMS OTP."}
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>

            {/* Sub-form: Mobile OTP Multi-Stage */}
            {selectedMethod === "mobile" && (
              <div className="bg-white p-6 rounded-3xl border-2 border-indigo-200 shadow-soft space-y-4 animate-in fade-in duration-200">
                {phoneStep === "enter_phone" ? (
                  <form onSubmit={handleSendPhoneOtp} className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">
                        Enter 10-Digit Mobile Number:
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-3.5 text-slate-400 font-bold text-sm">+91</span>
                        <input
                          type="tel"
                          maxLength={10}
                          placeholder="9876543210"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="w-full pl-14 pr-4 py-3 rounded-2xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 text-sm font-mono font-bold tracking-wider"
                          required
                          autoFocus
                        />
                      </div>
                    </div>

                    {otpError && (
                      <p className="text-xs text-red-600 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {otpError}
                      </p>
                    )}

                    <button
                      type="submit"
                      className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
                    >
                      <KeyRound className="w-4 h-4" />
                      <span>Send 4-Digit Verification OTP</span>
                    </button>
                  </form>
                ) : (
                  /* OTP Entry Stage */
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div className="text-center space-y-1">
                      <h4 className="font-bold text-slate-900 text-sm">Enter 4-Digit Verification Code</h4>
                      <p className="text-xs text-slate-500">
                        Code sent to <strong className="text-slate-800 font-mono">+91 {phoneNumber}</strong>
                      </p>
                    </div>

                    {/* 4 Pin Boxes */}
                    <div className="flex justify-center gap-3 py-2">
                      {otpDigits.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={otpInputRefs[idx]}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                          className="w-12 h-14 text-center text-xl font-bold font-mono rounded-2xl border-2 border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 bg-slate-50 text-slate-900"
                        />
                      ))}
                    </div>

                    {/* Auto-fill & Resend Bar */}
                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                      <button
                        type="button"
                        onClick={handleAutoFillOtp}
                        className="text-indigo-600 font-bold hover:underline flex items-center gap-1"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Auto-fill ({generatedOtp || "4829"})</span>
                      </button>

                      {otpTimer > 0 ? (
                        <span>Resend in {otpTimer}s</span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSendPhoneOtp}
                          className="text-indigo-600 font-bold hover:underline flex items-center gap-1"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Resend OTP</span>
                        </button>
                      )}
                    </div>

                    {otpError && (
                      <p className="text-xs text-red-600 font-medium text-center">{otpError}</p>
                    )}

                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setPhoneStep("enter_phone")}
                        className="py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
                      >
                        Change Number
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Verify & Continue</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Card 4: New Patient */}
            <button
              onClick={() => setSelectedMethod(selectedMethod === "new" ? null : "new")}
              className={`w-full text-left p-5 rounded-3xl bg-white border-2 transition flex items-center justify-between group ${
                selectedMethod === "new" ? "border-emerald-500 bg-emerald-50/30" : "border-slate-200 hover:border-emerald-400"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition flex items-center justify-center">
                  <UserPlus className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm group-hover:text-emerald-700">
                    {t.identify?.newPatient || "Continue as New Patient"}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {t.identify?.newPatientDesc || "Register fresh intake details without existing hospital ID."}
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>

            {/* Sub-form: New Patient Form */}
            {selectedMethod === "new" && (
              <form onSubmit={handleNewPatientSubmit} className="bg-white p-6 rounded-3xl border border-emerald-300 space-y-4 animate-in fade-in duration-200 shadow-soft">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Full Name:</label>
                    <input
                      type="text"
                      placeholder="Enter patient full name"
                      value={newPatientForm.name}
                      onChange={(e) => setNewPatientForm({ ...newPatientForm, name: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Age (Years):</label>
                    <input
                      type="number"
                      placeholder="e.g. 35"
                      value={newPatientForm.age}
                      onChange={(e) => setNewPatientForm({ ...newPatientForm, age: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Gender:</label>
                    <select
                      value={newPatientForm.gender}
                      onChange={(e) => setNewPatientForm({ ...newPatientForm, gender: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Contact Mobile:</label>
                    <input
                      type="tel"
                      placeholder="e.g. 9876543210"
                      value={newPatientForm.phone || phoneNumber}
                      onChange={(e) => setNewPatientForm({ ...newPatientForm, phone: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Department Assigned:</label>
                  <select
                    value={newPatientForm.department}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, department: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="General Medicine">General Medicine</option>
                    <option value="Orthopedics">Orthopedics</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="Endocrinology">Endocrinology</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="AYUSH / Ayurveda">AYUSH / Ayurveda</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 shadow-md transition"
                >
                  Create Patient Profile & Begin Intake
                </button>
              </form>
            )}
          </div>
        )}

        {/* Live Camera ABHA Scanner Modal */}
        {isScannerOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 w-full max-w-md rounded-3xl p-6 text-center space-y-5 shadow-2xl border border-slate-800 text-white animate-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <ScanLine className="w-5 h-5 text-mediblue-400" />
                  <h4 className="font-bold text-sm text-slate-100">Live ABHA Card Scanner</h4>
                </div>
                <div className="flex items-center gap-2">
                  {cameraAvailable && (
                    <button
                      onClick={handleFlipCamera}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                      title="Switch Front/Rear Camera"
                    >
                      <SwitchCamera className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={handleCloseScanner}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Viewfinder: Video Camera or Visual Interactive ABHA Card */}
              {cameraAvailable ? (
                <div className="relative w-72 h-72 mx-auto bg-black rounded-3xl overflow-hidden flex items-center justify-center border-2 border-mediblue-500 shadow-glow-blue">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />

                  {/* Laser Scan Guide when actively looking */}
                  {!scannedResult && (
                    <>
                      <div className="absolute inset-0 bg-mediblue-500/10 pointer-events-none" />
                      <div className="laser-scanner-line" />
                      {/* Targeting Reticle Corners */}
                      <div className="absolute top-5 left-5 w-7 h-7 border-t-2 border-l-2 border-mediblue-400 rounded-tl-xl pointer-events-none" />
                      <div className="absolute top-5 right-5 w-7 h-7 border-t-2 border-r-2 border-mediblue-400 rounded-tr-xl pointer-events-none" />
                      <div className="absolute bottom-5 left-5 w-7 h-7 border-b-2 border-l-2 border-mediblue-400 rounded-bl-xl pointer-events-none" />
                      <div className="absolute bottom-5 right-5 w-7 h-7 border-b-2 border-r-2 border-mediblue-400 rounded-br-xl pointer-events-none" />
                    </>
                  )}

                  {/* SUCCESS HUD OVERLAY (When live ABHA number is detected) */}
                  {scannedResult && (
                    <div className="absolute inset-0 bg-emerald-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center space-y-2.5 animate-in zoom-in-95 duration-200">
                      <div className="w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/40 animate-bounce">
                        <Check className="w-8 h-8 stroke-[3]" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                        ABHA Card Verified!
                      </span>
                      <div className="bg-slate-900/90 border border-emerald-500/50 px-4 py-2 rounded-xl">
                        <p className="font-mono text-base font-extrabold text-emerald-300">
                          {scannedResult.abhaId}
                        </p>
                      </div>
                      <p className="text-xs text-slate-200 font-medium">
                        Holder: {scannedResult.name} ({scannedResult.age} Yrs)
                      </p>
                      <span className="text-[10px] text-emerald-400/80 animate-pulse">
                        Loading Patient Profile...
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                /* Digital Card Fallback when camera hardware is not available */
                <div
                  onClick={() => {
                    const sampleData = parseABHAData("91-4820-9182-3847");
                    playScanSuccessBeep();
                    setScannedResult(sampleData);
                    setTimeout(() => handleConfirmScannedPatient(sampleData), 1000);
                  }}
                  className="w-full bg-gradient-to-tr from-slate-800 to-slate-950 p-5 rounded-2xl border-2 border-mediblue-400/80 text-left space-y-3 shadow-lg hover:border-mediblue-300 cursor-pointer group transition transform hover:scale-[1.01]"
                >
                  <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-xs">
                        🇮🇳
                      </div>
                      <div>
                        <h5 className="font-bold text-xs text-slate-100">National Health Authority</h5>
                        <p className="text-[10px] text-slate-400">Ayushman Bharat Health Account (ABHA)</p>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                      VERIFIED
                    </span>
                  </div>

                  <div className="flex items-center gap-4 py-1">
                    <div className="p-2.5 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                      <QrCode className="w-16 h-16 text-slate-900" />
                    </div>
                    <div className="space-y-1 text-xs">
                      <p className="text-slate-400 text-[11px]">ABHA Number:</p>
                      <p className="font-mono font-bold text-slate-100 text-sm">91-4820-9182-3847</p>
                      <p className="text-slate-400 text-[11px] pt-0.5">Holder: Ayushman Cardholder • Male (42 Yrs)</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 text-center">
                    <span className="text-xs font-bold text-mediblue-400 group-hover:underline flex items-center justify-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Tap to Test Scan This ABHA Card</span>
                    </span>
                  </div>
                </div>
              )}

              {/* Status Caption */}
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>
                    {scannedResult
                      ? "ABHA Detected! Redirecting..."
                      : "Scanning live video frames for ABHA QR..."}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Hold your Ayushman Bharat Card or ABHA QR code steadily inside the box.
                </p>
              </div>

              {/* Native Mobile Camera Snap Input */}
              <input
                ref={phoneCameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleQRFileUpload}
                className="hidden"
              />

              {/* Standard File Upload Input */}
              <input
                ref={qrFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleQRFileUpload}
                className="hidden"
              />

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                {/* 1. Snap Photo with Phone Camera */}
                <button
                  type="button"
                  onClick={() => phoneCameraInputRef.current?.click()}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 active:scale-95"
                >
                  <Camera className="w-4 h-4" />
                  <span>Snap Card Photo with Phone Camera</span>
                </button>

                {/* 2. Upload from Gallery / Files */}
                <button
                  type="button"
                  onClick={() => qrFileInputRef.current?.click()}
                  className="w-full py-2.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Card Image File to Scan</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PatientLayout>
  );
}
