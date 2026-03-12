import { useState, useEffect } from "react";
import Webcam from "react-webcam";

// ========== SIMULATED DATABASE ==========
const DB = {
  passengers: [
    { id: 1, name: "Arjun Sharma", face_id: "F001", wallet: 450, card: "CARD-001", avatar: "AS", trips: 23 },
    { id: 2, name: "Priya Patel", face_id: "F002", wallet: 280, card: "CARD-002", avatar: "PP", trips: 41 },
    { id: 3, name: "Rahul Singh", face_id: "F003", wallet: 120, card: "CARD-003", avatar: "RS", trips: 9 },
    { id: 4, name: "Meera Nair", face_id: "F004", wallet: 600, card: "CARD-004", avatar: "MN", trips: 67 },
    { id: 5, name: "Vikram Bose", face_id: "F005", wallet: 35, card: "CARD-005", avatar: "VB", trips: 15 },
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

let journeyCounter = 100;
let alertCounter = 10;

// ========== SIMULATED BACKEND API ==========
const API = {
  async detectFace(name) {
    await new Promise(r => setTimeout(r, 1200));
    const p = DB.passengers.find(x => x.name.toLowerCase().includes(name.toLowerCase()));
    if (p) return { success: true, passenger: p, confidence: (85 + Math.random() * 14).toFixed(1) };
    return { success: false, message: "Face not recognized" };
  },
  async boardPassenger(passenger_id, method) {
    await new Promise(r => setTimeout(r, 800));
    const p = DB.passengers.find(x => x.id === passenger_id);
    if (!p) return { success: false };
    const journey = {
      id: ++journeyCounter,
      passenger_id,
      passenger_name: p.name,
      board_time: new Date().toLocaleTimeString(),
      board_stop: DB.bus.stops[DB.bus.current_stop],
      exit_time: null,
      exit_stop: null,
      fare: null,
      method,
      status: "onboard"
    };
    DB.journeys.unshift(journey);
    DB.bus.passengers_onboard++;
    return { success: true, journey };
  },
  async exitPassenger(journey_id) {
    await new Promise(r => setTimeout(r, 800));
    const j = DB.journeys.find(x => x.id === journey_id);
    if (!j) return { success: false };
    const stops_traveled = Math.floor(Math.random() * 4) + 1;
    const fare = stops_traveled * 12;
    const p = DB.passengers.find(x => x.id === j.passenger_id);
    j.exit_time = new Date().toLocaleTimeString();
    j.exit_stop = DB.bus.stops[Math.min(DB.bus.current_stop + stops_traveled, DB.bus.stops.length - 1)];
    j.fare = fare;
    j.status = "completed";
    p.wallet -= fare;
    p.trips++;
    DB.revenue.today += fare;
    DB.bus.passengers_onboard = Math.max(0, DB.bus.passengers_onboard - 1);
    return { success: true, journey: j, fare };
  },
  async flagFraud(type, details) {
    await new Promise(r => setTimeout(r, 500));
    const alert = {
      id: ++alertCounter,
      type,
      details,
      time: new Date().toLocaleTimeString(),
      resolved: false
    };
    DB.fraud_alerts.unshift(alert);
    return { success: true, alert };
  },
  async getStats() {
    await new Promise(r => setTimeout(r, 300));
    return {
      passengers_onboard: DB.bus.passengers_onboard,
      revenue: DB.revenue,
      total_journeys: DB.journeys.length,
      fraud_alerts: DB.fraud_alerts.length,
      journeys: DB.journeys.slice(0, 8),
      alerts: DB.fraud_alerts.slice(0, 5)
    };
  }
};

// ========== COMPONENTS ==========

function Scanline() {
  return (
    <div style={{
      position:"fixed", top:0, left:0, right:0, bottom:0,
      background:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,255,200,0.015) 2px,rgba(0,255,200,0.015) 4px)",
      pointerEvents:"none", zIndex:9999
    }} />
  );
}

