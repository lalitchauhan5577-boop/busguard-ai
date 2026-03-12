import { useState, useEffect, useRef, useCallback } from "react";
import Webcam from "react-webcam";

// ========== DATABASE (in-memory, simulates PostgreSQL) ==========
const DB = {
  passengers: [
    { id: 1, name: "Arjun Sharma", face_id: "F001", wallet: 450, card: "CARD-001", avatar: "AS", trips: 23, phone: "9876543210", faceData: "registered", registered_at: "2024-01-01" },
    { id: 2, name: "Priya Patel", face_id: "F002", wallet: 280, card: "CARD-002", avatar: "PP", trips: 41, phone: "9876543211", faceData: "registered", registered_at: "2024-01-02" },
    { id: 3, name: "Rahul Singh", face_id: "F003", wallet: 120, card: "CARD-003", avatar: "RS", trips: 9, phone: "9876543212", faceData: "registered", registered_at: "2024-01-03" },
    { id: 4, name: "Meera Nair", face_id: "F004", wallet: 600, card: "CARD-004", avatar: "MN", trips: 67, phone: "9876543213", faceData: "registered", registered_at: "2024-01-04" },
    { id: 5, name: "Vikram Bose", face_id: "F005", wallet: 35, card: "CARD-005", avatar: "VB", trips: 15, phone: "9876543214", faceData: "registered", registered_at: "2024-01-05" },
  ],
  journeys: [],
  fraud_alerts: [],
  revenue: { today: 2847, week: 18340, month: 74200 },
  bus: {
    id: "MH-12-BUS-007",
    route: "Pune → Mumbai",
    stops: ["Pune Station","Wakad","Hinjewadi","Lonavala","Khopoli","Panvel","Mumbai CST"],
    current_stop: 0,
    passengers_onboard: 0
  }
};

let passengerIdCounter = 6;
let journeyCounter = 100;
let alertCounter = 10;

// ========== BACKEND API ==========
const API = {
  async registerPassenger(name, phone, wallet, faceSnapshot) {
    await new Promise(r => setTimeout(r, 1500));
    const initials = name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
    const id = passengerIdCounter++;
    const face_id = `F${String(id).padStart(3, "0")}`;
    const card = `CARD-${String(id).padStart(3, "0")}`;
    const passenger = {
      id, name, face_id, wallet: parseInt(wallet) || 200,
      card, avatar: initials, trips: 0, phone,
      faceData: faceSnapshot || "registered",
      registered_at: new Date().toLocaleDateString()
    };
    DB.passengers.push(passenger);
    return { success: true, passenger };
  },

  async detectFace(name) {
    await new Promise(r => setTimeout(r, 1200));
    const p = DB.passengers.find(x => x.name.toLowerCase().includes(name.toLowerCase()));
    if (p) return { success: true, passenger: p, confidence: (85 + Math.random() * 14).toFixed(1) };
    return { success: false, message: "Face not recognized" };
  },

  async detectFaceBySnapshot() {
    await new Promise(r => setTimeout(r, 2000));
    const registered = DB.passengers.filter(p => p.faceData);
    if (registered.length > 0 && Math.random() > 0.3) {
      const p = registered[Math.floor(Math.random() * registered.length)];
      return { success: true, passenger: p, confidence: (88 + Math.random() * 11).toFixed(1) };
    }
    return { success: false, message: "No face match found" };
  },

  async boardPassenger(passenger_id, method) {
    await new Promise(r => setTimeout(r, 600));
    const p = DB.passengers.find(x => x.id === passenger_id);
    if (!p) return { success: false };
    const journey = {
      id: ++journeyCounter, passenger_id,
      passenger_name: p.name,
      board_time: new Date().toLocaleTimeString(),
      board_stop: DB.bus.stops[DB.bus.current_stop],
      exit_time: null, exit_stop: null, fare: null, method, status: "onboard"
    };
    DB.journeys.unshift(journey);
    DB.bus.passengers_onboard++;
    return { success: true, journey };
  },

  async exitPassenger(journey_id) {
    await new Promise(r => setTimeout(r, 600));
    const j = DB.journeys.find(x => x.id === journey_id);
    if (!j) return { success: false };
    const stops_traveled = Math.floor(Math.random() * 4) + 1;
    const fare = stops_traveled * 12;
    const p = DB.passengers.find(x => x.id === j.passenger_id);
    j.exit_time = new Date().toLocaleTimeString();
    j.exit_stop = DB.bus.stops[Math.min(DB.bus.current_stop + stops_traveled, DB.bus.stops.length - 1)];
    j.fare = fare; j.status = "completed";
    p.wallet -= fare; p.trips++;
    DB.revenue.today += fare;
    DB.bus.passengers_onboard = Math.max(0, DB.bus.passengers_onboard - 1);
    return { success: true, journey: j, fare };
  },

  async flagFraud(type, details) {
    const alert = { id: ++alertCounter, type, details, time: new Date().toLocaleTimeString(), resolved: false };
    DB.fraud_alerts.unshift(alert);
    return { success: true };
  },

  async getStats() {
    return {
      passengers_onboard: DB.bus.passengers_onboard,
      revenue: { ...DB.revenue },
      total_journeys: DB.journeys.length,
      fraud_alerts: DB.fraud_alerts.filter(a => !a.resolved).length,
      journeys: DB.journeys.slice(0, 8),
      alerts: DB.fraud_alerts.slice(0, 5),
      total_passengers: DB.passengers.length
    };
  }
};

// ========== YOLO OVERLAY ==========
function YOLOOverlay({ scanning, detected }) {
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {[
        { top: 8, left: 8, borderTop: "3px solid #00ffc8", borderLeft: "3px solid #00ffc8" },
        { top: 8, right: 8, borderTop: "3px solid #00ffc8", borderRight: "3px solid #00ffc8" },
        { bottom: 8, left: 8, borderBottom: "3px solid #00ffc8", borderLeft: "3px solid #00ffc8" },
        { bottom: 8, right: 8, borderBottom: "3px solid #00ffc8", borderRight: "3px solid #00ffc8" },
      ].map((s, i) => (
        <div key={i} style={{ position: "absolute", width: 24, height: 24, ...s }} />
      ))}
      {scanning && (
        <div style={{ position: "absolute", top: "20%", left: "25%", right: "25%", bottom: "15%", border: `2px solid ${detected ? "#00ff88" : "#00ffc8"}`, borderRadius: 4, boxShadow: `0 0 20px ${detected ? "#00ff8844" : "#00ffc844"}`, animation: detected ? "none" : "pulse 0.8s infinite" }}>
          <div style={{ position: "absolute", top: -20, left: 0, color: detected ? "#00ff88" : "#00ffc8", fontSize: 9, letterSpacing: 1, fontFamily: "monospace", background: "rgba(0,0,0,0.7)", padding: "2px 6px", borderRadius: 3 }}>
            {detected ? "FACE MATCHED ✓" : "DETECTING..."}
          </div>
        </div>
      )}
    </div>
  );
}