function StatCard({ icon, label, value, sub, color = "#00ffc8", glow }) {
  return (
    <div style={{
      background:"rgba(0,255,200,0.04)",
      border:`1px solid ${color}22`,
      borderRadius:16,
      padding:"20px 24px",
      position:"relative",
      overflow:"hidden",
      transition:"all 0.3s",
      boxShadow: glow ? `0 0 30px ${color}33` : "none"
    }}>
      <div style={{
        position:"absolute", top:0, right:0, width:80, height:80,
        background:`radial-gradient(circle at top right, ${color}15, transparent)`,
        borderRadius:"0 16px"
      }} />
      <div style={{fontSize:28, marginBottom:6}}>{icon}</div>
      <div style={{fontSize:32, fontWeight:900, color, fontFamily:"'Courier New',monospace", letterSpacing:-1}}>{value}</div>
      <div style={{fontSize:12, color:"#666", marginTop:4, textTransform:"uppercase", letterSpacing:2}}>{label}</div>
      {sub && <div style={{fontSize:11, color:`${color}99`, marginTop:4}}>{sub}</div>}
    </div>
  );
}

function FraudAlert({ alert, onResolve }) {
  const colors = { "Skip Scan": "#ff4444", "Tailgate": "#ff8800", "No Exit": "#ffaa00" };
  const c = colors[alert.type] || "#ff4444";
  return (
    <div style={{
      background:`${c}11`,
      border:`1px solid ${c}44`,
      borderRadius:10,
      padding:"12px 16px",
      display:"flex",
      alignItems:"center",
      gap:12
    }}>
      <div style={{
        width:8, height:8, borderRadius:"50%",
        background:c, boxShadow:`0 0 8px ${c}`,
        flexShrink:0, animation:"pulse 1s infinite"
      }} />
      <div style={{flex:1}}>
        <div style={{color:c, fontWeight:700, fontSize:12}}>{alert.type} · {alert.time}</div>
        <div style={{color:"#888", fontSize:11, marginTop:2}}>{alert.details}</div>
      </div>
      {!alert.resolved && (
        <button
          onClick={() => onResolve(alert.id)}
          style={{
            background:"transparent",
            border:`1px solid ${c}`,
            borderRadius:6,
            padding:"4px 10px",
            color:c,
            fontSize:10,
            cursor:"pointer",
            fontWeight:700
          }}>
          RESOLVE
        </button>
      )}
    </div>
  );
}

// ========== DASHBOARD PAGE ==========