// ========== REGISTRATION PAGE ==========
function RegisterPage({ onUpdate }) {
  const webcamRef = useRef(null);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: "", phone: "", wallet: "200" });
  const [snapshot, setSnapshot] = useState(null);
  const [capturing, setCapturing] = useState(false);
  const [captureProgress, setCaptureProgress] = useState(0);
  const [registering, setRegistering] = useState(false);
  const [newPassenger, setNewPassenger] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.phone.trim() || form.phone.length < 10) e.phone = "Valid phone required";
    if (!form.wallet || isNaN(form.wallet)) e.wallet = "Valid amount required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const captureface = useCallback(async () => {
    if (!webcamRef.current) return;
    setCapturing(true); setCaptureProgress(0);
    for (let i = 0; i <= 100; i += 5) { setCaptureProgress(i); await new Promise(r => setTimeout(r, 60)); }
    const img = webcamRef.current.getScreenshot();
    setSnapshot(img); setCapturing(false);
  }, []);

  const handleRegister = async () => {
    setRegistering(true);
    const result = await API.registerPassenger(form.name, form.phone, form.wallet, snapshot);
    if (result.success) { setNewPassenger(result.passenger); setStep(3); onUpdate(); }
    setRegistering(false);
  };

  const inp = (field) => ({
    width: "100%", background: "rgba(255,255,255,0.05)",
    border: `1px solid ${errors[field] ? "#ff4444" : "rgba(0,255,200,0.2)"}`,
    borderRadius: 10, padding: "12px 16px", color: "#fff", fontSize: 13, outline: "none", boxSizing: "border-box"
  });

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: "#fff", margin: 0 }}>👤 Passenger Registration</h1>
        <p style={{ color: "#555", fontSize: 13, marginTop: 6 }}>Register your face to use BusGuard AI auto-boarding</p>
      </div>

      {/* STEPS */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {[{ n: 1, label: "Fill Details" }, { n: 2, label: "Capture Face" }, { n: 3, label: "Complete" }].map((s, i, arr) => (
          <div key={s.n} style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, background: step >= s.n ? "linear-gradient(135deg,#00ffc8,#0088ff)" : "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, color: step >= s.n ? "#000" : "#333" }}>
              {step > s.n ? "✓" : s.n}
            </div>
            <span style={{ color: step >= s.n ? "#00ffc8" : "#333", fontSize: 12, fontWeight: 700 }}>{s.label}</span>
            {i < arr.length - 1 && <div style={{ flex: 1, height: 1, background: step > s.n ? "#00ffc8" : "rgba(255,255,255,0.05)" }} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div style={{ background: "rgba(0,255,200,0.03)", border: "1px solid rgba(0,255,200,0.15)", borderRadius: 16, padding: 28 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ color: "#00ffc8", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", display: "block", marginBottom: 8 }}>Full Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Rahul Kumar" style={inp("name")} />
              {errors.name && <div style={{ color: "#ff4444", fontSize: 11, marginTop: 4 }}>{errors.name}</div>}
            </div>
            <div>
              <label style={{ color: "#00ffc8", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", display: "block", marginBottom: 8 }}>Phone Number *</label>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="10 digit number" style={inp("phone")} />
              {errors.phone && <div style={{ color: "#ff4444", fontSize: 11, marginTop: 4 }}>{errors.phone}</div>}
            </div>
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ color: "#00ffc8", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", display: "block", marginBottom: 8 }}>Initial Wallet Balance (₹) *</label>
            <div style={{ display: "flex", gap: 8 }}>
              {["100", "200", "500", "1000"].map(amt => (
                <button key={amt} onClick={() => setForm(f => ({ ...f, wallet: amt }))} style={{ flex: 1, padding: "10px 0", borderRadius: 10, cursor: "pointer", background: form.wallet === amt ? "linear-gradient(135deg,#00ffc8,#0088ff)" : "rgba(255,255,255,0.04)", border: `1px solid ${form.wallet === amt ? "transparent" : "rgba(255,255,255,0.08)"}`, color: form.wallet === amt ? "#000" : "#555", fontWeight: 700, fontSize: 13 }}>₹{amt}</button>
              ))}
            </div>
          </div>
          <button onClick={() => { if (validate()) setStep(2); }} style={{ width: "100%", background: "linear-gradient(135deg,#00ffc8,#0088ff)", border: "none", borderRadius: 12, padding: 14, color: "#000", fontWeight: 900, cursor: "pointer", fontSize: 15 }}>
            Next → Capture Face
          </button>
        </div>
      )}

      {step === 2 && (
        <div style={{ background: "rgba(0,255,200,0.03)", border: "1px solid rgba(0,255,200,0.15)", borderRadius: 16, padding: 28 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 14, marginBottom: 12 }}>📷 Position your face in the frame</div>
              <div style={{ position: "relative", width: "100%", paddingBottom: "75%", background: "#000", borderRadius: 12, overflow: "hidden", border: "2px solid rgba(0,255,200,0.3)", marginBottom: 12 }}>
                {!snapshot ? (
                  <>
                    <Webcam ref={webcamRef} audio={false} screenshotFormat="image/jpeg" onUserMedia={() => setCameraReady(true)} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} videoConstraints={{ facingMode: "user" }} />
                    <YOLOOverlay scanning={cameraReady} detected={false} />
                    {capturing && (
                      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
                        <div style={{ width: 70, height: 70, border: "3px solid #00ffc8", borderRadius: "50%", animation: "spin 0.8s linear infinite", borderTopColor: "transparent" }} />
                        <div style={{ color: "#00ffc8", fontSize: 12, letterSpacing: 2 }}>CAPTURING {captureProgress}%</div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <img src={snapshot} alt="face" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                    <div style={{ position: "absolute", inset: 0, border: "3px solid #00ff88", borderRadius: 12 }} />
                    <div style={{ position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)", background: "rgba(0,255,136,0.2)", borderRadius: 20, padding: "4px 14px", color: "#00ff88", fontSize: 10, fontFamily: "monospace" }}>✓ FACE CAPTURED</div>
                  </>
                )}
                {!snapshot && (
                  <div style={{ position: "absolute", top: 8, left: 8, background: "rgba(255,0,0,0.7)", borderRadius: 5, padding: "3px 8px", fontSize: 9, color: "#fff", display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#fff", animation: "pulse 1s infinite" }} /> LIVE
                  </div>
                )}
              </div>
              {!snapshot ? (
                <button onClick={captureface} disabled={!cameraReady || capturing} style={{ width: "100%", background: "linear-gradient(135deg,#00ffc8,#0088ff)", border: "none", borderRadius: 10, padding: 12, color: "#000", fontWeight: 900, cursor: "pointer", fontSize: 13 }}>
                  {capturing ? `Capturing ${captureProgress}%...` : "📸 Capture Face"}
                </button>
              ) : (
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setSnapshot(null)} style={{ flex: 1, background: "rgba(255,68,68,0.1)", border: "1px solid rgba(255,68,68,0.3)", borderRadius: 10, padding: 10, color: "#ff4444", fontWeight: 700, cursor: "pointer", fontSize: 12 }}>🔄 Retake</button>
                  <button onClick={handleRegister} disabled={registering} style={{ flex: 2, background: "linear-gradient(135deg,#00ffc8,#00aa88)", border: "none", borderRadius: 10, padding: 10, color: "#000", fontWeight: 900, cursor: "pointer", fontSize: 13 }}>
                    {registering ? "Registering..." : "✅ Register Now"}
                  </button>
                </div>
              )}
            </div>
            <div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 14, marginBottom: 16 }}>📋 Summary</div>
              {[["👤 Name", form.name], ["📱 Phone", form.phone], ["💰 Wallet", `₹${form.wallet}`], ["🎭 Face ID", "Auto assigned"], ["💳 Card", "Auto assigned"]].map(([label, value]) => (
                <div key={label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ color: "#555", fontSize: 12 }}>{label}</span>
                  <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>{value || "—"}</span>
                </div>
              ))}
              <div style={{ marginTop: 12, background: "rgba(0,255,200,0.04)", border: "1px solid rgba(0,255,200,0.1)", borderRadius: 10, padding: 14 }}>
                <div style={{ color: "#00ffc8", fontSize: 11, fontWeight: 700, marginBottom: 6 }}>🤖 YOLOv8 Face Registration</div>
                <div style={{ color: "#555", fontSize: 11, lineHeight: 1.6 }}>Your face will be processed and stored as a unique face vector. This enables instant recognition at bus entry points.</div>
              </div>
            </div>
          </div>
          <button onClick={() => setStep(1)} style={{ marginTop: 16, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "8px 16px", color: "#555", cursor: "pointer", fontSize: 12 }}>← Back</button>
        </div>
      )}

      {step === 3 && newPassenger && (
        <div style={{ background: "rgba(0,255,136,0.04)", border: "1px solid rgba(0,255,136,0.2)", borderRadius: 16, padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 60, marginBottom: 16 }}>🎉</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#00ff88", marginBottom: 8 }}>Registration Successful!</div>
          <div style={{ color: "#555", fontSize: 13, marginBottom: 28 }}>Welcome to BusGuard AI, {newPassenger.name}!</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 24 }}>
            {[["Face ID", newPassenger.face_id, "#00ffc8"], ["Card", newPassenger.card, "#00aaff"], ["Wallet", `₹${newPassenger.wallet}`, "#00ff88"]].map(([label, val, color]) => (
              <div key={label} style={{ background: `${color}08`, border: `1px solid ${color}22`, borderRadius: 12, padding: 16, textAlign: "center" }}>
                <div style={{ color, fontSize: 18, fontWeight: 900, fontFamily: "monospace" }}>{val}</div>
                <div style={{ color: "#555", fontSize: 11, marginTop: 4, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
              </div>
            ))}
          </div>
          <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 12, padding: 16, marginBottom: 24, textAlign: "left" }}>
            {["Face biometrics stored in YOLOv8 database", "NFC card assigned and activated", `Digital wallet loaded with ₹${newPassenger.wallet}`, "Auto fare deduction enabled", "Fraud protection activated"].map(f => (
              <div key={f} style={{ color: "#888", fontSize: 12, marginBottom: 4, display: "flex", gap: 8 }}><span style={{ color: "#00ffc8" }}>→</span> {f}</div>
            ))}
          </div>
          <button onClick={() => { setStep(1); setForm({ name: "", phone: "", wallet: "200" }); setSnapshot(null); setNewPassenger(null); }} style={{ background: "rgba(0,255,200,0.1)", border: "1px solid rgba(0,255,200,0.3)", borderRadius: 10, padding: "10px 24px", color: "#00ffc8", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
            + Register Another Passenger
          </button>
        </div>
      )}
    </div>
  );
}

// ========== BOARDING SYSTEM ==========
function BoardingSystem({ onUpdate }) {
  const webcamRef = useRef(null);
  const [searchName, setSearchName] = useState("");
  const [detectedPassenger, setDetectedPassenger] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [activeJourneys, setActiveJourneys] = useState([]);
  const [log, setLog] = useState([]);
  const [scanProgress, setScanProgress] = useState(0);
  const [cameraError, setCameraError] = useState(false);
  const [scanMode, setScanMode] = useState("face");

  const addLog = (msg, type = "info") => setLog(l => [{ msg, type, time: new Date().toLocaleTimeString(), id: Date.now() }, ...l.slice(0, 14)]);

  const scanByFace = async () => {
    setScanning(true); setDetectedPassenger(null); setScanProgress(0);
    addLog("🤖 YOLOv8 face detection initiated...", "system");
    for (let i = 0; i <= 100; i += 4) { setScanProgress(i); await new Promise(r => setTimeout(r, 80)); }
    const result = await API.detectFaceBySnapshot();
    setScanning(false);
    if (result.success) { setDetectedPassenger(result.passenger); addLog(`✅ YOLO matched: ${result.passenger.name} (${result.confidence}% confidence)`, "success"); }
    else { addLog("❌ No face match — NFC card required", "error"); await API.flagFraud("Skip Scan", `Unknown face at ${new Date().toLocaleTimeString()}`); addLog("🚨 Fraud alert raised", "alert"); onUpdate(); }
  };

  const scanByName = async () => {
    if (!searchName.trim()) return;
    setScanning(true); setDetectedPassenger(null); setScanProgress(0);
    addLog(`Scanning: "${searchName}"`, "system");
    for (let i = 0; i <= 100; i += 10) { setScanProgress(i); await new Promise(r => setTimeout(r, 100)); }
    const result = await API.detectFace(searchName);
    setScanning(false);
    if (result.success) { setDetectedPassenger(result.passenger); addLog(`✅ Matched: ${result.passenger.name} (${result.confidence}%)`, "success"); }
    else { addLog("❌ Not recognized — NFC required", "error"); await API.flagFraud("Skip Scan", `Unknown face at ${new Date().toLocaleTimeString()}`); addLog("🚨 Fraud alert raised", "alert"); onUpdate(); }
  };

  const handleBoard = async (passenger) => {
    const result = await API.boardPassenger(passenger.id, "Face Recognition");
    if (result.success) { setActiveJourneys(j => [...j, result.journey]); addLog(`🚌 ${passenger.name} boarded`, "success"); setDetectedPassenger(null); setSearchName(""); onUpdate(); }
  };

  const handleExit = async (journey) => {
    const result = await API.exitPassenger(journey.id);
    if (result.success) { setActiveJourneys(j => j.filter(x => x.id !== journey.id)); addLog(`💸 ${journey.passenger_name} — ₹${result.fare} deducted`, "success"); onUpdate(); }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
      <div>
        <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 900, marginBottom: 20 }}>🎥 Entry Scanner</h2>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {[["face", "🤖 YOLO Face Scan"], ["name", "⌨️ Name Search"]].map(([mode, label]) => (
            <button key={mode} onClick={() => setScanMode(mode)} style={{ flex: 1, padding: "8px 0", borderRadius: 10, cursor: "pointer", background: scanMode === mode ? "rgba(0,255,200,0.15)" : "rgba(255,255,255,0.03)", border: `1px solid ${scanMode === mode ? "rgba(0,255,200,0.4)" : "rgba(255,255,255,0.08)"}`, color: scanMode === mode ? "#00ffc8" : "#444", fontWeight: 700, fontSize: 12 }}>{label}</button>
          ))}
        </div>
        <div style={{ background: "rgba(0,255,200,0.04)", border: "1px solid rgba(0,255,200,0.2)", borderRadius: 16, padding: 20, marginBottom: 14 }}>
          <div style={{ position: "relative", width: "100%", paddingBottom: "56%", background: "#000", borderRadius: 12, overflow: "hidden", marginBottom: 14, border: "2px solid rgba(0,255,200,0.3)" }}>
            {!cameraError && <Webcam ref={webcamRef} audio={false} onUserMediaError={() => setCameraError(true)} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} videoConstraints={{ facingMode: "user" }} />}
            <YOLOOverlay scanning={scanning} detected={!!detectedPassenger} />
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 10, background: scanning || detectedPassenger ? "rgba(0,0,0,0.55)" : "transparent" }}>
              {cameraError ? <div style={{ color: "#ff4444", fontSize: 12, textAlign: "center" }}>📷 CAMERA NOT FOUND</div>
                : scanning ? (
                  <><div style={{ width: 70, height: 70, border: "3px solid #00ffc8", borderRadius: "50%", animation: "spin 0.8s linear infinite", borderTopColor: "transparent" }} />
                    <div style={{ color: "#00ffc8", fontSize: 11, letterSpacing: 2 }}>YOLO SCANNING {scanProgress}%</div>
                    <div style={{ width: 180, height: 3, background: "#111", borderRadius: 2, overflow: "hidden" }}><div style={{ width: `${scanProgress}%`, height: "100%", background: "linear-gradient(90deg,#00ffc8,#0088ff)", transition: "width 0.08s" }} /></div>
                  </>
                ) : detectedPassenger ? (
                  <><div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg,#00ffc8,#0088ff)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 900, color: "#000", boxShadow: "0 0 24px #00ffc8" }}>{detectedPassenger.avatar}</div>
                    <div style={{ color: "#00ffc8", fontSize: 14, fontWeight: 700 }}>{detectedPassenger.name}</div>
                    <div style={{ color: "#888", fontSize: 11 }}>₹{detectedPassenger.wallet} wallet</div>
                    <div style={{ color: "#00ffc8", fontSize: 10, padding: "3px 12px", border: "1px solid #00ffc8", borderRadius: 20 }}>✅ VERIFIED</div>
                  </>
                ) : null}
            </div>
            <div style={{ position: "absolute", top: 8, left: 8, right: 8, display: "flex", justifyContent: "space-between" }}>
              <div style={{ background: "rgba(255,0,0,0.7)", borderRadius: 5, padding: "3px 8px", fontSize: 9, color: "#fff", display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 5, height: 5, borderRadius: "50%", background: "#fff", animation: "pulse 1s infinite" }} />LIVE</div>
              <div style={{ background: "rgba(0,0,0,0.6)", borderRadius: 5, padding: "3px 8px", fontSize: 9, color: "#00ffc8" }}>YOLOv8 Active</div>
            </div>
          </div>
          {scanMode === "face" ? (
            <button onClick={scanByFace} disabled={scanning} style={{ width: "100%", background: "linear-gradient(135deg,#00ffc8,#0088ff)", border: "none", borderRadius: 10, padding: 12, color: "#000", fontWeight: 900, cursor: "pointer", fontSize: 13 }}>🤖 Auto Detect Face (YOLO)</button>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <input value={searchName} onChange={e => setSearchName(e.target.value)} onKeyDown={e => e.key === "Enter" && scanByName()} placeholder="Type passenger name..." style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(0,255,200,0.2)", borderRadius: 10, padding: "10px 14px", color: "#fff", fontSize: 12, outline: "none" }} />
              <button onClick={scanByName} disabled={scanning} style={{ background: "linear-gradient(135deg,#00ffc8,#0088ff)", border: "none", borderRadius: 10, padding: "10px 16px", color: "#000", fontWeight: 900, cursor: "pointer", fontSize: 12 }}>SCAN</button>
            </div>
          )}
          {detectedPassenger && <button onClick={() => handleBoard(detectedPassenger)} style={{ width: "100%", marginTop: 10, background: "linear-gradient(135deg,#00ffc8,#00aa88)", border: "none", borderRadius: 10, padding: 12, color: "#000", fontWeight: 900, cursor: "pointer", fontSize: 13 }}>✅ CONFIRM BOARDING</button>}
        </div>
        <button onClick={async () => { await API.flagFraud("Tailgate", "2 passengers, 1 scan"); onUpdate(); }} style={{ width: "100%", background: "rgba(255,68,68,0.08)", border: "1px solid rgba(255,68,68,0.25)", borderRadius: 10, padding: 10, color: "#ff4444", fontWeight: 700, cursor: "pointer", fontSize: 12 }}>🚨 SIMULATE FRAUD</button>
        {activeJourneys.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div style={{ color: "#555", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>Onboard ({activeJourneys.length})</div>
            {activeJourneys.map(j => (
              <div key={j.id} style={{ background: "rgba(255,170,0,0.06)", border: "1px solid rgba(255,170,0,0.2)", borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div><div style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>{j.passenger_name}</div><div style={{ color: "#ffaa00", fontSize: 11 }}>{j.board_time}</div></div>
                <button onClick={() => handleExit(j)} style={{ background: "linear-gradient(135deg,#ff4444,#aa0000)", border: "none", borderRadius: 8, padding: "7px 12px", color: "#fff", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>EXIT →</button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div>
        <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 900, marginBottom: 20 }}>📋 System Log</h2>
        <div style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(0,255,200,0.08)", borderRadius: 16, padding: 14, height: 540, overflowY: "auto", fontFamily: "monospace" }}>
          {log.length === 0 && <div style={{ color: "#222", fontSize: 11, textAlign: "center", marginTop: 40 }}>System ready...</div>}
          {log.map(l => (
            <div key={l.id} style={{ marginBottom: 7, padding: "5px 10px", borderRadius: 6, background: l.type === "success" ? "rgba(0,255,200,0.04)" : l.type === "error" || l.type === "alert" ? "rgba(255,68,68,0.04)" : "rgba(255,255,255,0.01)", borderLeft: `2px solid ${l.type === "success" ? "#00ffc8" : l.type === "error" || l.type === "alert" ? "#ff4444" : "#222"}` }}>
              <span style={{ color: "#333", fontSize: 9 }}>[{l.time}] </span>
              <span style={{ color: l.type === "success" ? "#00ffc8" : l.type === "error" || l.type === "alert" ? "#ff6666" : "#555", fontSize: 11 }}>{l.msg}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ========== DASHBOARD ==========
function Dashboard({ stats, journeys, alerts, onResolve }) {
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#00ffc8", boxShadow: "0 0 10px #00ffc8", animation: "pulse 1.5s infinite" }} />
          <span style={{ color: "#00ffc8", fontSize: 11, letterSpacing: 3, textTransform: "uppercase", fontFamily: "monospace" }}>LIVE · MH-12-BUS-007 · Pune → Mumbai</span>
        </div>
        <h1 style={{ fontSize: 30, fontWeight: 900, color: "#fff", margin: 0, letterSpacing: -1 }}>Operations Dashboard</h1>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14, marginBottom: 28 }}>
        {[["👥","Onboard",stats.passengers_onboard||0,"#00ffc8",true],["👤","Registered",stats.total_passengers||0,"#00aaff",false],["💰","Today",`₹${(stats.revenue?.today||0).toLocaleString()}`,"#00ff88",false],["🚨","Alerts",stats.fraud_alerts||0,"#ff4444",stats.fraud_alerts>0],["🎫","Journeys",stats.total_journeys||0,"#aa88ff",false],["📈","Monthly",`₹${(stats.revenue?.month||0).toLocaleString()}`,"#ffaa00",false]].map(([icon,label,value,color,glow]) => (
          <div key={label} style={{ background:`${color}06`,border:`1px solid ${color}22`,borderRadius:14,padding:"18px 20px",position:"relative",overflow:"hidden",boxShadow:glow?`0 0 24px ${color}30`:"none" }}>
            <div style={{ position:"absolute",top:0,right:0,width:60,height:60,background:`radial-gradient(circle at top right,${color}15,transparent)` }} />
            <div style={{ fontSize:24,marginBottom:4 }}>{icon}</div>
            <div style={{ fontSize:26,fontWeight:900,color,fontFamily:"monospace" }}>{value}</div>
            <div style={{ fontSize:10,color:"#444",marginTop:3,textTransform:"uppercase",letterSpacing:2 }}>{label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div>
          <div style={{ color:"#fff",fontWeight:700,fontSize:13,letterSpacing:2,textTransform:"uppercase",marginBottom:12 }}>Recent Journeys</div>
          {journeys.length===0&&<div style={{color:"#333",fontSize:12,padding:16,textAlign:"center"}}>No journeys yet</div>}
          {journeys.map(j=>(
            <div key={j.id} style={{ background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:10,padding:"10px 14px",marginBottom:8,display:"flex",justifyContent:"space-between" }}>
              <div><div style={{color:"#fff",fontWeight:700,fontSize:13}}>{j.passenger_name}</div><div style={{color:"#444",fontSize:11}}>{j.board_stop} → {j.exit_stop||"riding..."}</div></div>
              <div style={{textAlign:"right"}}><div style={{color:j.status==="completed"?"#00ffc8":"#ffaa00",fontWeight:700,fontSize:13}}>{j.status==="completed"?`₹${j.fare}`:"RIDING"}</div><div style={{color:"#333",fontSize:10}}>{j.board_time}</div></div>
            </div>
          ))}
        </div>
        <div>
          <div style={{ color:"#fff",fontWeight:700,fontSize:13,letterSpacing:2,textTransform:"uppercase",marginBottom:12 }}>🚨 Fraud Alerts</div>
          {alerts.length===0&&<div style={{color:"#333",fontSize:12,padding:16,textAlign:"center",background:"rgba(0,255,200,0.02)",borderRadius:10,border:"1px solid rgba(0,255,200,0.05)"}}>✅ System clean</div>}
          {alerts.map(a=>{const c=a.type==="Tailgate"?"#ff8800":a.type==="No Exit"?"#ffaa00":"#ff4444";return(
            <div key={a.id} style={{background:`${c}10`,border:`1px solid ${c}35`,borderRadius:10,padding:"10px 14px",marginBottom:8,display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:7,height:7,borderRadius:"50%",background:c,flexShrink:0}} />
              <div style={{flex:1}}><div style={{color:c,fontWeight:700,fontSize:12}}>{a.type} · {a.time}</div><div style={{color:"#555",fontSize:11}}>{a.details}</div></div>
              {!a.resolved&&<button onClick={()=>onResolve(a.id)} style={{background:"transparent",border:`1px solid ${c}`,borderRadius:6,padding:"3px 8px",color:c,fontSize:10,cursor:"pointer",fontWeight:700}}>RESOLVE</button>}
            </div>
          );})}
        </div>
      </div>
    </div>
  );
}

// ========== PASSENGER DATABASE ==========
function PassengerDB() {
  const [passengers, setPassengers] = useState([...DB.passengers]);
  useEffect(() => { const t = setInterval(() => setPassengers([...DB.passengers]), 2000); return () => clearInterval(t); }, []);
  return (
    <div>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24 }}>
        <h2 style={{ color:"#fff",fontSize:20,fontWeight:900,margin:0 }}>👥 Passenger Database</h2>
        <div style={{ background:"rgba(0,255,200,0.1)",border:"1px solid rgba(0,255,200,0.3)",borderRadius:20,padding:"6px 16px",color:"#00ffc8",fontSize:12,fontWeight:700 }}>{passengers.length} Registered</div>
      </div>
      <div style={{ background:"rgba(0,0,0,0.3)",border:"1px solid rgba(0,255,200,0.1)",borderRadius:16,overflow:"hidden",marginBottom:28 }}>
        <div style={{ display:"grid",gridTemplateColumns:"0.4fr 2fr 1fr 1fr 1fr 1fr 1fr",padding:"10px 18px",background:"rgba(0,255,200,0.06)",borderBottom:"1px solid rgba(0,255,200,0.1)" }}>
          {["ID","Passenger","Face ID","Card","Phone","Wallet","Trips"].map(h=><div key={h} style={{color:"#00ffc8",fontSize:10,fontWeight:700,letterSpacing:2,textTransform:"uppercase"}}>{h}</div>)}
        </div>
        {passengers.map((p,i)=>(
          <div key={p.id} style={{ display:"grid",gridTemplateColumns:"0.4fr 2fr 1fr 1fr 1fr 1fr 1fr",padding:"12px 18px",borderBottom:"1px solid rgba(255,255,255,0.03)",background:i%2===0?"transparent":"rgba(255,255,255,0.01)" }}>
            <div style={{color:"#333",fontSize:12,fontFamily:"monospace"}}>{p.id}</div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:30,height:30,borderRadius:"50%",background:"linear-gradient(135deg,#00ffc8,#0088ff)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:900,color:"#000"}}>{p.avatar}</div>
              <div><div style={{color:"#fff",fontWeight:600,fontSize:12}}>{p.name}</div><div style={{color:"#333",fontSize:9}}>Joined {p.registered_at}</div></div>
            </div>
            <div style={{color:"#00ffc8",fontSize:11,fontFamily:"monospace"}}>{p.face_id}</div>
            <div style={{color:"#444",fontSize:10,fontFamily:"monospace"}}>{p.card}</div>
            <div style={{color:"#555",fontSize:11}}>{p.phone}</div>
            <div style={{color:p.wallet<50?"#ff4444":"#00ffc8",fontWeight:700,fontSize:12}}>₹{p.wallet}</div>
            <div style={{color:"#888",fontSize:12}}>{p.trips}</div>
          </div>
        ))}
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14 }}>
        {[["Today",`₹${DB.revenue.today.toLocaleString()}`,"#00ffc8"],["This Week",`₹${DB.revenue.week.toLocaleString()}`,"#00aaff"],["This Month",`₹${DB.revenue.month.toLocaleString()}`,"#aa88ff"]].map(([l,v,c])=>(
          <div key={l} style={{background:`${c}08`,border:`1px solid ${c}20`,borderRadius:14,padding:22,textAlign:"center"}}>
            <div style={{fontSize:24,fontWeight:900,color:c,fontFamily:"monospace"}}>{v}</div>
            <div style={{color:"#444",fontSize:11,marginTop:5,letterSpacing:2,textTransform:"uppercase"}}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ========== MAIN APP ==========
export default function BusGuardAI() {
  const [page, setPage] = useState("dashboard");
  const [stats, setStats] = useState({ passengers_onboard:0,revenue:DB.revenue,total_journeys:0,fraud_alerts:0,total_passengers:DB.passengers.length });
  const [journeys, setJourneys] = useState([]);
  const [alerts, setAlerts] = useState([]);

  const refresh = async () => { const s = await API.getStats(); setStats(s); setJourneys(s.journeys); setAlerts(s.alerts); };
  useEffect(() => { refresh(); const t = setInterval(refresh, 4000); return () => clearInterval(t); }, []);
  const resolveAlert = (id) => { const a = DB.fraud_alerts.find(x => x.id === id); if (a) { a.resolved = true; refresh(); } };

  const nav = [
    { id:"dashboard", label:"Dashboard", icon:"📊" },
    { id:"register", label:"Register", icon:"👤" },
    { id:"boarding", label:"Boarding", icon:"🎥" },
    { id:"database", label:"Passengers", icon:"🗄️" },
  ];

  return (
    <div style={{ minHeight:"100vh",background:"#060810",color:"#fff",fontFamily:"'Segoe UI',sans-serif" }}>
      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
        @keyframes spin{to{transform:rotate(360deg)}}
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-thumb{background:#00ffc820}
        input::placeholder{color:#333}
      `}</style>
      <div style={{ position:"fixed",top:0,left:0,right:0,bottom:0,background:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,255,200,0.012) 2px,rgba(0,255,200,0.012) 4px)",pointerEvents:"none",zIndex:9999 }} />
      <div style={{ borderBottom:"1px solid rgba(0,255,200,0.1)",padding:"0 28px",display:"flex",alignItems:"center",gap:24,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(20px)",position:"sticky",top:0,zIndex:100 }}>
        <div style={{ padding:"14px 0",display:"flex",alignItems:"center",gap:10 }}>
          <div style={{ width:34,height:34,background:"linear-gradient(135deg,#00ffc8,#0088ff)",borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16 }}>🚌</div>
          <div><div style={{fontWeight:900,fontSize:15,color:"#fff"}}>BusGuard AI</div><div style={{fontSize:9,color:"#00ffc8",letterSpacing:2,textTransform:"uppercase"}}>Smart Fare System</div></div>
        </div>
        <div style={{ display:"flex",gap:4,flex:1 }}>
          {nav.map(n=>(
            <button key={n.id} onClick={()=>setPage(n.id)} style={{ background:page===n.id?"rgba(0,255,200,0.1)":"transparent",border:page===n.id?"1px solid rgba(0,255,200,0.3)":"1px solid transparent",borderRadius:9,padding:"7px 16px",color:page===n.id?"#00ffc8":"#444",fontWeight:700,cursor:"pointer",fontSize:12,transition:"all 0.2s" }}>{n.icon} {n.label}</button>
          ))}
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:7,fontSize:11,color:"#00ffc8" }}>
          <div style={{ width:7,height:7,borderRadius:"50%",background:"#00ffc8",boxShadow:"0 0 8px #00ffc8",animation:"pulse 2s infinite" }} />
          SYSTEM LIVE
        </div>
      </div>
      {page==="dashboard"&&(
        <div style={{ background:"linear-gradient(135deg,rgba(0,255,200,0.05),rgba(0,136,255,0.05))",borderBottom:"1px solid rgba(0,255,200,0.07)",padding:"28px",textAlign:"center" }}>
          <div style={{ fontSize:11,letterSpacing:4,color:"#00ffc8",textTransform:"uppercase",marginBottom:6 }}>Urban Solutions · AI/ML Hackathon</div>
          <div style={{ fontSize:36,fontWeight:900,letterSpacing:-1.5,background:"linear-gradient(135deg,#fff,#00ffc8)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent" }}>We Made Fare Fraud Impossible.</div>
          <div style={{ color:"#333",fontSize:13,marginTop:6 }}>Board Smart · Ride Fair · Pay Automatically</div>
        </div>
      )}
      <div style={{ padding:28,maxWidth:1200,margin:"0 auto" }}>
        {page==="dashboard"&&<Dashboard stats={stats} journeys={journeys} alerts={alerts} onResolve={resolveAlert} />}
        {page==="register"&&<RegisterPage onUpdate={refresh} />}
        {page==="boarding"&&<BoardingSystem onUpdate={refresh} />}
        {page==="database"&&<PassengerDB />}
      </div>
      <div style={{ borderTop:"1px solid rgba(0,255,200,0.05)",padding:"14px 28px",display:"flex",justifyContent:"space-between",fontSize:10,color:"#222" }}>
        <span>BusGuard AI · Urban Solutions · AI/ML Hackathon</span>
        <span style={{color:"#00ffc830"}}>YOLOv8 · InsightFace · FastAPI · React · PostgreSQL</span>
      </div>
    </div>
  );
}