function Dashboard({ stats, journeys, alerts, onResolve }) {
  return (
    <div>
      <div style={{marginBottom:32}}>
        <div style={{display:"flex", alignItems:"center", gap:12, marginBottom:8}}>
          <div style={{
            width:12, height:12, borderRadius:"50%",
            background:"#00ffc8", boxShadow:"0 0 12px #00ffc8",
            animation:"pulse 1.5s infinite"
          }} />
          <span style={{
            color:"#00ffc8", fontSize:12, letterSpacing:3,
            textTransform:"uppercase", fontFamily:"'Courier New',monospace"
          }}>
            Live · MH-12-BUS-007 · Pune → Mumbai
          </span>
        </div>
        <h1 style={{fontSize:36, fontWeight:900, color:"#fff", margin:0, letterSpacing:-1}}>
          Operations Dashboard
        </h1>
      </div>

      <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:16, marginBottom:32}}>
        <StatCard icon="👥" label="Onboard Now" value={stats.passengers_onboard || 0} sub="Real-time count" color="#00ffc8" glow />
        <StatCard icon="💰" label="Today Revenue" value={`₹${(stats.revenue?.today || 0).toLocaleString()}`} color="#00aaff" />
        <StatCard icon="🚨" label="Fraud Alerts" value={stats.fraud_alerts || 0} color="#ff4444" glow={stats.fraud_alerts > 0} />
        <StatCard icon="🎫" label="Total Journeys" value={stats.total_journeys || 0} color="#aa88ff" />
        <StatCard icon="📅" label="Week Revenue" value={`₹${(stats.revenue?.week || 0).toLocaleString()}`} color="#ffaa00" />
        <StatCard icon="📈" label="Month Revenue" value={`₹${(stats.revenue?.month || 0).toLocaleString()}`} color="#ff6688" />
      </div>

      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:24}}>
        <div>
          <h2 style={{color:"#fff", fontSize:16, fontWeight:700, marginBottom:16, letterSpacing:1, textTransform:"uppercase"}}>
            Recent Journeys
          </h2>
          <div style={{display:"flex", flexDirection:"column", gap:8}}>
            {journeys.length === 0 && (
              <div style={{color:"#444", fontSize:13, padding:16, textAlign:"center"}}>
                No journeys yet. Board a passenger to begin.
              </div>
            )}
            {journeys.map(j => (
              <div key={j.id} style={{
                background:"rgba(255,255,255,0.03)",
                border:"1px solid rgba(255,255,255,0.06)",
                borderRadius:10, padding:"12px 16px",
                display:"flex", justifyContent:"space-between", alignItems:"center"
              }}>
                <div>
                  <div style={{color:"#fff", fontWeight:700, fontSize:13}}>{j.passenger_name}</div>
                  <div style={{color:"#555", fontSize:11, marginTop:2}}>
                    {j.board_stop} → {j.exit_stop || "onboard"}
                  </div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{color: j.status === "completed" ? "#00ffc8" : "#ffaa00", fontWeight:700, fontSize:13}}>
                    {j.status === "completed" ? `₹${j.fare}` : "RIDING"}
                  </div>
                  <div style={{color:"#444", fontSize:10, marginTop:2}}>{j.board_time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 style={{color:"#fff", fontSize:16, fontWeight:700, marginBottom:16, letterSpacing:1, textTransform:"uppercase"}}>
            🚨 Fraud Alerts
          </h2>
          <div style={{display:"flex", flexDirection:"column", gap:8}}>
            {alerts.length === 0 && (
              <div style={{
                color:"#444", fontSize:13, padding:16, textAlign:"center",
                background:"rgba(0,255,200,0.02)", borderRadius:10,
                border:"1px solid rgba(0,255,200,0.05)"
              }}>
                ✅ No fraud detected. System is clean.
              </div>
            )}
            {alerts.map(a => <FraudAlert key={a.id} alert={a} onResolve={onResolve} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ========== BOARDING SYSTEM PAGE WITH LIVE CAMERA ==========

function BoardingSystem({ onUpdate }) {
  const [searchName, setSearchName] = useState("");
  const [detectedPassenger, setDetectedPassenger] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [activeJourneys, setActiveJourneys] = useState([]);
  const [log, setLog] = useState([]);
  const [scanProgress, setScanProgress] = useState(0);
  const [cameraError, setCameraError] = useState(false);

  const addLog = (msg, type = "info") =>
    setLog(l => [{ msg, type, time: new Date().toLocaleTimeString(), id: Date.now() }, ...l.slice(0, 12)]);

  const simulateScan = async () => {
    if (!searchName.trim()) return;
    setScanning(true);
    setDetectedPassenger(null);
    setScanProgress(0);
    addLog(`Initiating face scan for: "${searchName}"`, "system");
    for (let i = 0; i <= 100; i += 10) {
      setScanProgress(i);
      await new Promise(r => setTimeout(r, 120));
    }
    const result = await API.detectFace(searchName);
    setScanning(false);
    if (result.success) {
      setDetectedPassenger(result.passenger);
      addLog(`✅ Face matched: ${result.passenger.name} (${result.confidence}% confidence)`, "success");
    } else {
      addLog(`❌ Face not recognized — NFC card tap required`, "error");
      await API.flagFraud("Skip Scan", `Unknown face attempted boarding at ${new Date().toLocaleTimeString()}`);
      addLog(`🚨 Fraud alert raised — unidentified boarding attempt`, "alert");
      onUpdate();
    }
  };

  const handleBoard = async (passenger) => {
    const result = await API.boardPassenger(passenger.id, "Face Recognition");
    if (result.success) {
      setActiveJourneys(j => [...j, result.journey]);
      addLog(`🚌 ${passenger.name} boarded at ${DB.bus.stops[DB.bus.current_stop]}`, "success");
      setDetectedPassenger(null);
      setSearchName("");
      onUpdate();
    }
  };

  const handleExit = async (journey) => {
    const result = await API.exitPassenger(journey.id);
    if (result.success) {
      setActiveJourneys(j => j.filter(x => x.id !== journey.id));
      addLog(`💸 ${journey.passenger_name} exited — ₹${result.fare} auto-deducted`, "success");
      onUpdate();
    }
  };

  const simulateFraud = async () => {
    addLog(`⚠️ Tailgating detected — 2 persons, 1 scan`, "alert");
    await API.flagFraud("Tailgate", "Camera detected 2 passengers through door with 1 scan");
    onUpdate();
  };

  return (
    <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:24}}>
      <div>
        <h2 style={{color:"#fff", fontSize:20, fontWeight:900, marginBottom:24}}>🎥 Entry Scanner</h2>
        <div style={{
          background:"rgba(0,255,200,0.04)",
          border:"1px solid rgba(0,255,200,0.2)",
          borderRadius:16, padding:24, marginBottom:20
        }}>

          {/* ===== LIVE CAMERA BOX ===== */}
          <div style={{
            position:"relative", width:"100%", paddingBottom:"56%",
            background:"#000", borderRadius:12, overflow:"hidden",
            marginBottom:16, border:"2px solid rgba(0,255,200,0.3)"
          }}>

            {/* LIVE CAMERA FEED — always visible in background */}
            {!cameraError && (
              <Webcam
                audio={false}
                onUserMediaError={() => setCameraError(true)}
                style={{
                  position:"absolute",
                  top:0, left:0,
                  width:"100%",
                  height:"100%",
                  objectFit:"cover",
                  borderRadius:12
                }}
                videoConstraints={{ facingMode:"user" }}
              />
            )}

            {/* OVERLAY — scanning animation or detected passenger */}
            <div style={{
              position:"absolute", inset:0,
              display:"flex", alignItems:"center",
              justifyContent:"center", flexDirection:"column", gap:12,
              background: scanning || detectedPassenger ? "rgba(0,0,0,0.6)" : "transparent"
            }}>
              {cameraError ? (
                <>
                  <div style={{fontSize:40, opacity:0.3}}>📷</div>
                  <div style={{color:"#ff4444", fontSize:12, letterSpacing:2, textAlign:"center"}}>
                    CAMERA NOT FOUND
                    <br/>
                    <span style={{color:"#555", fontSize:10}}>Check browser camera permissions</span>
                  </div>
                </>
              ) : scanning ? (
                <>
                  <div style={{
                    width:80, height:80,
                    border:"3px solid #00ffc8",
                    borderRadius:"50%",
                    animation:"spin 1s linear infinite",
                    borderTopColor:"transparent"
                  }} />
                  <div style={{color:"#00ffc8", fontSize:12, letterSpacing:2}}>
                    SCANNING... {scanProgress}%
                  </div>
                  <div style={{width:200, height:4, background:"#111", borderRadius:2, overflow:"hidden"}}>
                    <div style={{
                      width:`${scanProgress}%`, height:"100%",
                      background:"linear-gradient(90deg,#00ffc8,#0088ff)",
                      transition:"width 0.1s"
                    }} />
                  </div>
                </>
              ) : detectedPassenger ? (
                <>
                  <div style={{
                    width:64, height:64, borderRadius:"50%",
                    background:"linear-gradient(135deg,#00ffc8,#0088ff)",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:22, fontWeight:900, color:"#000",
                    boxShadow:"0 0 30px #00ffc8"
                  }}>
                    {detectedPassenger.avatar}
                  </div>
                  <div style={{color:"#00ffc8", fontSize:14, fontWeight:700}}>
                    {detectedPassenger.name}
                  </div>
                  <div style={{color:"#aaa", fontSize:11}}>
                    Wallet: ₹{detectedPassenger.wallet}
                  </div>
                  <div style={{
                    color:"#00ffc8", fontSize:10, letterSpacing:2,
                    padding:"4px 12px", border:"1px solid #00ffc8",
                    borderRadius:20, background:"rgba(0,255,200,0.1)"
                  }}>
                    ✅ IDENTITY VERIFIED
                  </div>
                </>
              ) : null}
            </div>

            {/* TOP BADGES */}
            <div style={{
              position:"absolute", top:8, left:8, right:8,
              display:"flex", justifyContent:"space-between"
            }}>
              <div style={{
                background:"rgba(255,0,0,0.7)", borderRadius:6,
                padding:"4px 8px", fontSize:10, color:"#fff",
                letterSpacing:1, display:"flex", alignItems:"center", gap:4
              }}>
                <div style={{width:6, height:6, borderRadius:"50%", background:"#fff", animation:"pulse 1s infinite"}} />
                LIVE
              </div>
              <div style={{
                background:"rgba(0,0,0,0.6)", borderRadius:6,
                padding:"4px 8px", fontSize:10, color:"#00ffc8"
              }}>
                MacBook Camera
              </div>
            </div>
          </div>
          {/* ===== END CAMERA BOX ===== */}

          {/* SCAN INPUT */}
          <div style={{display:"flex", gap:8}}>
            <input
              value={searchName}
              onChange={e => setSearchName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && simulateScan()}
              placeholder="Type passenger name to scan..."
              style={{
                flex:1, background:"rgba(255,255,255,0.05)",
                border:"1px solid rgba(0,255,200,0.2)",
                borderRadius:10, padding:"12px 16px",
                color:"#fff", fontSize:13, outline:"none"
              }}
            />
            <button
              onClick={simulateScan}
              disabled={scanning}
              style={{
                background:"linear-gradient(135deg,#00ffc8,#0088ff)",
                border:"none", borderRadius:10,
                padding:"12px 20px", color:"#000",
                fontWeight:900, cursor:"pointer", fontSize:13
              }}>
              SCAN
            </button>
          </div>

          {/* CONFIRM BOARDING BUTTON */}
          {detectedPassenger && (
            <button
              onClick={() => handleBoard(detectedPassenger)}
              style={{
                width:"100%", marginTop:12,
                background:"linear-gradient(135deg,#00ffc8,#00aa88)",
                border:"none", borderRadius:10, padding:14,
                color:"#000", fontWeight:900, cursor:"pointer",
                fontSize:14, letterSpacing:1
              }}>
              ✅ CONFIRM BOARDING
            </button>
          )}
        </div>

        {/* FRAUD BUTTON */}
        <button
          onClick={simulateFraud}
          style={{
            width:"100%",
            background:"rgba(255,68,68,0.1)",
            border:"1px solid rgba(255,68,68,0.3)",
            borderRadius:10, padding:12, color:"#ff4444",
            fontWeight:700, cursor:"pointer", fontSize:12, letterSpacing:1
          }}>
          🚨 SIMULATE FRAUD ATTEMPT
        </button>

        {/* ACTIVE PASSENGERS */}
        <div style={{marginTop:20}}>
          <h3 style={{color:"#555", fontSize:12, letterSpacing:2, textTransform:"uppercase", marginBottom:12}}>
            Active Onboard Passengers ({activeJourneys.length})
          </h3>
          <div style={{display:"flex", flexDirection:"column", gap:8}}>
            {activeJourneys.length === 0 && (
              <div style={{color:"#333", fontSize:12, padding:12, textAlign:"center"}}>
                No active journeys
              </div>
            )}
            {activeJourneys.map(j => (
              <div key={j.id} style={{
                background:"rgba(255,170,0,0.06)",
                border:"1px solid rgba(255,170,0,0.2)",
                borderRadius:10, padding:"10px 14px",
                display:"flex", justifyContent:"space-between", alignItems:"center"
              }}>
                <div>
                  <div style={{color:"#fff", fontWeight:700, fontSize:13}}>{j.passenger_name}</div>
                  <div style={{color:"#ffaa00", fontSize:11}}>Boarded: {j.board_time}</div>
                </div>
                <button
                  onClick={() => handleExit(j)}
                  style={{
                    background:"linear-gradient(135deg,#ff4444,#aa0000)",
                    border:"none", borderRadius:8,
                    padding:"8px 14px", color:"#fff",
                    fontWeight:700, fontSize:11, cursor:"pointer"
                  }}>
                  EXIT →
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SYSTEM LOG */}
      <div>
        <h2 style={{color:"#fff", fontSize:20, fontWeight:900, marginBottom:24}}>📋 System Log</h2>
        <div style={{
          background:"rgba(0,0,0,0.4)",
          border:"1px solid rgba(0,255,200,0.1)",
          borderRadius:16, padding:16, height:500,
          overflowY:"auto", fontFamily:"'Courier New',monospace"
        }}>
          {log.length === 0 && (
            <div style={{color:"#333", fontSize:12, textAlign:"center", marginTop:40}}>
              System initialized. Awaiting activity...
            </div>
          )}
          {log.map(l => (
            <div key={l.id} style={{
              marginBottom:8, padding:"6px 10px", borderRadius:6,
              background: l.type === "success" ? "rgba(0,255,200,0.05)"
                : l.type === "error" || l.type === "alert" ? "rgba(255,68,68,0.05)"
                : "rgba(255,255,255,0.02)",
              borderLeft:`2px solid ${
                l.type === "success" ? "#00ffc8"
                : l.type === "error" || l.type === "alert" ? "#ff4444"
                : "#333"}`
            }}>
              <span style={{color:"#444", fontSize:10}}>[{l.time}] </span>
              <span style={{
                color: l.type === "success" ? "#00ffc8"
                  : l.type === "error" || l.type === "alert" ? "#ff6666"
                  : "#888",
                fontSize:12
              }}>
                {l.msg}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ========== PASSENGER DATABASE PAGE ==========

function PassengerDB() {
  return (
    <div>
      <h2 style={{color:"#fff", fontSize:20, fontWeight:900, marginBottom:24}}>👥 Passenger Database</h2>
      <div style={{
        background:"rgba(0,0,0,0.3)",
        border:"1px solid rgba(0,255,200,0.1)",
        borderRadius:16, overflow:"hidden"
      }}>
        <div style={{
          display:"grid",
          gridTemplateColumns:"0.5fr 2fr 1fr 1fr 1fr 1fr",
          padding:"12px 20px",
          background:"rgba(0,255,200,0.06)",
          borderBottom:"1px solid rgba(0,255,200,0.1)"
        }}>
          {["ID","Passenger","Face ID","Card","Wallet","Trips"].map(h => (
            <div key={h} style={{color:"#00ffc8", fontSize:11, fontWeight:700, letterSpacing:2, textTransform:"uppercase"}}>
              {h}
            </div>
          ))}
        </div>
        {DB.passengers.map((p, i) => (
          <div key={p.id} style={{
            display:"grid",
            gridTemplateColumns:"0.5fr 2fr 1fr 1fr 1fr 1fr",
            padding:"16px 20px",
            borderBottom:"1px solid rgba(255,255,255,0.04)",
            background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)"
          }}>
            <div style={{color:"#444", fontSize:13, fontFamily:"monospace"}}>{p.id}</div>
            <div style={{display:"flex", alignItems:"center", gap:10}}>
              <div style={{
                width:32, height:32, borderRadius:"50%",
                background:"linear-gradient(135deg,#00ffc8,#0088ff)",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:11, fontWeight:900, color:"#000"
              }}>
                {p.avatar}
              </div>
              <span style={{color:"#fff", fontWeight:600, fontSize:13}}>{p.name}</span>
            </div>
            <div style={{color:"#00ffc8", fontSize:12, fontFamily:"monospace"}}>{p.face_id}</div>
            <div style={{color:"#555", fontSize:11, fontFamily:"monospace"}}>{p.card}</div>
            <div style={{color: p.wallet < 50 ? "#ff4444" : "#00ffc8", fontWeight:700, fontSize:13}}>
              ₹{p.wallet}
            </div>
            <div style={{color:"#888", fontSize:13}}>{p.trips}</div>
          </div>
        ))}
      </div>

      <div style={{marginTop:32}}>
        <h3 style={{color:"#fff", fontSize:16, fontWeight:700, marginBottom:16}}>📊 Revenue Analytics</h3>
        <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16}}>
          {[
            ["Today", "₹"+DB.revenue.today.toLocaleString(), "#00ffc8"],
            ["This Week", "₹"+DB.revenue.week.toLocaleString(), "#00aaff"],
            ["This Month", "₹"+DB.revenue.month.toLocaleString(), "#aa88ff"]
          ].map(([label, val, color]) => (
            <div key={label} style={{
              background:`${color}08`,
              border:`1px solid ${color}22`,
              borderRadius:16, padding:24, textAlign:"center"
            }}>
              <div style={{fontSize:28, fontWeight:900, color, fontFamily:"monospace"}}>{val}</div>
              <div style={{color:"#555", fontSize:12, marginTop:6, letterSpacing:2, textTransform:"uppercase"}}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ========== MAIN APP ==========

export default function BusGuardAI() {
  const [page, setPage] = useState("dashboard");
  const [stats, setStats] = useState({
    passengers_onboard: 0,
    revenue: DB.revenue,
    total_journeys: 0,
    fraud_alerts: 0
  });
  const [journeys, setJourneys] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [tick, setTick] = useState(0);

  const refreshStats = async () => {
    const s = await API.getStats();
    setStats(s);
    setJourneys(s.journeys);
    setAlerts(s.alerts);
  };

  useEffect(() => { refreshStats(); }, [tick]);
  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 5000);
    return () => clearInterval(t);
  }, []);

  const resolveAlert = (id) => {
    const a = DB.fraud_alerts.find(x => x.id === id);
    if (a) { a.resolved = true; refreshStats(); }
  };

  const nav = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "boarding", label: "Boarding System", icon: "🎥" },
    { id: "database", label: "Passenger DB", icon: "🗄️" },
  ];

  return (
    <div style={{minHeight:"100vh", background:"#060810", color:"#fff", fontFamily:"'Segoe UI',sans-serif"}}>
      <Scanline />
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes spin { to{transform:rotate(360deg)} }
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-track{background:#0a0f1a}
        ::-webkit-scrollbar-thumb{background:#00ffc822;border-radius:2px}
        input::placeholder{color:#333}
      `}</style>

      {/* HEADER */}
      <div style={{
        borderBottom:"1px solid rgba(0,255,200,0.1)",
        padding:"0 32px",
        display:"flex", alignItems:"center", gap:32,
        background:"rgba(0,0,0,0.5)",
        backdropFilter:"blur(20px)",
        position:"sticky", top:0, zIndex:100
      }}>
        <div style={{padding:"16px 0", display:"flex", alignItems:"center", gap:12}}>
          <div style={{
            width:36, height:36,
            background:"linear-gradient(135deg,#00ffc8,#0088ff)",
            borderRadius:10, display:"flex",
            alignItems:"center", justifyContent:"center", fontSize:18
          }}>
            🚌
          </div>
          <div>
            <div style={{fontWeight:900, fontSize:16, color:"#fff", letterSpacing:-0.5}}>BusGuard AI</div>
            <div style={{fontSize:10, color:"#00ffc8", letterSpacing:2, textTransform:"uppercase"}}>Smart Fare System</div>
          </div>
        </div>

        <div style={{display:"flex", gap:4, flex:1}}>
          {nav.map(n => (
            <button
              key={n.id}
              onClick={() => setPage(n.id)}
              style={{
                background: page === n.id ? "rgba(0,255,200,0.1)" : "transparent",
                border: page === n.id ? "1px solid rgba(0,255,200,0.3)" : "1px solid transparent",
                borderRadius:10, padding:"8px 18px",
                color: page === n.id ? "#00ffc8" : "#555",
                fontWeight:700, cursor:"pointer", fontSize:13,
                display:"flex", alignItems:"center", gap:6,
                transition:"all 0.2s"
              }}>
              {n.icon} {n.label}
            </button>
          ))}
        </div>

        <div style={{display:"flex", alignItems:"center", gap:8, fontSize:12, color:"#00ffc8"}}>
          <div style={{
            width:8, height:8, borderRadius:"50%",
            background:"#00ffc8", boxShadow:"0 0 10px #00ffc8",
            animation:"pulse 2s infinite"
          }} />
          SYSTEM LIVE
        </div>
      </div>

      {/* HERO BANNER */}
      {page === "dashboard" && (
        <div style={{
          background:"linear-gradient(135deg,rgba(0,255,200,0.06),rgba(0,136,255,0.06))",
          borderBottom:"1px solid rgba(0,255,200,0.08)",
          padding:"32px", textAlign:"center"
        }}>
          <div style={{fontSize:12, letterSpacing:4, color:"#00ffc8", textTransform:"uppercase", marginBottom:8}}>
            Urban Solutions · AI/ML Hackathon
          </div>
          <div style={{
            fontSize:42, fontWeight:900, letterSpacing:-2,
            background:"linear-gradient(135deg,#fff,#00ffc8)",
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", marginBottom:8
          }}>
            We Made Fare Fraud Impossible.
          </div>
          <div style={{color:"#444", fontSize:14}}>
            Board Smart · Ride Fair · Pay Automatically
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <div style={{padding:32, maxWidth:1200, margin:"0 auto"}}>
        {page === "dashboard" && (
          <Dashboard stats={stats} journeys={journeys} alerts={alerts} onResolve={resolveAlert} />
        )}
        {page === "boarding" && <BoardingSystem onUpdate={refreshStats} />}
        {page === "database" && <PassengerDB />}
      </div>

      {/* FOOTER */}
      <div style={{
        borderTop:"1px solid rgba(0,255,200,0.06)",
        padding:"16px 32px",
        display:"flex", justifyContent:"space-between",
        alignItems:"center", fontSize:11, color:"#333"
      }}>
        <span>BusGuard AI · Urban Solutions · Full Stack AI/ML Hackathon</span>
        <span style={{color:"#00ffc830"}}>YOLOv8 · InsightFace · FastAPI · React · PostgreSQL</span>
      </div>
    </div>
  );
}
